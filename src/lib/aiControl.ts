import { prisma } from "@/lib/prisma";

/** 전역 AI 설정 키 */
export const AI_CONFIG_KEYS = {
  enabled: "ai.enabled",
  dailyRequestCap: "ai.dailyRequestCap",
} as const;

async function getConfig(key: string): Promise<string | null> {
  try {
    const row = await prisma.systemConfig.findUnique({ where: { key } });
    return row?.value ?? null;
  } catch {
    // 테이블 미적용 환경에서는 기본 활성
    return null;
  }
}

export async function isAiGloballyEnabled(): Promise<boolean> {
  const v = await getConfig(AI_CONFIG_KEYS.enabled);
  if (v === null) return true;
  return v !== "0" && v.toLowerCase() !== "false";
}

export async function setAiGloballyEnabled(enabled: boolean): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key: AI_CONFIG_KEYS.enabled },
    create: { key: AI_CONFIG_KEYS.enabled, value: enabled ? "1" : "0" },
    update: { value: enabled ? "1" : "0" },
  });
}

export async function getAiDailyRequestCap(): Promise<number | null> {
  const v = await getConfig(AI_CONFIG_KEYS.dailyRequestCap);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function setAiDailyRequestCap(cap: number | null): Promise<void> {
  const value = cap == null ? "" : String(Math.max(0, Math.floor(cap)));
  await prisma.systemConfig.upsert({
    where: { key: AI_CONFIG_KEYS.dailyRequestCap },
    create: { key: AI_CONFIG_KEYS.dailyRequestCap, value },
    update: { value },
  });
}

/** 대략 토큰 추정(문자 수 / 4) — 과금 토큰과 무관한 운영 지표 */
export function estimateTokens(text: string): number {
  return Math.ceil((text?.length ?? 0) / 4);
}

/** 전역 일일 요청 상한 (관리자 설정). 초과 시 에러. */
export async function assertAiDailyCap(): Promise<void> {
  const cap = await getAiDailyRequestCap();
  if (cap == null) return;

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const used = await prisma.chatHistory.count({
    where: { role: "model", createdAt: { gte: dayAgo } },
  });
  if (used >= cap) {
    const err = new Error(
      `전역 AI 일일 요청 한도(${cap}회)에 도달했습니다. 관리자에게 문의하세요.`,
    );
    (err as Error & { code?: string }).code = "AI_DAILY_CAP";
    throw err;
  }
}
