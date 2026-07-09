import {
  geminiGenerateForTool,
  geminiChatReply,
  MissingApiKeyError,
  type ChatMessage,
} from "./gemini";
import { openrouterGenerateForTool, openrouterChatReply } from "./openrouter";
import { groqGenerateForTool, groqChatReply } from "./groq";
import { FALLBACK_MODELS, MULTIMODAL_MODELS, type ModelDef } from "./models";
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

async function callModel(
  m: ModelDef,
  tool: ToolDef,
  text?: string,
  audio?: { data: string; mimeType: string }
): Promise<string> {
  if (m.provider === "gemini") {
    return geminiGenerateForTool({ tool, text, audio, model: m.model });
  }
  if (m.provider === "groq") {
    return groqGenerateForTool({ tool, text: text ?? "", model: m.model });
  }
  return openrouterGenerateForTool({ tool, text: text ?? "", model: m.model });
}

/** 여러 AI를 순서대로 시도해서, 실패하면 자동으로 다음 것으로 넘어간다. */
export async function generateWithFallback(args: {
  tool: ToolDef;
  text?: string;
  audio?: { data: string; mimeType: string };
}): Promise<string> {
  const { tool } = args;
  const candidates =
    tool.inputType === "url" || tool.inputType === "audio"
      ? MULTIMODAL_MODELS
      : FALLBACK_MODELS;

  let lastErr: unknown;
  for (const m of candidates) {
    try {
      return await callModel(m, tool, args.text, args.audio);
    } catch (err) {
      lastErr = err;
      if (!isRetryableProviderError(err)) throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("AI 요청에 실패했습니다.");
}

/** 채팅도 동일하게 순서대로 시도한다 (멀티모달 첨부가 있으면 Gemini 계열만). */
export async function chatReplyWithFallback(args: {
  systemInstruction: string;
  messages: ChatMessage[];
}): Promise<string> {
  const hasFiles = args.messages.some((m) => m.files && m.files.length > 0);
  const candidates = hasFiles ? MULTIMODAL_MODELS : FALLBACK_MODELS;

  let lastErr: unknown;
  for (const m of candidates) {
    try {
      if (m.provider === "gemini") {
        return await geminiChatReply({
          model: m.model,
          systemInstruction: args.systemInstruction,
          messages: args.messages,
        });
      }
      if (m.provider === "groq") {
        return await groqChatReply({
          model: m.model,
          systemInstruction: args.systemInstruction,
          messages: args.messages,
        });
      }
      return await openrouterChatReply({
        model: m.model,
        systemInstruction: args.systemInstruction,
        messages: args.messages,
      });
    } catch (err) {
      lastErr = err;
      if (!isRetryableProviderError(err)) throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("AI 요청에 실패했습니다.");
}
