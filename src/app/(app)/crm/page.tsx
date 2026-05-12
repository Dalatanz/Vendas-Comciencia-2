import Link from "next/link";
import { Suspense } from "react";
import { listLeads, getCrmStages } from "@/actions/leads";
import { CrmKanban } from "@/components/crm/CrmKanban";
import { CrmFilters } from "@/components/crm/CrmFilters";

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = {
    search: sp.q,
    stageSlug: sp.stage,
    status: sp.status as never,
    sdrId: sp.sdr,
    closerId: sp.closer,
    origin: sp.origin,
    segment: sp.segment,
    dateFrom: sp.from,
    dateTo: sp.to,
  };

  const [leadsRes, stagesRes] = await Promise.all([listLeads(filters), getCrmStages()]);
  const leads = "leads" in leadsRes ? leadsRes.leads : [];
  const error = "error" in leadsRes ? leadsRes.error : undefined;
  const stages = stagesRes.stages ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">CRM — Cold Call</h1>
          <p className="text-sm text-white/50">Kanban com validação de regras no servidor.</p>
        </div>
        <Link
          href="/crm/leads/new"
          className="rounded-lg bg-neon/90 text-black text-sm font-semibold px-4 py-2 hover:bg-neon"
        >
          Novo lead
        </Link>
      </div>

      <Suspense fallback={<p className="text-white/40 text-sm">Carregando filtros…</p>}>
        <CrmFilters />
      </Suspense>

      {error && <p className="text-amber-300 text-sm">{error}</p>}

      {stages.length === 0 ? (
        <p className="text-white/40">Nenhuma etapa configurada.</p>
      ) : (
        <CrmKanban stages={stages} leads={leads} />
      )}
    </div>
  );
}
