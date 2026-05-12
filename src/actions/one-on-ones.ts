"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "./auth-context";
import { can } from "@/lib/rbac";
import { isDemoMode } from "@/lib/demo-mode";

export async function listOneOnOnes() {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, items: [] };
  if (!can(ctx, "one_on_one.view")) return { error: "Sem permissão.", items: [] };
  if (isDemoMode()) return { items: [] };
  const items = await prisma.oneOnOne.findMany({
    where: {
      ecosystemId: ctx.ecosystemId,
      OR: [{ sellerId: ctx.userId }, { leaderId: ctx.userId }],
    },
    include: { seller: true, leader: true },
    orderBy: { scheduledAt: "asc" },
  });
  return { items };
}

export async function createOneOnOne(data: {
  sellerId: string;
  leaderId: string;
  scheduledAt: Date;
  notes?: string;
}) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "one_on_one.manage")) return { error: "Sem permissão." };
  if (isDemoMode()) return { error: "No modo demonstração não é possível gravar 1:1." };
  await prisma.oneOnOne.create({
    data: {
      ecosystemId: ctx.ecosystemId,
      sellerId: data.sellerId,
      leaderId: data.leaderId,
      scheduledAt: data.scheduledAt,
      notes: data.notes,
    },
  });
  revalidatePath("/one-on-ones");
  return { ok: true };
}

export async function updateOneOnOne(
  id: string,
  data: { notes?: string; actionItems?: string; scheduledAt?: Date }
) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (isDemoMode()) return { error: "No modo demonstração não é possível editar 1:1." };
  const o = await prisma.oneOnOne.findFirst({
    where: {
      id,
      ecosystemId: ctx.ecosystemId,
      OR: [{ sellerId: ctx.userId }, { leaderId: ctx.userId }],
    },
  });
  if (!o) return { error: "1:1 não encontrado." };
  if (!can(ctx, "one_on_one.manage") && o.leaderId !== ctx.userId) {
    return { error: "Apenas o líder ou gestão pode editar." };
  }
  await prisma.oneOnOne.update({ where: { id }, data });
  revalidatePath("/one-on-ones");
  return { ok: true };
}
