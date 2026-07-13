export type Provider = "gemini" | "openrouter" | "groq" | "deepseek";

export interface ModelDef {
  provider: Provider;
  model: string;
  /** free 티어 / 크레딧 0 가능 */
  free?: boolean;
  /** 초저가 유료 (DeepSeek 등) — 크레딧 필요하지만 거의 free급 */
  cheap?: boolean;
}

export type ModelTier = "standard" | "priority" | "top";

// ── Gemini ──
const G_FLASH: ModelDef = { provider: "gemini", model: "gemini-2.0-flash", free: true };
const G_FLASH_LITE: ModelDef = {
  provider: "gemini",
  model: "gemini-2.0-flash-lite",
  free: true,
};
const G_PRO: ModelDef = { provider: "gemini", model: "gemini-2.5-pro" };

function orFree(model: string): ModelDef {
  return { provider: "openrouter", model, free: true };
}

// ── Groq (무료 티어 · 매우 빠름) ──
const GROQ_LLAMA70: ModelDef = {
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  free: true,
};
const GROQ_LLAMA8: ModelDef = {
  provider: "groq",
  model: "llama-3.1-8b-instant",
  free: true,
};
const GROQ_OSS20: ModelDef = {
  provider: "groq",
  model: "openai/gpt-oss-20b",
  free: true,
};
const GROQ_OSS120: ModelDef = {
  provider: "groq",
  model: "openai/gpt-oss-120b",
  free: true,
};

export const GROQ_FREE: ModelDef[] = [GROQ_LLAMA70, GROQ_LLAMA8, GROQ_OSS20, GROQ_OSS120];

// ── DeepSeek 공식 API (초저가 · 품질 좋음) ──
const DS_FLASH: ModelDef = {
  provider: "deepseek",
  model: "deepseek-v4-flash",
  cheap: true,
};
const DS_CHAT: ModelDef = {
  provider: "deepseek",
  model: "deepseek-chat",
  cheap: true,
};
const DS_PRO: ModelDef = {
  provider: "deepseek",
  model: "deepseek-v4-pro",
  cheap: true,
};

export const DEEPSEEK_MODELS: ModelDef[] = [DS_FLASH, DS_CHAT, DS_PRO];

/**
 * OpenRouter free (prompt=0)
 */
export const OPENROUTER_FREE_CHAT: ModelDef[] = [
  orFree("openrouter/free"),
  orFree("tencent/hy3:free"),
  orFree("google/gemma-4-31b-it:free"),
  orFree("google/gemma-4-26b-a4b-it:free"),
  orFree("meta-llama/llama-3.3-70b-instruct:free"),
  orFree("openai/gpt-oss-120b:free"),
  orFree("nvidia/nemotron-3-super-120b-a12b:free"),
  orFree("qwen/qwen3-next-80b-a3b-instruct:free"),
  orFree("cohere/north-mini-code:free"),
  orFree("openai/gpt-oss-20b:free"),
  orFree("nvidia/nemotron-3-nano-30b-a3b:free"),
  orFree("meta-llama/llama-3.2-3b-instruct:free"),
];

/** 요청당 free 계열 최대 시도 (타임아웃 방지) */
export const MAX_FREE_ATTEMPTS = 8;

/**
 * 텍스트 체인 우선순위:
 * 1) Groq free (빠르고 안정적인 free tier)
 * 2) OpenRouter free
 * 3) DeepSeek 초저가 (키 있으면)
 * 4) Gemini free
 * 5) DeepSeek pro / Gemini pro
 */
function buildTextChain(maxFreeOr = MAX_FREE_ATTEMPTS, tier: ModelTier = "standard"): ModelDef[] {
  const orFreeSlice = OPENROUTER_FREE_CHAT.slice(0, maxFreeOr);
  const chain: ModelDef[] = [
    ...GROQ_FREE,
    ...orFreeSlice,
    DS_FLASH,
    DS_CHAT,
    G_FLASH,
    G_FLASH_LITE,
  ];
  if (tier === "priority" || tier === "top") {
    chain.push(DS_PRO, G_PRO);
  } else {
    chain.push(G_PRO, DS_PRO);
  }
  return chain;
}

const TEXT_CHAIN = buildTextChain();
const MULTI_CHAIN: ModelDef[] = [G_FLASH, G_FLASH_LITE, G_PRO];

export const FALLBACK_MODELS: ModelDef[] = TEXT_CHAIN;
export const MULTIMODAL_MODELS: ModelDef[] = MULTI_CHAIN;

export function modelsForTier(
  tier: ModelTier,
  opts?: { multimodal?: boolean },
): ModelDef[] {
  if (opts?.multimodal) {
    if (tier === "top") return [G_FLASH, G_PRO, G_FLASH_LITE];
    return [G_FLASH, G_FLASH_LITE, G_PRO];
  }
  if (tier === "top") return buildTextChain(10, "top");
  if (tier === "priority") return buildTextChain(8, "priority");
  return buildTextChain(8, "standard");
}

export function listFreeModelIds(): string[] {
  return [
    ...GROQ_FREE.map((m) => `groq/${m.model}`),
    ...OPENROUTER_FREE_CHAT.map((m) => m.model),
    ...DEEPSEEK_MODELS.map((m) => `deepseek/${m.model}`),
  ];
}

export {
  G_FLASH,
  G_FLASH_LITE,
  G_PRO,
  DS_FLASH,
  DS_CHAT,
  DS_PRO,
  GROQ_LLAMA70,
  OPENROUTER_FREE_CHAT as OR_FREE_POOL,
};

export const OR_FREE = OPENROUTER_FREE_CHAT[0]!;
export const OR_FREE_ROUTER = OR_FREE;
export const OR_LLAMA = orFree("meta-llama/llama-3.3-70b-instruct:free");
export const OR_QWEN = orFree("qwen/qwen3-next-80b-a3b-instruct:free");
export const OR_GEMMA4 = orFree("google/gemma-4-26b-a4b-it:free");
export const OR_NEMOTRON = orFree("nvidia/nemotron-3-super-120b-a12b:free");
export const OR_DEEPSEEK = DS_FLASH;
