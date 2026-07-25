import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { redeemReferral } from "@/lib/referral";
import { assertRateLimit, clientIp, RateLimitError } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 추천 코드 입력 → 양쪽 Pro 7일 부여. */
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (userId instanceof NextResponse) return userId;
    await assertRateLimit("referral-redeem:user", userId, { max: 8, windowSeconds: 600 });
    await assertRateLimit("referral-redeem:ip", clientIp(request), { max: 20, windowSeconds: 600 });

    const body = await request.json().catch(() => ({}));
    const code = String(body?.code ?? "");
    const result = await redeemReferral(userId, code);
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
