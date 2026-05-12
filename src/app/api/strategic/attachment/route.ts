import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.ecosystemId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const form = await req.formData();
  const taskId = form.get("taskId") as string;
  const file = form.get("file") as File | null;
  if (!taskId || !file) {
    return NextResponse.json({ error: "taskId e file obrigatórios" }, { status: 400 });
  }
  const task = await prisma.strategicTask.findFirst({
    where: { id: taskId, board: { ecosystemId: session.user.ecosystemId } },
  });
  if (!task) return NextResponse.json({ error: "Tarefa inválida" }, { status: 404 });
  const buf = Buffer.from(await file.arrayBuffer());
  await prisma.strategicTaskAttachment.create({
    data: {
      taskId,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: buf.length,
      blob: buf,
    },
  });
  return NextResponse.json({ ok: true });
}
