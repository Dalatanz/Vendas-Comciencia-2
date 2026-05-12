"use client";

import { StrategicColumn } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { moveStrategicTask } from "@/actions/strategic";
import type { StrategicPriority, StrategicTask, User, Company, Lead } from "@prisma/client";

type TaskRow = StrategicTask & {
  assignee: Pick<User, "id" | "name"> | null;
  company: Pick<Company, "id" | "razaoSocial"> | null;
  lead: Pick<Lead, "id" | "contactName"> | null;
};

const COLS: { id: StrategicColumn; label: string }[] = [
  { id: StrategicColumn.A_FAZER, label: "A Fazer" },
  { id: StrategicColumn.EM_ANDAMENTO, label: "Em Andamento" },
  { id: StrategicColumn.AGUARDANDO, label: "Aguardando" },
  { id: StrategicColumn.REVISAO, label: "Revisão" },
  { id: StrategicColumn.CONCLUIDO, label: "Concluído" },
];

const priorityColor: Record<StrategicPriority, string> = {
  BAIXA: "border-green-500/50",
  MEDIA: "border-orange-500/50",
  ALTA: "border-orange-600/60",
  URGENTE: "border-red-500/70",
};

export function StrategicBoard({ tasks }: { tasks: TaskRow[] }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("taskId", id);
  }

  function onDrop(e: React.DragEvent, col: StrategicColumn) {
    e.preventDefault();
    const id = e.dataTransfer.getData("taskId");
    if (!id) return;
    setErr(null);
    start(async () => {
      const max = tasks.filter((t) => t.column === col).length;
      const r = await moveStrategicTask(id, col, max);
      if ("error" in r && r.error) setErr(r.error);
      else router.refresh();
    });
  }

  const by = (c: StrategicColumn) => tasks.filter((t) => t.column === c);

  return (
    <div className="space-y-2">
      {err && <p className="text-sm text-red-400">{err}</p>}
      {pending && <p className="text-xs text-white/40">Salvando…</p>}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLS.map((c) => (
          <div
            key={c.id}
            className="min-w-[240px] rounded-xl border border-white/10 bg-surface-card/70 p-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, c.id)}
          >
            <div className="text-xs font-semibold text-neon mb-2">{c.label}</div>
            <div className="space-y-2 min-h-[100px]">
              {by(c.id).map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, t.id)}
                  className={`rounded-lg border bg-black/30 p-2 cursor-grab ${priorityColor[t.priority]}`}
                >
                  <div className="text-sm text-white font-medium">{t.title}</div>
                  <div className="text-[10px] text-white/45 mt-1">
                    {t.assignee?.name ?? "—"} · {t.company?.razaoSocial ?? "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
