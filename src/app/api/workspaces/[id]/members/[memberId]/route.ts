import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getMembership,
  requireMembership,
  roleAtLeast,
  WorkspaceError,
  type WorkspaceRole,
} from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 멤버 제거 또는 스스로 나가기. memberId = 대상 사용자 id.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id, memberId } = await params;
  const meId = session.user.id;

  try {
    const me = await requireMembership(id, meId);

    // 스스로 나가기
    if (memberId === meId) {
      if (me.role === "owner") {
        return NextResponse.json(
          { error: "소유자는 나갈 수 없습니다. 워크스페이스를 삭제하세요." },
          { status: 400 },
        );
      }
      await prisma.workspaceMember.delete({
        where: { workspaceId_userId: { workspaceId: id, userId: meId } },
      });
      return NextResponse.json({ ok: true });
    }

    // 타인 제거 — admin 이상, 그리고 대상보다 높은 역할이어야 함
    if (!roleAtLeast(me.role, "admin")) {
      return NextResponse.json({ error: "멤버를 제거할 권한이 없습니다." }, { status: 403 });
    }
    const target = await getMembership(id, memberId);
    if (!target) {
      return NextResponse.json({ error: "해당 멤버를 찾을 수 없습니다." }, { status: 404 });
    }
    // owner가 아닌 이상, 동급 이상 역할은 제거 불가
    if (me.role !== "owner" && roleAtLeast(target.role, me.role as WorkspaceRole)) {
      return NextResponse.json({ error: "이 멤버를 제거할 수 없습니다." }, { status: 403 });
    }
    if (target.role === "owner") {
      return NextResponse.json({ error: "소유자는 제거할 수 없습니다." }, { status: 400 });
    }

    await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId: id, userId: memberId } },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
