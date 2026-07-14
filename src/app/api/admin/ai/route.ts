import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  getAiDailyRequestCap,
  isAiGloballyEnabled,
  setAiDailyRequestCap,
  setAiGloballyEnabled,
} from "@/lib/aiControl";
import { monthKey } from "@/lib/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const enabled = await isAiGloballyEnabled();
  const dailyCap = await getAiDailyRequestCap();
  const mk = monthKey();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [messages24h, messages7d, sessions24h, disabledUsers, topUsers] =
    await Promise.all([
      prisma.chatHistory.count({
        where: { createdAt: { gte: dayAgo }, role: "model" },
      }),
      prisma.chatHistory.count({
        where: { createdAt: { gte: weekAgo }, role: "model" },
      }),
      prisma.chatSession.count({ where: { updatedAt: { gte: dayAgo } } }),
      prisma.userSettings.count({ where: { aiDisabled: true } }),
      prisma.usageCounter.findMany({
        where: { periodKey: mk },
        orderBy: { count: "desc" },
        take: 15,
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      }),
    ]);

  // 대략 토큰 추정: 최근 모델 응답 문자 수 샘플
  const sample = await prisma.chatHistory.findMany({
    where: { role: "model", createdAt: { gte: dayAgo } },
    select: { text: true },
    take: 200,
  });
  const estChars = sample.reduce((a, m) => a + (m.text?.length ?? 0), 0);
  const estTokens24h =
    sample.length > 0
      ? Math.round((estChars / sample.length) * messages24h) / 4
      : 0;

  return NextResponse.json({
    enabled,
    dailyCap,
    stats: {
      messages24h,
      messages7d,
      sessions24h,
      disabledUsers,
      estTokens24h: Math.round(estTokens24h),
    },
    topUsage: topUsers.map((u) => ({
      userId: u.userId,
      feature: u.feature,
      count: u.count,
      periodKey: u.periodKey,
      email: u.user.email,
      name: u.user.name,
    })),
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  if (typeof body.enabled === "boolean") {
    await setAiGloballyEnabled(body.enabled);
  }
  if (body.dailyCap === null || typeof body.dailyCap === "number") {
    await setAiDailyRequestCap(
      body.dailyCap === null ? null : Number(body.dailyCap),
    );
  }
  if (typeof body.userId === "string" && typeof body.aiDisabled === "boolean") {
    await prisma.userSettings.upsert({
      where: { userId: body.userId },
      create: { userId: body.userId, aiDisabled: body.aiDisabled },
      update: { aiDisabled: body.aiDisabled },
    });
  }

  return GET();
}
