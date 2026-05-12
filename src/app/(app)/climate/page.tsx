import { listActiveClimateSurveys, getClimateReport } from "@/actions/climate";
import { auth } from "@/auth";
import { ClimateForm } from "@/components/climate/ClimateForm";

export default async function ClimatePage() {
  const session = await auth();
  const surveysRes = await listActiveClimateSurveys();
  const surveys = "surveys" in surveysRes ? surveysRes.surveys : [];
  const sid = surveys[0]?.id;
  const canReport = session?.user?.permissions?.includes("climate.reports");
  const reportRes = canReport && sid ? await getClimateReport(sid) : null;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-semibold text-white">Pesquisa de clima</h1>
      {!sid ? (
        <p className="text-white/40 text-sm">Nenhuma pesquisa ativa.</p>
      ) : (
        <>
          <ClimateForm surveyId={sid} />
          {canReport && reportRes && "report" in reportRes && reportRes.report && (
            <div className="rounded-xl border border-white/10 p-4 bg-surface-card/60 text-sm space-y-2">
              <h2 className="text-neon font-semibold">Relatório consolidado</h2>
              <p className="text-white/60">Respostas: {reportRes.report.n}</p>
              <p className="text-white/60">
                Médias Q1–Q5: {reportRes.report.avgQ1.toFixed(2)}, {reportRes.report.avgQ2.toFixed(2)},{" "}
                {reportRes.report.avgQ3.toFixed(2)}, {reportRes.report.avgQ4.toFixed(2)},{" "}
                {reportRes.report.avgQ5.toFixed(2)}
              </p>
              <ul className="text-xs text-white/50 max-h-40 overflow-auto space-y-1">
                {reportRes.report.rows.map((r) => (
                  <li key={r.id}>
                    {r.anonymous ? "Anônimo" : r.user?.name ?? "—"} — {r.comment ?? "—"}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
