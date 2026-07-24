import { prisma } from "@/lib/prisma";

/** 전역 AI 설정 키 */
export const AI_CONFIG_KEYS = {
  enabled: "ai.enabled",
  dailyRequestCap: "ai.dailyRequestCap",
} as const;

// 채팅마다 호출되는 값이라 짧게 메모이즈 — 관리자 설정은 자주 안 바뀌고, 바뀔 때는
// setAiGloballyEnabled/setAiDailyRequestCap에서 캐시를 즉시 무효화한다.
const configCache = new Map<string, { value: string | null; expiresAt: number }>();
const CONFIG_CACHE_TTL_MS = 30_000;

async function getConfig(key: string): Promise<string | null> {
  const cached = configCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  try {
    const row = await prisma.systemConfig.findUnique({ where: { key } });
    const value = row?.value ?? null;
    configCache.set(key, { value, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS });
    return value;
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
  configCache.delete(AI_CONFIG_KEYS.enabled);
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
  configCache.delete(AI_CONFIG_KEYS.dailyRequestCap);
}

const AI_DAILY_FEATURE = "ai-daily";

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

/**
 * 전역 일일 요청 상한(관리자 설정)을 원자적으로 예약한다.
 * 예전엔 `chatHistory` 완료 행 개수를 세는 방식이라, 생성이 끝난 뒤에야 반영돼 생성이
 * 진행되는 수 초~수십 초 동안 도착한 모든 동시 요청이 같은(아직 미달인) 카운트를 보고
 * 통과할 수 있었다 — 경쟁 구간이 생성 시간만큼 넓었다. 이제 생성을 시작하기 *전에*
 * `GlobalCounter`를 원자적으로 +1 하고 한도를 확인해 자리를 예약하고, 생성이 실패하면
 * `refundAiDailySlot`으로 반납한다(usage.ts의 reserveQuota와 같은 원리).
 * 한도가 설정돼 있지 않으면 null(항상 통과).
 */
export async function reserveAiDailySlot(): Promise<{ periodKey: string } | null> {
  const cap = await getAiDailyRequestCap();
  if (cap == null) return null;

  const periodKey = dayKey();
  const row = await prisma.globalCounter.upsert({
    where: { feature_periodKey: { feature: AI_DAILY_FEATURE, periodKey } },
    create: { feature: AI_DAILY_FEATURE, periodKey, count: 1 },
    update: { count: { increment: 1 } },
  });
  if (row.count > cap) {
    await prisma.globalCounter.update({
      where: { feature_periodKey: { feature: AI_DAILY_FEATURE, periodKey } },
      data: { count: { decrement: 1 } },
    });
    const err = new Error(
      `전역 AI 일일 요청 한도(${cap}회)에 도달했습니다. 관리자에게 문의하세요.`,
    );
    (err as Error & { code?: string }).code = "AI_DAILY_CAP";
    throw err;
  }
  return { periodKey };
}

/** 예약한 전역 일일 슬롯을 반납한다(생성 실패 시). */
export async function refundAiDailySlot(periodKey: string): Promise<void> {
  await prisma.globalCounter.updateMany({
    where: { feature: AI_DAILY_FEATURE, periodKey, count: { gt: 0 } },
    data: { count: { decrement: 1 } },
  });
}
