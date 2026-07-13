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
import {
  isProviderSkipped,
  markProviderHealthy,
  noteProviderFailure,
} from "./providerHealth";
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

export function isGeminiFreeTierBlocked(err: unknown): boolean {
  const msg = errorText(err).toLowerCase();
  return (
    msg.includes("free_tier") ||
    msg.includes("generate_content_free_tier") ||
    (msg.includes("resource_exhausted") && msg.includes("quota"))
  );
}

export function isOpenRouterCreditsError(err: unknown): boolean {
  const msg = errorText(err).toLowerCase();
  return (
    msg.includes("insufficient credits") ||
    msg.includes("never purchased credits") ||
    msg.includes("purchase more")
  );
}

/** 다음 모델로 넘길지 — 사실상 거의 항상 true (안정성 우선) */
export function isRetryableProviderError(err: unknown): boolean {
  if (err instanceof MissingApiKeyError) return true;
  const status = errorStatus(err);
  if ([401, 403, 404, 408, 429, 500, 502, 503, 520, 522, 524].includes(status)) {
    return true;
  }
  // 알 수 없는 오류도 폴백 (마지막 후보에서만 throw)
  return true;
}

export function filterCandidatesByAvailableKeys(candidates: ModelDef[]): ModelDef[] {
  const hasGemini = !!process.env.GEMINI_API_KEY?.trim();
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY?.trim();

  const filtered = candidates.filter((m) => {
    if (m.provider === "gemini") {
      if (!hasGemini) return false;
      if (isProviderSkipped("gemini")) return false;
      return true;
    }
    if (m.provider === "openrouter") {
      if (!hasOpenRouter) return false;
      if (isProviderSkipped("openrouter")) return false;
      return true;
    }
    return false;
  });

  if (filtered.length === 0) {
    if (!hasGemini && !hasOpenRouter) {
      throw new MissingApiKeyError(
        "AI API 키가 없습니다. Vercel에 GEMINI_API_KEY 또는 OPENROUTER_API_KEY를 설정하세요.",
      );
    }
    if (isProviderSkipped("gemini") && isProviderSkipped("openrouter")) {
      throw new Error(
        "일시적으로 모든 AI 제공자를 사용할 수 없습니다. 몇 분 후 다시 시도해 주세요.",
      );
    }
    if (isProviderSkipped("gemini") && !hasOpenRouter) {
      throw new Error(
        "Gemini 할당량이 소진되었습니다. OPENROUTER_API_KEY를 추가하거나 Google AI Studio 할당량을 확인해 주세요.",
      );
    }
    if (isProviderSkipped("openrouter") && !hasGemini) {
      throw new Error(
        "OpenRouter를 사용할 수 없습니다. 키/크레딧을 확인하거나 GEMINI_API_KEY를 설정해 주세요.",
      );
    }
    // 키가 있는데 health 로 전부 걸러진 경우 → health 무시하고 키 있는 것만 재시도
    return candidates.filter((m) => {
      if (m.provider === "gemini") return hasGemini;
      if (m.provider === "openrouter") return hasOpenRouter;
      return false;
    });
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

async function runWithFallback(
  candidates: ModelDef[],
  invoke: (m: ModelDef) => Promise<string>,
  onAttempt?: (info: AttemptInfo) => void,
): Promise<FallbackResult> {
  const list = filterCandidatesByAvailableKeys(candidates);
  let lastErr: unknown;
  let attemptNumber = 0;
  let skipPaidOpenRouter = false;

  for (const m of list) {
    if (skipPaidOpenRouter && m.provider === "openrouter" && !m.free) continue;
    if (isProviderSkipped(m.provider)) continue;

    attemptNumber += 1;
    onAttempt?.({ provider: m.provider, model: m.model, attemptNumber });

    try {
      const text = await invoke(m);
      if (!text || !String(text).trim()) {
        throw new Error("빈 응답 (empty model output)");
      }
      markProviderHealthy(m.provider);
      return { text, provider: m.provider, model: m.model, attempts: attemptNumber };
    } catch (err) {
      lastErr = err;
      const msg = errorText(err);
      console.warn(`[ai] fail ${m.provider}/${m.model}:`, msg.slice(0, 300));
      noteProviderFailure(m.provider, err);

      if (m.provider === "openrouter" && isOpenRouterCreditsError(err) && !m.free) {
        skipPaidOpenRouter = true;
      }
      // 계속 다음 모델
    }
  }

  if (attemptNumber === 0) {
    throw new MissingApiKeyError(
      "사용 가능한 AI 모델이 없습니다. GEMINI_API_KEY / OPENROUTER_API_KEY를 확인하세요.",
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
  const tier: ModelTier = args.modelTier ?? "standard";
  const multi =
    args.tool.inputType === "url" ||
    args.tool.inputType === "audio" ||
    args.tool.inputType === "image" ||
    args.tool.inputType === "mixed" ||
    !!args.audio ||
    !!(args.images && args.images.length);

  return runWithFallback(
    modelsForTier(tier, { multimodal: multi }),
    (m) =>
      m.provider === "gemini"
        ? geminiGenerateForTool({
            tool: args.tool,
            text: args.text,
            audio: args.audio,
            images: args.images,
            model: m.model,
          })
        : openrouterGenerateForTool({
            tool: args.tool,
            text: args.text ?? "",
            model: m.model,
          }),
    args.onAttempt,
  );
}

export async function chatReplyWithFallback(args: {
  systemInstruction: string;
  messages: ChatMessage[];
  candidates?: ModelDef[];
  modelTier?: ModelTier;
  onAttempt?: (info: AttemptInfo) => void;
}): Promise<FallbackResult> {
  const hasFiles = args.messages.some((m) => m.files && m.files.length > 0);
  const raw =
    args.candidates ??
    (hasFiles
      ? MULTIMODAL_MODELS
      : args.modelTier
        ? modelsForTier(args.modelTier)
        : FALLBACK_MODELS);

  return runWithFallback(
    raw,
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
