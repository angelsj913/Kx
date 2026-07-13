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

/** Gemini free tier 가 프로젝트에서 0(비활성)인 경우 */
export function isGeminiFreeTierBlocked(err: unknown): boolean {
  const msg = errorText(err).toLowerCase();
  return (
    (msg.includes("free_tier") &&
      (msg.includes("limit: 0") || msg.includes('limit":0') || msg.includes("limit:0"))) ||
    msg.includes("generate_content_free_tier")
  );
}

export function isOpenRouterCreditsError(err: unknown): boolean {
  const msg = errorText(err).toLowerCase();
  return (
    msg.includes("insufficient credits") ||
    msg.includes("never purchased credits") ||
    msg.includes("purchase more") ||
    (msg.includes("credit") && (msg.includes("insufficient") || msg.includes("balance")))
  );
}

/**
 * 다음 모델로 넘어갈 수 있는 오류.
 * OpenRouter "Provider returned error" 도 반드시 포함 (free 모델 장애 시 흔함).
 */
export function isRetryableProviderError(err: unknown): boolean {
  if (err instanceof MissingApiKeyError) return true;
  const msg = errorText(err).toLowerCase();
  const status = errorStatus(err);
  if ([401, 403, 404, 408, 429, 500, 502, 503, 520, 522, 524].includes(status)) return true;
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
    msg.includes("no endpoints") ||
    msg.includes("provider returned error") ||
    msg.includes("provider error") ||
    msg.includes("temporarily unavailable") ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("econnreset") ||
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("insufficient credits") ||
    msg.includes("never purchased credits") ||
    msg.includes("credit") ||
    msg.includes("503") ||
    msg.includes("502") ||
    msg.includes("500") ||
    msg.includes("internal server") ||
    // 짧은 일반 오류 문구도 폴백 허용 (마지막 후보가 아니면)
    msg === "provider returned error" ||
    msg.startsWith("openrouter 오류")
  );
}

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
  // 일반 429 도 같은 분 안에 연쇄 실패 가능 → free_tier 아니어도 pro 연속 실패 방지
  if (failed.provider === "gemini") {
    const msg = errorText(err).toLowerCase();
    if (msg.includes("429") || msg.includes("resource_exhausted") || msg.includes("quota")) {
      // free_tier limit 0 은 위에서 전체 skip. 그 외 rate limit 은 같은 모델만 실패로 두고 다음 진행
      if (isGeminiFreeTierBlocked(err)) skip.gemini = true;
    }
  }
  if (failed.provider === "openrouter" && isOpenRouterCreditsError(err)) {
    if (failed.free) {
      // free 도 크레딧 오류면 정책상 전체 OR 차단일 수 있음 — 그래도 다른 free 한 번 더 시도
      // openrouter/free 라우터는 유지하고 paid 만 스킵
      skip.openrouterPaid = true;
      console.warn("[ai] OpenRouter credits issue on free model — skip paid only");
    } else {
      skip.openrouterPaid = true;
      console.warn("[ai] OpenRouter paid credits empty — trying free models only");
    }
  }
}

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
  let tried = 0;

  for (const m of candidates) {
    if (shouldSkipCandidate(m, skip)) continue;
    tried += 1;
    attemptNumber += 1;
    onAttempt?.({ provider: m.provider, model: m.model, attemptNumber });
    try {
      const text = await invoke(m);
      if (!text || !String(text).trim()) {
        throw new Error("빈 응답 (empty model output)");
      }
      return { text, provider: m.provider, model: m.model, attempts: attemptNumber };
    } catch (err) {
      lastErr = err;
      console.warn(
        `[ai] model fail ${m.provider}/${m.model}:`,
        err instanceof Error ? err.message : err,
      );
      updateSkipFlags(err, m, skip);
      // 항상 다음 후보 시도 (키 오류 제외 — MissingApiKey 는 이미 skip 으로 걸러짐)
      if (!isRetryableProviderError(err)) {
        // 알 수 없는 오류도 폴백 계속 (마지막이면 throw)
        console.warn("[ai] non-standard error, still trying next model");
      }
    }
  }

  if (tried === 0) {
    throw new MissingApiKeyError(
      "사용 가능한 AI 모델 후보가 없습니다. GEMINI_API_KEY 또는 OPENROUTER_API_KEY를 확인해 주세요.",
    );
  }
  throw lastErr instanceof Error ? lastErr : new Error("AI 요청에 실패했습니다.");
}

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
