"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { listMyEcosystems, setSelectedEcosystem } from "@/actions/ecosystem";

export default function SelectEcosystemPage() {
  const { data: session, update } = useSession();
  const [items, setItems] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listMyEcosystems().then((r) => {
      if ("error" in r) setErr(r.error ?? "Erro");
      else setItems(r.ecosystems);
    });
  }, []);

  async function pick(id: string) {
    setErr(null);
    const r = await setSelectedEcosystem(id);
    if ("error" in r) {
      setErr(r.error ?? "Erro");
      return;
    }
    await update({ ecosystemId: id });
    window.location.assign("/dashboard");
  }

  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <h1 className="text-xl font-semibold text-white mb-2">Escolha o ecossistema</h1>
      <p className="text-sm text-white/50 mb-6">Scale ou Simplifica — define o contexto de dados e permissões.</p>
      {err && <p className="text-red-400 text-sm mb-4">{err}</p>}
      <div className="grid gap-3">
        {items.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => pick(e.id)}
            className="rounded-xl border border-white/10 bg-surface-card/80 p-4 text-left hover:border-neon/50 hover:shadow-neon transition"
          >
            <div className="text-neon font-semibold">{e.name}</div>
            <div className="text-xs text-white/40">{e.slug}</div>
          </button>
        ))}
      </div>
      {session?.user?.ecosystemId && (
        <p className="text-xs text-white/40 mt-6">
          Ecossistema atual na sessão. Você pode trocar pelo menu superior a qualquer momento.
        </p>
      )}
    </div>
  );
}
