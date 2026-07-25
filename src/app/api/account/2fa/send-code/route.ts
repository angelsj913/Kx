import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { issueOtp } from "@/lib/otp";
import { assertRateLimit, RateLimitError } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 2단계 인증 설정(켜기/끄기) 전 본인 확인용 코드를 사용자 이메일로 발송. */
export async function POST() {
  try {
    const userId = await requireUserId();
    if (userId instanceof NextResponse) return userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user?.email) {
      return NextResponse.json({ error: "이메일이 없는 계정입니다." }, { status: 400 });
    }
    await assertRateLimit("2fa-setup:user", userId, { max: 5, windowSeconds: 600 });

    const result = await issueOtp(user.email, "login-2fa");
    return NextResponse.json({
      sent: result.sent,
      mode: result.mode,
      mailError: result.mailError,
      // 개발/메일 미설정 시에만 코드가 내려온다(otp.ts 정책).
      devCode: result.devCode,
    });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("2fa send-code error:", err);
    return NextResponse.json({ error: "인증번호 발송에 실패했습니다." }, { status: 500 });
  }
}
