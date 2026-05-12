"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "./auth-context";
import { can } from "@/lib/rbac";

export async function submitClimateResponse(data: {
  surveyId: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  comment?: string;
  anonymous: boolean;
}) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "climate.submit")) return { error: "Sem permissão." };
  const survey = await prisma.climateSurvey.findFirst({
    where: { id: data.surveyId, ecosystemId: ctx.ecosystemId, active: true },
  });
  if (!survey) return { error: "Pesquisa não encontrada." };
  await prisma.climateSurveyResponse.create({
    data: {
      surveyId: data.surveyId,
      userId: data.anonymous ? null : ctx.userId,
      anonymous: data.anonymous,
      q1: data.q1,
      q2: data.q2,
      q3: data.q3,
      q4: data.q4,
      q5: data.q5,
      comment: data.comment?.trim(),
    },
  });
  revalidatePath("/climate");
  return { ok: true };
}

export async function getClimateReport(surveyId: string) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, report: null };
  if (!can(ctx, "climate.reports")) return { error: "Sem permissão para relatório.", report: null };
  const rows = await prisma.climateSurveyResponse.findMany({
    where: { surveyId, survey: { ecosystemId: ctx.ecosystemId } },
    include: { user: { select: { name: true, email: true } } },
  });
  const avg = (fn: (r: (typeof rows)[0]) => number) =>
    rows.length ? rows.reduce((a, r) => a + fn(r), 0) / rows.length : 0;
  const report = {
    n: rows.length,
    avgQ1: avg((r) => r.q1),
    avgQ2: avg((r) => r.q2),
    avgQ3: avg((r) => r.q3),
    avgQ4: avg((r) => r.q4),
    avgQ5: avg((r) => r.q5),
    rows: rows.map((r) => ({
      id: r.id,
      anonymous: r.anonymous,
      user: r.anonymous ? null : r.user,
      q1: r.q1,
      q2: r.q2,
      q3: r.q3,
      q4: r.q4,
      q5: r.q5,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
  };
  return { report };
}

export async function listActiveClimateSurveys() {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, surveys: [] };
  const surveys = await prisma.climateSurvey.findMany({
    where: { ecosystemId: ctx.ecosystemId, active: true },
  });
  return { surveys };
}
