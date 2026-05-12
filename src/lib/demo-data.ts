import type { CrmStage, Notification } from "@prisma/client";
import { NotificationType } from "@prisma/client";

/** ID estável na sessão JWT (não existe na tabela `User` em modo demo). */
export const DEMO_USER_ID = "demo-local-user";

/** Ecossistemas fictícios (menu Scale / Simplifica). */
export const DEMO_ECOSYSTEM_SCALE_ID = "demo-eco-scale";
export const DEMO_ECOSYSTEM_SIMPLIFICA_ID = "demo-eco-simplifica";

export const DEMO_FUNNEL_ID = "demo-funnel-cold-call";

/** Mesmos valores sugeridos na tela de login (seed real usa o mesmo e-mail). */
export const DEMO_LOGIN_EMAIL = "master@vendacomciencia.com";
export const DEMO_LOGIN_PASSWORD = "maisvendas!@2026";

/** Permissões equivalentes ao perfil Master do seed (para o menu completo). */
export const DEMO_MASTER_PERMISSIONS: string[] = [
  "dashboard.view",
  "crm.view",
  "crm.leads.own",
  "crm.leads.team",
  "crm.leads.all",
  "crm.leads.create",
  "crm.leads.edit",
  "crm.leads.delete",
  "crm.companies.manage",
  "crm.kanban",
  "crm.reports",
  "crm.score_rules.view",
  "crm.exceptions.approve",
  "one_on_one.view",
  "one_on_one.manage",
  "evaluations.view",
  "evaluations.manage",
  "evaluations.postpone_decide",
  "climate.submit",
  "climate.reports",
  "tickets.view",
  "tickets.create",
  "tickets.respond",
  "workspace.view",
  "workspace.manage",
  "strategic.view",
  "strategic.manage",
  "reports.management",
  "reports.executive",
  "admin.users",
  "admin.roles",
  "admin.permissions",
  "admin.ecosystems",
  "admin.companies",
  "admin.logs",
  "admin.sla",
  "admin.crm_stages",
];

const stageDefs: { id: string; name: string; slug: string; order: number; slaHours: number }[] = [
  { id: "demo-stage-1", name: "Lead Novo", slug: "LEAD_NOVO", order: 1, slaHours: 4 },
  { id: "demo-stage-2", name: "Retorno", slug: "RETORNO", order: 2, slaHours: 24 },
  { id: "demo-stage-3", name: "Reunião", slug: "REUNIAO", order: 7, slaHours: 72 },
  { id: "demo-stage-4", name: "Proposta Enviada", slug: "PROPOSTA_ENVIADA", order: 8, slaHours: 72 },
  { id: "demo-stage-5", name: "Contrato Assinado", slug: "CONTRATO_ASSINADO", order: 9, slaHours: 120 },
];

export function getDemoCrmStages(): CrmStage[] {
  return stageDefs.map(
    (s) =>
      ({
        id: s.id,
        funnelId: DEMO_FUNNEL_ID,
        name: s.name,
        slug: s.slug,
        order: s.order,
        slaHours: s.slaHours,
      }) as CrmStage
  );
}

export function getDemoNotification(): Notification {
  const now = new Date();
  return {
    id: "demo-notification-1",
    userId: DEMO_USER_ID,
    title: "Modo demonstração",
    body: "Sem PostgreSQL: dados são exemplos ou vazios. Configure DATABASE_URL e desligue DEMO_MODE para uso real.",
    read: false,
    link: "/dashboard",
    type: NotificationType.SISTEMA,
    createdAt: now,
  } as Notification;
}
