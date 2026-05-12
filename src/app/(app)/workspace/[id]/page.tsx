import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkspaceDetail } from "@/actions/workspace";
import { WorkspaceUpload } from "@/components/workspace/WorkspaceUpload";

export default async function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getWorkspaceDetail(id);
  if (!res.workspace) notFound();
  const w = res.workspace;

  return (
    <div className="space-y-6">
      <Link href="/workspace" className="text-xs text-neon hover:underline">
        ← Workspaces
      </Link>
      <h1 className="text-2xl font-semibold text-white">{w.name}</h1>
      <p className="text-sm text-white/50">{w.company.razaoSocial}</p>
      <div className="space-y-6">
        {w.folders.map((folder) => (
          <div key={folder.id} className="rounded-xl border border-white/10 p-4 bg-surface-card/60">
            <h2 className="text-sm font-semibold text-neon mb-3">{folder.name}</h2>
            <WorkspaceUpload folderId={folder.id} />
            <ul className="mt-3 space-y-2 text-sm">
              {folder.files.map((f) => (
                <li key={f.id} className="flex justify-between gap-2 border-b border-white/5 pb-2">
                  <a
                    className="text-white/80 hover:text-neon"
                    href={`/api/workspace/file/${f.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {f.name}
                  </a>
                  <span className="text-white/40 text-xs">{f.uploadedBy.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
