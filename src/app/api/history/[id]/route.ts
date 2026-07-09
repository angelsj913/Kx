import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  await prisma.historyItem.deleteMany({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}

/** 구조화 도구(회의록/주간보고/강의노트/레포트)의 편집 내용을 debounce 저장한다. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const result = typeof body?.result === "string" ? body.result : null;
  if (!result) {
    return NextResponse.json({ error: "저장할 내용이 없습니다." }, { status: 400 });
  }

  const { id } = await params;
  const { count } = await prisma.historyItem.updateMany({
    where: { id, userId: session.user.id },
    data: { result },
  });
  if (count === 0) {
    return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
