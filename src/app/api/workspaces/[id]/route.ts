import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireMembership, requireRole, WorkspaceError } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 워크스페이스 상세 — 멤버 목록 + 내 역할 + 공유 세션/서재 수
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
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        _count: { select: { chatSessions: true, libraryItems: true } },
      },
    });
    if (!workspace) {
      return NextResponse.json({ error: "워크스페이스를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
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
          joinedAt: m.createdAt.toISOString(),
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

// 이름 변경 (admin 이상)
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
  const name = String(body?.name ?? "").trim();
  if (!name || name.length > 60) {
    return NextResponse.json({ error: "이름은 1~60자로 입력해 주세요." }, { status: 400 });
  }

  try {
    await requireRole(id, session.user.id, "admin");
    const workspace = await prisma.workspace.update({ where: { id }, data: { name } });
    return NextResponse.json({ workspace: { id: workspace.id, name: workspace.name } });
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

// 워크스페이스 삭제 (owner만). 공유 세션/서재는 개인 소유로 남고 workspaceId만 해제됨(SetNull).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;

  try {
    await requireRole(id, session.user.id, "owner");
    await prisma.workspace.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
