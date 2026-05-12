"use server";

import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function writeAudit(args: {
  userId: string | null;
  ecosystemId: string | null;
  entity: string;
  entityId?: string | null;
  action: string;
  diff?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      userId: args.userId,
      ecosystemId: args.ecosystemId,
      entity: args.entity,
      entityId: args.entityId ?? null,
      action: args.action,
      diff: args.diff === undefined ? undefined : (args.diff as object),
    },
  });
}

export async function notifyUser(args: {
  userId: string;
  title: string;
  body?: string;
  type: NotificationType;
  link?: string;
}) {
  await prisma.notification.create({
    data: {
      userId: args.userId,
      title: args.title,
      body: args.body,
      type: args.type,
      link: args.link,
    },
  });
}
