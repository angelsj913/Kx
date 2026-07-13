export type Provider = "gemini" | "openrouter";

export interface ModelDef {
  provider: Provider;
  /** 각 제공자에게 실제로 보내는 모델 문자열 */
  model: string;
  /** true면 OpenRouter free 슬러그 (크레딧 불필요) */
  free?: boolean;
}

export type ModelTier = "standard" | "priority" | "top";

/**
 * Gemini (2026-07)
 * - free tier limit:0 인 프로젝트는 전부 실패 → OpenRouter free 로 폴백
 * - 2.5-pro 를 맨 앞에 두면 free 계정에서 매번 429 만 발생 → flash 우선
 */
const G_FLASH: ModelDef = { provider: "gemini", model: "gemini-2.0-flash" };
const G_FLASH_LITE: ModelDef = { provider: "gemini", model: "gemini-2.0-flash-lite" };
const G_PRO: ModelDef = { provider: "gemini", model: "gemini-2.5-pro" };

/**
 * OpenRouter free
 * - openrouter/free : 가용 free 모델을 라우터가 고름 (개별 슬러그 장애에 강함)
 * - 개별 free 모델은 백업
 */
const OR_FREE_ROUTER: ModelDef = {
  provider: "openrouter",
  model: "openrouter/free",
  free: true,
};
const OR_GEMMA4: ModelDef = {
  provider: "openrouter",
  model: "google/gemma-4-26b-a4b-it:free",
  free: true,
};
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
const OR_NEMOTRON: ModelDef = {
  provider: "openrouter",
  model: "nvidia/nemotron-3-super-120b-a12b:free",
  free: true,
};
/** 유료 — 크레딧 없으면 Insufficient credits */
const OR_DEEPSEEK: ModelDef = {
  provider: "openrouter",
  model: "deepseek/deepseek-r1",
  free: false,
};

const OR_FREE_POOL: ModelDef[] = [
  OR_FREE_ROUTER,
  OR_GEMMA4,
  OR_LLAMA,
  OR_QWEN,
  OR_GEMMA,
  OR_NEMOTRON,
];

/**
 * 기본 순서: OpenRouter free 먼저 → Gemini → 유료
 * (Gemini free tier 가 죽은 환경에서도 바로 응답 가능)
 */
export const FALLBACK_MODELS: ModelDef[] = [
  ...OR_FREE_POOL,
  G_FLASH,
  G_FLASH_LITE,
  G_PRO,
  OR_DEEPSEEK,
];

/** 영상/음성 등 멀티모달은 Gemini 우선 */
export const MULTIMODAL_MODELS: ModelDef[] = [
  G_FLASH,
  G_FLASH_LITE,
  G_PRO,
];

/**
 * 요금제 티어별 모델 후보.
 * text 경로는 free OpenRouter 를 항상 앞쪽에 둔다.
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
  // text: free OR 먼저 (Gemini free 할당 0 환경 대응)
  if (tier === "top") {
    return [...OR_FREE_POOL, G_FLASH, G_FLASH_LITE, G_PRO, OR_DEEPSEEK];
  }
  if (tier === "priority") {
    return [...OR_FREE_POOL, G_FLASH, G_FLASH_LITE, G_PRO, OR_DEEPSEEK];
  }
  return [...OR_FREE_POOL, G_FLASH, G_FLASH_LITE, G_PRO, OR_DEEPSEEK];
}

export {
  G_FLASH,
  G_FLASH_LITE,
  G_PRO,
  OR_FREE_ROUTER,
  OR_LLAMA,
  OR_DEEPSEEK,
  OR_QWEN,
  OR_GEMMA,
  OR_GEMMA4,
  OR_NEMOTRON,
};
