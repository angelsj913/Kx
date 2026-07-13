export type Provider = "gemini" | "openrouter";

export interface ModelDef {
  provider: Provider;
  /** 각 제공자에게 실제로 보내는 모델 문자열 */
  model: string;
}

export type ModelTier = "standard" | "priority" | "top";

/**
 * Gemini 모델 (2026-07 기준)
 * - gemini-2.5-flash 는 신규 API 키에 404 → 사용 불가
 * - 2.0-flash / 2.5-pro 계열 안정 슬러그 사용
 */
const G_FLASH: ModelDef = { provider: "gemini", model: "gemini-2.0-flash" };
const G_FLASH_LITE: ModelDef = { provider: "gemini", model: "gemini-2.0-flash-lite" };
const G_PRO: ModelDef = { provider: "gemini", model: "gemini-2.5-pro" };

const OR_LLAMA: ModelDef = {
  provider: "openrouter",
  model: "meta-llama/llama-3.3-70b-instruct:free",
};
/** free 슬러그가 막힌 경우를 대비해 유료 슬러그 + 다른 free 백업 */
const OR_DEEPSEEK: ModelDef = {
  provider: "openrouter",
  model: "deepseek/deepseek-r1",
};
const OR_QWEN: ModelDef = {
  provider: "openrouter",
  model: "qwen/qwen-2.5-72b-instruct:free",
};
const OR_GEMMA: ModelDef = {
  provider: "openrouter",
  model: "google/gemma-3-27b-it:free",
};

// 사용자에게는 노출되지 않는, 내부 전용 자동 전환 순서.
export const FALLBACK_MODELS: ModelDef[] = [
  G_FLASH,
  G_FLASH_LITE,
  G_PRO,
  OR_LLAMA,
  OR_QWEN,
  OR_GEMMA,
  OR_DEEPSEEK,
];

/** 영상(URL 입력)/음성 도구는 Gemini 멀티모달만 지원한다. */
export const MULTIMODAL_MODELS: ModelDef[] = FALLBACK_MODELS.filter(
  (m) => m.provider === "gemini",
);

/**
 * 요금제 티어별 모델 후보.
 * - standard (free): 표준 flash 우선, pro는 최후 폴백
 * - priority (pro): flash→pro, 제한적 상위 모델
 * - top (professional): pro 우선 멀티 라우트 (최상위)
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
    return [G_PRO, G_FLASH, OR_DEEPSEEK, G_FLASH_LITE, OR_QWEN, OR_LLAMA, OR_GEMMA];
  }
  if (tier === "priority") {
    return [G_FLASH, G_PRO, G_FLASH_LITE, OR_LLAMA, OR_QWEN, OR_GEMMA, OR_DEEPSEEK];
  }
  // standard: pro 최소화
  return [G_FLASH, G_FLASH_LITE, OR_LLAMA, OR_QWEN, OR_GEMMA, OR_DEEPSEEK, G_PRO];
}

export { G_FLASH, G_FLASH_LITE, G_PRO, OR_LLAMA, OR_DEEPSEEK, OR_QWEN, OR_GEMMA };
