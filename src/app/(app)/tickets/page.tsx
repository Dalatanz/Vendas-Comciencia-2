import Link from "next/link";
import { listTickets } from "@/actions/tickets";
import { TicketCreateForm } from "@/components/tickets/TicketCreateForm";

export default async function TicketsPage() {
  const res = await listTickets({});
  const tickets = "tickets" in res ? res.tickets : [];
  const error = "error" in res ? res.error : undefined;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Chamados</h1>
      {error && <p className="text-amber-300 text-sm">{error}</p>}
      <TicketCreateForm />
      <div className="rounded-xl border border-white/10 divide-y divide-white/10">
        {tickets.length === 0 ? (
          <p className="p-6 text-white/40 text-sm">Nenhum chamado.</p>
        ) : (
          tickets.map((t) => (
            <Link key={t.id} href={`/tickets/${t.id}`} className="block p-4 hover:bg-white/5">
              <div className="text-neon text-sm font-semibold">
                #{t.number} · {t.status}
              </div>
              <div className="text-xs text-white/50 mt-1">{t.category} / {t.subcategory}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
