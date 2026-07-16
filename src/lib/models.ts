export type Provider =
  | "gemini"
  | "openrouter"
  | "groq"
  | "deepseek"
  | "cerebras"
  | "mistral";

export interface ModelDef {
  provider: Provider;
  model: string;
  free?: boolean;
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

// ── Groq free ──
export const GROQ_FREE: ModelDef[] = [
  { provider: "groq", model: "llama-3.3-70b-versatile", free: true },
  { provider: "groq", model: "llama-3.1-8b-instant", free: true },
  { provider: "groq", model: "openai/gpt-oss-20b", free: true },
  { provider: "groq", model: "openai/gpt-oss-120b", free: true },
];

// ── Cerebras free (초고속) ──
export const CEREBRAS_FREE: ModelDef[] = [
  { provider: "cerebras", model: "llama-3.3-70b", free: true },
  { provider: "cerebras", model: "llama3.1-8b", free: true },
];

// ── Mistral free/experiment ──
export const MISTRAL_FREE: ModelDef[] = [
  { provider: "mistral", model: "mistral-small-latest", free: true },
  { provider: "mistral", model: "open-mistral-nemo", free: true },
  { provider: "mistral", model: "ministral-8b-latest", free: true },
];

// ── DeepSeek 초저가 ──
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

// ── OpenRouter free ──
export const OPENROUTER_FREE_CHAT: ModelDef[] = [
  orFree("openrouter/free"),
  orFree("tencent/hy3:free"),
  orFree("google/gemma-4-31b-it:free"),
  orFree("google/gemma-4-26b-a4b-it:free"),
  orFree("meta-llama/llama-3.3-70b-instruct:free"),
  orFree("openai/gpt-oss-120b:free"),
  orFree("nvidia/nemotron-3-super-120b-a12b:free"),
  orFree("qwen/qwen3-next-80b-a3b-instruct:free"),
  orFree("openai/gpt-oss-20b:free"),
  orFree("meta-llama/llama-3.2-3b-instruct:free"),
];

export const MAX_FREE_ATTEMPTS = 6;

/**
 * 제공자 라운드로빈 — 한 제공자 연속 실패를 줄이고 백엔드 라우트 페일오버 극대화.
 */
export function interleaveByProvider(groups: ModelDef[][]): ModelDef[] {
  const queues = groups.map((g) => [...g]);
  const out: ModelDef[] = [];
  const seen = new Set<string>();
  let added = true;
  while (added) {
    added = false;
    for (const q of queues) {
      while (q.length) {
        const m = q.shift()!;
        const key = `${m.provider}:${m.model}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(m);
        added = true;
        break; // 다음 제공자로
      }
    }
  }
  return out;
}

/**
 * 요금제별 후보 순서 — "먼저 성공하는 모델"이 아니라 "결제한 티어만큼 실제로
 * 다른 모델이 먼저 시도되도록" 차등화한다. 무료 소형 모델 풀은 어느 티어에서도
 * 완전히 제거하지 않고 안전망(실제 에러 시 폴백)으로 유지한다.
 */
function buildTextChain(maxOrFree = MAX_FREE_ATTEMPTS, tier: ModelTier = "standard"): ModelDef[] {
  const freeGroups = [
    GROQ_FREE,
    CEREBRAS_FREE,
    MISTRAL_FREE,
    OPENROUTER_FREE_CHAT.slice(0, maxOrFree),
  ];
  const freeInterleaved = interleaveByProvider(freeGroups);

  const mid: ModelDef[] = [DS_FLASH, DS_CHAT, G_FLASH, G_FLASH_LITE];
  const premium: ModelDef[] =
    tier === "top" || tier === "priority" ? [DS_PRO, G_PRO] : [G_PRO, DS_PRO];

  // standard(무료): 비용 우선 — 무료 풀을 먼저 시도, 프리미엄은 최후 수단
  if (tier === "standard") {
    return [...freeInterleaved, ...mid, ...premium];
  }
  // priority(Pro): 중간 등급 모델을 먼저 시도 — 무료 풀은 실패 시 안전망으로 이동
  if (tier === "priority") {
    return [...mid, ...premium, ...freeInterleaved];
  }
  // top(Professional): 프리미엄 모델을 첫 시도로 — 무료 풀은 프리미엄이 에러날 때만
  return [...premium, ...mid, ...freeInterleaved];
}

/** 검증 전용: 생성에 쓴 제공자와 다른 쪽 우선 */
export function modelsForVerify(
  tier: ModelTier,
  avoidProvider?: Provider,
): ModelDef[] {
  const all = modelsForTier(tier);
  const preferred = all.filter((m) => m.provider !== avoidProvider);
  const rest = all.filter((m) => m.provider === avoidProvider);
  // free/cheap 우선 3~4개
  return [...preferred, ...rest].slice(0, 4);
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
  if (tier === "top") return buildTextChain(8, "top");
  if (tier === "priority") return buildTextChain(6, "priority");
  return buildTextChain(6, "standard");
}

export function listFreeModelIds(): string[] {
  return [
    ...GROQ_FREE.map((m) => `groq/${m.model}`),
    ...CEREBRAS_FREE.map((m) => `cerebras/${m.model}`),
    ...MISTRAL_FREE.map((m) => `mistral/${m.model}`),
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
  OPENROUTER_FREE_CHAT as OR_FREE_POOL,
};

export const OR_FREE = OPENROUTER_FREE_CHAT[0]!;
export const OR_FREE_ROUTER = OR_FREE;
export const OR_LLAMA = orFree("meta-llama/llama-3.3-70b-instruct:free");
export const OR_QWEN = orFree("qwen/qwen3-next-80b-a3b-instruct:free");
export const OR_GEMMA4 = orFree("google/gemma-4-26b-a4b-it:free");
export const OR_NEMOTRON = orFree("nvidia/nemotron-3-super-120b-a12b:free");
export const OR_DEEPSEEK = DS_FLASH;
export const GROQ_LLAMA70 = GROQ_FREE[0]!;
