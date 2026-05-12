"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "./auth-context";
import { can } from "@/lib/rbac";
import { writeAudit } from "./audit-notify";

const FOLDERS = [
  { key: "documentos", name: "Documentos da empresa" },
  { key: "kickoff", name: "Reuniões de kickoff" },
  { key: "organograma", name: "Organograma" },
  { key: "operacao", name: "Desenho da operação" },
  { key: "mercado", name: "Mercado" },
  { key: "segmento", name: "Segmento" },
  { key: "porte", name: "Porte da empresa" },
  { key: "diagnostico", name: "Diagnóstico inicial" },
  { key: "dores", name: "Maiores dores" },
];

export async function ensureWorkspaceForCompany(companyId: string) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, workspace: null };
  if (!can(ctx, "workspace.manage") && !can(ctx, "workspace.view")) {
    return { error: "Sem permissão.", workspace: null };
  }
  const company = await prisma.company.findFirst({
    where: { id: companyId, ecosystemId: ctx.ecosystemId },
  });
  if (!company) return { error: "Empresa não encontrada.", workspace: null };

  let ws = await prisma.clientWorkspace.findFirst({ where: { companyId } });
  if (!ws) {
    if (!can(ctx, "workspace.manage")) {
      return { error: "Workspace ainda não existe. Solicite à gestão.", workspace: null };
    }
    ws = await prisma.clientWorkspace.create({
      data: {
        companyId,
        name: `Workspace — ${company.razaoSocial}`,
      },
    });
    for (const f of FOLDERS) {
      await prisma.workspaceFolder.create({
        data: { workspaceId: ws.id, key: f.key, name: f.name },
      });
    }
    await writeAudit({
      userId: ctx.userId,
      ecosystemId: ctx.ecosystemId,
      entity: "ClientWorkspace",
      entityId: ws.id,
      action: "CREATE",
    });
  }
  return { workspace: ws };
}

export async function listWorkspaces() {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, workspaces: [] };
  if (!can(ctx, "workspace.view")) return { error: "Sem permissão.", workspaces: [] };
  const workspaces = await prisma.clientWorkspace.findMany({
    where: { company: { ecosystemId: ctx.ecosystemId } },
    include: {
      company: { select: { id: true, razaoSocial: true, cnpj: true } },
      folders: { include: { _count: { select: { files: true } } } },
    },
  });
  return { workspaces };
}

export async function getWorkspaceDetail(workspaceId: string) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, workspace: null };
  const workspace = await prisma.clientWorkspace.findFirst({
    where: { id: workspaceId, company: { ecosystemId: ctx.ecosystemId } },
    include: {
      company: true,
      folders: {
        include: {
          files: {
            include: {
              uploadedBy: { select: { name: true } },
              comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });
  return { workspace };
}

export async function addWorkspaceFileComment(fileId: string, body: string) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "workspace.view")) return { error: "Sem permissão." };
  const file = await prisma.workspaceFile.findFirst({
    where: { id: fileId, folder: { workspace: { company: { ecosystemId: ctx.ecosystemId } } } },
  });
  if (!file) return { error: "Arquivo não encontrado." };
  await prisma.workspaceComment.create({
    data: { fileId, userId: ctx.userId, body: body.trim() },
  });
  await writeAudit({
    userId: ctx.userId,
    ecosystemId: ctx.ecosystemId,
    entity: "WorkspaceFile",
    entityId: fileId,
    action: "COMMENT",
    diff: { body },
  });
  revalidatePath("/workspace");
  return { ok: true };
}
