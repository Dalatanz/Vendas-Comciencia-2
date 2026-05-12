"use server";

import { revalidatePath } from "next/cache";
import { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "./auth-context";
import { can } from "@/lib/rbac";
import { writeAudit } from "./audit-notify";
import bcrypt from "bcryptjs";

export async function listUsers() {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, users: [] };
  if (!can(ctx, "admin.users")) return { error: "Sem permissão.", users: [] };
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      memberships: { include: { ecosystem: true, role: true } },
    },
  });
  return { users };
}

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  ecosystemId: string;
  roleName: RoleName;
}) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "admin.users")) return { error: "Sem permissão." };
  const role = await prisma.role.findUnique({ where: { name: data.roleName } });
  if (!role) return { error: "Perfil inválido." };
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      name: data.name.trim(),
      passwordHash,
      selectedEcosystemId: data.ecosystemId,
      memberships: {
        create: { ecosystemId: data.ecosystemId, roleId: role.id },
      },
    },
  });
  await writeAudit({
    userId: ctx.userId,
    ecosystemId: ctx.ecosystemId,
    entity: "User",
    entityId: user.id,
    action: "CREATE_USER",
  });
  revalidatePath("/admin/users");
  return { ok: true, id: user.id };
}

export async function updateMembershipRole(membershipId: string, roleName: RoleName) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "admin.users")) return { error: "Sem permissão." };
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) return { error: "Perfil inválido." };
  await prisma.userEcosystemMembership.update({
    where: { id: membershipId },
    data: { roleId: role.id },
  });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function listAuditLogs() {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, logs: [] };
  if (!can(ctx, "admin.logs")) return { error: "Sem permissão.", logs: [] };
  const logs = await prisma.auditLog.findMany({
    where: { OR: [{ ecosystemId: ctx.ecosystemId }, { ecosystemId: null }] },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true, email: true } } },
  });
  return { logs };
}

export async function listSlaConfigs() {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, items: [] };
  if (!can(ctx, "admin.sla")) return { error: "Sem permissão.", items: [] };
  const items = await prisma.slaConfig.findMany({
    where: { ecosystemId: ctx.ecosystemId },
    orderBy: { key: "asc" },
  });
  return { items };
}

export async function updateSlaConfig(id: string, hours: number) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "admin.sla")) return { error: "Sem permissão." };
  await prisma.slaConfig.updateMany({
    where: { id, ecosystemId: ctx.ecosystemId },
    data: { hours },
  });
  revalidatePath("/admin/sla");
  return { ok: true };
}

export async function listCrmStagesAdmin() {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, stages: [] };
  if (!can(ctx, "admin.crm_stages")) return { error: "Sem permissão.", stages: [] };
  const funnel = await prisma.crmFunnel.findFirst({
    where: { ecosystemId: ctx.ecosystemId, name: "cold call" },
    include: { stages: { orderBy: { order: "asc" } } },
  });
  return { stages: funnel?.stages ?? [], funnelId: funnel?.id };
}

export async function updateCrmStage(
  stageId: string,
  data: { slaHours?: number | null; name?: string; order?: number }
) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "admin.crm_stages")) return { error: "Sem permissão." };
  const stage = await prisma.crmStage.findFirst({
    where: { id: stageId, funnel: { ecosystemId: ctx.ecosystemId } },
  });
  if (!stage) return { error: "Etapa inválida." };
  await prisma.crmStage.update({ where: { id: stageId }, data });
  revalidatePath("/admin/crm-stages");
  revalidatePath("/crm");
  return { ok: true };
}

export async function listRolesAndPermissions() {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, roles: [], permissions: [] };
  if (!can(ctx, "admin.roles") && !can(ctx, "admin.permissions")) {
    return { error: "Sem permissão.", roles: [], permissions: [] };
  }
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  });
  const permissions = await prisma.permission.findMany({ orderBy: { key: "asc" } });
  return { roles, permissions };
}

export async function listEcosystemsAdmin() {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, ecosystems: [] };
  if (!can(ctx, "admin.ecosystems")) return { error: "Sem permissão.", ecosystems: [] };
  const ecosystems = await prisma.ecosystem.findMany({ orderBy: { name: "asc" } });
  return { ecosystems };
}

export async function listPostponementRequests() {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, items: [] };
  if (!can(ctx, "evaluations.postpone_decide")) return { error: "Sem permissão.", items: [] };
  const items = await prisma.evaluationPostponementRequest.findMany({
    where: { evaluation: { ecosystemId: ctx.ecosystemId } },
    include: { evaluation: true, requestedBy: true },
    orderBy: { createdAt: "desc" },
  });
  return { items };
}
