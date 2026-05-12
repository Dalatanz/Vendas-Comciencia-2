import type { AuthContext } from "@/actions/auth-context";

export function can(ctx: AuthContext, key: string) {
  return ctx.permissions.includes(key);
}
