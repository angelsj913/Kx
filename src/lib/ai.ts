import {
  geminiGenerateForTool,
  geminiChatReply,
  MissingApiKeyError,
  type ChatMessage,
} from "./gemini";
import { openrouterGenerateForTool, openrouterChatReply } from "./openrouter";
import {
  FALLBACK_MODELS,
  MULTIMODAL_MODELS,
  modelsForTier,
  type ModelDef,
  type ModelTier,
  type Provider,
} from "./models";
import type { ToolDef } from "./tools";

function errorText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err ?? "");
  }
}

function errorStatus(err: unknown): number {
  if (err && typeof err === "object" && "status" in err) {
    return Number((err as { status?: number }).status);
  }
  return NaN;
}

/** Gemini free tier 가 프로젝트에서 0(비활성)인 경우 — 같은 제공자 재시도 무의미 */
export function isGeminiFreeTierBlocked(err: unknown): boolean {
  const msg = errorText(err).toLowerCase();
  return (
    msg.includes("free_tier") &&
    (msg.includes("limit: 0") || msg.includes("limit\":0") || msg.includes("limit:0"))
  ) || (
    msg.includes("generate_content_free_tier") && msg.includes("limit")
  );
}

/** OpenRouter 크레딧 부족 — free 슬러그는 아직 시도 가치 있음 */
export function isOpenRouterCreditsError(err: unknown): boolean {
  const msg = errorText(err).toLowerCase();
  return (
    msg.includes("insufficient credits") ||
    msg.includes("never purchased credits") ||
    msg.includes("purchase more") ||
    (msg.includes("credit") && (msg.includes("insufficient") || msg.includes("balance")))
  );
}

/** 이 오류를 만나면 다음 모델로 자동 전환해도 되는지 판단 */
export function isRetryableProviderError(err: unknown): boolean {
  if (err instanceof MissingApiKeyError) return true;
  const msg = errorText(err).toLowerCase();
  const status = errorStatus(err);
  if ([401, 403, 404, 429, 500, 502, 503].includes(status)) return true;
  return (
    msg.includes("api key not valid") ||
    msg.includes("api_key_invalid") ||
    msg.includes("invalid api key") ||
    msg.includes("unauthorized") ||
    msg.includes("401") ||
    msg.includes("403") ||
    msg.includes("404") ||
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("resource_exhausted") ||
    msg.includes("overloaded") ||
    msg.includes("no longer available") ||
    msg.includes("not found") ||
    msg.includes("unavailable for free") ||
    msg.includes("model is unavailable") ||
    msg.includes("insufficient credits") ||
    msg.includes("never purchased credits") ||
    msg.includes("credit") ||
    msg.includes("503") ||
    msg.includes("502") ||
    msg.includes("500")
  );
}

/**
 * 같은 제공자/클래스의 나머지 후보를 건너뛸지.
 * - Gemini free_tier limit 0 → 모든 Gemini 스킵
 * - OpenRouter 크레딧 부족 on paid → free 만 남기고 paid 스킵
 * - OpenRouter 크레딧 부족 on free → 모든 OpenRouter 스킵
 */
export function shouldSkipCandidate(
  candidate: ModelDef,
  skip: { gemini: boolean; openrouterPaid: boolean; openrouterAll: boolean },
): boolean {
  if (candidate.provider === "gemini" && skip.gemini) return true;
  if (candidate.provider === "openrouter") {
    if (skip.openrouterAll) return true;
    if (skip.openrouterPaid && !candidate.free) return true;
  }
  return false;
}

export function updateSkipFlags(
  err: unknown,
  failed: ModelDef,
  skip: { gemini: boolean; openrouterPaid: boolean; openrouterAll: boolean },
): void {
  if (failed.provider === "gemini" && isGeminiFreeTierBlocked(err)) {
    skip.gemini = true;
    console.warn("[ai] Gemini free tier blocked — skipping remaining Gemini models");
  }
  if (failed.provider === "openrouter" && isOpenRouterCreditsError(err)) {
    if (failed.free) {
      skip.openrouterAll = true;
      console.warn("[ai] OpenRouter free also blocked by credits — skipping OpenRouter");
    } else {
      skip.openrouterPaid = true;
      console.warn("[ai] OpenRouter paid credits empty — trying free models only");
    }
  }
}

/** 설정된 제공자 키만 후보에 남긴다. 둘 다 없으면 MissingApiKeyError. */
export function filterCandidatesByAvailableKeys(candidates: ModelDef[]): ModelDef[] {
  const hasGemini = !!process.env.GEMINI_API_KEY?.trim();
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY?.trim();
  const filtered = candidates.filter((m) => {
    if (m.provider === "gemini") return hasGemini;
    if (m.provider === "openrouter") return hasOpenRouter;
    return false;
  });
  if (filtered.length === 0) {
    if (!hasGemini && !hasOpenRouter) {
      throw new MissingApiKeyError(
        "AI API 키가 없습니다. Vercel 환경 변수에 GEMINI_API_KEY 또는 OPENROUTER_API_KEY를 설정하세요.",
      );
    }
    throw new MissingApiKeyError(
      hasGemini
        ? "OpenRouter 전용 모델만 후보에 있으나 OPENROUTER_API_KEY가 없습니다."
        : "Gemini 전용 모델만 후보에 있으나 GEMINI_API_KEY가 없습니다.",
    );
  }
  return filtered;
}

export interface AttemptInfo {
  provider: Provider;
  model: string;
  attemptNumber: number;
}

export interface FallbackResult {
  text: string;
  provider: Provider;
  model: string;
  attempts: number;
}

async function callModel(
  m: ModelDef,
  tool: ToolDef,
  text?: string,
  audio?: { data: string; mimeType: string },
  images?: { data: string; mimeType: string }[]
): Promise<string> {
  return m.provider === "gemini"
    ? geminiGenerateForTool({ tool, text, audio, images, model: m.model })
    : openrouterGenerateForTool({ tool, text: text ?? "", model: m.model });
}

async function runWithFallback(
  candidates: ModelDef[],
  invoke: (m: ModelDef) => Promise<string>,
  onAttempt?: (info: AttemptInfo) => void,
): Promise<FallbackResult> {
  let lastErr: unknown;
  let attemptNumber = 0;
  const skip = { gemini: false, openrouterPaid: false, openrouterAll: false };

  for (const m of candidates) {
    if (shouldSkipCandidate(m, skip)) continue;
    attemptNumber += 1;
    onAttempt?.({ provider: m.provider, model: m.model, attemptNumber });
    try {
      const text = await invoke(m);
      return { text, provider: m.provider, model: m.model, attempts: attemptNumber };
    } catch (err) {
      lastErr = err;
      console.warn(
        `[ai] model fail ${m.provider}/${m.model}:`,
        err instanceof Error ? err.message : err,
      );
      updateSkipFlags(err, m, skip);
      if (!isRetryableProviderError(err)) throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("AI 요청에 실패했습니다.");
}

/** 여러 AI를 순서대로 시도해서, 실패하면 자동으로 다음 것으로 넘어간다. */
export async function generateWithFallback(args: {
  tool: ToolDef;
  text?: string;
  audio?: { data: string; mimeType: string };
  images?: { data: string; mimeType: string }[];
  modelTier?: ModelTier;
  onAttempt?: (info: AttemptInfo) => void;
}): Promise<FallbackResult> {
  const { tool } = args;
  const tier: ModelTier = args.modelTier ?? "standard";
  const multi =
    tool.inputType === "url" ||
    tool.inputType === "audio" ||
    tool.inputType === "image" ||
    tool.inputType === "mixed" ||
    !!args.audio ||
    !!(args.images && args.images.length);
  const candidates = filterCandidatesByAvailableKeys(
    modelsForTier(tier, { multimodal: multi }),
  );

  return runWithFallback(
    candidates,
    (m) => callModel(m, tool, args.text, args.audio, args.images),
    args.onAttempt,
  );
}

/** 채팅도 동일하게 순서대로 시도한다 (멀티모달 첨부가 있으면 Gemini 계열만). candidates를 넘기면 그 순서를 그대로 따른다. */
export async function chatReplyWithFallback(args: {
  systemInstruction: string;
  messages: ChatMessage[];
  candidates?: ModelDef[];
  onAttempt?: (info: AttemptInfo) => void;
}): Promise<FallbackResult> {
  const hasFiles = args.messages.some((m) => m.files && m.files.length > 0);
  const raw = args.candidates ?? (hasFiles ? MULTIMODAL_MODELS : FALLBACK_MODELS);
  const candidates = filterCandidatesByAvailableKeys(raw);

  return runWithFallback(
    candidates,
    async (m) =>
      m.provider === "gemini"
        ? geminiChatReply({
            model: m.model,
            systemInstruction: args.systemInstruction,
            messages: args.messages,
          })
        : openrouterChatReply({
            model: m.model,
            systemInstruction: args.systemInstruction,
            messages: args.messages,
          }),
    args.onAttempt,
  );
}
