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
import { listConfiguredProviders } from "@/lib/openaiCompat";
import { monthKey } from "@/lib/usage";

const PROVIDER_LIMIT_ENV: Record<string, string> = {
  gemini: "GEMINI_MONTHLY_TOKEN_LIMIT",
  groq: "GROQ_MONTHLY_TOKEN_LIMIT",
  cerebras: "CEREBRAS_MONTHLY_TOKEN_LIMIT",
  mistral: "MISTRAL_MONTHLY_TOKEN_LIMIT",
  openrouter: "OPENROUTER_MONTHLY_TOKEN_LIMIT",
  deepseek: "DEEPSEEK_MONTHLY_TOKEN_LIMIT",
  github: "GITHUB_MONTHLY_TOKEN_LIMIT",
  sambanova: "SAMBANOVA_MONTHLY_TOKEN_LIMIT",
};

function parseMonthlyLimit(provider: string): number | null {
  const envName = PROVIDER_LIMIT_ENV[provider];
  if (!envName) return null;
  const raw = process.env[envName]?.trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function estimateTokensSince(since: Date): Promise<number> {
  const [count, sample] = await Promise.all([
    prisma.chatHistory.count({
      where: { role: "model", createdAt: { gte: since } },
    }),
    prisma.chatHistory.findMany({
      where: { role: "model", createdAt: { gte: since } },
      select: { text: true },
      take: 200,
    }),
  ]);
  if (count === 0 || sample.length === 0) return 0;
  const estChars = sample.reduce((a, m) => a + (m.text?.length ?? 0), 0);
  return Math.round((estChars / sample.length) * count / 4);
}

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

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const estTokensMonth = await estimateTokensSince(monthStart);

  const providerQuotas = listConfiguredProviders().map((p) => {
    const monthlyLimit = parseMonthlyLimit(p.provider);
    const estUsed = p.set ? estTokensMonth : 0;
    return {
      provider: p.provider,
      envKey: p.envKey,
      configured: p.set,
      monthlyLimit,
      estTokensMonth: estUsed,
      remaining:
        monthlyLimit != null ? Math.max(0, monthlyLimit - estUsed) : null,
    };
  });

  return NextResponse.json({
    enabled,
    dailyCap,
    stats: {
      messages24h,
      messages7d,
      sessions24h,
      disabledUsers,
      estTokens24h: Math.round(estTokens24h),
      estTokensMonth,
    },
    providerQuotas,
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
