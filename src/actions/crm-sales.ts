"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "./auth-context";
import { can } from "@/lib/rbac";

async function assertLeadAccess(leadId: string, ecosystemId: string) {
  return prisma.lead.findFirst({ where: { id: leadId, ecosystemId } });
}

export async function createMeeting(leadId: string, title: string, notes?: string, scheduledAt?: Date) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "crm.view")) return { error: "Sem permissão." };
  const lead = await assertLeadAccess(leadId, ctx.ecosystemId);
  if (!lead) return { error: "Lead não encontrado." };
  await prisma.meeting.create({
    data: { leadId, userId: ctx.userId, title, notes, scheduledAt },
  });
  await prisma.lead.update({
    where: { id: leadId },
    data: { meetingAt: scheduledAt ?? lead.meetingAt, lastActivityAt: new Date() },
  });
  revalidatePath(`/crm/leads/${leadId}`);
  return { ok: true };
}

export async function createProposal(leadId: string, value?: number, notes?: string) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "crm.view")) return { error: "Sem permissão." };
  const lead = await assertLeadAccess(leadId, ctx.ecosystemId);
  if (!lead) return { error: "Lead não encontrado." };
  await prisma.proposal.create({
    data: { leadId, userId: ctx.userId, value, notes, sentAt: new Date() },
  });
  revalidatePath(`/crm/leads/${leadId}`);
  return { ok: true };
}

export async function createContract(leadId: string, value?: number) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "crm.view")) return { error: "Sem permissão." };
  const lead = await assertLeadAccess(leadId, ctx.ecosystemId);
  if (!lead) return { error: "Lead não encontrado." };
  await prisma.contract.create({
    data: { leadId, userId: ctx.userId, value, signedAt: new Date() },
  });
  revalidatePath(`/crm/leads/${leadId}`);
  return { ok: true };
}
