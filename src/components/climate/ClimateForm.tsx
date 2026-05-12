"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitClimateResponse } from "@/actions/climate";

export function ClimateForm({ surveyId }: { surveyId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [q, setQ] = useState({ q1: 3, q2: 3, q3: 3, q4: 3, q5: 3 });
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      await submitClimateResponse({
        surveyId,
        ...q,
        comment,
        anonymous,
      });
      setComment("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-white/10 p-4 space-y-3 bg-surface-card/60">
      <h2 className="text-sm font-semibold text-neon">Responder pesquisa (1–5)</h2>
      {([1, 2, 3, 4, 5] as const).map((n) => (
        <label key={n} className="block text-xs text-white/50">
          Pergunta {n}
          <input
            type="range"
            min={1}
            max={5}
            className="block w-full"
            value={q[`q${n}` as "q1"]}
            onChange={(e) => setQ((s) => ({ ...s, [`q${n}`]: Number(e.target.value) } as typeof q))}
          />
        </label>
      ))}
      <label className="block text-xs text-white/50">
        Comentário aberto
        <textarea
          className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </label>
      <label className="flex items-center gap-2 text-xs text-white/60">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
        Enviar como anônimo
      </label>
      <button type="submit" disabled={pending} className="rounded-lg bg-neon/90 text-black text-sm font-semibold px-4 py-2">
        Enviar resposta
      </button>
    </form>
  );
}
