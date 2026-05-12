import {
  PrismaClient,
  RoleName,
  RegimeTributario,
  LeadStatus,
  TicketArea,
  TicketCategory,
  TicketSubcategory,
  TicketStatus,
  StrategicColumn,
  StrategicPriority,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "maisvendas!@2026";

const PERMISSIONS: { key: string; label: string }[] = [
  { key: "dashboard.view", label: "Ver dashboard" },
  { key: "crm.view", label: "Acessar CRM" },
  { key: "crm.leads.own", label: "Leads próprios" },
  { key: "crm.leads.team", label: "Leads do time" },
  { key: "crm.leads.all", label: "Todos os leads" },
  { key: "crm.leads.create", label: "Criar lead" },
  { key: "crm.leads.edit", label: "Editar leads" },
  { key: "crm.leads.delete", label: "Excluir leads" },
  { key: "crm.companies.manage", label: "Gerir empresas" },
  { key: "crm.kanban", label: "Kanban CRM" },
  { key: "crm.reports", label: "Relatórios CRM" },
  { key: "crm.score_rules.view", label: "Ver regra de score" },
  { key: "crm.exceptions.approve", label: "Aprovar exceções de avanço" },
  { key: "one_on_one.view", label: "Ver 1:1" },
  { key: "one_on_one.manage", label: "Gerir 1:1" },
  { key: "evaluations.view", label: "Ver avaliações" },
  { key: "evaluations.manage", label: "Gerir avaliações" },
  { key: "evaluations.postpone_decide", label: "Aprovar adiamento avaliação" },
  { key: "climate.submit", label: "Responder clima" },
  { key: "climate.reports", label: "Relatório clima" },
  { key: "tickets.view", label: "Ver chamados" },
  { key: "tickets.create", label: "Abrir chamado" },
  { key: "tickets.respond", label: "Responder/fechar chamados" },
  { key: "workspace.view", label: "Workspace cliente" },
  { key: "workspace.manage", label: "Gerir workspace" },
  { key: "strategic.view", label: "Planejamento estratégico" },
  { key: "strategic.manage", label: "Gerir tarefas estratégicas" },
  { key: "reports.management", label: "Dashboards gerenciais" },
  { key: "reports.executive", label: "Relatórios executivos" },
  { key: "admin.users", label: "Usuários" },
  { key: "admin.roles", label: "Perfis" },
  { key: "admin.permissions", label: "Permissões" },
  { key: "admin.ecosystems", label: "Ecossistemas" },
  { key: "admin.companies", label: "Empresas (admin)" },
  { key: "admin.logs", label: "Logs" },
  { key: "admin.sla", label: "SLA" },
  { key: "admin.crm_stages", label: "Etapas CRM" },
];

const ROLE_KEYS: Record<RoleName, string[]> = {
  SDR: [
    "dashboard.view",
    "crm.view",
    "crm.leads.own",
    "crm.leads.create",
    "crm.leads.edit",
    "crm.companies.manage",
    "crm.kanban",
    "crm.reports",
    "one_on_one.view",
    "evaluations.view",
    "climate.submit",
    "tickets.view",
    "tickets.create",
    "workspace.view",
    "strategic.view",
  ],
  CLOSER: [
    "dashboard.view",
    "crm.view",
    "crm.leads.own",
    "crm.leads.edit",
    "crm.companies.manage",
    "crm.kanban",
    "crm.reports",
    "one_on_one.view",
    "evaluations.view",
    "climate.submit",
    "tickets.view",
    "tickets.create",
    "workspace.view",
    "strategic.view",
  ],
  GESTOR: [
    "dashboard.view",
    "crm.view",
    "crm.leads.team",
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
  ],
  DIRETOR: [
    "dashboard.view",
    "crm.view",
    "crm.leads.all",
    "crm.leads.edit",
    "crm.companies.manage",
    "crm.kanban",
    "crm.reports",
    "crm.score_rules.view",
    "one_on_one.view",
    "evaluations.view",
    "climate.reports",
    "tickets.view",
    "tickets.respond",
    "workspace.view",
    "strategic.view",
    "reports.management",
    "reports.executive",
  ],
  MASTER: PERMISSIONS.map((p) => p.key),
};

const STAGES = [
  { name: "Lead Novo", slug: "LEAD_NOVO", order: 1, slaHours: 4 },
  { name: "Retorno", slug: "RETORNO", order: 2, slaHours: 24 },
  { name: "Dia 1", slug: "DIA_1", order: 3, slaHours: 24 },
  { name: "Dia 2", slug: "DIA_2", order: 4, slaHours: 24 },
  { name: "Dia 3", slug: "DIA_3", order: 5, slaHours: 24 },
  { name: "Não Atendido", slug: "NAO_ATENDIDO", order: 6, slaHours: 48 },
  { name: "Reunião", slug: "REUNIAO", order: 7, slaHours: 72 },
  { name: "Proposta Enviada", slug: "PROPOSTA_ENVIADA", order: 8, slaHours: 72 },
  { name: "Contrato Assinado", slug: "CONTRATO_ASSINADO", order: 9, slaHours: 120 },
  { name: "Standby", slug: "STANDBY", order: 10, slaHours: 168 },
  { name: "Perdido", slug: "PERDIDO", order: 11, slaHours: 0 },
];

const WORKSPACE_FOLDER_KEYS = [
  { key: "documentos", name: "Documentos da empresa" },
  { key: "kickoff", name: "Reuniões de kickoff" },
  { key: "organograma", name: "Organograma" },
  { key: "operacao", name: "Desenho da operação" },
  { key: "mercado", name: "Mercado" },
  { key: "segmento", name: "Segmento" },
  { key: "porte", name: "Porte da empresa" },
  { key: "diagnostico", name: "Diagnóstico inicial" },
  { key: "dores", name: "Maiores dores" },
];

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      create: { key: p.key, label: p.label },
      update: { label: p.label },
    });
  }

  const permMap = Object.fromEntries(
    (await prisma.permission.findMany()).map((x) => [x.key, x.id])
  );

  const roles: Record<RoleName, string> = {} as Record<RoleName, string>;
  for (const name of Object.values(RoleName)) {
    const role = await prisma.role.upsert({
      where: { name },
      create: {
        name,
        label:
          name === "SDR"
            ? "SDR"
            : name === "CLOSER"
              ? "Closer"
              : name === "GESTOR"
                ? "Gestor"
                : name === "DIRETOR"
                  ? "Diretor"
                  : "Master",
      },
      update: {},
    });
    roles[name] = role.id;
  }

  for (const name of Object.values(RoleName)) {
    const keys = ROLE_KEYS[name];
    await prisma.rolePermission.deleteMany({ where: { roleId: roles[name] } });
    for (const key of keys) {
      const pid = permMap[key];
      if (!pid) continue;
      await prisma.rolePermission.create({
        data: { roleId: roles[name], permissionId: pid },
      });
    }
  }

  const scale = await prisma.ecosystem.upsert({
    where: { slug: "scale" },
    create: { name: "Scale", slug: "scale" },
    update: {},
  });
  const simplifica = await prisma.ecosystem.upsert({
    where: { slug: "simplifica" },
    create: { name: "Simplifica", slug: "simplifica" },
    update: {},
  });

  async function seedEcosystem(ecoId: string) {
    const funnel = await prisma.crmFunnel.upsert({
      where: { id: `funnel-cold-${ecoId}` },
      create: {
        id: `funnel-cold-${ecoId}`,
        ecosystemId: ecoId,
        name: "cold call",
      },
      update: {},
    });

    for (const s of STAGES) {
      const existing = await prisma.crmStage.findFirst({
        where: { funnelId: funnel.id, slug: s.slug },
      });
      if (existing) {
        await prisma.crmStage.update({
          where: { id: existing.id },
          data: { name: s.name, order: s.order, slaHours: s.slaHours },
        });
      } else {
        await prisma.crmStage.create({
          data: {
            funnelId: funnel.id,
            name: s.name,
            slug: s.slug,
            order: s.order,
            slaHours: s.slaHours,
          },
        });
      }
    }

    await prisma.strategicBoard.upsert({
      where: { id: `board-${ecoId}` },
      create: {
        id: `board-${ecoId}`,
        ecosystemId: ecoId,
        name: "Planejamento Estratégico",
      },
      update: {},
    });

    await prisma.climateSurvey.upsert({
      where: { id: `climate-${ecoId}` },
      create: {
        id: `climate-${ecoId}`,
        ecosystemId: ecoId,
        title: "Pesquisa de clima — " + ecoId,
        active: true,
      },
      update: { active: true },
    });

    for (const k of ["default_sla_hours", "followup_d3", "followup_d7", "followup_d10"]) {
      await prisma.slaConfig.upsert({
        where: {
          ecosystemId_key: { ecosystemId: ecoId, key: k },
        },
        create: {
          ecosystemId: ecoId,
          key: k,
          hours: k === "default_sla_hours" ? 24 : 24 * (k === "followup_d3" ? 3 : k === "followup_d7" ? 7 : 10),
        },
        update: {},
      });
    }
  }

  await seedEcosystem(scale.id);
  await seedEcosystem(simplifica.id);

  const users = [
    { email: "master@vendacomciencia.com", name: "Master Admin", role: RoleName.MASTER },
    { email: "diretor@vendacomciencia.com", name: "Diretor Comercial", role: RoleName.DIRETOR },
    { email: "gestor@vendacomciencia.com", name: "Gestor Comercial", role: RoleName.GESTOR },
    { email: "sdr@vendacomciencia.com", name: "SDR Demo", role: RoleName.SDR },
    { email: "closer@vendacomciencia.com", name: "Closer Demo", role: RoleName.CLOSER },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        name: u.name,
        passwordHash: passwordHash,
        selectedEcosystemId: scale.id,
      },
      update: { name: u.name, passwordHash: passwordHash, selectedEcosystemId: scale.id },
    });

    for (const eco of [scale, simplifica]) {
      await prisma.userEcosystemMembership.upsert({
        where: {
          userId_ecosystemId: { userId: user.id, ecosystemId: eco.id },
        },
        create: {
          userId: user.id,
          ecosystemId: eco.id,
          roleId: roles[u.role],
        },
        update: { roleId: roles[u.role] },
      });
    }
  }

  const sdr = await prisma.user.findUniqueOrThrow({
    where: { email: "sdr@vendacomciencia.com" },
  });
  const closer = await prisma.user.findUniqueOrThrow({
    where: { email: "closer@vendacomciencia.com" },
  });
  const gestor = await prisma.user.findUniqueOrThrow({
    where: { email: "gestor@vendacomciencia.com" },
  });

  const funnelScale = await prisma.crmFunnel.findFirstOrThrow({
    where: { ecosystemId: scale.id, name: "cold call" },
  });
  const stageNovo = await prisma.crmStage.findFirstOrThrow({
    where: { funnelId: funnelScale.id, slug: "LEAD_NOVO" },
  });

  const company = await prisma.company.upsert({
    where: {
      ecosystemId_cnpj: {
        ecosystemId: scale.id,
        cnpj: "12.345.678/0001-90",
      },
    },
    create: {
      ecosystemId: scale.id,
      razaoSocial: "Empresa Demo LTDA",
      cnpj: "12.345.678/0001-90",
      regimeTributario: RegimeTributario.SIMPLES_NACIONAL,
    },
    update: {},
  });

  const ws = await prisma.clientWorkspace.upsert({
    where: { id: `ws-${company.id}` },
    create: {
      id: `ws-${company.id}`,
      companyId: company.id,
      name: `Workspace — ${company.razaoSocial}`,
    },
    update: {},
  });

  for (const f of WORKSPACE_FOLDER_KEYS) {
    await prisma.workspaceFolder.upsert({
      where: {
        workspaceId_key: { workspaceId: ws.id, key: f.key },
      },
      create: {
        workspaceId: ws.id,
        key: f.key,
        name: f.name,
      },
      update: { name: f.name },
    });
  }

  const lead = await prisma.lead.upsert({
    where: { id: "seed-lead-1" },
    create: {
      id: "seed-lead-1",
      ecosystemId: scale.id,
      funnelId: funnelScale.id,
      stageId: stageNovo.id,
      companyId: company.id,
      contactName: "Contato Demo",
      phone: "(11) 98888-7777",
      origin: "Inbound",
      segment: "6201-5/00",
      revenue: "Até R$ 500k",
      interest: "Automação comercial",
      status: LeadStatus.NOVO,
      assignedSdrId: sdr.id,
      assignedCloserId: closer.id,
      nextActionAt: new Date(Date.now() + 86400000),
    },
    update: {},
  });

  await prisma.leadTask.upsert({
    where: { id: "seed-task-sdr" },
    create: {
      id: "seed-task-sdr",
      leadId: lead.id,
      title: "Primeiro contato (tarefa automática ao criar lead)",
      assigneeId: sdr.id,
      createdById: sdr.id,
      dueAt: new Date(Date.now() + 3600000),
    },
    update: {},
  });

  const board = await prisma.strategicBoard.findFirstOrThrow({
    where: { ecosystemId: scale.id },
  });

  await prisma.strategicTask.upsert({
    where: { id: "seed-strategic-1" },
    create: {
      id: "seed-strategic-1",
      boardId: board.id,
      column: StrategicColumn.A_FAZER,
      order: 0,
      title: "Mapear ICP do segmento",
      description: "Definir perfil de cliente ideal para o trimestre.",
      priority: StrategicPriority.MEDIA,
      assigneeId: gestor.id,
      companyId: company.id,
      leadId: lead.id,
      dueAt: new Date(Date.now() + 3 * 86400000),
    },
    update: {},
  });

  await prisma.ticket.upsert({
    where: { id: "seed-ticket-1" },
    create: {
      id: "seed-ticket-1",
      ecosystemId: scale.id,
      number: 1,
      requesterId: sdr.id,
      area: TicketArea.TI,
      category: TicketCategory.CRM,
      subcategory: TicketSubcategory.DUVIDA,
      description: "Chamado de exemplo criado pelo seed.",
      status: TicketStatus.ABERTO,
      expectedAt: new Date(Date.now() + 2 * 86400000),
    },
    update: {},
  });

  await prisma.evaluation.upsert({
    where: { id: "seed-eval-1" },
    create: {
      id: "seed-eval-1",
      ecosystemId: scale.id,
      subjectId: sdr.id,
      leaderId: gestor.id,
      periodYear: new Date().getFullYear(),
      periodMonth: new Date().getMonth() + 1,
      status: "RASCUNHO",
    },
    update: {},
  });

  console.log("Seed concluído. Usuários:", users.map((u) => u.email).join(", "));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
