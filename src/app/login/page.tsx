"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("master@vendacomciencia.com");
  const [password, setPassword] = useState("maisvendas!@2026");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbHint, setDbHint] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(
        (data: {
          ok?: boolean;
          database?: boolean;
          schemaReady?: boolean;
          schemaMissing?: boolean;
          userCount?: number;
          demoMode?: boolean;
        }) => {
          if (data.demoMode) {
            setDbHint(
              "Modo demonstração (DEMO_MODE): você pode entrar sem PostgreSQL. Os números do dashboard são exemplos; o CRM aparece vazio até conectar o banco e rodar o seed."
            );
            return;
          }
          if (!data.database) {
            setDbHint(
              "O app não consegue conectar ao PostgreSQL. Confira DATABASE_URL na Vercel (ou .env local): host, porta, utilizador e palavra-passe."
            );
            return;
          }
          if (data.database && data.schemaReady === false) {
            setDbHint(
              data.schemaMissing
                ? "O Postgres responde, mas o schema Prisma ainda não foi aplicado (falta a tabela User, etc.). No seu PC, com DATABASE_URL apontando para este mesmo banco (conexão direta Supabase, porta 5432), execute: npx prisma migrate deploy e depois npm run db:seed"
                : "O banco responde, mas houve erro ao ler as tabelas. Verifique se correu npx prisma migrate deploy (ou db push) contra este banco."
            );
            return;
          }
          if ((data.userCount ?? 0) === 0) {
            setDbHint(
              "Tabelas OK, mas não há utilizadores. Rode: npm run db:seed (com o mesmo DATABASE_URL)."
            );
          }
        }
      )
      .catch(() => setDbHint(null));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(
        "Não foi possível entrar. Confira e-mail e senha (veja a caixa abaixo). Se o banco não tiver usuários, rode o seed após corrigir o PostgreSQL."
      );
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050608] bg-grid-radial p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-card/80 p-8 glow-border shadow-card">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-neon tracking-tight">VENDA COMCIÊNCIA</div>
          <p className="text-sm text-white/50 mt-2">Ciência e tecnologia aplicadas à performance comercial</p>
        </div>

        {dbHint && (
          <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            {dbHint}
          </div>
        )}

        <div className="mb-4 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-white/60 space-y-1">
          <p className="font-semibold text-neon/90">Após o seed (usuários de teste)</p>
          <p>
            <span className="text-white/40">E-mail:</span>{" "}
            <code className="text-white">master@vendacomciencia.com</code>
          </p>
          <p>
            <span className="text-white/40">Senha:</span>{" "}
            <code className="text-white">maisvendas!@2026</code>
          </p>
          <p className="text-white/40 pt-1">
            Atenção ao domínio: <strong className="text-white/70">vendacomciencia</strong> (sem “n” depois de
            “com”) — não é “consciência”.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">E-mail</label>
            <input
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Senha</label>
            <input
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-neon/90 text-black font-semibold py-2.5 text-sm hover:bg-neon disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
