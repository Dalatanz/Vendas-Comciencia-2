"use server";

import { prisma } from "@/lib/prisma";
import { notifyUser } from "./audit-notify";
import { NotificationType } from "@prisma/client";
import { isDemoMode } from "@/lib/demo-mode";

export async function processOverdueSla(ecosystemId: string) {
  if (isDemoMode()) return;
  const leads = await prisma.lead.findMany({
    where: {
      ecosystemId,
      slaBreached: false,
      slaDueAt: { not: null, lt: new Date() },
    },
    include: { assignedSdr: true },
  });
  for (const l of leads) {
    await prisma.lead.update({
      where: { id: l.id },
      data: { slaBreached: true, slaBreachedAt: new Date() },
    });
    if (l.assignedSdrId) {
      await notifyUser({
        userId: l.assignedSdrId,
        title: "SLA estourado no lead",
        body: l.contactName,
        type: NotificationType.SLA,
        link: `/crm/leads/${l.id}`,
      });
    }
    const actorId =
      l.assignedSdrId ??
      (
        await prisma.userEcosystemMembership.findFirst({
          where: { ecosystemId, role: { name: "GESTOR" } },
        })
      )?.userId;
    if (actorId) {
      await prisma.leadTask.create({
        data: {
          leadId: l.id,
          title: "Tratar SLA estourado — ação automática",
          createdById: actorId,
          assigneeId: l.assignedSdrId ?? actorId,
          dueAt: new Date(),
        },
      });
    }
  }
  return { processed: leads.length };
}
