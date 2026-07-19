import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { issueOtp } from "@/lib/otp";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 로그인 1단계 — 이 계정이 2FA를 쓰는지 판별하고, 쓴다면 이메일로 코드를 발송한다.
 *
 * 정보 노출 최소화: 자격증명이 맞고 2FA가 켜진 경우에만 { twoFactor: true }를 돌려주고,
 * 그 외(계정 없음·비번 틀림·2FA 미사용·과도한 시도)는 모두 { twoFactor: false }로 응답한다.
 * 클라이언트는 false면 평소 로그인 흐름(signIn)으로 진행하므로, 잘못된 자격증명은 거기서
 * 일관된 오류로 처리된다. brute-force·메일 폭탄을 막기 위해 로그인과 같은 rate limit 버킷을
 * 공유한다.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    if (!email || !password) return NextResponse.json({ twoFactor: false });

    const ip = clientIp(request);
    const [ipOk, emailOk] = await Promise.all([
      checkRateLimit("login:ip", ip, { max: 20, windowSeconds: 300 }),
      checkRateLimit("login:email", email, { max: 6, windowSeconds: 300 }),
    ]);
    if (!ipOk || !emailOk) return NextResponse.json({ twoFactor: false });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash || !user.twoFactorEnabled) {
      return NextResponse.json({ twoFactor: false });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return NextResponse.json({ twoFactor: false });

    await issueOtp(email, "login-2fa");
    return NextResponse.json({ twoFactor: true });
  } catch (err) {
    console.error("2fa login-challenge error:", err);
    // 실패해도 로그인 자체는 막지 않도록 false로 응답(클라이언트가 평소 흐름으로 진행).
    return NextResponse.json({ twoFactor: false });
  }
}
