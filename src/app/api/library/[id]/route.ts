import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMembership, itemAccessWhere, roleAtLeast } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;

  const item = await prisma.libraryItem.findFirst({
    where: { id, ...(await itemAccessWhere(session.user.id)) },
  });
  if (!item) {
    return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const item = await prisma.libraryItem.findFirst({
    where: { id, ...(await itemAccessWhere(userId)) },
  });
  if (!item) {
    return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
  }

  // 생성자이거나, 공유 워크스페이스의 admin 이상이면 삭제 가능
  let canDelete = item.userId === userId;
  if (!canDelete && item.workspaceId) {
    const membership = await getMembership(item.workspaceId, userId);
    canDelete = roleAtLeast(membership?.role, "admin");
  }
  if (!canDelete) {
    return NextResponse.json({ error: "이 항목을 삭제할 권한이 없습니다." }, { status: 403 });
  }

  await prisma.libraryItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
