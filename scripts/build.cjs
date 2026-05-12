/**
 * Build de produção: aplica migrations antes do `next build` (ex.: Vercel + Supabase).
 * Build local sem Postgres: SKIP_PRISMA_MIGRATE=1 npm run build
 */
const { spawnSync } = require("child_process");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: true, env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (process.env.SKIP_PRISMA_MIGRATE !== "1") {
  run("npx", ["prisma", "migrate", "deploy"]);
}

run("npx", ["next", "build"]);
