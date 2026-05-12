"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addTicketMessage } from "@/actions/tickets";
import type { TicketMessage, User } from "@prisma/client";

export function TicketChat({
  ticketId,
  messages,
}: {
  ticketId: string;
  messages: (TicketMessage & { user: Pick<User, "id" | "name"> })[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    start(async () => {
      await addTicketMessage(ticketId, body);
      setBody("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-white/10 p-4 bg-surface-card/60 space-y-3">
      <h2 className="text-sm font-semibold text-neon">Mensagens</h2>
      <ul className="space-y-2 text-sm max-h-64 overflow-auto">
        {messages.map((m) => (
          <li key={m.id} className="border-b border-white/5 pb-2">
            <span className="text-neon/80">{m.user.name}</span>
            <span className="text-white/40 text-xs ml-2">{new Date(m.createdAt).toLocaleString("pt-BR")}</span>
            <p className="text-white/80 mt-1 whitespace-pre-wrap">{m.body}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={send} className="flex gap-2">
        <textarea
          className="flex-1 rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm min-h-[60px]"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Responder…"
        />
        <button type="submit" disabled={pending} className="self-end rounded-lg bg-neon/90 text-black text-sm px-3 py-2">
          Enviar
        </button>
      </form>
    </div>
  );
}
