import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
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

  if (!req.auth) {
    if (path === "/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  const eco = req.auth.user?.ecosystemId;
  if (!eco && path !== "/select-ecosystem") {
    return NextResponse.redirect(new URL("/select-ecosystem", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
