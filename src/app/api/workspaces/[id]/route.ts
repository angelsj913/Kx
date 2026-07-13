export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
      return NextResponse.json({ error: "워크스페이스 소유자 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    const ownerEmail = workspace.owner.email;

    if (!otpCode) {
      const { issueOtp } = await import("@/lib/otp");
      const result = await issueOtp(ownerEmail, "email", "workspace-delete");

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
      return NextResponse.json({ error: "OTP가 일치하지 않거나 만료되었습니다." }, { status: 400 });
    }

    await prisma.workspace.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: true });
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "삭제 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
