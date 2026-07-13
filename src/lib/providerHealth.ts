export type ProviderId =
  | "gemini"
  | "openrouter"
  | "groq"
  | "deepseek"
  | "cerebras"
  | "mistral";

interface HealthState {
  skipUntil: number;
  reason: string;
}

const health: Record<ProviderId, HealthState> = {
  gemini: { skipUntil: 0, reason: "" },
  openrouter: { skipUntil: 0, reason: "" },
  groq: { skipUntil: 0, reason: "" },
  deepseek: { skipUntil: 0, reason: "" },
  cerebras: { skipUntil: 0, reason: "" },
  mistral: { skipUntil: 0, reason: "" },
};

const DEFAULT_SKIP_MS = 10 * 60 * 1000;

export function isProviderSkipped(provider: ProviderId): boolean {
  return Date.now() < (health[provider]?.skipUntil ?? 0);
}

export function markProviderUnhealthy(
  provider: ProviderId,
  reason: string,
  ms: number = DEFAULT_SKIP_MS,
): void {
  health[provider] = { skipUntil: Date.now() + ms, reason };
  console.warn(
    `[providerHealth] ${provider} unhealthy ${Math.round(ms / 1000)}s: ${reason}`,
  );
}

export function markProviderHealthy(provider: ProviderId): void {
  health[provider] = { skipUntil: 0, reason: "" };
}

export function noteProviderFailure(provider: ProviderId, err: unknown): void {
  const msg = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();

  if (provider === "gemini") {
    if (
      msg.includes("free_tier") ||
      msg.includes("generate_content_free_tier") ||
      msg.includes("resource_exhausted") ||
      (msg.includes("quota") && msg.includes("limit"))
    ) {
      const long =
        msg.includes("limit: 0") || msg.includes("free_tier") ? 30 * 60 * 1000 : 5 * 60 * 1000;
      markProviderUnhealthy("gemini", msg.slice(0, 160), long);
      return;
    }
  }

  if (msg.includes("401") || msg.includes("invalid api key") || msg.includes("authentication")) {
    markProviderUnhealthy(provider, msg.slice(0, 160), 15 * 60 * 1000);
    return;
  }

  if (msg.includes("429") || msg.includes("rate limit") || msg.includes("too many requests")) {
    markProviderUnhealthy(provider, msg.slice(0, 160), 90 * 1000);
    return;
  }

  if (
    (provider === "deepseek" || provider === "mistral") &&
    (msg.includes("insufficient") || msg.includes("balance") || msg.includes("quota"))
  ) {
    markProviderUnhealthy(provider, msg.slice(0, 160), 10 * 60 * 1000);
  }
}
