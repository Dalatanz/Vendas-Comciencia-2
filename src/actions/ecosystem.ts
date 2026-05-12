"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "./auth-context";
import { isDemoMode } from "@/lib/demo-mode";
import {
  DEMO_ECOSYSTEM_SCALE_ID,
  DEMO_ECOSYSTEM_SIMPLIFICA_ID,
  DEMO_USER_ID,
} from "@/lib/demo-data";

export async function listMyEcosystems() {
  const u = await requireUser();
  if ("error" in u) return { error: u.error, ecosystems: [] as { id: string; name: string; slug: string }[] };
  if (isDemoMode() && u.userId === DEMO_USER_ID) {
    return {
      ecosystems: [
        { id: DEMO_ECOSYSTEM_SCALE_ID, name: "Scale", slug: "scale" },
        { id: DEMO_ECOSYSTEM_SIMPLIFICA_ID, name: "Simplifica", slug: "simplifica" },
      ],
    };
  }
  const rows = await prisma.userEcosystemMembership.findMany({
    where: { userId: u.userId },
    include: { ecosystem: true },
  });
  return {
    ecosystems: rows.map((r) => ({
      id: r.ecosystem.id,
      name: r.ecosystem.name,
      slug: r.ecosystem.slug,
    })),
  };
}

export async function setSelectedEcosystem(ecosystemId: string) {
  const u = await requireUser();
  if ("error" in u) return { error: u.error };
  if (
    isDemoMode() &&
    u.userId === DEMO_USER_ID &&
    (ecosystemId === DEMO_ECOSYSTEM_SCALE_ID || ecosystemId === DEMO_ECOSYSTEM_SIMPLIFICA_ID)
  ) {
    return { ok: true as const };
  }
  const mem = await prisma.userEcosystemMembership.findUnique({
    where: {
      userId_ecosystemId: { userId: u.userId, ecosystemId },
    },
  });
  if (!mem) return { error: "Você não tem acesso a este ecossistema." };
  await prisma.user.update({
    where: { id: u.userId },
    data: { selectedEcosystemId: ecosystemId },
  });
  return { ok: true as const };
}
