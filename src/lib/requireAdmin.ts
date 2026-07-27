import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import { isAdminMfaVerified, requireAdminMfa } from "@/lib/adminMfa";

/** RSC/admin page: 비관리자는 공홈으로, 미로그인은 로그인으로 */
export async function requireAdminPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (!isAdminSession(session)) {
    redirect("/?admin=denied");
  }
  return session;
}

/** 보안 콘솔: 관리자 + MFA(8h) */
export async function requireSecurityPage() {
  const session = await requireAdminPage();
  if (session.user.id) {
    await requireAdminMfa(session.user.id);
  }
  return session;
}

/** API route: 비관리자 403 · MFA 미완료 403 (MFA 발급/검증 엔드포인트만 skipMfa) */
export async function requireAdminApi(opts?: { skipMfa?: boolean }) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  if (!opts?.skipMfa) {
    const userId = session?.user?.id;
    if (!userId || !(await isAdminMfaVerified(userId))) {
      return NextResponse.json(
        { error: "관리자 2단계 인증이 필요합니다.", code: "ADMIN_MFA_REQUIRED" },
        { status: 403 },
      );
    }
  }
  return session;
}
