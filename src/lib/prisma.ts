import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/** Uma ligação por isolate reduz picos no pooler; idempotente se já existir na URL. */
function runtimeDatabaseUrl(): string | undefined {
  const u = process.env.DATABASE_URL;
  if (!u) return undefined;
  if (/[?&]connection_limit=/i.test(u)) return u;
  return u.includes("?") ? `${u}&connection_limit=1` : `${u}?connection_limit=1`;
}

const dbUrl = runtimeDatabaseUrl();
if (
  process.env.NODE_ENV === "production" &&
  dbUrl?.includes("pooler.supabase.com") &&
  /:5432(\/|\?|$)/.test(dbUrl)
) {
  console.error(
    "[prisma] DATABASE_URL usa o pooler Supabase na porta 5432 (modo sessão, ~15 clientes). " +
      "No Vercel defina a URI Transaction (porta 6543) com ?pgbouncer=true&connection_limit=1."
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
