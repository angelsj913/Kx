import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { getMembership, itemAccessWhere, roleAtLeast } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;
  const { id } = await params;

  const item = await prisma.libraryItem.findFirst({
    where: { id, ...(await itemAccessWhere(userId)) },
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
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;
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
