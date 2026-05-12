"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "./auth-context";
import { isDemoMode } from "@/lib/demo-mode";
import { DEMO_USER_ID, getDemoNotification } from "@/lib/demo-data";

export async function listNotifications() {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, items: [] };
  if (isDemoMode() && ctx.userId === DEMO_USER_ID) {
    return { items: [getDemoNotification()] };
  }
  const items = await prisma.notification.findMany({
    where: { userId: ctx.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return { items };
}

export async function markNotificationRead(id: string): Promise<void> {
  const ctx = await requireAuth();
  if ("error" in ctx) return;
  if (isDemoMode() && ctx.userId === DEMO_USER_ID) return;
  await prisma.notification.updateMany({
    where: { id, userId: ctx.userId },
    data: { read: true },
  });
  revalidatePath("/dashboard");
}

export async function markAllNotificationsRead() {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (isDemoMode() && ctx.userId === DEMO_USER_ID) return { ok: true as const };
  await prisma.notification.updateMany({
    where: { userId: ctx.userId, read: false },
    data: { read: true },
  });
  return { ok: true };
}
