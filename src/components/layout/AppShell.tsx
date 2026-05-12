"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; perm?: string };

const NAV: NavItem[] = [
  { href: "/select-ecosystem", label: "Ecossistema", perm: "dashboard.view" },
  { href: "/dashboard", label: "Dashboard", perm: "dashboard.view" },
  { href: "/crm", label: "CRM Comercial", perm: "crm.view" },
  { href: "/crm/companies", label: "Empresas", perm: "crm.companies.manage" },
  { href: "/one-on-ones", label: "1:1", perm: "one_on_one.view" },
  { href: "/evaluations", label: "Avaliações", perm: "evaluations.view" },
  { href: "/climate", label: "Clima", perm: "climate.submit" },
  { href: "/tickets", label: "Chamados", perm: "tickets.view" },
  { href: "/workspace", label: "Workspace Cliente", perm: "workspace.view" },
  { href: "/strategic", label: "Planejamento", perm: "strategic.view" },
  { href: "/reports", label: "Relatórios", perm: "reports.management" },
  { href: "/admin", label: "Administração", perm: "admin.users" },
];

function Breadcrumbs({ path }: { path: string }) {
  const parts = path.split("/").filter(Boolean);
  const crumbs = parts.map((p, i) => ({
    label: decodeURIComponent(p).replace(/-/g, " "),
    href: "/" + parts.slice(0, i + 1).join("/"),
  }));
  return (
    <nav className="text-xs text-white/50 flex flex-wrap gap-2">
      <Link href="/dashboard" className="hover:text-neon">
        Início
      </Link>
      {crumbs.map((c) => (
        <span key={c.href} className="flex items-center gap-2">
          <span>/</span>
          <Link href={c.href} className="hover:text-neon capitalize">
            {c.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

export function AppShell({
  children,
  user,
  demoMode = false,
}: {
  children: React.ReactNode;
  demoMode?: boolean;
  user: {
    name: string;
    email: string;
    role: string | null;
    permissions: string[];
    ecosystemId: string | null;
  };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const { data: session, update } = useSession();
  void session;

  const visible = NAV.filter((n) => !n.perm || user.permissions.includes(n.perm));

  async function switchEco(id: string) {
    const { setSelectedEcosystem } = await import("@/actions/ecosystem");
    const r = await setSelectedEcosystem(id);
    if ("error" in r) {
      alert(r.error);
      return;
    }
    await update({ ecosystemId: id });
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen flex bg-[#050608] bg-grid-radial">
      <aside
        className={cn(
          "border-r border-white/10 bg-surface-card/90 backdrop-blur-md transition-all",
          open ? "w-64" : "w-16"
        )}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
          {open && (
            <div>
              <div className="text-neon font-bold tracking-tight">VENDA COMCIÊNCIA</div>
              <div className="text-[10px] text-white/40">Inteligência comercial</div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="text-white/60 hover:text-neon text-sm px-2"
            aria-label="Alternar menu"
          >
            {open ? "«" : "»"}
          </button>
        </div>
        <nav className="p-2 flex flex-col gap-1">
          {visible.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition",
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-neon/15 text-neon shadow-neon"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              {open ? item.label : item.label.slice(0, 1)}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-surface-card/60 backdrop-blur">
          <Breadcrumbs path={pathname} />
          <div className="flex items-center gap-4 text-sm">
            <EcoSwitcher onSelect={switchEco} />
            <span className="text-white/60 hidden sm:inline">{user.name}</span>
            <span className="text-neon text-xs uppercase">{user.role}</span>
            <button
              type="button"
              className="text-white/50 hover:text-white"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sair
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {demoMode && (
            <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
              Modo demonstração: sem PostgreSQL. Dashboard com números fictícios; outras áreas podem mostrar erro até
              você configurar o banco e desativar <code className="text-amber-50/90">DEMO_MODE</code>.
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

function EcoSwitcher({ onSelect }: { onSelect: (id: string) => void }) {
  const [opts, setOpts] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);

  async function toggle() {
    if (!open && opts.length === 0) {
      const { listMyEcosystems } = await import("@/actions/ecosystem");
      const r = await listMyEcosystems();
      if (!("error" in r)) setOpts(r.ecosystems);
    }
    setOpen((v) => !v);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className="rounded-md border border-neon/40 px-2 py-1 text-xs text-neon hover:bg-neon/10"
      >
        Ecossistema
      </button>
      {open && opts.length > 0 && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border border-white/10 bg-surface-card shadow-card py-1">
          {opts.map((o) => (
            <button
              key={o.id}
              type="button"
              className="block w-full text-left px-3 py-2 text-xs hover:bg-white/5"
              onClick={() => {
                setOpen(false);
                onSelect(o.id);
              }}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
