"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createOneOnOne } from "@/actions/one-on-ones";

export function OneOnOneForm({
  users,
}: {
  users: { id: string; name: string; email: string }[];
}) {
  const router = useRouter();
  const [sellerId, setSellerId] = useState(users[0]?.id ?? "");
  const [leaderId, setLeaderId] = useState(users[1]?.id ?? users[0]?.id ?? "");
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!when) return;
    start(async () => {
      await createOneOnOne({
        sellerId,
        leaderId,
        scheduledAt: new Date(when),
        notes: notes || undefined,
      });
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-white/10 p-4 space-y-2 max-w-lg bg-surface-card/60 text-sm">
      <h2 className="text-neon font-semibold text-sm mb-2">Novo 1:1</h2>
      <select className="w-full rounded bg-black/40 border border-white/10 px-2 py-1" value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            Vendedor: {u.name}
          </option>
        ))}
      </select>
      <select className="w-full rounded bg-black/40 border border-white/10 px-2 py-1" value={leaderId} onChange={(e) => setLeaderId(e.target.value)}>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            Líder: {u.name}
          </option>
        ))}
      </select>
      <input type="datetime-local" className="w-full rounded bg-black/40 border border-white/10 px-2 py-1" value={when} onChange={(e) => setWhen(e.target.value)} required />
      <textarea className="w-full rounded bg-black/40 border border-white/10 px-2 py-1" placeholder="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <button type="submit" disabled={pending} className="rounded-lg bg-neon/90 text-black font-semibold px-4 py-2">
        Agendar
      </button>
    </form>
  );
}
