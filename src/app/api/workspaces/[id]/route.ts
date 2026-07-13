// 이름 변경 + Ownership Transfer
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
    // === Ownership Transfer (대표 권한 양도) ===
    if (body.action === "transfer-ownership" && body.newOwnerId) {
      const newOwnerId = String(body.newOwnerId);

      // 호출자가 현재 Owner인지 확인
      await requireRole(id, session.user.id, "owner");

      if (newOwnerId === session.user.id) {
        return NextResponse.json({ error: "자신에게 권한을 양도할 수 없습니다." }, { status: 400 });
      }

      // 대상이 워크스페이스 멤버인지 확인
      const targetMember = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: id, userId: newOwnerId } },
      });

      if (!targetMember) {
        return NextResponse.json({ error: "해당 유저는 이 워크스페이스 멤버가 아닙니다." }, { status: 400 });
      }

      if (targetMember.role === "owner") {
        return NextResponse.json({ error: "이미 소유자입니다." }, { status: 400 });
      }

      // 트랜잭션으로 안전하게 권한 양도
      await prisma.$transaction(async (tx) => {
        // 기존 Owner를 admin으로 변경
        await tx.workspaceMember.update({
          where: { workspaceId_userId: { workspaceId: id, userId: session.user.id } },
          data: { role: "admin" },
        });

        // Workspace ownerId 변경
        await tx.workspace.update({
          where: { id },
          data: { ownerId: newOwnerId },
        });

        // 새 Owner role을 owner로 변경
        await tx.workspaceMember.update({
          where: { workspaceId_userId: { workspaceId: id, userId: newOwnerId } },
          data: { role: "owner" },
        });
      });

      return NextResponse.json({ ok: true, newOwnerId });
    }

    // === 기존 이름 변경 ===
    const name = String(body?.name ?? "").trim();
    if (name) {
      if (name.length > 60) {
        return NextResponse.json({ error: "이름은 1\~60자로 입력해 주세요." }, { status: 400 });
      }

      await requireRole(id, session.user.id, "admin");

      const workspace = await prisma.workspace.update({
        where: { id },
        data: { name },
      });

      return NextResponse.json({ workspace: { id: workspace.id, name: workspace.name } });
    }

    return NextResponse.json({ error: "지원하지 않는 요청입니다." }, { status: 400 });
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[workspace patch] error:", err);
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
