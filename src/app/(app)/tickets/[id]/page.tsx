import Link from "next/link";
import { notFound } from "next/navigation";
import { TicketStatus } from "@prisma/client";
import { getTicket, setTicketStatus } from "@/actions/tickets";
import { TicketChat } from "@/components/tickets/TicketChat";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getTicket(id);
  if (!res.ticket) notFound();
  const t = res.ticket;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/tickets" className="text-xs text-neon hover:underline">
        ← Chamados
      </Link>
      <h1 className="text-2xl font-semibold text-white">
        Chamado #{t.number} — {t.status}
      </h1>
      <p className="text-sm text-white/60 whitespace-pre-wrap">{t.description}</p>
      <div className="flex flex-wrap gap-2">
        <form action={setTicketStatus.bind(null, t.id, TicketStatus.EM_ATENDIMENTO)}>
          <button className="text-xs border border-white/20 rounded px-2 py-1">Em atendimento</button>
        </form>
        <form action={setTicketStatus.bind(null, t.id, TicketStatus.FECHADO)}>
          <button className="text-xs border border-white/20 rounded px-2 py-1">Fechar</button>
        </form>
        <form action={setTicketStatus.bind(null, t.id, TicketStatus.REABERTO)}>
          <button className="text-xs border border-white/20 rounded px-2 py-1">Reabrir</button>
        </form>
      </div>
      <TicketChat ticketId={t.id} messages={t.messages} />
    </div>
  );
}
