import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const memories = await prisma.userMemory.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, content: true, category: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json({ memories });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "삭제할 메모리를 선택해 주세요." }, { status: 400 });

  const result = await prisma.userMemory.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (!result.count) return NextResponse.json({ error: "메모리를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
