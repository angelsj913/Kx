import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { getReferralStatus } from "@/lib/referral";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 내 추천 코드 · 성사 건수 · 현재 부여된 Pro 만료일. */
export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;
  try {
    const status = await getReferralStatus(userId);
    return NextResponse.json(status);
  } catch (err) {
    console.error("referral status error:", err);
    return NextResponse.json({ error: "추천 정보를 불러오지 못했습니다." }, { status: 500 });
  }
}
