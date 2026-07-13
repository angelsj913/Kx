export type Provider = "gemini" | "openrouter";

export interface ModelDef {
  provider: Provider;
  model: string;
  /** OpenRouter free 슬러그 (크레딧 불필요) */
  free?: boolean;
}

export type ModelTier = "standard" | "priority" | "top";

// ── Gemini (2026-07: 2.5-flash 신규키 404 → 2.0 사용) ──
const G_FLASH: ModelDef = { provider: "gemini", model: "gemini-2.0-flash" };
const G_FLASH_LITE: ModelDef = { provider: "gemini", model: "gemini-2.0-flash-lite" };
const G_PRO: ModelDef = { provider: "gemini", model: "gemini-2.5-pro" };

// ── OpenRouter free (가용 free 자동 선택 라우터 우선) ──
const OR_FREE: ModelDef = {
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
const OR_NEMO: ModelDef = {
  provider: "openrouter",
  model: "nvidia/nemotron-3-super-120b-a12b:free",
  free: true,
};

/** 유료 — 크레딧 없으면 스킵 */
const OR_DEEPSEEK: ModelDef = {
  provider: "openrouter",
  model: "deepseek/deepseek-r1",
  free: false,
};

/** 텍스트 채팅·도구 공통: free OR → Gemini flash → pro → 유료 */
const TEXT_CHAIN: ModelDef[] = [
  OR_FREE,
  OR_GEMMA4,
  OR_LLAMA,
  OR_QWEN,
  OR_NEMO,
  G_FLASH,
  G_FLASH_LITE,
  G_PRO,
  OR_DEEPSEEK,
];

/** 멀티모달: Gemini만 (첨부/URL) */
const MULTI_CHAIN: ModelDef[] = [G_FLASH, G_FLASH_LITE, G_PRO];

export const FALLBACK_MODELS: ModelDef[] = TEXT_CHAIN;
export const MULTIMODAL_MODELS: ModelDef[] = MULTI_CHAIN;

/**
 * 요금제 티어별 후보.
 * - 품질 차이는 system prompt / 검증 패스로 두고
 * - 모델 목록은 안정성 우선 동일 체인 (pro는 뒤쪽)
 */
export function modelsForTier(
  tier: ModelTier,
  opts?: { multimodal?: boolean },
): ModelDef[] {
  if (opts?.multimodal) {
    if (tier === "top") return [G_PRO, G_FLASH, G_FLASH_LITE];
    return [G_FLASH, G_FLASH_LITE, G_PRO];
  }
  // top/priority 도 free 를 앞에 — Gemini free 0 환경에서 무조건 응답 가능하게
  if (tier === "top") {
    return [
      OR_FREE,
      OR_GEMMA4,
      OR_LLAMA,
      G_FLASH,
      OR_QWEN,
      G_FLASH_LITE,
      G_PRO,
      OR_NEMO,
      OR_DEEPSEEK,
    ];
  }
  if (tier === "priority") {
    return [
      OR_FREE,
      G_FLASH,
      OR_GEMMA4,
      OR_LLAMA,
      G_FLASH_LITE,
      OR_QWEN,
      G_PRO,
      OR_NEMO,
      OR_DEEPSEEK,
    ];
  }
  return [...TEXT_CHAIN];
}

export {
  G_FLASH,
  G_FLASH_LITE,
  G_PRO,
  OR_FREE,
  OR_FREE as OR_FREE_ROUTER,
  OR_LLAMA,
  OR_DEEPSEEK,
  OR_QWEN,
  OR_GEMMA4,
  OR_NEMO as OR_NEMOTRON,
};
