import type { DefaultSession } from "next-auth";
import type { RoleName } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: RoleName | null;
      permissions: string[];
      ecosystemId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    ecosystemId?: string | null;
    role?: RoleName | null;
    permissions?: string[];
  }
}
