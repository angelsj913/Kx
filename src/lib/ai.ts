import {
  geminiGenerateForTool,
  geminiChatReply,
  MissingApiKeyError,
  type ChatMessage,
} from "./gemini";
import {
  compatChatReply,
  compatGenerateForTool,
  hasProviderKey,
  listConfiguredProviders,
} from "./openaiCompat";
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
  type ProviderId,
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

export function isOpenRouterCreditsError(err: unknown): boolean {
  const msg = errorText(err).toLowerCase();
  return (
    msg.includes("insufficient credits") ||
    msg.includes("never purchased credits") ||
    msg.includes("purchase more")
  );
}

export function filterCandidatesByAvailableKeys(candidates: ModelDef[]): ModelDef[] {
  const filtered = candidates.filter((m) => {
    if (!hasProviderKey(m.provider)) return false;
    if (isProviderSkipped(m.provider as ProviderId)) return false;
    return true;
  });

  if (filtered.length === 0) {
    const configured = listConfiguredProviders().filter((p) => p.set);
    if (configured.length === 0) {
      throw new MissingApiKeyError(
        "AI API 키가 없습니다. Vercel에 GROQ / CEREBRAS / MISTRAL / OPENROUTER / DEEPSEEK / GEMINI 키 중 하나 이상을 설정하세요.",
      );
    }
    const relaxed = candidates.filter((m) => hasProviderKey(m.provider));
    if (relaxed.length === 0) {
      throw new MissingApiKeyError(
        "설정된 키로 쓸 수 있는 모델이 없습니다. GROQ·CEREBRAS·MISTRAL·OPENROUTER·DEEPSEEK·GEMINI 키를 확인하세요.",
      );
    }
    return relaxed;
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

async function invokeModel(
  m: ModelDef,
  opts: {
    mode: "tool" | "chat";
    tool?: ToolDef;
    text?: string;
    audio?: { data: string; mimeType: string };
    images?: { data: string; mimeType: string }[];
    systemInstruction?: string;
    messages?: ChatMessage[];
  },
): Promise<string> {
  if (m.provider === "gemini") {
    if (opts.mode === "tool" && opts.tool) {
      return geminiGenerateForTool({
        tool: opts.tool,
        text: opts.text,
        audio: opts.audio,
        images: opts.images,
        model: m.model,
      });
    }
    return geminiChatReply({
      model: m.model,
      systemInstruction: opts.systemInstruction ?? "",
      messages: opts.messages ?? [],
    });
  }

  // openrouter | groq | deepseek
  if (opts.mode === "tool" && opts.tool) {
    return compatGenerateForTool({
      provider: m.provider,
      tool: opts.tool,
      text: opts.text ?? "",
      model: m.model,
    });
  }
  return compatChatReply({
    provider: m.provider,
    systemInstruction: opts.systemInstruction ?? "",
    messages: opts.messages ?? [],
    model: m.model,
  });
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
    if (isProviderSkipped(m.provider as ProviderId)) continue;

    attemptNumber += 1;
    onAttempt?.({ provider: m.provider, model: m.model, attemptNumber });

    try {
      const text = await invoke(m);
      if (!text || !String(text).trim()) {
        throw new Error("빈 응답 (empty model output)");
      }
      markProviderHealthy(m.provider as ProviderId);
      return { text, provider: m.provider, model: m.model, attempts: attemptNumber };
    } catch (err) {
      lastErr = err;
      console.warn(`[ai] fail ${m.provider}/${m.model}:`, errorText(err).slice(0, 300));
      noteProviderFailure(m.provider as ProviderId, err);

      if (m.provider === "openrouter" && isOpenRouterCreditsError(err) && !m.free) {
        skipPaidOpenRouter = true;
      }
    }
  }

  if (attemptNumber === 0) {
    throw new MissingApiKeyError(
      "사용 가능한 AI 모델이 없습니다. GROQ / CEREBRAS / MISTRAL / OPENROUTER / DEEPSEEK / GEMINI 키를 확인하세요.",
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
  /** 이 제공자들은 후보에서 제외한다 — 독립적인 2차 의견(교차 검증)이 필요할 때, 1차와 같은
   * 제공자가 같은 계열 실수를 반복하지 않도록 다른 제공자를 강제한다. */
  excludeProviders?: Provider[];
  onAttempt?: (info: AttemptInfo) => void;
}): Promise<FallbackResult> {
  const tier: ModelTier = args.modelTier ?? "standard";
  const hasBinary = !!args.audio || !!(args.images && args.images.length > 0);
  const multi = hasBinary;

  if (multi && !hasProviderKey("gemini")) {
    throw new MissingApiKeyError(
      "이미지·오디오 분석에는 GEMINI_API_KEY가 필요합니다. URL·대본만으로 요청하려면 첨부를 빼고 다시 시도하세요.",
    );
  }

  const candidates = modelsForTier(tier, { multimodal: multi }).filter(
    (m) => !args.excludeProviders?.includes(m.provider),
  );

  return runWithFallback(
    candidates,
    (m) =>
      invokeModel(m, {
        mode: "tool",
        tool: args.tool,
        text: args.text,
        audio: args.audio,
        images: args.images,
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
    (m) =>
      invokeModel(m, {
        mode: "chat",
        systemInstruction: args.systemInstruction,
        messages: args.messages,
      }),
    args.onAttempt,
  );
}

export { listConfiguredProviders, hasProviderKey };
