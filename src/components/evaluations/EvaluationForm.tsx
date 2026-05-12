"use client";

import type { Evaluation, User } from "@prisma/client";
import type { RoleName } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveEvaluation } from "@/actions/evaluations";
import { computeFinalScore } from "@/lib/evaluation-score";

type Ev = Evaluation & { subject: User; leader: User };

export function EvaluationForm({ evaluation, viewerRole }: { evaluation: Ev; viewerRole: RoleName | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    comprometimento: evaluation.comprometimento ?? "",
    organizacaoCrm: evaluation.organizacaoCrm ?? "",
    volumeAtividades: evaluation.volumeAtividades ?? "",
    qualidadeAbordagem: evaluation.qualidadeAbordagem ?? "",
    qualidadeQualificacao: evaluation.qualidadeQualificacao ?? "",
    gestaoObjecoes: evaluation.gestaoObjecoes ?? "",
    qualidadeFollowups: evaluation.qualidadeFollowups ?? "",
    aderenciaProcesso: evaluation.aderenciaProcesso ?? "",
    conversaoReuniao: evaluation.conversaoReuniao ?? "",
    evolucaoPeriodo: evaluation.evolucaoPeriodo ?? "",
    pontoForte: evaluation.pontoForte ?? "",
    pontoMelhoria: evaluation.pontoMelhoria ?? "",
  });

  const preview = computeFinalScore(
    Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === "" ? null : Number(v)])
    ) as never,
    viewerRole
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      await saveEvaluation(evaluation.id, form as never);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-2 text-xs">
      {(
        [
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
        ] as const
      ).map((k) => (
        <label key={k} className="text-white/50">
          {k}
          <input
            type="number"
            min={1}
            max={5}
            className="mt-1 w-full rounded bg-black/40 border border-white/10 px-2 py-1 text-white"
            value={form[k] as string | number}
            onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
          />
        </label>
      ))}
      <label className="text-white/50 sm:col-span-2">
        Ponto forte
        <input
          className="mt-1 w-full rounded bg-black/40 border border-white/10 px-2 py-1 text-white"
          value={form.pontoForte}
          onChange={(e) => setForm((f) => ({ ...f, pontoForte: e.target.value }))}
        />
      </label>
      <label className="text-white/50 sm:col-span-2">
        Ponto de melhoria
        <input
          className="mt-1 w-full rounded bg-black/40 border border-white/10 px-2 py-1 text-white"
          value={form.pontoMelhoria}
          onChange={(e) => setForm((f) => ({ ...f, pontoMelhoria: e.target.value }))}
        />
      </label>
      {preview.formulaNote && <p className="sm:col-span-2 text-neon/90">{preview.formulaNote}</p>}
      {preview.score != null && <p className="sm:col-span-2 text-white/70">Score estimado: {preview.score}</p>}
      <button
        type="submit"
        disabled={pending}
        className="sm:col-span-2 rounded-lg bg-neon/90 text-black font-semibold py-2 mt-2"
      >
        Salvar avaliação
      </button>
    </form>
  );
}
