import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ensureInviteCode,
  newInviteCode,
  requireMembership,
  requireRole,
  transferOwnership,
  WorkspaceError,
} from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const me = await requireMembership(id, session.user.id);
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        _count: { select: { chatSessions: true, libraryItems: true } },
      },
    });
    if (!workspace) {
      return NextResponse.json({ error: "워크스페이스를 찾을 수 없습니다." }, { status: 404 });
    }

    const inviteCode =
      me.role === "owner" || me.role === "admin"
        ? await ensureInviteCode(workspace.id, workspace.inviteCode)
        : null;

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        imageUrl: workspace.imageUrl,
        inviteCode,
        ownerId: workspace.ownerId,
        myRole: me.role,
        sessionCount: workspace._count.chatSessions,
        libraryCount: workspace._count.libraryItems,
        members: workspace.members.map((m) => ({
          userId: m.userId,
          role: m.role,
          name: m.user.name,
          email: m.user.email,
          image: m.user.image,
        })),
      },
    });
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

/** 이름·이미지·초대코드 재발급 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    // 이름/이미지: admin 이상, 코드 재발급·양도: owner
    if (body?.transferToUserId) {
      await transferOwnership(id, session.user.id, String(body.transferToUserId));
      return NextResponse.json({ ok: true, transferred: true });
    }

    const data: { name?: string; imageUrl?: string | null; inviteCode?: string } = {};

    if (typeof body?.name === "string") {
      await requireRole(id, session.user.id, "admin");
      const name = body.name.trim();
      if (!name || name.length > 60) {
        return NextResponse.json({ error: "이름은 1~60자로 입력해 주세요." }, { status: 400 });
      }
      data.name = name;
    }

    if (body?.imageUrl !== undefined) {
      await requireRole(id, session.user.id, "admin");
      data.imageUrl =
        body.imageUrl === null || body.imageUrl === ""
          ? null
          : String(body.imageUrl).slice(0, 2000);
    }

    if (body?.regenerateInviteCode) {
      await requireRole(id, session.user.id, "owner");
      data.inviteCode = newInviteCode();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "변경할 항목이 없습니다." }, { status: 400 });
    }

    const workspace = await prisma.workspace.update({ where: { id }, data });
    return NextResponse.json({
      ok: true,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        imageUrl: workspace.imageUrl,
        inviteCode: workspace.inviteCode,
      },
    });
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[workspace patch]", err);
    return NextResponse.json({ error: "수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

/** OTP 기반 워크스페이스 삭제 (대표 전용) */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const otpCode = body?.otp?.toString().trim();

  try {
    await requireRole(id, session.user.id, "owner");

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: { owner: { select: { email: true } } },
    });

    if (!workspace?.owner?.email) {
      return NextResponse.json(
        { error: "워크스페이스 소유자 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const ownerEmail = workspace.owner.email;

    if (!otpCode) {
      const { issueOtp } = await import("@/lib/otp");
      const result = await issueOtp(ownerEmail, "workspace-delete");

      return NextResponse.json({
        ok: true,
        otpSent: true,
        message: "대표자 이메일로 6자리 OTP가 발송되었습니다.",
        devCode: result?.devCode,
      });
    }

    const { verifyOtp } = await import("@/lib/otp");
    const isValid = await verifyOtp(ownerEmail, "workspace-delete", otpCode);

    if (!isValid) {
      return NextResponse.json(
        { error: "OTP가 일치하지 않거나 만료되었습니다." },
        { status: 400 },
      );
    }

    await prisma.workspace.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: true });
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[workspace delete] error:", err);
    return NextResponse.json({ error: "삭제 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
