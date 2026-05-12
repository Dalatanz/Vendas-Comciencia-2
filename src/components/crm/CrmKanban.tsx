"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { moveLeadStage } from "@/actions/leads";
import type { CrmStage, Company, Lead, User } from "@prisma/client";

type LeadRow = Lead & {
  stage: CrmStage;
  company: Company | null;
  assignedSdr: Pick<User, "id" | "name"> | null;
  assignedCloser: Pick<User, "id" | "name"> | null;
};

export function CrmKanban({
  stages,
  leads,
}: {
  stages: CrmStage[];
  leads: LeadRow[];
}) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onDragStart(e: React.DragEvent, leadId: string) {
    e.dataTransfer.setData("leadId", leadId);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function onDrop(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (!leadId) return;
    setErr(null);
    start(async () => {
      const res = await moveLeadStage(leadId, stageId);
      if ("error" in res && res.error) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });
  }

  const byStage = (sid: string) => leads.filter((l) => l.stageId === sid);

  return (
    <div className="space-y-3">
      {err && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {err}
        </div>
      )}
      {pending && <p className="text-xs text-white/50">Salvando movimento…</p>}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {stages.map((s) => (
          <div
            key={s.id}
            className="min-w-[260px] max-w-[280px] rounded-xl border border-white/10 bg-surface-card/70 flex flex-col"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, s.id)}
          >
            <div className="px-3 py-2 border-b border-white/10 flex justify-between items-center">
              <span className="text-sm font-semibold text-neon">{s.name}</span>
              <span className="text-[10px] text-white/40">{byStage(s.id).length}</span>
            </div>
            <div className="p-2 space-y-2 flex-1 min-h-[120px]">
              {byStage(s.id).length === 0 ? (
                <p className="text-[11px] text-white/30 text-center py-6">Arraste leads aqui</p>
              ) : (
                byStage(s.id).map((l) => (
                  <div
                    key={l.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, l.id)}
                    className="rounded-lg border border-white/10 bg-black/30 p-2 cursor-grab active:cursor-grabbing hover:border-neon/40"
                  >
                    <Link href={`/crm/leads/${l.id}`} className="text-sm font-medium text-white hover:text-neon">
                      {l.contactName}
                    </Link>
                    <div className="text-[10px] text-white/45 mt-1">
                      {l.company?.razaoSocial ?? "Sem empresa"} · {l.origin}
                    </div>
                    <div className="text-[10px] text-white/35 mt-1">
                      SDR: {l.assignedSdr?.name ?? "—"} · Closer: {l.assignedCloser?.name ?? "—"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
