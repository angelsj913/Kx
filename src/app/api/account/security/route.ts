import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 보안 탭 상태: 2FA 사용 여부, 비밀번호 로그인 여부, 최근 로그인 기록. */
export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const [user, recentLogins] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true, passwordHash: true },
    }),
    prisma.loginEvent.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, ip: true, userAgent: true, provider: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    twoFactorEnabled: !!user?.twoFactorEnabled,
    hasPassword: !!user?.passwordHash,
    recentLogins,
  });
}
