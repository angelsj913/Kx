import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 초대 미리보기 — 로그인 없이도 워크스페이스 이름/초대자를 볼 수 있다.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: { select: { name: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "유효하지 않거나 만료된 초대입니다." }, { status: 404 });
  }

  return NextResponse.json({
    invite: {
      email: invite.email,
      role: invite.role,
      workspaceName: invite.workspace.name,
      invitedBy: invite.invitedBy.name ?? invite.invitedBy.email,
    },
  });
}

// 초대 수락 — 로그인한 사용자를 멤버로 등록.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { token } = await params;

  const invite = await prisma.workspaceInvite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "유효하지 않거나 만료된 초대입니다." }, { status: 404 });
  }

  // 이미 멤버면 초대만 소진하고 통과
  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: session.user.id } },
  });

  if (!existing) {
    await prisma.workspaceMember.create({
      data: { workspaceId: invite.workspaceId, userId: session.user.id, role: invite.role },
    });
  }
  await prisma.workspaceInvite.update({
    where: { token },
    data: { acceptedAt: new Date() },
  });

  return NextResponse.json({ ok: true, workspaceId: invite.workspaceId });
}
