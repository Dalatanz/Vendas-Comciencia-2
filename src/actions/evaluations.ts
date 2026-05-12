"use server";

import { revalidatePath } from "next/cache";
import { EvaluationPostponementStatus, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeFinalScore } from "@/lib/evaluation-score";
import { requireAuth } from "./auth-context";
import { can } from "@/lib/rbac";
import { writeAudit } from "./audit-notify";

export async function listEvaluations() {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, items: [] };
  if (!can(ctx, "evaluations.view")) return { error: "Sem permissão.", items: [] };

  const where =
    can(ctx, "evaluations.manage") || ctx.role === "MASTER" || ctx.role === "DIRETOR" || ctx.role === "GESTOR"
      ? { ecosystemId: ctx.ecosystemId }
      : { ecosystemId: ctx.ecosystemId, OR: [{ subjectId: ctx.userId }, { leaderId: ctx.userId }] };

  const items = await prisma.evaluation.findMany({
    where,
    include: { subject: true, leader: true },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
  });
  return { items };
}

export async function saveEvaluation(
  id: string,
  data: Record<string, string | number | null | undefined>
) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  const ev = await prisma.evaluation.findFirst({
    where: { id, ecosystemId: ctx.ecosystemId },
  });
  if (!ev) return { error: "Avaliação não encontrada." };
  const isSubject = ev.subjectId === ctx.userId;
  const isLeader = ev.leaderId === ctx.userId;
  if (!isSubject && !isLeader && !can(ctx, "evaluations.manage")) return { error: "Sem permissão." };

  const criteria = [
    "comprometimento",
    "organizacaoCrm",
    "volumeAtividades",
    "qualidadeAbordagem",
    "qualidadeQualificacao",
    "gestaoObjecoes",
    "qualidadeFollowups",
    "aderenciaProcesso",
    "conversaoReuniao",
    "evolucaoPeriodo",
  ] as const;

  const patch: Record<string, unknown> = {};
  for (const k of criteria) {
    if (data[k] !== undefined && data[k] !== "") {
      const n = Number(data[k]);
      if (!Number.isNaN(n)) patch[k] = n;
    }
  }
  const text = [
    "pontoForte",
    "pontoMelhoria",
    "gargaloAtual",
    "focoProximaSemana",
    "acaoCombinada",
    "treinamentoRecomendado",
  ] as const;
  for (const k of text) {
    if (data[k] !== undefined) patch[k] = data[k] as string;
  }
  if (data.companyScore !== undefined && data.companyScore !== "") {
    patch.companyScore = Number(data.companyScore);
  }

  if (isSubject && !isLeader) {
    patch.status = "AUTO";
    patch.autoCompletedAt = new Date();
  } else if (isLeader || can(ctx, "evaluations.manage")) {
    patch.status = "LIDER";
    patch.leaderCompletedAt = new Date();
    const { score } = computeFinalScore(patch as never, ctx.role);
    patch.scoreFinal = score;
  }

  await prisma.evaluation.update({ where: { id }, data: patch as never });
  await writeAudit({
    userId: ctx.userId,
    ecosystemId: ctx.ecosystemId,
    entity: "Evaluation",
    entityId: id,
    action: "UPDATE",
    diff: patch,
  });
  revalidatePath("/evaluations");
  return { ok: true };
}

export async function requestEvaluationPostponement(evaluationId: string, justification: string) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  await prisma.evaluationPostponementRequest.create({
    data: { evaluationId, requestedById: ctx.userId, justification },
  });
  const masters = await prisma.userEcosystemMembership.findMany({
    where: { ecosystemId: ctx.ecosystemId, role: { name: "MASTER" } },
  });
  for (const m of masters) {
    await prisma.notification.create({
      data: {
        userId: m.userId,
        title: "Pedido de adiamento de avaliação",
        body: justification.slice(0, 200),
        type: NotificationType.AVALIACAO,
        link: "/admin/evaluations-postpone",
      },
    });
  }
  revalidatePath("/evaluations");
  return { ok: true };
}

export async function decidePostponement(id: string, approve: boolean): Promise<void> {
  const ctx = await requireAuth();
  if ("error" in ctx) return;
  if (!can(ctx, "evaluations.postpone_decide")) return;
  await prisma.evaluationPostponementRequest.update({
    where: { id },
    data: {
      status: approve ? EvaluationPostponementStatus.APROVADO : EvaluationPostponementStatus.REPROVADO,
      decidedById: ctx.userId,
      decidedAt: new Date(),
    },
  });
  revalidatePath("/admin");
}
