import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { redeemReferral } from "@/lib/referral";
import { assertRateLimit, RateLimitError } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 추천 코드 입력 → 양쪽 Pro 7일 부여. */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    // 코드 대입 시도 제한.
    await assertRateLimit("referral-redeem:user", session.user.id, { max: 10, windowSeconds: 600 });

    const body = await request.json().catch(() => ({}));
    const code = String(body?.code ?? "");
    const result = await redeemReferral(session.user.id, code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, rewardDays: result.rewardDays });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("referral redeem error:", err);
    return NextResponse.json({ error: "추천 코드 처리에 실패했습니다." }, { status: 500 });
  }
}
