/**
 * 프로세스 단위 제공자 건강 상태.
 */

export type ProviderId = "gemini" | "openrouter" | "groq" | "deepseek";

interface HealthState {
  skipUntil: number;
  reason: string;
}

const health: Record<ProviderId, HealthState> = {
  gemini: { skipUntil: 0, reason: "" },
  openrouter: { skipUntil: 0, reason: "" },
  groq: { skipUntil: 0, reason: "" },
  deepseek: { skipUntil: 0, reason: "" },
};

const DEFAULT_SKIP_MS = 10 * 60 * 1000;

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
  health[provider] = { skipUntil: Date.now() + ms, reason };
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

export function noteProviderFailure(provider: ProviderId, err: unknown): void {
  const msg = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();

  if (provider === "gemini") {
    if (
      msg.includes("free_tier") ||
      msg.includes("generate_content_free_tier") ||
      (msg.includes("quota") && msg.includes("limit")) ||
      msg.includes("resource_exhausted")
    ) {
      const long =
        msg.includes("limit: 0") || msg.includes("free_tier") ? 30 * 60 * 1000 : 5 * 60 * 1000;
      markProviderUnhealthy("gemini", msg.slice(0, 160), long);
    }
  }

  if (msg.includes("401") || msg.includes("invalid api key") || msg.includes("authentication")) {
    markProviderUnhealthy(provider, msg.slice(0, 160), 15 * 60 * 1000);
    return;
  }

  if (provider === "groq" && (msg.includes("rate limit") || msg.includes("429"))) {
    markProviderUnhealthy("groq", msg.slice(0, 160), 2 * 60 * 1000);
  }

  if (
    provider === "deepseek" &&
    (msg.includes("insufficient") || msg.includes("balance") || msg.includes("quota"))
  ) {
    markProviderUnhealthy("deepseek", msg.slice(0, 160), 10 * 60 * 1000);
  }

  if (
    provider === "openrouter" &&
    (msg.includes("insufficient credits") || msg.includes("never purchased"))
  ) {
    // free 모델은 계속 시도 — paid 만 스킵은 ai 루프에서
  }
}
