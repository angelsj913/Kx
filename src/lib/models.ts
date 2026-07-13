export type Provider = "gemini" | "openrouter";

export interface ModelDef {
  provider: Provider;
  /** 각 제공자에게 실제로 보내는 모델 문자열 */
  model: string;
}

export type ModelTier = "standard" | "priority" | "top";

const G_FLASH: ModelDef = { provider: "gemini", model: "gemini-2.5-flash" };
const G_PRO: ModelDef = { provider: "gemini", model: "gemini-2.5-pro" };
const OR_LLAMA: ModelDef = {
  provider: "openrouter",
  model: "meta-llama/llama-3.3-70b-instruct:free",
};
const OR_DEEPSEEK: ModelDef = {
  provider: "openrouter",
  model: "deepseek/deepseek-r1:free",
};
const OR_QWEN: ModelDef = {
  provider: "openrouter",
  model: "qwen/qwen-2.5-72b-instruct:free",
};

// 사용자에게는 노출되지 않는, 내부 전용 자동 전환 순서.
export const FALLBACK_MODELS: ModelDef[] = [
  G_FLASH,
  G_PRO,
  OR_LLAMA,
  OR_DEEPSEEK,
  OR_QWEN,
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
    if (tier === "top") return [G_PRO, G_FLASH];
    if (tier === "priority") return [G_FLASH, G_PRO];
    return [G_FLASH, G_PRO]; // free: flash 우선
  }
  if (tier === "top") {
    // 최상위: pro·추론 모델 먼저, 이후 광범위 페일오버
    return [G_PRO, OR_DEEPSEEK, G_FLASH, OR_QWEN, OR_LLAMA];
  }
  if (tier === "priority") {
    return [G_FLASH, G_PRO, OR_LLAMA, OR_QWEN, OR_DEEPSEEK];
  }
  // standard: pro 최소화
  return [G_FLASH, OR_LLAMA, OR_QWEN, OR_DEEPSEEK, G_PRO];
}

export { G_FLASH, G_PRO, OR_LLAMA, OR_DEEPSEEK, OR_QWEN };
