import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { isDemoMode } from "@/lib/demo-mode";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <AppShell
      demoMode={isDemoMode()}
      user={{
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        role: session.user.role,
        permissions: session.user.permissions ?? [],
        ecosystemId: session.user.ecosystemId,
      }}
    >
      {children}
    </AppShell>
  );
}
