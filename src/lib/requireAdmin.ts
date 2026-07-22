import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";

/** RSC/admin page: 비관리자는 공홈으로, 미로그인은 로그인으로 */
export async function requireAdminPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (!isAdminSession(session)) {
    redirect("/");
  }
  return session;
}

/** API route: 비관리자 403 */
export async function requireAdminApi() {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  return session;
}
