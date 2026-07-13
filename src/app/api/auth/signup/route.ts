import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hasRecentVerifiedOtp } from "@/lib/otp";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "");
    const dialCode = String(body?.dialCode ?? "").trim();
    const phoneNumber = String(body?.phone ?? "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "올바른 이메일 주소를 입력해 주세요." }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_]{4,20}$/.test(username)) {
      return NextResponse.json(
        { error: "아이디는 영문·숫자·밑줄(_) 4~20자로 입력해 주세요." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
    }

    // 이메일 OTP 인증이 최근에 완료됐는지 재확인
    const verified = await hasRecentVerifiedOtp(email, "signup");
    if (!verified) {
      return NextResponse.json({ error: "이메일 인증을 먼저 완료해 주세요." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
    }

    const dupUsername = await prisma.user.findUnique({ where: { username } });
    if (dupUsername) {
      return NextResponse.json({ error: "이미 사용 중인 아이디입니다." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const phone = dialCode && phoneNumber ? `${dialCode} ${phoneNumber}` : phoneNumber || null;

    await prisma.user.create({
      data: {
        email,
        username,
        // 프로필 표시용 — name 이 비면 UI 가 전부 "사용자"로 같아 보인다
        name: username,
        passwordHash,
        phone,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("signup error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
