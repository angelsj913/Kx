import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  INVITE_TTL_DAYS,
  newInviteToken,
  requireRole,
  WorkspaceError,
} from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 대기 중인 초대 목록 (admin 이상)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;

  try {
    await requireRole(id, session.user.id, "admin");
    const invites = await prisma.workspaceInvite.findMany({
      where: { workspaceId: id, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, token: true, expiresAt: true },
    });
    return NextResponse.json({ invites });
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

// 이메일로 초대 생성 (admin 이상). 초대 수락 링크를 반환한다.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  const role = body?.role === "admin" ? "admin" : "member";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "유효한 이메일을 입력해 주세요." }, { status: 400 });
  }

  try {
    await requireRole(id, session.user.id, "admin");

    // 이미 멤버인지 확인
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const already = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: id, userId: existingUser.id } },
      });
      if (already) {
        return NextResponse.json({ error: "이미 이 워크스페이스의 멤버입니다." }, { status: 409 });
      }
    }

    const token = newInviteToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    await prisma.workspaceInvite.create({
      data: { workspaceId: id, email, role, token, invitedById: session.user.id, expiresAt },
    });

    const origin = new URL(request.url).origin;
    const inviteUrl = `${origin}/invite/${token}`;

    return NextResponse.json({ invite: { email, role, token, expiresAt, inviteUrl } });
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
