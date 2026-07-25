import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";

const unauthorized = () => NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

/** 세션이 없으면 401 NextResponse를 반환한다 — 호출부에서 `instanceof NextResponse`로 분기. */
export async function requireSession(): Promise<Session | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  return session;
}

/** session.user.id만 필요한 라우트용 축약형. */
export async function requireUserId(): Promise<string | NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  return session.user.id!;
}
