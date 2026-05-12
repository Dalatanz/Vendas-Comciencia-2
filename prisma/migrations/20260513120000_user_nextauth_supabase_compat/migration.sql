-- Colunas esperadas pelo Prisma / NextAuth em bases Supabase já existentes onde faltem.
-- Idempotente: pode correr várias vezes (PostgreSQL 11+ ADD COLUMN IF NOT EXISTS).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'User' AND c.relkind = 'r'
  ) THEN
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT;
  END IF;
END $$;
