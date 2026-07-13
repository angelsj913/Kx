/**
 * 프로세스 단위 제공자 건강 상태.
 * Gemini free tier limit:0 처럼 "당분간 전 모델 실패" 상태를 기억해
 * 요청마다 pro→flash 를 연쇄 실패하지 않게 한다.
 */

export type ProviderId = "gemini" | "openrouter";

interface HealthState {
  /** 이 시각 이전까지 해당 제공자 스킵 */
  skipUntil: number;
  reason: string;
}

const health: Record<ProviderId, HealthState> = {
  gemini: { skipUntil: 0, reason: "" },
  openrouter: { skipUntil: 0, reason: "" },
};

const DEFAULT_SKIP_MS = 10 * 60 * 1000; // 10분

export function isProviderSkipped(provider: ProviderId): boolean {
  return Date.now() < (health[provider]?.skipUntil ?? 0);
}

export function getProviderSkipReason(provider: ProviderId): string {
  if (!isProviderSkipped(provider)) return "";
  return health[provider].reason;
}

export function markProviderUnhealthy(
  provider: ProviderId,
  reason: string,
  ms: number = DEFAULT_SKIP_MS,
): void {
  health[provider] = {
    skipUntil: Date.now() + ms,
    reason,
  };
  console.warn(
    `[providerHealth] ${provider} unhealthy for ${Math.round(ms / 1000)}s: ${reason}`,
  );
}

export function markProviderHealthy(provider: ProviderId): void {
  if (health[provider].skipUntil > Date.now()) {
    console.info(`[providerHealth] ${provider} recovered`);
  }
  health[provider] = { skipUntil: 0, reason: "" };
}

/** 에러 메시지 기반 자동 마킹 */
export function noteProviderFailure(provider: ProviderId, err: unknown): void {
  const msg = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();

  if (provider === "gemini") {
    if (
      msg.includes("free_tier") ||
      msg.includes("generate_content_free_tier") ||
      (msg.includes("quota") && msg.includes("limit")) ||
      msg.includes("resource_exhausted")
    ) {
      // free tier 0 / 일일 한도 → 길게 스킵
      const long = msg.includes("limit: 0") || msg.includes("free_tier") ? 30 * 60 * 1000 : 5 * 60 * 1000;
      markProviderUnhealthy("gemini", msg.slice(0, 160), long);
    }
  }

  if (provider === "openrouter") {
    if (msg.includes("insufficient credits") || msg.includes("never purchased")) {
      // paid 만 막힌 경우와 전체 차단을 구분하기 어려우면 paid 는 모델 free 플래그로 처리
      // free 모델까지 전부 실패하는 경우는 짧게만
    }
    if (msg.includes("401") || msg.includes("invalid api key") || msg.includes("user not found")) {
      markProviderUnhealthy("openrouter", msg.slice(0, 160), 15 * 60 * 1000);
    }
  }
}
