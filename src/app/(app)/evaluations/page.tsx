import { listEvaluations } from "@/actions/evaluations";
import { auth } from "@/auth";
import { EvaluationForm } from "@/components/evaluations/EvaluationForm";

export default async function EvaluationsPage() {
  const session = await auth();
  const res = await listEvaluations();
  const items = "items" in res ? res.items : [];
  const error = "error" in res ? res.error : undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Avaliações</h1>
      {error && <p className="text-amber-300 text-sm">{error}</p>}
      {session?.user?.permissions?.includes("crm.score_rules.view") && (
        <p className="text-xs text-neon/80 border border-neon/20 rounded-lg p-3">
          Regra de score (confidencial para SDR/Closer): peso 70% processos e 30% comportamental — visível apenas para
          gestão, diretoria e master.
        </p>
      )}
      <div className="space-y-8">
        {items.length === 0 ? (
          <p className="text-white/40 text-sm">Nenhuma avaliação.</p>
        ) : (
          items.map((ev) => (
            <div key={ev.id} className="rounded-xl border border-white/10 p-4 bg-surface-card/60">
              <div className="text-sm text-white mb-2">
                {ev.subject.name} — {ev.periodMonth}/{ev.periodYear} — {ev.status}
              </div>
              <EvaluationForm evaluation={ev} viewerRole={session?.user?.role ?? null} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
