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

  const chatSession = await prisma.chatSession.findFirst({
    where: { id, ...(await itemAccessWhere(session.user.id)) },
    include: { history: { orderBy: { createdAt: "asc" } } },
  });

  if (!chatSession) {
    return NextResponse.json({ error: "대화를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ session: chatSession });
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

  const chatSession = await prisma.chatSession.findFirst({
    where: { id, ...(await itemAccessWhere(userId)) },
  });
  if (!chatSession) {
    return NextResponse.json({ error: "대화를 찾을 수 없습니다." }, { status: 404 });
  }

  // 생성자이거나, 공유 워크스페이스의 admin 이상이면 삭제 가능
  let canDelete = chatSession.userId === userId;
  if (!canDelete && chatSession.workspaceId) {
    const membership = await getMembership(chatSession.workspaceId, userId);
    canDelete = roleAtLeast(membership?.role, "admin");
  }
  if (!canDelete) {
    return NextResponse.json({ error: "이 대화를 삭제할 권한이 없습니다." }, { status: 403 });
  }

  await prisma.chatSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
