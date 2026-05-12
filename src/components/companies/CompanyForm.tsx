"use client";

import { RegimeTributario } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCompany } from "@/actions/companies";
import { formatCnpj, onlyDigits } from "@/lib/masks";

export function CompanyForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [razao, setRazao] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [regime, setRegime] = useState<RegimeTributario>(RegimeTributario.SIMPLES_NACIONAL);
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await createCompany({
        razaoSocial: razao,
        cnpj,
        regimeTributario: regime,
      });
      if ("error" in r && r.error) setErr(r.error);
      else {
        setRazao("");
        setCnpj("");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-white/10 bg-surface-card/60 p-4 space-y-3 max-w-lg">
      <h2 className="text-sm font-semibold text-neon">Nova empresa</h2>
      {err && <p className="text-xs text-red-400">{err}</p>}
      <input
        className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
        placeholder="Razão social"
        value={razao}
        onChange={(e) => setRazao(e.target.value)}
        required
      />
      <input
        className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
        placeholder="CNPJ"
        value={cnpj}
        onChange={(e) => setCnpj(formatCnpj(onlyDigits(e.target.value)))}
        required
      />
      <select
        className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
        value={regime}
        onChange={(e) => setRegime(e.target.value as RegimeTributario)}
      >
        <option value={RegimeTributario.SIMPLES_NACIONAL}>Simples Nacional</option>
        <option value={RegimeTributario.LUCRO_PRESUMIDO}>Lucro Presumido</option>
        <option value={RegimeTributario.LUCRO_REAL}>Lucro Real</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neon/90 text-black text-sm font-semibold px-4 py-2"
      >
        Salvar empresa
      </button>
    </form>
  );
}
