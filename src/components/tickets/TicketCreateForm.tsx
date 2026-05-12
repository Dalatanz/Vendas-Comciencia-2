"use client";

import { TicketArea, TicketCategory, TicketSubcategory } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createTicket } from "@/actions/tickets";

export function TicketCreateForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [desc, setDesc] = useState("");
  const [area, setArea] = useState<TicketArea>(TicketArea.TI);
  const [cat, setCat] = useState<TicketCategory>(TicketCategory.CRM);
  const [sub, setSub] = useState<TicketSubcategory>(TicketSubcategory.DUVIDA);
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await createTicket({ area, category: cat, subcategory: sub, description: desc });
      if ("error" in r && r.error) setErr(r.error);
      else {
        setDesc("");
        router.push(`/tickets/${(r as { id: string }).id}`);
      }
    });
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-white/10 p-4 space-y-2 max-w-xl bg-surface-card/60">
      <h2 className="text-sm font-semibold text-neon">Abrir chamado</h2>
      {err && <p className="text-xs text-red-400">{err}</p>}
      <select className="w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm" value={area} onChange={(e) => setArea(e.target.value as TicketArea)}>
        <option value={TicketArea.TI}>TI</option>
        <option value={TicketArea.INTELIGENCIA_NEGOCIOS}>Inteligência de Negócios</option>
      </select>
      <select className="w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm" value={cat} onChange={(e) => setCat(e.target.value as TicketCategory)}>
        <option value={TicketCategory.CRM}>CRM</option>
        <option value={TicketCategory.VOIP}>VOIP</option>
        <option value={TicketCategory.SISTEMA}>Sistema</option>
      </select>
      <select className="w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm" value={sub} onChange={(e) => setSub(e.target.value as TicketSubcategory)}>
        <option value={TicketSubcategory.DUVIDA}>Dúvida</option>
        <option value={TicketSubcategory.ERRO_SISTEMA}>Erro de sistema</option>
        <option value={TicketSubcategory.FALHA_CONEXAO}>Falha de conexão</option>
      </select>
      <textarea
        required
        className="w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm min-h-[80px]"
        placeholder="Descrição obrigatória"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <button type="submit" disabled={pending} className="rounded-lg bg-neon/90 text-black text-sm font-semibold px-4 py-2">
        Enviar
      </button>
    </form>
  );
}
