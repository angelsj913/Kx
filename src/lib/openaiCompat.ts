/**
 * OpenAI 호환 Chat Completions 클라이언트.
 * DeepSeek / Groq / OpenRouter 등 baseUrl 만 다른 제공자에 재사용.
 */
import { MissingApiKeyError, type ChatMessage } from "./gemini";
import type { ToolDef } from "./tools";
import type { Provider } from "./models";

export interface CompatProviderConfig {
  provider: Provider;
  envKey: string;
  baseUrl: string;
  defaultModel: string;
  /** OpenRouter 전용 헤더 등 */
  extraHeaders?: Record<string, string>;
  missingKeyMessage: string;
}

export const PROVIDER_CONFIG: Record<
  Exclude<Provider, "gemini">,
  CompatProviderConfig
> = {
  openrouter: {
    provider: "openrouter",
    envKey: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: "openrouter/free",
    extraHeaders: {
      "HTTP-Referer": process.env.NEXTAUTH_URL || "https://kx.vercel.app",
      "X-Title": "ZEFF",
    },
    missingKeyMessage:
      "OpenRouter API 키가 없습니다. Vercel에 OPENROUTER_API_KEY를 설정하세요. (openrouter.ai 무료 발급)",
  },
  groq: {
    provider: "groq",
    envKey: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama-3.3-70b-versatile",
    missingKeyMessage:
      "Groq API 키가 없습니다. Vercel에 GROQ_API_KEY를 설정하세요. (console.groq.com 무료 발급)",
  },
  deepseek: {
    provider: "deepseek",
    envKey: "DEEPSEEK_API_KEY",
    baseUrl: "https://api.deepseek.com/chat/completions",
    defaultModel: "deepseek-v4-flash",
    missingKeyMessage:
      "DeepSeek API 키가 없습니다. Vercel에 DEEPSEEK_API_KEY를 설정하세요. (platform.deepseek.com · 매우 저렴)",
  },
};

function requireKey(cfg: CompatProviderConfig, apiKey?: string): string {
  const key = apiKey || process.env[cfg.envKey]?.trim();
  if (!key) throw new MissingApiKeyError(cfg.missingKeyMessage);
  return key;
}

interface OAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callCompat(
  cfg: CompatProviderConfig,
  model: string,
  messages: OAIMessage[],
  jsonMode = false,
  apiKey?: string,
): Promise<string> {
  const key = requireKey(cfg, apiKey);
  const res = await fetch(cfg.baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(cfg.extraHeaders ?? {}),
    },
    body: JSON.stringify({
      model,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    let msg = `${cfg.provider} 오류 (${res.status})`;
    try {
      const err = await res.json();
      const detail =
        err?.error?.message ||
        err?.error?.metadata?.raw ||
        err?.message ||
        (typeof err?.error === "string" ? err.error : null);
      if (detail) msg = String(detail);
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const data = await res.json();
  if (data?.error?.message) throw new Error(String(data.error.message));
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((p: { text?: string; content?: string }) => p?.text ?? p?.content ?? "")
      .join("");
  }
  return "";
}

function toolMessages(tool: ToolDef, text: string): OAIMessage[] {
  return [
    { role: "system", content: tool.systemInstruction },
    { role: "user", content: text || "요청을 수행해 주세요." },
  ];
}

function chatMessages(
  systemInstruction: string,
  messages: ChatMessage[],
): OAIMessage[] {
  return [
    { role: "system", content: systemInstruction },
    ...messages.map((m) => ({
      role: (m.role === "model" ? "assistant" : "user") as "assistant" | "user",
      // 멀티모달은 Gemini 전용 — 호환 API에는 텍스트만
      content: m.text || "(첨부 파일은 텍스트 경로에서 처리되지 않습니다)",
    })),
  ];
}

export async function compatGenerateForTool(opts: {
  provider: Exclude<Provider, "gemini">;
  tool: ToolDef;
  text: string;
  model?: string;
  apiKey?: string;
}): Promise<string> {
  const cfg = PROVIDER_CONFIG[opts.provider];
  const jsonMode =
    opts.tool.outputType === "pptx" ||
    opts.tool.outputType === "xlsx" ||
    opts.tool.outputType === "structured";
  return callCompat(
    cfg,
    opts.model || cfg.defaultModel,
    toolMessages(opts.tool, opts.text),
    jsonMode,
    opts.apiKey,
  );
}

export async function compatChatReply(opts: {
  provider: Exclude<Provider, "gemini">;
  systemInstruction: string;
  messages: ChatMessage[];
  model?: string;
  apiKey?: string;
}): Promise<string> {
  const cfg = PROVIDER_CONFIG[opts.provider];
  return callCompat(
    cfg,
    opts.model || cfg.defaultModel,
    chatMessages(opts.systemInstruction, opts.messages),
    false,
    opts.apiKey,
  );
}

export function hasProviderKey(provider: Provider): boolean {
  if (provider === "gemini") return !!process.env.GEMINI_API_KEY?.trim();
  const cfg = PROVIDER_CONFIG[provider as Exclude<Provider, "gemini">];
  if (!cfg) return false;
  return !!process.env[cfg.envKey]?.trim();
}

/** 디버그·온보딩용: 어떤 키가 설정돼 있는지 */
export function listConfiguredProviders(): { provider: string; envKey: string; set: boolean }[] {
  return [
    { provider: "gemini", envKey: "GEMINI_API_KEY", set: !!process.env.GEMINI_API_KEY?.trim() },
    { provider: "openrouter", envKey: "OPENROUTER_API_KEY", set: !!process.env.OPENROUTER_API_KEY?.trim() },
    { provider: "groq", envKey: "GROQ_API_KEY", set: !!process.env.GROQ_API_KEY?.trim() },
    { provider: "deepseek", envKey: "DEEPSEEK_API_KEY", set: !!process.env.DEEPSEEK_API_KEY?.trim() },
  ];
}
