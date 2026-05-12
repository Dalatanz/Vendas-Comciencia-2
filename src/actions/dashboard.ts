"use server";

import { LeadStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "./auth-context";
import { can } from "@/lib/rbac";
import { isDemoMode } from "@/lib/demo-mode";
import { getDemoCrmStages } from "@/lib/demo-data";

function buildLeadWhere(
  ctx: { ecosystemId: string; userId: string },
  filters: {
    dateFrom?: string;
    dateTo?: string;
    sdrId?: string;
    closerId?: string;
    origin?: string;
    status?: LeadStatus;
    segment?: string;
  },
  restricted: boolean
): Prisma.LeadWhereInput {
  const w: Prisma.LeadWhereInput = { ecosystemId: ctx.ecosystemId };
  if (restricted) {
    w.OR = [{ assignedSdrId: ctx.userId }, { assignedCloserId: ctx.userId }];
  } else {
    if (filters.sdrId) w.assignedSdrId = filters.sdrId;
    if (filters.closerId) w.assignedCloserId = filters.closerId;
    if (filters.origin) w.origin = { equals: filters.origin, mode: "insensitive" };
    if (filters.status) w.status = filters.status;
    if (filters.segment) w.segment = { contains: filters.segment, mode: "insensitive" };
    const created: Prisma.DateTimeFilter = {};
    if (filters.dateFrom) created.gte = new Date(filters.dateFrom);
    if (filters.dateTo) created.lte = new Date(filters.dateTo);
    if (Object.keys(created).length) w.createdAt = created;
  }
  return w;
}

export async function getDashboardKpis(filters: {
  dateFrom?: string;
  dateTo?: string;
  sdrId?: string;
  closerId?: string;
  origin?: string;
  status?: LeadStatus;
  segment?: string;
}) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, kpis: null as null | Record<string, number> };

  if (!can(ctx, "dashboard.view")) return { error: "Sem permissão.", kpis: null };

  if (isDemoMode()) {
    return {
      kpis: {
        leadsNovos: 12,
        reunioes: 5,
        propostas: 3,
        contratos: 2,
        receitaPrevista: 185000,
        receitaFechada: 92000,
        perdidos: 1,
        total: 24,
      },
    };
  }

  const restricted = !can(ctx, "reports.management") && !can(ctx, "reports.executive");
  const where = buildLeadWhere(ctx, filters, restricted);

  const leads = await prisma.lead.findMany({
    where,
    include: { stage: true, proposals: true, contracts: true },
  });

  const leadIds = leads.map((l) => l.id);
  const proposals = await prisma.proposal.count({ where: { leadId: { in: leadIds } } });
  const contracts = await prisma.contract.findMany({
    where: { leadId: { in: leadIds } },
    select: { value: true },
  });

  const stageSlug = (s: string) => leads.filter((l) => l.stage.slug === s).length;
  const receitaFechada = contracts.reduce((a, c) => a + (c.value ?? 0), 0);
  const receitaPrevista = leads.reduce((a, l) => a + (l.proposals[0]?.value ?? 0), 0);

  const kpis = {
    leadsNovos: stageSlug("LEAD_NOVO"),
    reunioes: stageSlug("REUNIAO"),
    propostas: proposals,
    contratos: contracts.length,
    receitaPrevista,
    receitaFechada,
    perdidos: leads.filter((l) => l.status === "PERDIDO").length,
    total: leads.length,
  };

  return { kpis };
}

export async function getFunnelSeries() {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, data: [] as { name: string; value: number }[] };
  if (isDemoMode()) {
    const stages = getDemoCrmStages();
    const values: Record<string, number> = {
      LEAD_NOVO: 12,
      RETORNO: 8,
      REUNIAO: 5,
      PROPOSTA_ENVIADA: 3,
      CONTRATO_ASSINADO: 2,
    };
    return {
      data: stages.map((s) => ({ name: s.name, value: values[s.slug] ?? 1 })),
    };
  }
  const stages = await prisma.crmStage.findMany({
    where: { funnel: { ecosystemId: ctx.ecosystemId, name: "cold call" } },
    orderBy: { order: "asc" },
  });
  const counts = await Promise.all(
    stages.map(async (s) => ({
      name: s.name,
      value: await prisma.lead.count({ where: { ecosystemId: ctx.ecosystemId, stageId: s.id } }),
    }))
  );
  return { data: counts };
}

export async function getDashboardInsights() {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, insights: [] as string[] };
  if (!can(ctx, "reports.management") && !can(ctx, "reports.executive")) {
    return { insights: [] };
  }

  if (isDemoMode()) {
    return {
      insights: [
        "Modo demonstração: com PostgreSQL e seed, estes textos passam a refletir o CRM real.",
        "Exemplo: maior volume por origem e leads com próxima ação atrasada seriam calculados no servidor.",
      ],
    };
  }

  const byOrigin = await prisma.lead.groupBy({
    by: ["origin"],
    where: { ecosystemId: ctx.ecosystemId },
    _count: true,
  });
  const insights: string[] = [];
  if (byOrigin.length) {
    const top = [...byOrigin].sort((a, b) => {
      const ca = typeof a._count === "number" ? a._count : (a._count as { _all: number })._all;
      const cb = typeof b._count === "number" ? b._count : (b._count as { _all: number })._all;
      return cb - ca;
    })[0];
    const cnt =
      typeof top._count === "number" ? top._count : (top._count as { _all: number })._all;
    insights.push(`Maior volume de leads por origem: ${top.origin} (${cnt}).`);
  }
  const stalled = await prisma.lead.findFirst({
    where: {
      ecosystemId: ctx.ecosystemId,
      nextActionAt: { lt: new Date() },
    },
    include: { stage: true },
  });
  if (stalled) {
    insights.push(
      `Possível gargalo: há leads com próxima ação atrasada na etapa "${stalled.stage.name}".`
    );
  }
  return { insights };
}
