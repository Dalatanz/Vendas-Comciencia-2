"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function CrmFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [pending, start] = useTransition();

  function apply(e: React.FormEvent) {
    e.preventDefault();
    start(() => {
      const p = new URLSearchParams(sp.toString());
      if (q) p.set("q", q);
      else p.delete("q");
      router.push(`/crm?${p.toString()}`);
    });
  }

  return (
    <form onSubmit={apply} className="flex flex-wrap gap-2 items-end">
      <div>
        <label className="block text-[10px] text-white/40 mb-1">Busca</label>
        <input
          className="rounded-lg bg-black/40 border border-white/10 px-3 py-1.5 text-sm w-64"
          placeholder="Nome, empresa, CNPJ, telefone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-neon/50 text-neon text-sm px-3 py-1.5 hover:bg-neon/10"
      >
        Filtrar
      </button>
    </form>
  );
}
