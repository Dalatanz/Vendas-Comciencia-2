"use server";

import { revalidatePath } from "next/cache";
import { RegimeTributario } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateCnpjDigits, onlyDigits, formatCnpj } from "@/lib/masks";
import { requireAuth } from "./auth-context";
import { can } from "@/lib/rbac";
import { writeAudit } from "./audit-notify";

export async function listCompanies() {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error, companies: [] };
  if (!can(ctx, "crm.companies.manage") && !can(ctx, "admin.companies")) {
    return { error: "Sem permissão.", companies: [] };
  }
  const companies = await prisma.company.findMany({
    where: { ecosystemId: ctx.ecosystemId },
    orderBy: { razaoSocial: "asc" },
  });
  return { companies };
}

export async function createCompany(data: {
  razaoSocial: string;
  cnpj: string;
  regimeTributario: RegimeTributario;
}) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "crm.companies.manage")) return { error: "Sem permissão." };
  const digits = onlyDigits(data.cnpj);
  const cnpj = formatCnpj(digits);
  if (digits.length !== 14 || !validateCnpjDigits(digits)) {
    return { error: "CNPJ inválido." };
  }
  try {
    const company = await prisma.company.create({
      data: {
        ecosystemId: ctx.ecosystemId,
        razaoSocial: data.razaoSocial.trim(),
        cnpj,
        regimeTributario: data.regimeTributario,
      },
    });
    await writeAudit({
      userId: ctx.userId,
      ecosystemId: ctx.ecosystemId,
      entity: "Company",
      entityId: company.id,
      action: "CREATE",
      diff: data,
    });
    revalidatePath("/crm/companies");
    revalidatePath("/admin/companies");
    return { ok: true, id: company.id };
  } catch {
    return { error: "CNPJ já cadastrado neste ecossistema." };
  }
}

export async function updateCompany(
  id: string,
  data: { razaoSocial?: string; regimeTributario?: RegimeTributario; cnpj?: string }
) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "crm.companies.manage")) return { error: "Sem permissão." };
  const existing = await prisma.company.findFirst({
    where: { id, ecosystemId: ctx.ecosystemId },
  });
  if (!existing) return { error: "Empresa não encontrada." };
  let cnpj: string | undefined;
  if (data.cnpj) {
    const digits = onlyDigits(data.cnpj);
    cnpj = formatCnpj(digits);
    if (digits.length !== 14 || !validateCnpjDigits(digits)) {
      return { error: "CNPJ inválido." };
    }
  }
  try {
    await prisma.company.update({
      where: { id },
      data: {
        razaoSocial: data.razaoSocial?.trim(),
        regimeTributario: data.regimeTributario,
        ...(cnpj ? { cnpj } : {}),
      },
    });
    revalidatePath("/crm/companies");
    return { ok: true };
  } catch {
    return { error: "Não foi possível atualizar (CNPJ duplicado?)." };
  }
}

export async function deleteCompany(id: string) {
  const ctx = await requireAuth();
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx, "crm.companies.manage")) return { error: "Sem permissão." };
  await prisma.company.deleteMany({ where: { id, ecosystemId: ctx.ecosystemId } });
  revalidatePath("/crm/companies");
  return { ok: true };
}
