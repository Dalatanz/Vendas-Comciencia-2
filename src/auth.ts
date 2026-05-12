import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/demo-mode";
import {
  DEMO_ECOSYSTEM_SCALE_ID,
  DEMO_LOGIN_EMAIL,
  DEMO_LOGIN_PASSWORD,
  DEMO_MASTER_PERMISSIONS,
  DEMO_USER_ID,
} from "@/lib/demo-data";

async function hydrateToken(token: {
  sub?: string;
  ecosystemId?: string | null;
  role?: RoleName | null;
  permissions?: string[];
}) {
  const uid = token.sub;
  if (!uid) return;
  if (isDemoMode() && uid === DEMO_USER_ID) {
    token.ecosystemId = token.ecosystemId ?? DEMO_ECOSYSTEM_SCALE_ID;
    token.role = "MASTER";
    token.permissions = DEMO_MASTER_PERMISSIONS;
    return;
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: uid },
    include: {
      memberships: {
        include: {
          role: { include: { permissions: { include: { permission: true } } } },
        },
      },
    },
  });
  if (!dbUser) return;
  let ecoId = dbUser.selectedEcosystemId ?? dbUser.memberships[0]?.ecosystemId ?? null;
  if (token.ecosystemId) ecoId = token.ecosystemId;
  const mem = dbUser.memberships.find((m) => m.ecosystemId === ecoId);
  token.ecosystemId = ecoId;
  token.role = (mem?.role.name as RoleName) ?? null;
  token.permissions = mem?.role.permissions.map((rp) => rp.permission.key) ?? [];
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 10 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;
        const em = email.toLowerCase().trim();
        if (
          isDemoMode() &&
          em === DEMO_LOGIN_EMAIL.toLowerCase() &&
          password === DEMO_LOGIN_PASSWORD
        ) {
          return {
            id: DEMO_USER_ID,
            email: em,
            name: "Master (demonstração)",
          };
        }
        const user = await prisma.user.findUnique({ where: { email: em } });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.sub = user.id;
      }
      if (trigger === "update" && session && typeof session === "object") {
        const s = session as { ecosystemId?: string };
        if (s.ecosystemId && token.sub) {
          try {
            if (!(isDemoMode() && token.sub === DEMO_USER_ID)) {
              await prisma.user.update({
                where: { id: token.sub },
                data: { selectedEcosystemId: s.ecosystemId },
              });
            }
            token.ecosystemId = s.ecosystemId;
          } catch (e) {
            console.error("[auth] jwt update selectedEcosystemId", e);
          }
        }
      }
      try {
        await hydrateToken(
          token as {
            sub?: string;
            ecosystemId?: string | null;
            role?: RoleName | null;
            permissions?: string[];
          }
        );
      } catch (e) {
        // Sem isto: Prisma falha (ex. pool esgotado) → JWTSessionError → /login;
        // o middleware ainda vê o cookie JWT → /dashboard → loop infinito.
        console.error("[auth] hydrateToken (mantém claims já no token)", e);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.sub as string;
        (session.user as { role: RoleName | null }).role = (token.role as RoleName) ?? null;
        (session.user as { permissions: string[] }).permissions = (token.permissions as string[]) ?? [];
        (session.user as { ecosystemId: string | null }).ecosystemId =
          (token.ecosystemId as string | null) ?? null;
      }
      return session;
    },
  },
});
