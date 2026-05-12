import { listOneOnOnes } from "@/actions/one-on-ones";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/actions/auth-context";
import { OneOnOneForm } from "@/components/one-on-ones/OneOnOneForm";
import { isDemoMode } from "@/lib/demo-mode";
import { DEMO_LOGIN_EMAIL, DEMO_USER_ID } from "@/lib/demo-data";

async function loadUsers() {
  const ctx = await requireAuth();
  if ("error" in ctx) return [];
  if (isDemoMode() && ctx.userId === DEMO_USER_ID) {
    return [{ id: DEMO_USER_ID, name: "Master (demonstração)", email: DEMO_LOGIN_EMAIL }];
  }
  return prisma.user.findMany({
    where: { memberships: { some: { ecosystemId: ctx.ecosystemId } } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

export default async function OneOnOnesPage() {
  const res = await listOneOnOnes();
  const items = "items" in res ? res.items : [];
  const error = "error" in res ? res.error : undefined;
  const users = await loadUsers();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Gestão de 1:1</h1>
      {error && <p className="text-amber-300 text-sm">{error}</p>}
      <OneOnOneForm users={users} />
      <div className="rounded-xl border border-white/10 divide-y divide-white/10">
        {items.length === 0 ? (
          <p className="p-4 text-white/40 text-sm">Nenhum 1:1 agendado.</p>
        ) : (
          items.map((o) => (
            <div key={o.id} className="p-4 text-sm">
              <div className="text-neon font-medium">{new Date(o.scheduledAt).toLocaleString("pt-BR")}</div>
              <div className="text-white/60 text-xs mt-1">
                {o.seller.name} ↔ {o.leader.name}
              </div>
              {o.notes && <p className="text-white/50 mt-2">{o.notes}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
