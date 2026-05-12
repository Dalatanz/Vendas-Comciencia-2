import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { processOverdueSla } from "@/actions/sla-job";
import { getDashboardInsights, getDashboardKpis, getFunnelSeries } from "@/actions/dashboard";
import { listNotifications, markNotificationRead } from "@/actions/notifications";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.ecosystemId) redirect("/select-ecosystem");

  await processOverdueSla(session.user.ecosystemId);

  const [kpisRes, funnelRes, insightsRes, notifRes] = await Promise.all([
    getDashboardKpis({}),
    getFunnelSeries(),
    getDashboardInsights(),
    listNotifications(),
  ]);

  const kpis = "kpis" in kpisRes && kpisRes.kpis ? kpisRes.kpis : null;
  const funnel = "data" in funnelRes ? funnelRes.data : [];
  const insights = "insights" in insightsRes ? insightsRes.insights : [];
  const notifs = "items" in notifRes ? notifRes.items : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-white/50 text-sm mt-1">Visão consolidada do funil e indicadores-chave.</p>
      </div>

      {kpis ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Leads novos", kpis.leadsNovos],
            ["Reuniões (etapa)", kpis.reunioes],
            ["Propostas", kpis.propostas],
            ["Contratos", kpis.contratos],
            ["Receita prevista", `R$ ${kpis.receitaPrevista.toFixed(0)}`],
            ["Receita fechada", `R$ ${kpis.receitaFechada.toFixed(0)}`],
            ["Perdas", kpis.perdidos],
            ["Total leads", kpis.total],
          ].map(([label, val]) => (
            <div
              key={String(label)}
              className="rounded-xl border border-white/10 bg-surface-card/80 p-4 glow-border"
            >
              <div className="text-xs text-white/50">{label}</div>
              <div className="text-2xl font-bold text-neon mt-1">{val}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-amber-300 text-sm">{(kpisRes as { error?: string }).error ?? "Sem dados."}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-surface-card/80 p-4">
          <h2 className="text-sm font-semibold text-white mb-4">Funil comercial (cold call)</h2>
          {funnel.length ? <FunnelChart data={funnel} /> : <p className="text-white/40 text-sm">Sem etapas.</p>}
        </div>
        <div className="rounded-xl border border-white/10 bg-surface-card/80 p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Notificações</h2>
          {notifs.length === 0 ? (
            <p className="text-white/40 text-sm">Nenhuma notificação.</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-auto">
              {notifs.slice(0, 12).map((n) => (
                <li key={n.id} className="text-xs border-b border-white/5 pb-2">
                  <div className="flex justify-between gap-2">
                    <Link
                      href={n.link ?? "#"}
                      className={`font-medium ${n.read ? "text-white/50" : "text-neon"}`}
                    >
                      {n.title}
                    </Link>
                    <form action={markNotificationRead.bind(null, n.id)}>
                      <button type="submit" className="text-[10px] text-white/40 hover:text-white">
                        Lida
                      </button>
                    </form>
                  </div>
                  {n.body && <p className="text-white/40 mt-1">{n.body}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-surface-card/60 p-4">
        <h2 className="text-sm font-semibold text-neon mb-2">Insights automáticos</h2>
        {insights.length === 0 ? (
          <p className="text-white/40 text-sm">Insights disponíveis para gestão e diretoria.</p>
        ) : (
          <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
            {insights.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
