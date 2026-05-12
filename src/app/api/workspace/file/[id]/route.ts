import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.ecosystemId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const row = await prisma.workspaceFile.findFirst({
    where: {
      id,
      folder: { workspace: { company: { ecosystemId: session.user.ecosystemId } } },
    },
  });
  if (!row) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const body = new Uint8Array(row.blob);
  return new NextResponse(body, {
    headers: {
      "Content-Type": row.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(row.name)}"`,
    },
  });
}
