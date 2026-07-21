export type Provider =
  | "gemini"
  | "openrouter"
  | "groq"
  | "deepseek"
  | "cerebras"
  | "mistral"
  | "github"
  | "sambanova";

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

// ── GitHub Models (무료, PAT 하나를 앱 전체가 공유 — 모델별 10~15 RPM·50~150 RPD로
// 다른 무료 제공자보다 한도가 훨씬 낮다. 그래서 라운드로빈에 안 섞고 무료 풀
// 맨 뒤 최후 수단으로만 둔다) ──
export const GITHUB_FREE: ModelDef[] = [
  { provider: "github", model: "gpt-4o-mini", free: true },
  { provider: "github", model: "Meta-Llama-3.1-8B-Instruct", free: true },
];

// ── SambaNova Cloud (무료, 영구 무료 티어 — 모델별 분당 10~30회로 GitHub Models의
// 일일 한도보다 빨리 회복된다. 그래서 Groq/Cerebras/Mistral과 같은 라운드로빈
// 그룹에 바로 섞는다) ──
export const SAMBANOVA_FREE: ModelDef[] = [
  { provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", free: true },
  { provider: "sambanova", model: "DeepSeek-V3.1", free: true },
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

// ── 에이전트(함수 호출) 전용 모델 ──
// 툴 콜은 모델 품질에 민감해서, 8b 소형 폴백 풀로 새면 tool_calls가 깨진다.
// 그래서 modelsForTier/FALLBACK_MODELS(소형 모델 안전망 포함)를 재사용하지 않고,
// OpenAI 함수호출을 안정적으로 지원하는 강한 무료 모델만 골라 고정한다.
// (OpenRouter free·GitHub Models는 tools 파라미터에 400을 낼 수 있어 제외.)
export const AGENT_MODELS: ModelDef[] = [
  { provider: "groq", model: "llama-3.3-70b-versatile", free: true },
  { provider: "cerebras", model: "llama-3.3-70b", free: true },
  { provider: "mistral", model: "mistral-small-latest", free: true },
  { provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", free: true },
  { provider: "deepseek", model: "deepseek-chat", cheap: true },
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
    SAMBANOVA_FREE,
    OPENROUTER_FREE_CHAT.slice(0, maxOrFree),
  ];
  const freeInterleaved = interleaveByProvider(freeGroups);
  // GitHub Models는 라운드로빈에 안 섞고 무료 풀 맨 뒤에 최후 수단으로 붙인다.
  const freePool = [...freeInterleaved, ...GITHUB_FREE];

  const mid: ModelDef[] = [DS_FLASH, DS_CHAT, G_FLASH, G_FLASH_LITE];
  const premium: ModelDef[] =
    tier === "top" || tier === "priority" ? [DS_PRO, G_PRO] : [G_PRO, DS_PRO];

  // standard(무료): 비용 우선 — 무료 풀을 먼저 시도, 프리미엄은 최후 수단
  if (tier === "standard") {
    return [...freePool, ...mid, ...premium];
  }
  // priority(Pro): 중간 등급 모델을 먼저 시도 — 무료 풀은 실패 시 안전망으로 이동
  if (tier === "priority") {
    return [...mid, ...premium, ...freePool];
  }
  // top(Professional): 프리미엄 모델을 첫 시도로 — 무료 풀은 프리미엄이 에러날 때만
  return [...premium, ...mid, ...freePool];
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

// ── 비전(이미지 입력) 무료 폴백 ──
// 멀티모달은 원래 Gemini 전용이라, Gemini 키가 크레딧 소진(429)되면 이미지 질문이 전부
// 실패했다. Gemini 다음 순번으로 이미지 입력을 받는 무료/저가 비전 모델을 둬서, Gemini가
// 죽어도 사진 질문이 폴백으로 처리되게 한다. 모델명은 공개 문서 기준 best-effort이며
// 사용 불가 시 폴백 루프가 조용히 다음 후보로 넘어간다.
export const VISION_FALLBACK: ModelDef[] = [
  orFree("meta-llama/llama-3.2-11b-vision-instruct:free"),
  orFree("qwen/qwen2.5-vl-72b-instruct:free"),
  { provider: "groq", model: "meta-llama/llama-4-scout-17b-16e-instruct", free: true },
];

const TEXT_CHAIN = buildTextChain();
// 이미지 입력은 Gemini Flash를 먼저 시도하고, 빈 응답·일시 오류일 때만 OpenRouter 및
// Groq 비전 모델로 넘어간다. OPENROUTER_VISION_MODELS는 런타임에서 이 두 후보를 교체한다.
const MULTI_CHAIN: ModelDef[] = [G_FLASH, ...VISION_FALLBACK];

export const FALLBACK_MODELS: ModelDef[] = TEXT_CHAIN;
export const MULTIMODAL_MODELS: ModelDef[] = MULTI_CHAIN;

export function modelsForTier(
  tier: ModelTier,
  opts?: { multimodal?: boolean },
): ModelDef[] {
  if (opts?.multimodal) {
    return MULTI_CHAIN;
  }
  if (tier === "top") return buildTextChain(8, "top");
  if (tier === "priority") return buildTextChain(6, "priority");
  return buildTextChain(6, "standard");
}

