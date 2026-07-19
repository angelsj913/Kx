import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getReferralStatus } from "@/lib/referral";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 내 추천 코드 · 성사 건수 · 현재 부여된 Pro 만료일. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  try {
    const status = await getReferralStatus(session.user.id);
    return NextResponse.json(status);
  } catch (err) {
    console.error("referral status error:", err);
    return NextResponse.json({ error: "추천 정보를 불러오지 못했습니다." }, { status: 500 });
  }
}
