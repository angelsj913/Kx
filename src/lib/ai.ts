import {
  geminiGenerateForTool,
  geminiChatReply,
  geminiChatReplyStream,
  MissingApiKeyError,
  type ChatMessage,
} from "./gemini";
import {
  compatChatReply,
  compatChatReplyStream,
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

export interface StreamFallbackResult extends FallbackResult {
  /** 첫 델타 이후 스트림이 끊겨 중단된 채로 마무리됐는지 — true면 다른 제공자로
   * 페일오버하지 않고 이미 보여준 텍스트 그대로 턴을 종료한 상태다. */
  interrupted: boolean;
}

function invokeModelStream(
  m: ModelDef,
  opts: { systemInstruction: string; messages: ChatMessage[] },
  onDelta: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  if (m.provider === "gemini") {
    return geminiChatReplyStream({
      model: m.model,
      systemInstruction: opts.systemInstruction,
      messages: opts.messages,
      onDelta,
      signal,
    });
  }
  return compatChatReplyStream({
    provider: m.provider,
    systemInstruction: opts.systemInstruction,
    messages: opts.messages,
    model: m.model,
    onDelta,
    signal,
  });
}

/**
 * 채팅 전용 스트리밍 페일오버. 핵심 규칙: **첫 델타가 도착하기 전까지는** 지금처럼
 * 다음 후보로 넘어가는 페일오버가 그대로 동작하고(대부분의 실패는 인증·레이트리밋처럼
 * 첫 토큰 이전에 발생), **첫 델타가 도착한 순간부터는 그 제공자에 확정**한다. 확정 후
 * 스트림이 끊기면(드문 경우) 다른 제공자로 몰래 갈아타지 않는다 — 사용자가 이미 본
 * 텍스트와 안 이어지는 답이 뒤에 붙는 걸 막기 위해, 그 지점에서 중단(interrupted)으로
 * 마무리한다.
 */
export async function chatReplyWithFallbackStream(args: {
  systemInstruction: string;
  messages: ChatMessage[];
  candidates?: ModelDef[];
  modelTier?: ModelTier;
  onAttempt?: (info: AttemptInfo) => void;
  onDelta: (delta: string) => void;
  signal?: AbortSignal;
}): Promise<StreamFallbackResult> {
  const hasFiles = args.messages.some((m) => m.files && m.files.length > 0);
  const raw =
    args.candidates ??
    (hasFiles
      ? MULTIMODAL_MODELS
      : args.modelTier
        ? modelsForTier(args.modelTier)
        : FALLBACK_MODELS);

  const list = filterCandidatesByAvailableKeys(raw);
  let lastErr: unknown;
  let attemptNumber = 0;
  let skipPaidOpenRouter = false;

  for (const m of list) {
    if (args.signal?.aborted) break;
    if (skipPaidOpenRouter && m.provider === "openrouter" && !m.free) continue;
    if (isProviderSkipped(m.provider as ProviderId)) continue;

    attemptNumber += 1;
    args.onAttempt?.({ provider: m.provider, model: m.model, attemptNumber });

    let committed = false;
    let accumulated = "";
    try {
      const text = await invokeModelStream(
        m,
        { systemInstruction: args.systemInstruction, messages: args.messages },
        (delta) => {
          committed = true;
          accumulated += delta;
          args.onDelta(delta);
        },
        args.signal,
      );
      const finalText = text || accumulated;
      if (!finalText || !finalText.trim()) {
        if (committed) {
          return {
            text: accumulated,
            provider: m.provider,
            model: m.model,
            attempts: attemptNumber,
            interrupted: true,
          };
        }
        throw new Error("빈 응답 (empty model output)");
      }
      markProviderHealthy(m.provider as ProviderId);
      return {
        text: finalText,
        provider: m.provider,
        model: m.model,
        attempts: attemptNumber,
        interrupted: false,
      };
    } catch (err) {
      if (committed) {
        console.warn(
          `[ai] stream interrupted mid-response ${m.provider}/${m.model}:`,
          errorText(err).slice(0, 300),
        );
        return {
          text: accumulated,
          provider: m.provider,
          model: m.model,
          attempts: attemptNumber,
          interrupted: true,
        };
      }
      lastErr = err;
      console.warn(`[ai] stream fail ${m.provider}/${m.model}:`, errorText(err).slice(0, 300));
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

export { listConfiguredProviders, hasProviderKey };
