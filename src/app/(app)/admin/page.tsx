import Link from "next/link";
import { listUsers, listAuditLogs, listSlaConfigs, listCrmStagesAdmin, listEcosystemsAdmin, listPostponementRequests } from "@/actions/admin";
import { decidePostponement } from "@/actions/evaluations";

export default async function AdminPage() {
  const [users, logs, slas, stages, ecosystems, posts] = await Promise.all([
    listUsers(),
    listAuditLogs(),
    listSlaConfigs(),
    listCrmStagesAdmin(),
    listEcosystemsAdmin(),
    listPostponementRequests(),
  ]);

  return (
    <div className="space-y-10 max-w-5xl">
      <h1 className="text-2xl font-semibold text-white">Administração</h1>

      <section>
        <h2 className="text-neon text-sm font-semibold mb-2">Ecossistemas</h2>
        {"ecosystems" in ecosystems &&
          ecosystems.ecosystems.map((e) => (
            <div key={e.id} className="text-sm text-white/70">
              {e.name} ({e.slug})
            </div>
          ))}
      </section>

      <section>
        <h2 className="text-neon text-sm font-semibold mb-2">Usuários</h2>
        {"users" in users &&
          users.users.map((u) => (
            <div key={u.id} className="text-xs text-white/60 border-b border-white/5 py-1">
              {u.name} — {u.email}
            </div>
          ))}
      </section>

      <section>
        <h2 className="text-neon text-sm font-semibold mb-2">SLA (horas)</h2>
        {"items" in slas &&
          slas.items.map((s) => (
            <div key={s.id} className="text-xs text-white/60">
              {s.key}: {s.hours}h
            </div>
          ))}
      </section>

      <section>
        <h2 className="text-neon text-sm font-semibold mb-2">Etapas CRM</h2>
        {"stages" in stages &&
          stages.stages.map((s) => (
            <div key={s.id} className="text-xs text-white/60">
              {s.order}. {s.name} — SLA {s.slaHours ?? "—"}h
            </div>
          ))}
      </section>

      <section>
        <h2 className="text-neon text-sm font-semibold mb-2">Adiamentos de avaliação</h2>
        {"items" in posts &&
          posts.items.map((p) => (
            <div key={p.id} className="flex flex-wrap gap-2 items-center text-xs border-b border-white/5 py-2">
              <span className="text-white/70">{p.justification.slice(0, 80)}</span>
              <span className="text-white/40">{p.status}</span>
              {p.status === "PENDENTE" && (
                <>
                  <form action={decidePostponement.bind(null, p.id, true)}>
                    <button className="text-neon">Aprovar</button>
                  </form>
                  <form action={decidePostponement.bind(null, p.id, false)}>
                    <button className="text-red-400">Reprovar</button>
                  </form>
                </>
              )}
            </div>
          ))}
      </section>

      <section>
        <h2 className="text-neon text-sm font-semibold mb-2">Logs recentes</h2>
        <div className="max-h-64 overflow-auto text-xs font-mono text-white/50 space-y-1">
          {"logs" in logs &&
            logs.logs.map((l) => (
              <div key={l.id}>
                {new Date(l.createdAt).toISOString()} — {l.action} — {l.entity}
              </div>
            ))}
        </div>
      </section>

      <Link href="/dashboard" className="text-sm text-neon hover:underline">
        Voltar ao dashboard
      </Link>
    </div>
  );
}
