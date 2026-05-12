import { getFunnelSeries, getDashboardKpis } from "@/actions/dashboard";
import { FunnelChart } from "@/components/dashboard/FunnelChart";

export default async function ReportsPage() {
  const [funnel, kpis] = await Promise.all([getFunnelSeries(), getDashboardKpis({})]);
  const data = "data" in funnel ? funnel.data : [];
  const k = "kpis" in kpis ? kpis.kpis : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Relatórios e indicadores</h1>
      {k && (
        <div className="grid sm:grid-cols-3 gap-3">
          {Object.entries(k).map(([key, val]) => (
            <div key={key} className="rounded-xl border border-white/10 p-3 bg-surface-card/60">
              <div className="text-[10px] text-white/40 uppercase">{key}</div>
              <div className="text-lg text-neon font-semibold">{String(val)}</div>
            </div>
          ))}
        </div>
      )}
      <div className="rounded-xl border border-white/10 p-4 bg-surface-card/60 h-80">
        <h2 className="text-sm font-semibold text-neon mb-2">Funil</h2>
        {data.length ? <FunnelChart data={data} /> : <p className="text-white/40 text-sm">Sem dados.</p>}
      </div>
    </div>
  );
}
