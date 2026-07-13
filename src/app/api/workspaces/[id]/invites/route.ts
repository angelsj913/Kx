import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendWorkspaceInviteEmail } from "@/lib/email";
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

// 이메일로 초대 생성 + 초대 링크 메일 발송 (admin 이상)
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

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: { name: true },
    });
    if (!workspace) {
      return NextResponse.json({ error: "워크스페이스를 찾을 수 없습니다." }, { status: 404 });
    }

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

    // 동일 이메일 미수락 초대가 있으면 토큰 갱신 후 재발송
    const pending = await prisma.workspaceInvite.findFirst({
      where: {
        workspaceId: id,
        email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    const token = pending?.token ?? newInviteToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    if (pending) {
      await prisma.workspaceInvite.update({
        where: { id: pending.id },
        data: { role, expiresAt, invitedById: session.user.id },
      });
    } else {
      await prisma.workspaceInvite.create({
        data: {
          workspaceId: id,
          email,
          role,
          token,
          invitedById: session.user.id,
          expiresAt,
        },
      });
    }

    const base =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(request.url).origin;
    const inviteUrl = `${base.replace(/\/$/, "")}/invite/${token}`;

    const inviterName =
      session.user.name?.trim() ||
      session.user.email?.split("@")[0] ||
      "ZEFF 사용자";

    let emailSent = false;
    let emailMode: string | null = null;
    let emailError: string | null = null;
    try {
      const result = await sendWorkspaceInviteEmail({
        to: email,
        workspaceName: workspace.name,
        inviterName,
        role,
        inviteUrl,
        expiresAt,
      });
      emailSent = true;
      emailMode = result.mode;
    } catch (err) {
      console.error("[workspace invite email]", err);
      emailError =
        err instanceof Error ? err.message : "이메일 발송에 실패했습니다.";
    }

    return NextResponse.json({
      invite: { email, role, token, expiresAt, inviteUrl },
      emailSent,
      emailMode,
      emailError,
      message: emailSent
        ? `${email} 으로 초대 메일을 보냈습니다.`
        : emailError
          ? `초대는 생성됐지만 메일 발송에 실패했습니다: ${emailError}`
          : "초대가 생성되었습니다.",
    });
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
