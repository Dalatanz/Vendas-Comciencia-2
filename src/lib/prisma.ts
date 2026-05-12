import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Em Vercel/serverless o mesmo isolate reutiliza o cliente; sem isto cada import podia abrir nova pool ao DB.
globalForPrisma.prisma = prisma;
