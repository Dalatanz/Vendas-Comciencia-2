import Link from "next/link";
import { listWorkspaces } from "@/actions/workspace";

export default async function WorkspaceIndexPage() {
  const res = await listWorkspaces();
  const workspaces = "workspaces" in res ? res.workspaces : [];
  const error = "error" in res ? res.error : undefined;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Workspace do cliente</h1>
      {error && <p className="text-amber-300 text-sm">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {workspaces.length === 0 ? (
          <p className="text-white/40 text-sm">Nenhum workspace. Crie empresas e solicite à gestão a criação.</p>
        ) : (
          workspaces.map((w) => (
            <Link
              key={w.id}
              href={`/workspace/${w.id}`}
              className="rounded-xl border border-white/10 bg-surface-card/70 p-4 hover:border-neon/40"
            >
              <div className="text-neon font-semibold">{w.name}</div>
              <div className="text-xs text-white/50 mt-1">{w.company.razaoSocial}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
