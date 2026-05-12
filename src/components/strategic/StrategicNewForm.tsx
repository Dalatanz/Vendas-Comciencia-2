"use client";

import { StrategicColumn, StrategicPriority } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createStrategicTask } from "@/actions/strategic";

export function StrategicNewForm({ boardId }: { boardId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();

  if (!boardId) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      await createStrategicTask({
        title,
        column: StrategicColumn.A_FAZER,
        priority: StrategicPriority.MEDIA,
      });
      setTitle("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex gap-2 items-end max-w-xl">
      <input
        className="flex-1 rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
        placeholder="Nova tarefa estratégica"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <button type="submit" disabled={pending} className="rounded-lg bg-neon/90 text-black text-sm font-semibold px-4 py-2">
        Criar
      </button>
    </form>
  );
}
