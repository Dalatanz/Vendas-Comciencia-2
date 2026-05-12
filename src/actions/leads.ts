"use server";

import { revalidatePath } from "next/cache";
import { ActivityType, LeadStatus, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateLeadStageMove, hasApprovedException } from "@/lib/lead-stage-rules";
import { requireAuth } from "./auth-context";
import { can } from "@/lib/rbac";
import { writeAudit, notifyUser } from "./audit-notify";
import { isDemoMode } from "@/lib/demo-mode";
import { getDemoCrmStages } from "@/lib/demo-data";

export type LeadFilters = {
  search?: string;
  stageSlug?: string;
  status?: LeadStatus;
  sdrId?: string;
  closerId?: string;
  origin?: string;
  segment?: string;
  dateFrom?: string;
  dateTo?: string;
};

function leadWhere(ctx: import("./auth-context").AuthContext, f: LeadFilters) {
  const base: Record<string, unknown> = { ecosystemId: ctx.ecosystemId };
  const scope: object[] = [];

  if (can(ctx, "crm.leads.all") || can(ctx, "crm.leads.team")) {
    // ecossistema inteiro
  } else if (can(ctx, "crm.leads.own")) {
    scope.push({ OR: [{ assignedSdrId: ctx.userId }, { assignedCloserId: ctx.userId }] });
  } else {
    scope.push({ id: { equals: "__sem_acesso__" } });
  }

  const and: object[] = [...scope];
  if (f.search?.trim()) {
    const q = f.search.trim();
    and.push({
      OR: [
        { contactName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { origin: { contains: q, mode: "insensitive" } },
        { company: { is: { razaoSocial: { contains: q, mode: "insensitive" } } } },
        { company: { is: { cnpj: { contains: q } } } },
      ],
    });
  }
  if (f.stageSlug) and.push({ stage: { slug: f.stageSlug } });
  if (f.status) and.push({ status: f.status });
  if (f.sdrId) and.push({ assignedSdrId: f.sdrId });
  if (f.closerId) and.push({ assignedCloserId: f.closerId });
  if (f.origin) and.push({ origin: { equals: f.origin, mode: "insensitive" } });
  if (f.segment) and.push({ segment: { contains: f.segment, mode: "insensitive" } });
  if (f.dateFrom) and.push({ createdAt: { gte: new Date(f.dateFrom) } });
  if (f.dateTo) and.push({ createdAt: { lte: new Date(f.dateTo) } });

  return { AND: [base, ...and] };
}

export async function listLeads(filters: LeadFilters) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, leads: [] };
  if (!can(ctx, "crm.view")) return { error: "Sem permissão para CRM.", leads: [] };

  if (isDemoMode()) return { leads: [] };

  const leads = await prisma.lead.findMany({
    where: leadWhere(ctx, filters) as never,
    include: {
      stage: true,
      company: true,
      assignedSdr: { select: { id: true, name: true } },
      assignedCloser: { select: { id: true, name: true } },
    },
    orderBy: [{ stage: { order: "asc" } }, { kanbanOrder: "asc" }],
  });
  return { leads };
}

export async function getCrmStages() {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, stages: [] };
  if (isDemoMode()) return { stages: getDemoCrmStages() };
  const funnel = await prisma.crmFunnel.findFirst({
    where: { ecosystemId: ctx.ecosystemId, name: "cold call" },
    include: { stages: { orderBy: { order: "asc" } } },
  });
  return { stages: funnel?.stages ?? [] };
}

export async function createLead(data: {
  contactName: string;
  phone: string;
  origin: string;
  segment: string;
  revenue?: string;
  interest?: string;
  status: LeadStatus;
  companyId?: string | null;
  assignedSdrId?: string | null;
  assignedCloserId?: string | null;
  nextActionAt?: Date | null;
}) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "crm.leads.create")) return { error: "Sem permissão." };

  if (isDemoMode()) {
    return { error: "Modo demonstração: criação de leads exige PostgreSQL e seed. Desative DEMO_MODE após configurar o banco." };
  }

  const funnel = await prisma.crmFunnel.findFirst({
    where: { ecosystemId: ctx.ecosystemId, name: "cold call" },
    include: { stages: true },
  });
  const stage = funnel?.stages.find((s) => s.slug === "LEAD_NOVO");
  if (!funnel || !stage) return { error: "Funil não configurado." };

  const slaHours = stage.slaHours ?? 24;
  const slaDueAt = new Date(Date.now() + slaHours * 3600000);

  const lead = await prisma.lead.create({
    data: {
      ecosystemId: ctx.ecosystemId,
      funnelId: funnel.id,
      stageId: stage.id,
      companyId: data.companyId || null,
      contactName: data.contactName,
      phone: data.phone,
      origin: data.origin,
      segment: data.segment,
      revenue: data.revenue,
      interest: data.interest,
      status: data.status,
      assignedSdrId: data.assignedSdrId ?? ctx.userId,
      assignedCloserId: data.assignedCloserId,
      nextActionAt: data.nextActionAt,
      slaDueAt,
    },
  });

  await prisma.leadTask.create({
    data: {
      leadId: lead.id,
      title: "Qualificar lead — tarefa automática",
      assigneeId: data.assignedSdrId ?? ctx.userId,
      createdById: ctx.userId,
      dueAt: slaDueAt,
    },
  });

  await writeAudit({
    userId: ctx.userId,
    ecosystemId: ctx.ecosystemId,
    entity: "Lead",
    entityId: lead.id,
    action: "CREATE",
    diff: data,
  });

  revalidatePath("/crm");
  return { ok: true, id: lead.id };
}

export async function updateLead(
  id: string,
  data: Partial<{
    contactName: string;
    phone: string;
    origin: string;
    segment: string;
    revenue: string | null;
    interest: string | null;
    status: LeadStatus;
    lastActivityAt: Date | null;
    nextActionAt: Date | null;
    meetingAt: Date | null;
    lossReason: string | null;
    qualificationScore: number | null;
    meetingScore: number | null;
    companyId: string | null;
    assignedSdrId: string | null;
    assignedCloserId: string | null;
  }>
) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "crm.leads.edit")) return { error: "Sem permissão." };

  const existing = await prisma.lead.findFirst({ where: { id, ecosystemId: ctx.ecosystemId } });
  if (!existing) return { error: "Lead não encontrado." };

  if (!can(ctx, "crm.leads.all") && !can(ctx, "crm.leads.team")) {
    if (existing.assignedSdrId !== ctx.userId && existing.assignedCloserId !== ctx.userId) {
      return { error: "Você não pode editar este lead." };
    }
  }

  await prisma.lead.update({ where: { id }, data });
  await writeAudit({
    userId: ctx.userId,
    ecosystemId: ctx.ecosystemId,
    entity: "Lead",
    entityId: id,
    action: "UPDATE",
    diff: data,
  });
  revalidatePath("/crm");
  revalidatePath(`/crm/leads/${id}`);
  return { ok: true };
}

export async function deleteLead(id: string) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "crm.leads.delete") && !can(ctx, "crm.leads.edit")) return { error: "Sem permissão." };

  const existing = await prisma.lead.findFirst({ where: { id, ecosystemId: ctx.ecosystemId } });
  if (!existing) return { error: "Lead não encontrado." };

  if (!can(ctx, "crm.leads.delete")) {
    if (existing.assignedSdrId !== ctx.userId) return { error: "Apenas gestão pode excluir." };
  }

  await prisma.lead.delete({ where: { id } });
  await writeAudit({
    userId: ctx.userId,
    ecosystemId: ctx.ecosystemId,
    entity: "Lead",
    entityId: id,
    action: "DELETE",
  });
  revalidatePath("/crm");
  return { ok: true };
}

export async function moveLeadStage(leadId: string, toStageId: string) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (isDemoMode()) {
    return {
      error:
        "Modo demonstração: não há leads persistidos. Desative DEMO_MODE, configure o PostgreSQL e rode o seed para usar o Kanban.",
    };
  }
  if (!can(ctx, "crm.kanban")) return { error: "Sem permissão para Kanban." };

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, ecosystemId: ctx.ecosystemId },
    include: { stage: true, company: true },
  });
  if (!lead) return { error: "Lead não encontrado." };

  if (!can(ctx, "crm.leads.all") && !can(ctx, "crm.leads.team")) {
    if (lead.assignedSdrId !== ctx.userId && lead.assignedCloserId !== ctx.userId) {
      return { error: "Sem acesso a este lead." };
    }
  }

  const toStage = await prisma.crmStage.findFirst({
    where: { id: toStageId, funnelId: lead.funnelId },
  });
  if (!toStage) return { error: "Etapa inválida." };

  const bypassSla = await hasApprovedException(leadId);

  const validation = await validateLeadStageMove({
    lead,
    fromStage: lead.stage,
    toStage,
    bypassSla,
  });

  if (!validation.ok) return { error: validation.message };

  const maxOrder = await prisma.lead.aggregate({
    where: { stageId: toStageId },
    _max: { kanbanOrder: true },
  });

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: {
        stageId: toStageId,
        kanbanOrder: (maxOrder._max.kanbanOrder ?? 0) + 1,
        slaDueAt: toStage.slaHours
          ? new Date(Date.now() + (toStage.slaHours ?? 24) * 3600000)
          : null,
      },
    }),
    prisma.stageChangeLog.create({
      data: {
        leadId,
        fromStageId: lead.stageId,
        toStageId,
        userId: ctx.userId,
        metadata: { fromSlug: lead.stage.slug, toSlug: toStage.slug },
      },
    }),
  ]);

  await writeAudit({
    userId: ctx.userId,
    ecosystemId: ctx.ecosystemId,
    entity: "Lead",
    entityId: leadId,
    action: "STAGE_MOVE",
    diff: { toStage: toStage.slug },
  });

  if (toStage.slug === "REUNIAO" && lead.meetingAt) {
    const msg = `Olá ${lead.contactName}, confirmando reunião em ${lead.meetingAt.toLocaleString("pt-BR")}.`;
    await notifyUser({
      userId: lead.assignedSdrId ?? ctx.userId,
      title: "Mensagem sugerida — WhatsApp",
      body: msg,
      type: NotificationType.INFO,
      link: `/crm/leads/${leadId}`,
    });
  }

  if (toStage.slug === "PROPOSTA_ENVIADA") {
    const base = Date.now();
    for (const days of [3, 7, 10]) {
      await prisma.leadTask.create({
        data: {
          leadId,
          title: `Follow-up proposta — D${days}`,
          dueAt: new Date(base + days * 86400000),
          createdById: ctx.userId,
          assigneeId: lead.assignedCloserId ?? lead.assignedSdrId ?? ctx.userId,
        },
      });
    }
  }

  revalidatePath("/crm");
  return { ok: true };
}

export async function addLeadActivity(leadId: string, type: ActivityType, notes?: string) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  const lead = await prisma.lead.findFirst({ where: { id: leadId, ecosystemId: ctx.ecosystemId } });
  if (!lead) return { error: "Lead não encontrado." };

  await prisma.leadActivity.create({
    data: {
      leadId,
      userId: ctx.userId,
      type,
      notes,
    },
  });
  await prisma.lead.update({
    where: { id: leadId },
    data: { lastActivityAt: new Date() },
  });
  revalidatePath(`/crm/leads/${leadId}`);
  return { ok: true };
}

export async function createExceptionRequest(leadId: string, justification: string) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  await prisma.exceptionRequest.create({
    data: { leadId, requestedById: ctx.userId, justification },
  });
  const gestores = await prisma.userEcosystemMembership.findMany({
    where: { ecosystemId: ctx.ecosystemId, role: { name: "GESTOR" } },
  });
  for (const g of gestores) {
    await notifyUser({
      userId: g.userId,
      title: "Nova solicitação de exceção de avanço",
      body: justification.slice(0, 200),
      type: NotificationType.SISTEMA,
      link: `/crm/leads/${leadId}`,
    });
  }
  revalidatePath("/crm");
  return { ok: true };
}

export async function decideExceptionRequest(id: string, approve: boolean) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "crm.exceptions.approve")) return { error: "Apenas gestão." };
  await prisma.exceptionRequest.update({
    where: { id },
    data: {
      status: approve ? "APROVADO" : "REPROVADO",
      decidedById: ctx.userId,
      decidedAt: new Date(),
    },
  });
  revalidatePath("/crm");
  return { ok: true };
}

export async function getLead(id: string) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, lead: null };
  const lead = await prisma.lead.findFirst({
    where: { id, ecosystemId: ctx.ecosystemId },
    include: {
      stage: true,
      company: true,
      activities: { include: { user: true }, orderBy: { occurredAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
      exceptionRequests: { orderBy: { createdAt: "desc" } },
    },
  });
  return { lead };
}
