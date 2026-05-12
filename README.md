# VENDA COMCIÊNCIA

Sistema web completo para inteligência comercial: CRM com funil **cold call**, permissões por perfil, multiempresa, ecossistemas **Scale** e **Simplifica**, autenticação, PostgreSQL (Prisma) e interface em tema escuro com verde neon. Para ver o layout **sem instalar PostgreSQL**, use o modo demonstração (`DEMO_MODE`).

## Stack

- Next.js 14 (App Router) + TypeScript  
- Tailwind CSS  
- Prisma 5 + PostgreSQL  
- NextAuth.js v5 (Credentials + JWT)  
- React Hook Form + Zod  
- Recharts  
- Vitest  

## Pré-requisitos

- Node.js 20+  
- PostgreSQL (ou Docker) **quando for usar dados reais** — opcional se só ativar `DEMO_MODE` para navegar na interface  

## Instalação

```bash
npm install
```

### Primeira vez com base de dados (obrigatório para login real)

Precisa de **PostgreSQL com o schema aplicado**. Escolha **uma** opção:

**A) Docker (PC)** — instale [Docker Desktop](https://www.docker.com/products/docker-desktop/), abra-o e na pasta do projeto:

```bash
docker compose up -d
npm run db:setup
```

(`db:setup` = `prisma migrate deploy` + seed.)

**B) Supabase** — no dashboard: **Project Settings → Database → Connection string** (modo **URI**, host `db…`, porta **5432**). Cole no `.env` como `DATABASE_URL=...` e no terminal:

```bash
npm run db:setup
```

Depois:

```bash
npm run dev
```

Login: `master@vendacomciencia.com` / `maisvendas!@2026` (após o seed).

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste:

| Variável | Descrição |
|----------|-----------|
| `DEMO_MODE` | Defina `1` ou `true` para login e dashboard **sem** PostgreSQL (dados fictícios; não use em produção). |
| `DATABASE_URL` | URL do PostgreSQL quando for usar o sistema de verdade (local, Supabase, etc.). |
| `AUTH_SECRET` | Segredo do NextAuth (string longa aleatória) |
| `NEXTAUTH_URL` | URL base da aplicação em dev: `http://localhost:3000` |

## Banco de dados

Com **`DEMO_MODE=1`** você não precisa rodar migrations nem seed para ver o layout (login com `master@vendacomciencia.com` / `maisvendas!@2026`).

Para **dados reais**, desative o modo demo e configure o Postgres:

### Subir PostgreSQL com Docker (opcional)

```bash
docker compose up -d
```

### Migrations

```bash
npm run db:migrate
```

Em desenvolvimento, alternativa rápida sem histórico de migration:

```bash
npm run db:push
```

### Supabase / Postgres já existente (sem recriar o schema)

- Rode **`npx prisma migrate deploy`** no projeto (com `DATABASE_URL` apontando para o banco). A migration `20260513120000_user_nextauth_supabase_compat` adiciona em **`"User"`** as colunas em falta de forma idempotente: `emailVerified`, `image`, `role` (todas opcionais exceto as que já existirem).
- O hash de senha continua no campo **`passwordHash`**. Se a sua tabela tiver a coluna **`password`** (template NextAuth antigo), renomeie no SQL (`ALTER TABLE "User" RENAME COLUMN "password" TO "passwordHash";`) **ou** no `schema.prisma` use `passwordHash String @map("password")` e regere o client — não faça os dois.
- Depois do deploy das migrations: **`npm run db:seed`** (usa `upsert` por e-mail; não duplica utilizadores já existentes com o mesmo e-mail).

### Seeds (dados iniciais + usuários de teste)

```bash
npm run db:seed
```

## Executar o sistema

```bash
npm run dev
```

Acesse `http://localhost:3000`. Você será redirecionado para o login.

### Usuários de teste (seed)

| E-mail | Perfil |
|--------|--------|
| `master@vendacomciencia.com` | Master |
| `diretor@vendacomciencia.com` | Diretor |
| `gestor@vendacomciencia.com` | Gestor |
| `sdr@vendacomciencia.com` | SDR |
| `closer@vendacomciencia.com` | Closer |

**Senha padrão (todos):** `maisvendas!@2026`

Após o login, use o menu **Ecossistema** para alternar entre **Scale** e **Simplifica** (a sessão é atualizada e os dados filtrados por ecossistema).

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor após build |
| `npm run lint` | ESLint |
| `npm run test` | Testes (Vitest) |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:migrate` | Aplica migrations (`migrate deploy`) |
| `npm run db:push` | Sincroniza schema sem migration file |
| `npm run db:seed` | Executa o seed |

## Estrutura principal

- `prisma/schema.prisma` — modelo de dados completo (PostgreSQL)  
- `prisma/migrations/` — SQL inicial PostgreSQL  
- `prisma/seed.ts` — perfis, permissões, ecossistemas, funil cold call, usuários, empresa demo, lead, chamado, tarefa estratégica  
- `src/auth.ts` — NextAuth (login por e-mail/senha)  
- `src/middleware.ts` — proteção de rotas e exigência de ecossistema  
- `src/actions/` — server actions (CRM, chamados, workspace, admin, etc.)  
- `src/lib/` — Prisma, RBAC, máscaras, regras de etapa de lead, score de avaliação  
- `src/app/(app)/` — páginas autenticadas (dashboard, CRM, tickets, …)  

## Testes

```bash
npm run test
```

Inclui testes básicos de máscara/CNPJ e da regra de exibição do score (70/30) por perfil.

## Caminho recomendado: local → Supabase → Vercel

### Fase 1 — Só ver a interface (sem PostgreSQL)

1. Copie `.env.example` → `.env`.  
2. Defina `DEMO_MODE=1`, `AUTH_SECRET`, `NEXTAUTH_URL` (`http://localhost:3000`). `DATABASE_URL` pode ficar como placeholder enquanto o demo estiver ativo.  
3. Rode:

   ```bash
   npm run dev
   ```

4. Acesse o login: **`master@vendacomciencia.com`** / **`maisvendas!@2026`** — a sessão é fictícia (não lê usuários do banco).  
5. O dashboard mostra **números de exemplo**; o CRM abre com colunas vazias; outras telas podem falhar até existir banco. **Não use `DEMO_MODE` em produção.**

Quando for usar dados reais, desative `DEMO_MODE`, aponte `DATABASE_URL` para um Postgres válido, rode `db:push` ou `db:migrate` e `db:seed`, e siga para a fase 2.

### Fase 2 — Banco no Supabase

1. Crie um projeto em [Supabase](https://supabase.com).  
2. Em **Project Settings → Database**, copie a connection string.  
   - Para **migrations e seed a partir do seu computador**, use a conexão **direta** (host `db.<ref>.supabase.co`, porta **5432**), com a senha do banco.  
   - Para o **app em produção (Vercel)**, o Supabase recomenda o **pooler** (Transaction mode, porta **6543**) com `?pgbouncer=true&connection_limit=1` na URL, para não estourar conexões em serverless.  
3. No `.env` local, aponte `DATABASE_URL` para o Postgres do Supabase e rode:

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

   (Se ainda não tiver migrations aplicadas, `npx prisma db push` também funciona uma vez; em time, prefira `migrate deploy`.)

4. Confirme login e dados no ambiente local contra o Supabase antes do deploy.

### Fase 3 — Deploy na Vercel

1. Conecte o repositório Git à [Vercel](https://vercel.com).  
2. Em **Settings → Environment Variables**, configure pelo menos:

   | Variável | Valor |
   |----------|--------|
   | `DATABASE_URL` | URI do Supabase (**pooler** 6543 + `pgbouncer=true` para produção) **ou**, se o build falhar nas migrations, use temporariamente a URI **direta** (porta **5432**) até o primeiro deploy concluir |
   | `AUTH_SECRET` | Mesmo tipo de segredo longo do `.env` local (pode ser outro valor, só precisa ser estável) |
   | `NEXTAUTH_URL` | URL pública do site, ex.: `https://seu-app.vercel.app` (sem `/` no final) |

3. **Build:** o script `npm run build` corre **`prisma migrate deploy`** antes do `next build`, para criar tabelas (`User`, etc.) no Supabase ligado ao `DATABASE_URL`. Não precisa de Postgres na máquina para o deploy.  
4. **Seed (uma vez):** as migrations não criam utilizadores de teste. Depois do primeiro deploy OK, no seu PC com `DATABASE_URL` **direto** ao Supabase: `npm run db:seed`. A partir daí o login na Vercel funciona.  
5. **Build local sem base:** `set SKIP_PRISMA_MIGRATE=1` (Windows) ou `SKIP_PRISMA_MIGRATE=1 npm run build` (Unix) para só correr o Next.js.  
6. **Migrations**: não dependa só do build se preferir control manual — pode continuar a correr `npx prisma migrate deploy` no PC.  
7. **Seed em produção**: não rode o seed em todo deploy (não está no build); só quando precisar de dados iniciais.

O projeto já usa `trustHost: true` no NextAuth, adequado ao domínio da Vercel.

---

## Produção (genérico)

- `AUTH_SECRET` forte e `NEXTAUTH_URL` igual à URL pública que o usuário acessa.  
- `npm run build` + deploy na plataforma escolhida.  
- Banco: migrations aplicadas no Postgres (Supabase ou outro).

---

**VENDA COMCIÊNCIA** — ciência e tecnologia aplicadas à performance comercial.
