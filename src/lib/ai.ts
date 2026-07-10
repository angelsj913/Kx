import {
  geminiGenerateForTool,
  geminiChatReply,
  MissingApiKeyError,
  type ChatMessage,
} from "./gemini";
import { openrouterGenerateForTool, openrouterChatReply } from "./openrouter";
import { FALLBACK_MODELS, MULTIMODAL_MODELS, type ModelDef, type Provider } from "./models";
import type { ToolDef } from "./tools";

/** 이 오류를 만나면 다음 모델로 자동 전환해도 되는지 판단 */
export function isRetryableProviderError(err: unknown): boolean {
  if (err instanceof MissingApiKeyError) return true;
  const msg = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();
  return (
    msg.includes("api key not valid") ||
    msg.includes("api_key_invalid") ||
    msg.includes("invalid api key") ||
    msg.includes("unauthorized") ||
    msg.includes("401") ||
    msg.includes("403") ||
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("overloaded") ||
    msg.includes("503") ||
    msg.includes("502") ||
    msg.includes("500")
  );
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
  audio?: { data: string; mimeType: string }
): Promise<string> {
  return m.provider === "gemini"
    ? geminiGenerateForTool({ tool, text, audio, model: m.model })
    : openrouterGenerateForTool({ tool, text: text ?? "", model: m.model });
}

/** 여러 AI를 순서대로 시도해서, 실패하면 자동으로 다음 것으로 넘어간다. */
export async function generateWithFallback(args: {
  tool: ToolDef;
  text?: string;
  audio?: { data: string; mimeType: string };
  onAttempt?: (info: AttemptInfo) => void;
}): Promise<FallbackResult> {
  const { tool } = args;
  const candidates =
    tool.inputType === "url" || tool.inputType === "audio"
      ? MULTIMODAL_MODELS
      : FALLBACK_MODELS;

  let lastErr: unknown;
  let attemptNumber = 0;
  for (const m of candidates) {
    attemptNumber += 1;
    args.onAttempt?.({ provider: m.provider, model: m.model, attemptNumber });
    try {
      const text = await callModel(m, tool, args.text, args.audio);
      return { text, provider: m.provider, model: m.model, attempts: attemptNumber };
    } catch (err) {
      lastErr = err;
      if (!isRetryableProviderError(err)) throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("AI 요청에 실패했습니다.");
}

/** 채팅도 동일하게 순서대로 시도한다 (멀티모달 첨부가 있으면 Gemini 계열만). candidates를 넘기면 그 순서를 그대로 따른다. */
export async function chatReplyWithFallback(args: {
  systemInstruction: string;
  messages: ChatMessage[];
  candidates?: ModelDef[];
  onAttempt?: (info: AttemptInfo) => void;
}): Promise<FallbackResult> {
  const hasFiles = args.messages.some((m) => m.files && m.files.length > 0);
  const candidates = args.candidates ?? (hasFiles ? MULTIMODAL_MODELS : FALLBACK_MODELS);

  let lastErr: unknown;
  let attemptNumber = 0;
  for (const m of candidates) {
    attemptNumber += 1;
    args.onAttempt?.({ provider: m.provider, model: m.model, attemptNumber });
    try {
      const text =
        m.provider === "gemini"
          ? await geminiChatReply({
              model: m.model,
              systemInstruction: args.systemInstruction,
              messages: args.messages,
            })
          : await openrouterChatReply({
              model: m.model,
              systemInstruction: args.systemInstruction,
              messages: args.messages,
            });
      return { text, provider: m.provider, model: m.model, attempts: attemptNumber };
    } catch (err) {
      lastErr = err;
      if (!isRetryableProviderError(err)) throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("AI 요청에 실패했습니다.");
}
