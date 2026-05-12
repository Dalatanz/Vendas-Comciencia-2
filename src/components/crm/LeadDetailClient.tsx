"use client";

import { ActivityType, LeadStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addLeadActivity,
  createExceptionRequest,
  deleteLead,
  updateLead,
} from "@/actions/leads";
import { createMeeting, createProposal } from "@/actions/crm-sales";
import type { Lead, LeadActivity, LeadTask, CrmStage, Company, User, ExceptionRequest } from "@prisma/client";

type LeadFull = Lead & {
  stage: CrmStage;
  company: Company | null;
  activities: (LeadActivity & { user: User })[];
  tasks: LeadTask[];
  exceptionRequests: ExceptionRequest[];
};

export function LeadDetailClient({ lead }: { lead: LeadFull }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState(lead.status);
  const [lossReason, setLossReason] = useState(lead.lossReason ?? "");
  const [meetingAt, setMeetingAt] = useState(
    lead.meetingAt ? lead.meetingAt.toISOString().slice(0, 16) : ""
  );
  const [notes, setNotes] = useState("");
  const [excuse, setExcuse] = useState("");
  const [del, setDel] = useState(false);

  function saveLead(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      await updateLead(lead.id, {
        status,
        lossReason: status === LeadStatus.PERDIDO ? lossReason : null,
        meetingAt: meetingAt ? new Date(meetingAt) : null,
      });
      router.refresh();
    });
  }

  function addActivity(type: ActivityType) {
    start(async () => {
      await addLeadActivity(lead.id, type, notes || undefined);
      setNotes("");
      router.refresh();
    });
  }

  function requestExc() {
    start(async () => {
      await createExceptionRequest(lead.id, excuse);
      setExcuse("");
      router.refresh();
    });
  }

  function remove() {
    start(async () => {
      await deleteLead(lead.id);
      router.push("/crm");
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={saveLead} className="rounded-xl border border-white/10 p-4 space-y-3 bg-surface-card/60">
        <h2 className="text-sm font-semibold text-neon">Dados do lead</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs text-white/50">
            Status
            <select
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus)}
            >
              {Object.values(LeadStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-white/50">
            Data reunião
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm"
              value={meetingAt}
              onChange={(e) => setMeetingAt(e.target.value)}
            />
          </label>
        </div>
        {status === LeadStatus.PERDIDO && (
          <label className="text-xs text-white/50 block">
            Motivo da perda
            <input
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm"
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value)}
            />
          </label>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-neon/90 text-black text-sm font-semibold px-4 py-2"
        >
          Salvar alterações
        </button>
      </form>

      <div className="rounded-xl border border-white/10 p-4 bg-surface-card/60 space-y-2">
        <h2 className="text-sm font-semibold text-neon">Atividades</h2>
        <textarea
          className="w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm"
          placeholder="Notas da atividade"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["Ligação", ActivityType.LIGACAO],
              ["WhatsApp", ActivityType.WHATSAPP],
              ["E-mail", ActivityType.EMAIL],
              ["Reunião", ActivityType.REUNIAO],
            ] as const
          ).map(([label, t]) => (
            <button
              key={t}
              type="button"
              disabled={pending}
              onClick={() => addActivity(t)}
              className="text-xs rounded-md border border-white/15 px-2 py-1 hover:border-neon/50"
            >
              {label}
            </button>
          ))}
        </div>
        <ul className="text-xs text-white/60 space-y-1 max-h-40 overflow-auto">
          {lead.activities.map((a) => (
            <li key={a.id}>
              <span className="text-neon/80">{a.type}</span> — {a.user.name} —{" "}
              {new Date(a.occurredAt).toLocaleString("pt-BR")}
              {a.notes && <span>: {a.notes}</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-white/10 p-4 bg-surface-card/60 space-y-2">
        <h2 className="text-sm font-semibold text-neon">Closer — Reunião / Proposta</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="text-xs rounded-md border border-white/15 px-2 py-1"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await createMeeting(lead.id, "Reunião registrada", notes, meetingAt ? new Date(meetingAt) : undefined);
                setNotes("");
                router.refresh();
              })
            }
          >
            Registrar reunião
          </button>
          <button
            type="button"
            className="text-xs rounded-md border border-white/15 px-2 py-1"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await createProposal(lead.id, undefined, notes);
                setNotes("");
                router.refresh();
              })
            }
          >
            Registrar proposta
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 p-4 bg-surface-card/60 space-y-2">
        <h2 className="text-sm font-semibold text-neon">Exceção de avanço (SLA)</h2>
        <textarea
          className="w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm"
          placeholder="Justificativa para gestão"
          value={excuse}
          onChange={(e) => setExcuse(e.target.value)}
        />
        <button
          type="button"
          disabled={pending || !excuse.trim()}
          onClick={requestExc}
          className="text-xs rounded-md bg-amber-500/20 text-amber-200 px-3 py-1"
        >
          Solicitar liberação
        </button>
        <ul className="text-xs text-white/50">
          {lead.exceptionRequests.map((ex) => (
            <li key={ex.id}>
              {ex.status} — {ex.justification.slice(0, 80)}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-white/10 p-4 bg-surface-card/60">
        <h2 className="text-sm font-semibold text-white mb-2">Tarefas</h2>
        <ul className="text-xs text-white/60 space-y-1">
          {lead.tasks.map((t) => (
            <li key={t.id}>
              {t.title} {t.done ? "✓" : ""}
            </li>
          ))}
        </ul>
      </div>

      <div className="border border-red-500/30 rounded-xl p-4">
        {!del ? (
          <button type="button" className="text-sm text-red-400" onClick={() => setDel(true)}>
            Excluir lead
          </button>
        ) : (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-red-300">Confirmar exclusão?</span>
            <button type="button" className="text-sm bg-red-600 px-3 py-1 rounded" disabled={pending} onClick={remove}>
              Sim, excluir
            </button>
            <button type="button" className="text-sm text-white/60" onClick={() => setDel(false)}>
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
