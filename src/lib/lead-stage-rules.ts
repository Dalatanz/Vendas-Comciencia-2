import type { CrmStage, Lead } from "@prisma/client";
import { prisma } from "./prisma";

export async function hasApprovedException(leadId: string): Promise<boolean> {
  const ex = await prisma.exceptionRequest.findFirst({
    where: { leadId, status: "APROVADO" },
    orderBy: { decidedAt: "desc" },
  });
  if (!ex?.decidedAt) return false;
  const days = (Date.now() - ex.decidedAt.getTime()) / 86400000;
  return days <= 7;
}

export function isForwardMove(fromOrder: number, toOrder: number) {
  return toOrder > fromOrder;
}

export async function validateLeadStageMove(args: {
  lead: Lead & { company: { regimeTributario: string | null } | null };
  fromStage: CrmStage;
  toStage: CrmStage;
  bypassSla: boolean;
}) {
  const { lead, fromStage, toStage, bypassSla } = args;
  const forward = isForwardMove(fromStage.order, toStage.order);

  if (lead.slaBreached && forward && !bypassSla) {
    const ok = await hasApprovedException(lead.id);
    if (!ok) {
      return {
        ok: false as const,
        message:
          "SLA estourado: solicite liberação da gestão com justificativa antes de avançar a etapa.",
      };
    }
  }

  if (toStage.slug === "PROPOSTA_ENVIADA" && !lead.meetingAt) {
    return { ok: false as const, message: "Proposta enviada exige data da reunião preenchida." };
  }

  if (lead.status === "QUALIFICADO") {
    if (!lead.company?.regimeTributario) {
      return {
        ok: false as const,
        message: "Status Qualificado exige regime tributário da empresa vinculada.",
      };
    }
    if (lead.qualificationScore == null) {
      return { ok: false as const, message: "Status Qualificado exige nota de qualificação." };
    }
  }

  if (lead.status === "REUNIAO") {
    if (!lead.meetingAt) return { ok: false as const, message: "Status Reunião exige data da reunião." };
    if (lead.meetingScore == null) return { ok: false as const, message: "Status Reunião exige nota da reunião." };
  }

  if (lead.status === "PERDIDO" && !lead.lossReason?.trim()) {
    return { ok: false as const, message: "Status Perdido exige motivo da perda." };
  }

  if (lead.status === "QUALIFICADO" && (!lead.interest?.trim() || !lead.segment?.trim())) {
    return {
      ok: false as const,
      message: "Status Qualificado exige interesse e segmento/CNAE preenchidos.",
    };
  }

  return { ok: true as const };
}
