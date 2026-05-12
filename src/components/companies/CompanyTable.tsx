"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCompany } from "@/actions/companies";
import type { Company } from "@prisma/client";

export function CompanyTable({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [delId, setDelId] = useState<string | null>(null);

  if (!companies.length) {
    return <p className="text-white/40 text-sm">Nenhuma empresa cadastrada.</p>;
  }

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-white/5 text-left text-xs text-white/50">
          <tr>
            <th className="p-3">Razão social</th>
            <th className="p-3">CNPJ</th>
            <th className="p-3">Regime</th>
            <th className="p-3 w-28" />
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.id} className="border-t border-white/10">
              <td className="p-3 text-white">{c.razaoSocial}</td>
              <td className="p-3 text-white/70">{c.cnpj}</td>
              <td className="p-3 text-white/70">{c.regimeTributario}</td>
              <td className="p-3">
                {delId === c.id ? (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="text-xs text-red-400"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          await deleteCompany(c.id);
                          setDelId(null);
                          router.refresh();
                        })
                      }
                    >
                      Confirmar
                    </button>
                    <button type="button" className="text-xs text-white/50" onClick={() => setDelId(null)}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-xs text-red-400/80 hover:text-red-400"
                    onClick={() => setDelId(c.id)}
                  >
                    Excluir
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
