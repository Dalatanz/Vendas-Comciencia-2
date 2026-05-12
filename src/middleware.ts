import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Não importar `@/auth` aqui: isso puxava Prisma/bcryptjs para o Edge e gerava avisos
 * ou JS inválido. Só decodificamos o JWT (mesmo segredo do NextAuth).
 */
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (
    path.startsWith("/api/auth") ||
    path === "/api/health" ||
    path.startsWith("/_next") ||
    path === "/favicon.ico" ||
    /\.(svg|png|jpg|jpeg|gif|webp|woff2?)$/.test(path)
  ) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("[middleware] AUTH_SECRET não definido.");
    return NextResponse.next();
  }

  const token = await getToken({ req, secret });

  if (!token?.sub) {
    if (path === "/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  const eco = token.ecosystemId as string | null | undefined;
  if (!eco && path !== "/select-ecosystem") {
    return NextResponse.redirect(new URL("/select-ecosystem", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
