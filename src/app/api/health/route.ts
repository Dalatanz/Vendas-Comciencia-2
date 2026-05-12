import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/demo-mode";

function isMissingSchemaError(e: unknown): boolean {
  const m = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return m.includes("does not exist") || m.includes("unknown table") || m.includes("no such table");
}

export async function GET() {
  const demoMode = isDemoMode();

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        ok: demoMode,
        demoMode,
        database: false,
        schemaReady: false,
        userCount: 0,
        message: msg,
      },
      { status: 200 }
    );
  }

  try {
    const users = await prisma.user.count();
    return NextResponse.json({
      ok: true,
      demoMode,
      database: true,
      schemaReady: true,
      userCount: users,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const missingSchema = isMissingSchemaError(e);
    return NextResponse.json(
      {
        ok: demoMode,
        demoMode,
        database: true,
        schemaReady: false,
        schemaMissing: missingSchema,
        userCount: 0,
        message: msg,
      },
      { status: 200 }
    );
  }
}
