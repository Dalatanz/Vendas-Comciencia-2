import type { RoleName } from "@prisma/client";

const PROCESS_KEYS = [
  "organizacaoCrm",
  "volumeAtividades",
  "qualidadeQualificacao",
  "qualidadeFollowups",
  "aderenciaProcesso",
  "conversaoReuniao",
] as const;

const BEHAVIOR_KEYS = [
  "comprometimento",
  "qualidadeAbordagem",
  "gestaoObjecoes",
  "evolucaoPeriodo",
] as const;

type Criteria = Record<string, number | null | undefined>;

function avg(keys: readonly string[], data: Criteria) {
  const vals = keys.map((k) => data[k]).filter((v): v is number => typeof v === "number");
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Regra 70% processos / 30% comportamental — só para perfis autorizados. */
export function computeFinalScore(data: Criteria, viewerRole: RoleName | null | undefined) {
  const canSeeRule = viewerRole === "GESTOR" || viewerRole === "DIRETOR" || viewerRole === "MASTER";
  const p = avg(PROCESS_KEYS, data);
  const b = avg(BEHAVIOR_KEYS, data);
  if (p == null || b == null) return { score: null as number | null, formulaNote: null as string | null };
  const score = p * 0.7 + b * 0.3;
  return {
    score: Math.round(score * 100) / 100,
    formulaNote: canSeeRule ? "Peso: 70% processos + 30% comportamental" : null,
  };
}
