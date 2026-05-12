/**
 * Build de produção: aplica migrations antes do `next build` (ex.: Vercel + Supabase).
 * Build local sem Postgres: SKIP_PRISMA_MIGRATE=1 npm run build
 */
const { spawnSync } = require("child_process");

// O schema Prisma exige DIRECT_URL; na Vercel às vezes só existe DATABASE_URL.
// Sem isto o `migrate deploy` falha com P1012 antes do next build.
if (!String(process.env.DIRECT_URL || "").trim() && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: true, env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (process.env.SKIP_PRISMA_MIGRATE !== "1") {
  // P3009: deploy anterior pode ter deixado `20260512190000_init` em estado "failed" (ex.: BOM no SQL).
  // Marcar como rolled back permite `migrate deploy` voltar a aplicar. Ignora erro se não houver falha pendente.
  spawnSync("npx", ["prisma", "migrate", "resolve", "--rolled-back", "20260512190000_init"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  run("npx", ["prisma", "migrate", "deploy"]);
}

run("npx", ["next", "build"]);
