import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const memories = await prisma.userMemory.findMany({
    where: { userId: userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, content: true, category: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json({ memories });
}

export async function DELETE(request: Request) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;
  const body = await request.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "삭제할 메모리를 선택해 주세요." }, { status: 400 });

  const result = await prisma.userMemory.deleteMany({
    where: { id, userId: userId },
  });
  if (!result.count) return NextResponse.json({ error: "메모리를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
