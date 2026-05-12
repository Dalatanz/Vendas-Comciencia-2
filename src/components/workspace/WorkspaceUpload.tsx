"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function WorkspaceUpload({ folderId }: { folderId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("folderId", folderId);
    fd.set("file", file);
    start(async () => {
      const res = await fetch("/api/workspace/file", { method: "POST", body: fd });
      if (!res.ok) alert("Falha no upload");
      router.refresh();
      e.target.value = "";
    });
  }

  return (
    <label className="text-xs text-white/50 cursor-pointer inline-block">
      <span className="rounded border border-white/20 px-2 py-1 hover:border-neon/50">Anexar arquivo</span>
      <input type="file" className="hidden" disabled={pending} onChange={onChange} />
    </label>
  );
}
