export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; memberId: string }> }) {
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
        return NextResponse.json({ error: "소유자는 나갈 수 없습니다. 워크스페이스를 삭제하세요." }, { status: 400 });
      }
      await prisma.workspaceMember.delete({
        where: { workspaceId_userId: { workspaceId: id, userId: meId } },
      });
      return NextResponse.json({ ok: true });
    }

    // 타인 강제 추방 - Owner만 가능
    if (me.role !== "owner") {
      return NextResponse.json({ error: "팀원 강제 추방은 소유자만 가능합니다." }, { status: 403 });
    }

    const target = await getMembership(id, memberId);
    if (!target) {
      return NextResponse.json({ error: "해당 멤버를 찾을 수 없습니다." }, { status: 404 });
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
    return NextResponse.json({ error: "멤버 제거 중 오류가 발생했습니다." }, { status: 500 });
  }
}
