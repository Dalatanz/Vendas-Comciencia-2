"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("master@vendacomciencia.com");
  const [password, setPassword] = useState("maisvendas!@2026");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setError("E-mail ou senha incorretos.");
      return;
    }
    // Navegação completa: garante que o cookie da sessão (Set-Cookie no POST credentials)
    // seja enviado no próximo pedido. router.push sozinho costuma falhar com NextAuth + App Router.
    window.location.assign("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050608] bg-grid-radial p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-card/80 p-8 glow-border shadow-card">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-neon tracking-tight">VENDA COMCIÊNCIA</div>
          <p className="text-sm text-white/50 mt-2">Ciência e tecnologia aplicadas à performance comercial</p>
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
