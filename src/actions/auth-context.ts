"use server";

import { auth } from "@/auth";
import type { RoleName } from "@prisma/client";

export type AuthContext = {
  userId: string;
  email: string;
  name: string;
  role: RoleName | null;
  permissions: string[];
  ecosystemId: string;
};

export async function requireUser(): Promise<
  | { userId: string; email: string; name: string }
  | { error: string }
> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return { error: "Não autenticado." };
  return {
    userId: user.id,
    email: user.email ?? "",
    name: user.name ?? "",
  };
}

export async function requireAuth(): Promise<AuthContext | { error: string }> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.ecosystemId) {
    return { error: "Sessão inválida ou ecossistema não selecionado." };
  }
  return {
    userId: user.id,
    email: user.email ?? "",
    name: user.name ?? "",
    role: user.role,
    permissions: user.permissions ?? [],
    ecosystemId: user.ecosystemId,
  };
}
