import { describe, it, expect } from "vitest";
import { computeFinalScore } from "@/lib/evaluation-score";

describe("score avaliação", () => {
  it("gestor vê nota da fórmula", () => {
    const data = {
      organizacaoCrm: 5,
      volumeAtividades: 5,
      qualidadeQualificacao: 5,
      qualidadeFollowups: 5,
      aderenciaProcesso: 5,
      conversaoReuniao: 5,
      comprometimento: 4,
      qualidadeAbordagem: 4,
      gestaoObjecoes: 4,
      evolucaoPeriodo: 4,
    };
    const g = computeFinalScore(data, "GESTOR");
    expect(g.formulaNote).toBeTruthy();
    expect(g.score).toBeGreaterThan(0);
  });

  it("SDR não vê fórmula", () => {
    const data = {
      organizacaoCrm: 5,
      volumeAtividades: 5,
      qualidadeQualificacao: 5,
      qualidadeFollowups: 5,
      aderenciaProcesso: 5,
      conversaoReuniao: 5,
      comprometimento: 4,
      qualidadeAbordagem: 4,
      gestaoObjecoes: 4,
      evolucaoPeriodo: 4,
    };
    const s = computeFinalScore(data, "SDR");
    expect(s.formulaNote).toBeNull();
  });
});
