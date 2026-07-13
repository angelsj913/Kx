export type Provider = "gemini" | "openrouter";

export interface ModelDef {
  provider: Provider;
  model: string;
  /** OpenRouter free 슬러그 (크레딧 불필요) */
  free?: boolean;
}

export type ModelTier = "standard" | "priority" | "top";

// ── Gemini (키 있으면 사용, free tier 0 이면 providerHealth 가 스킵) ──
const G_FLASH: ModelDef = { provider: "gemini", model: "gemini-2.0-flash" };
const G_FLASH_LITE: ModelDef = { provider: "gemini", model: "gemini-2.0-flash-lite" };
const G_PRO: ModelDef = { provider: "gemini", model: "gemini-2.5-pro" };

function orFree(model: string): ModelDef {
  return { provider: "openrouter", model, free: true };
}

/**
 * OpenRouter 무료 채팅 모델 (2026-07 API 기준, prompt=0 & completion=0)
 * - openrouter/free : 가용 free 중 자동 선택 (가장 먼저)
 * - 이미지 생성·임베딩·세이프티 전용 모델 제외
 * - 순서는 일반 채팅 품질·안정성 우선
 */
export const OPENROUTER_FREE_CHAT: ModelDef[] = [
  // 라우터 — 한 번에 살아 있는 free 엔드포인트로
  orFree("openrouter/free"),

  // 대형·범용
  orFree("tencent/hy3:free"),
  orFree("google/gemma-4-31b-it:free"),
  orFree("google/gemma-4-26b-a4b-it:free"),
  orFree("meta-llama/llama-3.3-70b-instruct:free"),
  orFree("openai/gpt-oss-120b:free"),
  orFree("nvidia/nemotron-3-ultra-550b-a55b:free"),
  orFree("nvidia/nemotron-3-super-120b-a12b:free"),
  orFree("qwen/qwen3-next-80b-a3b-instruct:free"),
  orFree("nousresearch/hermes-3-llama-3.1-405b:free"),

  // 코딩·에이전트 계열
  orFree("cohere/north-mini-code:free"),
  orFree("poolside/laguna-xs-2.1:free"),
  orFree("poolside/laguna-m.1:free"),
  orFree("qwen/qwen3-coder:free"),

  // 중·소형 백업 (빠르고 잘 살아 있음)
  orFree("openai/gpt-oss-20b:free"),
  orFree("nvidia/nemotron-3-nano-30b-a3b:free"),
  orFree("nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"),
  orFree("nvidia/nemotron-nano-12b-v2-vl:free"),
  orFree("nvidia/nemotron-nano-9b-v2:free"),
  orFree("cognitivecomputations/dolphin-mistral-24b-venice-edition:free"),
  orFree("meta-llama/llama-3.2-3b-instruct:free"),
];

/** 유료 OpenRouter — 크레딧 있을 때만 */
const OR_DEEPSEEK: ModelDef = {
  provider: "openrouter",
  model: "deepseek/deepseek-r1",
  free: false,
};

/**
 * 요청당 free 모델 최대 시도 수 (Vercel 타임아웃 방지).
 * openrouter/free 포함. 나머지는 앞쪽 우선순위만 사용.
 */
export const MAX_FREE_ATTEMPTS = 10;

/** free 풀에서 앞 N개 + Gemini + 유료 */
function buildTextChain(maxFree = MAX_FREE_ATTEMPTS): ModelDef[] {
  const free = OPENROUTER_FREE_CHAT.slice(0, maxFree);
  return [...free, G_FLASH, G_FLASH_LITE, G_PRO, OR_DEEPSEEK];
}

const TEXT_CHAIN = buildTextChain();
const MULTI_CHAIN: ModelDef[] = [G_FLASH, G_FLASH_LITE, G_PRO];

export const FALLBACK_MODELS: ModelDef[] = TEXT_CHAIN;
export const MULTIMODAL_MODELS: ModelDef[] = MULTI_CHAIN;

/**
 * 요금제 티어별 후보.
 * free OpenRouter 를 항상 앞에 둬 Gemini free tier 0 환경에서도 응답 가능.
 */
export function modelsForTier(
  tier: ModelTier,
  opts?: { multimodal?: boolean },
): ModelDef[] {
  if (opts?.multimodal) {
    if (tier === "top") return [G_PRO, G_FLASH, G_FLASH_LITE];
    return [G_FLASH, G_FLASH_LITE, G_PRO];
  }

  // top: free 조금 더 넓게, priority/standard: 기본 10
  if (tier === "top") return buildTextChain(12);
  if (tier === "priority") return buildTextChain(10);
  return buildTextChain(10);
}

/** 등록된 free 모델 id 목록 (디버그·상태 표시용) */
export function listFreeModelIds(): string[] {
  return OPENROUTER_FREE_CHAT.map((m) => m.model);
}

export {
  G_FLASH,
  G_FLASH_LITE,
  G_PRO,
  OR_DEEPSEEK,
  OPENROUTER_FREE_CHAT as OR_FREE_POOL,
};

// 하위 호환 export
export const OR_FREE = OPENROUTER_FREE_CHAT[0]!;
export const OR_FREE_ROUTER = OR_FREE;
export const OR_LLAMA = orFree("meta-llama/llama-3.3-70b-instruct:free");
export const OR_QWEN = orFree("qwen/qwen3-next-80b-a3b-instruct:free");
export const OR_GEMMA4 = orFree("google/gemma-4-26b-a4b-it:free");
export const OR_NEMOTRON = orFree("nvidia/nemotron-3-super-120b-a12b:free");
