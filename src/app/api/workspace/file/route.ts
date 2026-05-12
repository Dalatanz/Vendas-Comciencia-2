import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.ecosystemId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const form = await req.formData();
  const folderId = form.get("folderId") as string;
  const file = form.get("file") as File | null;
  if (!folderId || !file) {
    return NextResponse.json({ error: "folderId e file obrigatórios" }, { status: 400 });
  }
  const folder = await prisma.workspaceFolder.findFirst({
    where: {
      id: folderId,
      workspace: { company: { ecosystemId: session.user.ecosystemId } },
    },
  });
  if (!folder) return NextResponse.json({ error: "Pasta inválida" }, { status: 404 });

  const buf = Buffer.from(await file.arrayBuffer());
  await prisma.workspaceFile.create({
    data: {
      folderId,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: buf.length,
      blob: buf,
      uploadedById: session.user.id,
    },
  });
  return NextResponse.json({ ok: true });
}
