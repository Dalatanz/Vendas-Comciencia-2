"use server";

import { revalidatePath } from "next/cache";
import { StrategicColumn, StrategicPriority, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "./auth-context";
import { can } from "@/lib/rbac";
import { writeAudit, notifyUser } from "./audit-notify";

async function getBoard(ctx: { ecosystemId: string }) {
  let board = await prisma.strategicBoard.findFirst({
    where: { ecosystemId: ctx.ecosystemId },
  });
  if (!board) {
    board = await prisma.strategicBoard.create({
      data: { ecosystemId: ctx.ecosystemId, name: "Planejamento Estratégico" },
    });
  }
  return board;
}

export async function listStrategicTasks(filters: {
  assigneeId?: string;
  priority?: StrategicPriority;
  companyId?: string;
  column?: StrategicColumn;
  overdue?: boolean;
}) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, tasks: [], boardId: "" };
  if (!can(ctx, "strategic.view")) return { error: "Sem permissão.", tasks: [], boardId: "" };
  const board = await getBoard(ctx);
  const where: Record<string, unknown> = { boardId: board.id };
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters.priority) where.priority = filters.priority;
  if (filters.companyId) where.companyId = filters.companyId;
  if (filters.column) where.column = filters.column;
  if (filters.overdue) {
    where.dueAt = { lt: new Date() };
    if (!filters.column) {
      where.column = { not: StrategicColumn.CONCLUIDO };
    }
  }
  const tasks = await prisma.strategicTask.findMany({
    where: where as never,
    include: {
      assignee: { select: { id: true, name: true } },
      company: { select: { id: true, razaoSocial: true } },
      lead: { select: { id: true, contactName: true } },
      checklists: true,
      _count: { select: { comments: true, attachments: true } },
    },
    orderBy: [{ column: "asc" }, { order: "asc" }],
  });
  return { tasks, boardId: board.id };
}

export async function createStrategicTask(data: {
  title: string;
  description?: string;
  column: StrategicColumn;
  priority: StrategicPriority;
  assigneeId?: string | null;
  dueAt?: Date | null;
  companyId?: string | null;
  leadId?: string | null;
}) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "strategic.manage")) return { error: "Sem permissão." };
  const board = await getBoard(ctx);
  const max = await prisma.strategicTask.aggregate({
    where: { boardId: board.id, column: data.column },
    _max: { order: true },
  });
  const task = await prisma.strategicTask.create({
    data: {
      boardId: board.id,
      column: data.column,
      order: (max._max.order ?? 0) + 1,
      title: data.title.trim(),
      description: data.description?.trim(),
      priority: data.priority,
      assigneeId: data.assigneeId,
      dueAt: data.dueAt,
      companyId: data.companyId,
      leadId: data.leadId,
      slaDueAt: data.dueAt,
    },
  });
  if (data.assigneeId) {
    await notifyUser({
      userId: data.assigneeId,
      title: "Nova tarefa estratégica atribuída",
      body: data.title,
      type: NotificationType.TAREFA,
      link: `/strategic`,
    });
  }
  await writeAudit({
    userId: ctx.userId,
    ecosystemId: ctx.ecosystemId,
    entity: "StrategicTask",
    entityId: task.id,
    action: "CREATE",
  });
  revalidatePath("/strategic");
  return { ok: true, id: task.id };
}

export async function moveStrategicTask(taskId: string, column: StrategicColumn, order: number) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "strategic.manage")) return { error: "Sem permissão." };
  const task = await prisma.strategicTask.findFirst({
    where: { id: taskId, board: { ecosystemId: ctx.ecosystemId } },
  });
  if (!task) return { error: "Tarefa não encontrada." };
  await prisma.strategicTask.update({
    where: { id: taskId },
    data: { column, order },
  });
  if (task.assigneeId) {
    await notifyUser({
      userId: task.assigneeId,
      title: "Tarefa estratégica movida de coluna",
      body: task.title,
      type: NotificationType.TAREFA,
      link: `/strategic`,
    });
  }
  revalidatePath("/strategic");
  return { ok: true };
}

export async function updateStrategicTask(
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    priority: StrategicPriority;
    assigneeId: string | null;
    dueAt: Date | null;
    companyId: string | null;
    leadId: string | null;
  }>
) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "strategic.manage")) return { error: "Sem permissão." };
  await prisma.strategicTask.updateMany({
    where: { id, board: { ecosystemId: ctx.ecosystemId } },
    data,
  });
  revalidatePath("/strategic");
  return { ok: true };
}

export async function deleteStrategicTask(id: string) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "strategic.manage")) return { error: "Sem permissão." };
  await prisma.strategicTask.deleteMany({
    where: { id, board: { ecosystemId: ctx.ecosystemId } },
  });
  revalidatePath("/strategic");
  return { ok: true };
}

export async function addStrategicComment(taskId: string, body: string) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "strategic.view")) return { error: "Sem permissão." };
  await prisma.strategicTaskComment.create({
    data: { taskId, userId: ctx.userId, body: body.trim() },
  });
  revalidatePath("/strategic");
  return { ok: true };
}

export async function addStrategicChecklist(taskId: string, title: string) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "strategic.manage")) return { error: "Sem permissão." };
  await prisma.strategicTaskChecklist.create({
    data: { taskId, title: title.trim(), userId: ctx.userId },
  });
  revalidatePath("/strategic");
  return { ok: true };
}

export async function toggleStrategicChecklist(id: string, done: boolean) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "strategic.manage")) return { error: "Sem permissão." };
  await prisma.strategicTaskChecklist.updateMany({
    where: { id, task: { board: { ecosystemId: ctx.ecosystemId } } },
    data: { done },
  });
  revalidatePath("/strategic");
  return { ok: true };
}

export async function getStrategicTask(id: string) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, task: null };
  const task = await prisma.strategicTask.findFirst({
    where: { id, board: { ecosystemId: ctx.ecosystemId } },
    include: {
      assignee: true,
      company: true,
      lead: true,
      checklists: true,
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
      attachments: true,
    },
  });
  return { task };
}
