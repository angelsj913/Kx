/**
 * ZEFF AI 모델 라우팅
 *
 * ── 라우팅 규칙 (2026-07) ──
 *
 * 1. 비전/이미지 인식 (free-capable)
 *    BEFORE: Gemini free → OR free block → Groq free (전부 무료, 유료 없음)
 *    AFTER:  Free → Paid → Free → Paid 교차 (interleaveFreePaid)
 *    경로: buildVisionCandidates() — ai.ts, backendRoute(hasFiles), toolGeneration
 *
 * 2. 이미지 생성
 *    BEFORE: Gemini try/catch → OpenRouter 루프 (비용 순서 미정)
 *    AFTER:  imageGenerationCandidates() — 비용 오름차순 단일 폴백 루프
 *    순서: Pollinations(무료,키불필요) → Gemini → OPENROUTER_IMAGE_MODEL → env fallbacks
 *
 * 3. 복잡/고급 작업 (변경 없음)
 *    - buildTextChain tier chains (standard/priority/top)
 *    - backendRoute verify stage, agentRoute AGENT_MODELS
 *    - PPT/math cross-validation orchestration
 */
import {
  getOpenRouterImageModels,
  getOpenRouterVisionModelsFree,
  getOpenRouterVisionModelsPaid,
  hasProviderKey,
} from "./openaiCompat";
import { isProviderSkipped } from "./providerHealth";
import { pipelineInfo } from "./pipelineLog";

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

export interface ImageGenCandidate {
  provider: "pollinations" | "gemini" | "openrouter";
  model: string;
  free?: boolean;
}

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

function orPaid(model: string): ModelDef {
  return { provider: "openrouter", model };
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
 * 무료·유료 모델 교차 배치 — Free → Paid → Free → Paid …
 * 한쪽 풀이 먼저 소진되면 나머지를 이어 붙인다.
 */
export function interleaveFreePaid(free: ModelDef[], paid: ModelDef[]): ModelDef[] {
  const out: ModelDef[] = [];
  const seen = new Set<string>();
  let fi = 0;
  let pi = 0;
  while (fi < free.length || pi < paid.length) {
    if (fi < free.length) {
      const m = free[fi++];
      const key = `${m.provider}:${m.model}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(m);
      }
    }
    if (pi < paid.length) {
      const m = paid[pi++];
      const key = `${m.provider}:${m.model}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(m);
      }
    }
  }
  return out;
}

/** API 키·쿨다운 상태로 실제 시도 가능한 모델만 남긴다. */
export function filterAvailableCandidates(candidates: ModelDef[]): ModelDef[] {
  return candidates.filter(
    (m) => hasProviderKey(m.provider) && !isProviderSkipped(m.provider),
  );
}

export function filterAvailableImageGenCandidates(
  candidates: ImageGenCandidate[],
): ImageGenCandidate[] {
  return candidates.filter((c) => {
    if (c.provider === "pollinations") return true; // API 키 불필요
    return hasProviderKey(c.provider) && !isProviderSkipped(c.provider);
  });
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

// ── 비전(이미지 입력) 풀 ──
const GROQ_VISION: ModelDef = {
  provider: "groq",
  model: "meta-llama/llama-4-scout-17b-16e-instruct",
  free: true,
};

/** 정적 무료 비전 폴백 (env 미설정 시 기본값). */
export const VISION_FALLBACK: ModelDef[] = [
  orFree("meta-llama/llama-3.2-11b-vision-instruct:free"),
  orFree("qwen/qwen2.5-vl-72b-instruct:free"),
  GROQ_VISION,
];

/** 정적 유료 비전 폴백 (env 미설정 시 기본값). */
export const VISION_PAID_FALLBACK: ModelDef[] = [
  orPaid("qwen/qwen2.5-vl-72b-instruct"),
  orPaid("meta-llama/llama-3.2-11b-vision-instruct"),
  G_PRO,
];

/**
 * 비전/이미지 인식 후보 — Free→Paid→Free→Paid 교차.
 * ai.ts, backendRoute(hasFiles), toolGeneration에서 공통 사용.
 */
export async function buildVisionCandidates(): Promise<ModelDef[]> {
  const freePool: ModelDef[] = [G_FLASH];
  const paidPool: ModelDef[] = [];

  if (hasProviderKey("openrouter")) {
    const [orFreeModels, orPaidModels] = await Promise.all([
      getOpenRouterVisionModelsFree(),
      getOpenRouterVisionModelsPaid(),
    ]);
    freePool.push(...orFreeModels.map((model) => orFree(model)));
    paidPool.push(...orPaidModels.map((model) => orPaid(model)));
  }

  if (hasProviderKey("groq")) {
    freePool.push(GROQ_VISION);
  }
  if (hasProviderKey("gemini") && !paidPool.some((m) => m.provider === "gemini")) {
    paidPool.push(G_PRO);
  }

  const ordered = interleaveFreePaid(freePool, paidPool);
  const available = filterAvailableCandidates(ordered);
  pipelineInfo(
    "vision/candidates",
    `${available.length}/${ordered.length} available`,
    available.map((m) => `${m.provider}/${m.model}`).join(" → "),
  );
  return available;
}

/** 이미지 생성 비용 순위 — 무료(Pollinations) → Gemini → OpenRouter paid. */
export const IMAGE_GEN_COST_ORDER: ImageGenCandidate[] = [
  {
    provider: "pollinations",
    model: process.env.POLLINATIONS_IMAGE_MODEL || "flux",
    free: true,
  },
  { provider: "gemini", model: "gemini-2.5-flash-image", free: true },
  {
    provider: "openrouter",
    model: process.env.OPENROUTER_IMAGE_MODEL || "bytedance-seed/seedream-4.5",
  },
];

/**
 * 이미지 생성 후보 — 비용 오름차순 단일 폴백 체인.
 * rank 0: Pollinations(완전 무료, 키 불필요)
 * rank 1: Gemini flash-image
 * rank 2+: OPENROUTER_IMAGE_MODEL → env fallbacks(최대 2)
 */
export async function imageGenerationCandidates(): Promise<ImageGenCandidate[]> {
  const primary = process.env.OPENROUTER_IMAGE_MODEL || "bytedance-seed/seedream-4.5";
  const pollinationsModel = process.env.POLLINATIONS_IMAGE_MODEL || "flux";
  const base: ImageGenCandidate[] = [
    { provider: "pollinations", model: pollinationsModel, free: true },
  ];

  if (hasProviderKey("gemini") && !isProviderSkipped("gemini")) {
    base.push({ provider: "gemini", model: "gemini-2.5-flash-image", free: true });
  }
  if (hasProviderKey("openrouter") && !isProviderSkipped("openrouter")) {
    base.push({ provider: "openrouter", model: primary });
    try {
      const fallbacks = await getOpenRouterImageModels();
      const seen = new Set(base.map((c) => c.model));
      for (const model of fallbacks) {
        if (seen.has(model)) continue;
        seen.add(model);
        base.push({ provider: "openrouter", model });
      }
    } catch (err) {
      pipelineInfo(
        "image-gen/candidates",
        "OpenRouter fallback discovery skipped",
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  const available = filterAvailableImageGenCandidates(base);
  pipelineInfo(
    "image-gen/candidates",
    `${available.length}/${base.length} available`,
    available.map((c) => `${c.provider}/${c.model}`).join(" → "),
  );
  return available;
}

const TEXT_CHAIN = buildTextChain();
// 정적 문서용 — 런타임은 buildVisionCandidates() 사용
const MULTI_CHAIN: ModelDef[] = interleaveFreePaid(
  [G_FLASH, ...VISION_FALLBACK],
  VISION_PAID_FALLBACK,
);

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
