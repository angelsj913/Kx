export type Provider = "gemini" | "openrouter";

export interface ModelDef {
  provider: Provider;
  /** 각 제공자에게 실제로 보내는 모델 문자열 */
  model: string;
  /** true면 OpenRouter 크레딧이 필요 없는 free 슬러그 */
  free?: boolean;
}

export type ModelTier = "standard" | "priority" | "top";

/**
 * Gemini 모델 (2026-07 기준)
 * - gemini-2.5-flash 는 신규 API 키에 404
 * - free tier 한도 0 이면 프로젝트 결제/할당 문제 → OpenRouter free 로 폴백
 */
const G_FLASH: ModelDef = { provider: "gemini", model: "gemini-2.0-flash" };
const G_FLASH_LITE: ModelDef = { provider: "gemini", model: "gemini-2.0-flash-lite" };
const G_PRO: ModelDef = { provider: "gemini", model: "gemini-2.5-pro" };

/** OpenRouter free — 크레딧 0이어도 동작하는 경우가 많음 (유료 모델보다 먼저) */
const OR_LLAMA: ModelDef = {
  provider: "openrouter",
  model: "meta-llama/llama-3.3-70b-instruct:free",
  free: true,
};
const OR_QWEN: ModelDef = {
  provider: "openrouter",
  model: "qwen/qwen-2.5-72b-instruct:free",
  free: true,
};
const OR_GEMMA: ModelDef = {
  provider: "openrouter",
  model: "google/gemma-3-27b-it:free",
  free: true,
};
const OR_MISTRAL: ModelDef = {
  provider: "openrouter",
  model: "mistralai/mistral-small-3.1-24b-instruct:free",
  free: true,
};
/** 유료 — 크레딧 없으면 Insufficient credits */
const OR_DEEPSEEK: ModelDef = {
  provider: "openrouter",
  model: "deepseek/deepseek-r1",
  free: false,
};

const OR_FREE_POOL: ModelDef[] = [OR_LLAMA, OR_QWEN, OR_GEMMA, OR_MISTRAL];

// 사용자에게는 노출되지 않는, 내부 전용 자동 전환 순서.
// Gemini → OpenRouter free → (유료) 순서. 크레딧 없는 계정에서도 free 가 먼저 시도됨.
export const FALLBACK_MODELS: ModelDef[] = [
  G_FLASH,
  G_FLASH_LITE,
  ...OR_FREE_POOL,
  G_PRO,
  OR_DEEPSEEK,
];

/** 영상(URL 입력)/음성 도구는 Gemini 멀티모달만 지원한다. */
export const MULTIMODAL_MODELS: ModelDef[] = FALLBACK_MODELS.filter(
  (m) => m.provider === "gemini",
);

/**
 * 요금제 티어별 모델 후보.
 * free OpenRouter 를 유료 모델보다 항상 앞에 둔다.
 */
export function modelsForTier(
  tier: ModelTier,
  opts?: { multimodal?: boolean },
): ModelDef[] {
  const multi = !!opts?.multimodal;
  if (multi) {
    if (tier === "top") return [G_PRO, G_FLASH, G_FLASH_LITE];
    if (tier === "priority") return [G_FLASH, G_PRO, G_FLASH_LITE];
    return [G_FLASH, G_FLASH_LITE, G_PRO];
  }
  if (tier === "top") {
    // 품질 우선이지만 free 백업을 유료보다 앞
    return [G_PRO, G_FLASH, G_FLASH_LITE, ...OR_FREE_POOL, OR_DEEPSEEK];
  }
  if (tier === "priority") {
    return [G_FLASH, G_FLASH_LITE, G_PRO, ...OR_FREE_POOL, OR_DEEPSEEK];
  }
  // standard: pro·유료 최소화
  return [G_FLASH, G_FLASH_LITE, ...OR_FREE_POOL, G_PRO, OR_DEEPSEEK];
}

export { G_FLASH, G_FLASH_LITE, G_PRO, OR_LLAMA, OR_DEEPSEEK, OR_QWEN, OR_GEMMA, OR_MISTRAL };
