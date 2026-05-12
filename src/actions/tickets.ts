"use server";

import { revalidatePath } from "next/cache";
import { TicketStatus, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "./auth-context";
import { can } from "@/lib/rbac";
import { writeAudit, notifyUser } from "./audit-notify";

export async function listTickets(filters: {
  status?: TicketStatus;
  category?: string;
  subcategory?: string;
  mine?: boolean;
}) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, tickets: [] };
  if (!can(ctx, "tickets.view")) return { error: "Sem permissão.", tickets: [] };

  const where: Record<string, unknown> = { ecosystemId: ctx.ecosystemId };
  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.subcategory) where.subcategory = filters.subcategory;
  if (filters.mine) where.requesterId = ctx.userId;

  const tickets = await prisma.ticket.findMany({
    where: where as never,
    include: { requester: { select: { name: true, email: true } }, _count: { select: { messages: true } } },
    orderBy: { createdAt: "desc" },
  });
  return { tickets };
}

export async function createTicket(data: {
  area: "TI" | "INTELIGENCIA_NEGOCIOS";
  category: "CRM" | "VOIP" | "SISTEMA";
  subcategory: "DUVIDA" | "ERRO_SISTEMA" | "FALHA_CONEXAO";
  description: string;
}) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "tickets.create")) return { error: "Sem permissão." };

  const last = await prisma.ticket.aggregate({
    where: { ecosystemId: ctx.ecosystemId },
    _max: { number: true },
  });
  const number = (last._max.number ?? 0) + 1;

  const ticket = await prisma.ticket.create({
    data: {
      ecosystemId: ctx.ecosystemId,
      number,
      requesterId: ctx.userId,
      area: data.area,
      category: data.category,
      subcategory: data.subcategory,
      description: data.description.trim(),
      expectedAt: new Date(Date.now() + 48 * 3600000),
    },
  });

  await writeAudit({
    userId: ctx.userId,
    ecosystemId: ctx.ecosystemId,
    entity: "Ticket",
    entityId: ticket.id,
    action: "CREATE",
  });

  const gestores = await prisma.userEcosystemMembership.findMany({
    where: { ecosystemId: ctx.ecosystemId, role: { name: { in: ["GESTOR", "MASTER"] } } },
  });
  for (const g of gestores) {
    await notifyUser({
      userId: g.userId,
      title: `Novo chamado #${number}`,
      body: data.description.slice(0, 160),
      type: NotificationType.TICKET,
      link: `/tickets/${ticket.id}`,
    });
  }

  revalidatePath("/tickets");
  return { ok: true, id: ticket.id };
}

export async function addTicketMessage(ticketId: string, body: string): Promise<void> {
  const ctx = await requireAuth();
  if ("error" in ctx) return;
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, ecosystemId: ctx.ecosystemId },
  });
  if (!ticket) return;
  if (ticket.requesterId !== ctx.userId && !can(ctx, "tickets.respond")) {
    return;
  }
  await prisma.ticketMessage.create({
    data: { ticketId, userId: ctx.userId, body: body.trim() },
  });
  if (ticket.requesterId !== ctx.userId) {
    await notifyUser({
      userId: ticket.requesterId,
      title: `Resposta no chamado #${ticket.number}`,
      body: body.slice(0, 200),
      type: NotificationType.TICKET,
      link: `/tickets/${ticketId}`,
    });
  }
  revalidatePath(`/tickets/${ticketId}`);
}

export async function setTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
  const ctx = await requireAuth();
  if ("error" in ctx) return;
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, ecosystemId: ctx.ecosystemId },
  });
  if (!ticket) return;

  const canManage =
    can(ctx, "tickets.respond") ||
    (ticket.requesterId === ctx.userId &&
      (status === "FECHADO" || status === "REABERTO"));

  if (!canManage) return;

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status,
      closedAt: status === "FECHADO" ? new Date() : null,
    },
  });
  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function getTicket(id: string) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, ticket: null };
  const ticket = await prisma.ticket.findFirst({
    where: { id, ecosystemId: ctx.ecosystemId },
    include: {
      requester: true,
      messages: { include: { user: { select: { name: true, id: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  return { ticket };
}
