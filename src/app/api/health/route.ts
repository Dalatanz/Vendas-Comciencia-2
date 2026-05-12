import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/demo-mode";

export async function GET() {
  const demoMode = isDemoMode();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const users = await prisma.user.count();
    return NextResponse.json({
      ok: true,
      demoMode,
      database: true,
      userCount: users,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        ok: demoMode,
        demoMode,
        database: false,
        userCount: 0,
        message: msg,
      },
      { status: 200 }
    );
  }
}
