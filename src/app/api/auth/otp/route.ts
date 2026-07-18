import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { issueOtp, verifyOtp } from "@/lib/otp";
import { friendlyError } from "@/lib/errors";
import { assertRateLimit, clientIp, RateLimitError } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 회원가입/비밀번호 재설정용 이메일 인증만 다룬다. 워크스페이스 삭제·관리자 요금제
// 변경 OTP는 각자 라우트 안에서 자체 처리(로그인과 무관, 여기 안 거침).
type Purpose = "signup" | "find-password";
const PURPOSES: Purpose[] = ["signup", "find-password"];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    const identifier = String(body?.identifier ?? "").trim().toLowerCase();
    const purpose = body?.purpose as Purpose;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      return NextResponse.json({ error: "올바른 이메일 주소를 입력해 주세요." }, { status: 400 });
    }
    if (!PURPOSES.includes(purpose)) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    const ip = clientIp(request);

    if (action === "send") {
      await assertRateLimit("otp:send:ip", ip, { max: 10, windowSeconds: 600 });
      await assertRateLimit(`otp:send:${purpose}`, identifier, { max: 4, windowSeconds: 600 });

      if (purpose === "signup") {
        // 가입 여부를 바로 알려주는 건 표준적인 UX 트레이드오프라 그대로 둔다.
        // (구글로 이미 가입된 이메일도 포함 — 비밀번호 로그인을 나중에 별도로
        // 추가하는 기능은 지금 범위 밖이라, 이메일당 계정은 하나만 둔다.)
        const existing = await prisma.user.findUnique({ where: { email: identifier } });
        if (existing) {
          return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
        }
        const { devCode } = await issueOtp(identifier, purpose);
        return NextResponse.json({ ok: true, devCode });
      }

      // find-password: 계정 존재 여부를 응답으로 드러내지 않는다 — 존재하지 않으면
      // 코드를 실제로 발급하지 않지만, 응답은 존재할 때와 동일하게 반환한다.
      const user = await prisma.user.findUnique({ where: { email: identifier } });
      if (user?.passwordHash) {
        const { devCode } = await issueOtp(identifier, purpose);
        return NextResponse.json({ ok: true, devCode });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "check") {
      const code = String(body?.code ?? "").trim();
      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json({ error: "6자리 숫자를 입력해 주세요." }, { status: 400 });
      }
      // 6자리(100만 가지) 무차별 대입 방어의 핵심 지점 — 코드 유효기간(3분) 안에
      // 시도 가능한 횟수를 사람이 실제로 틀릴 수 있는 수준으로 강하게 제한한다.
      await assertRateLimit(`otp:check:${purpose}`, identifier, { max: 8, windowSeconds: 180 });
      await assertRateLimit("otp:check:ip", ip, { max: 30, windowSeconds: 300 });

      const ok = await verifyOtp(identifier, purpose, code);
      if (!ok) {
        return NextResponse.json({ error: "인증번호가 올바르지 않거나 만료되었습니다." }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "알 수 없는 요청입니다." }, { status: 400 });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("auth otp error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
