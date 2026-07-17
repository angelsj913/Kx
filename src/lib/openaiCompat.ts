/**
 * OpenAI 호환 Chat Completions — 다중 제공자.
 */
import { MissingApiKeyError, type ChatMessage } from "./gemini";
import type { ToolDef } from "./tools";
import type { Provider } from "./models";

export interface CompatProviderConfig {
  provider: Provider;
  envKey: string;
  baseUrl: string;
  defaultModel: string;
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
      "OpenRouter API 키가 없습니다. OPENROUTER_API_KEY 설정 (openrouter.ai 무료)",
  },
  groq: {
    provider: "groq",
    envKey: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama-3.3-70b-versatile",
    missingKeyMessage: "Groq API 키가 없습니다. GROQ_API_KEY 설정 (console.groq.com 무료)",
  },
  deepseek: {
    provider: "deepseek",
    envKey: "DEEPSEEK_API_KEY",
    baseUrl: "https://api.deepseek.com/chat/completions",
    defaultModel: "deepseek-v4-flash",
    missingKeyMessage:
      "DeepSeek API 키가 없습니다. DEEPSEEK_API_KEY 설정 (platform.deepseek.com 초저가)",
  },
  cerebras: {
    provider: "cerebras",
    envKey: "CEREBRAS_API_KEY",
    baseUrl: "https://api.cerebras.ai/v1/chat/completions",
    defaultModel: "llama-3.3-70b",
    missingKeyMessage:
      "Cerebras API 키가 없습니다. CEREBRAS_API_KEY 설정 (cloud.cerebras.ai 무료 티어)",
  },
  mistral: {
    provider: "mistral",
    envKey: "MISTRAL_API_KEY",
    baseUrl: "https://api.mistral.ai/v1/chat/completions",
    defaultModel: "mistral-small-latest",
    missingKeyMessage:
      "Mistral API 키가 없습니다. MISTRAL_API_KEY 설정 (console.mistral.ai Experiment 무료)",
  },
  // GitHub Models — GitHub 계정만 있으면 무료(models:read 권한의 PAT 필요).
  // 다만 무료 티어 요청 한도가 다른 무료 제공자보다 훨씬 낮아(모델별 10~15
  // RPM·50~150 RPD, PAT 하나를 앱 전체가 공유) models.ts에서 최후 수단으로만 쓴다.
  github: {
    provider: "github",
    envKey: "GITHUB_MODELS_TOKEN",
    baseUrl: "https://models.github.ai/inference/chat/completions",
    defaultModel: "gpt-4o-mini",
    missingKeyMessage:
      "GitHub Models 토큰이 없습니다. models:read 권한의 GitHub PAT를 GITHUB_MODELS_TOKEN에 설정하세요 (github.com/settings/tokens 무료)",
  },
  // SambaNova Cloud — 영구 무료 티어(카드 등록 불필요). Cohere의 무료 Trial 키는
  // 상업적 이용을 명시적으로 금지해 후보에서 제외했다.
  sambanova: {
    provider: "sambanova",
    envKey: "SAMBANOVA_API_KEY",
    baseUrl: "https://api.sambanova.ai/v1/chat/completions",
    defaultModel: "Meta-Llama-3.3-70B-Instruct",
    missingKeyMessage:
      "SambaNova API 키가 없습니다. SAMBANOVA_API_KEY 설정 (cloud.sambanova.ai 무료 티어)",
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

/** SSE 스트리밍 버전 — 델타가 올 때마다 onDelta로 중계하고, 누적된 전체 텍스트를 반환한다. */
async function callCompatStream(
  cfg: CompatProviderConfig,
  model: string,
  messages: OAIMessage[],
  onDelta: (delta: string) => void,
  apiKey?: string,
  signal?: AbortSignal,
): Promise<string> {
  const key = requireKey(cfg, apiKey);
  const res = await fetch(cfg.baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(cfg.extraHeaders ?? {}),
    },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  });

  if (!res.ok || !res.body) {
    let msg = `${cfg.provider} 오류 (${res.status})`;
    try {
      const err = await res.json();
      const detail =
        err?.error?.message ||
        err?.message ||
        (typeof err?.error === "string" ? err.error : null);
      if (detail) msg = String(detail);
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;

      let json: unknown;
      try {
        json = JSON.parse(payload);
      } catch {
        continue;
      }
      const chunk = json as {
        error?: { message?: string };
        choices?: { delta?: { content?: string } }[];
      };
      if (chunk?.error?.message) throw new Error(String(chunk.error.message));
      const delta = chunk?.choices?.[0]?.delta?.content;
      if (typeof delta === "string" && delta) {
        full += delta;
        onDelta(delta);
      }
    }
  }
  return full;
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
    [
      { role: "system", content: opts.tool.systemInstruction },
      { role: "user", content: opts.text || "요청을 수행해 주세요." },
    ],
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
    [
      { role: "system", content: opts.systemInstruction },
      ...opts.messages.map((m) => ({
        role: (m.role === "model" ? "assistant" : "user") as "assistant" | "user",
        content: m.text || "(첨부 파일은 텍스트 경로에서 처리되지 않습니다)",
      })),
    ],
    false,
    opts.apiKey,
  );
}

export async function compatChatReplyStream(opts: {
  provider: Exclude<Provider, "gemini">;
  systemInstruction: string;
  messages: ChatMessage[];
  onDelta: (delta: string) => void;
  model?: string;
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<string> {
  const cfg = PROVIDER_CONFIG[opts.provider];
  return callCompatStream(
    cfg,
    opts.model || cfg.defaultModel,
    [
      { role: "system", content: opts.systemInstruction },
      ...opts.messages.map((m) => ({
        role: (m.role === "model" ? "assistant" : "user") as "assistant" | "user",
        content: m.text || "(첨부 파일은 텍스트 경로에서 처리되지 않습니다)",
      })),
    ],
    opts.onDelta,
    opts.apiKey,
    opts.signal,
  );
}

export function hasProviderKey(provider: Provider): boolean {
  if (provider === "gemini") return !!process.env.GEMINI_API_KEY?.trim();
  const cfg = PROVIDER_CONFIG[provider as Exclude<Provider, "gemini">];
  if (!cfg) return false;
  return !!process.env[cfg.envKey]?.trim();
}

export function listConfiguredProviders(): {
  provider: string;
  envKey: string;
  set: boolean;
}[] {
  return [
    { provider: "gemini", envKey: "GEMINI_API_KEY", set: !!process.env.GEMINI_API_KEY?.trim() },
    { provider: "groq", envKey: "GROQ_API_KEY", set: !!process.env.GROQ_API_KEY?.trim() },
    {
      provider: "cerebras",
      envKey: "CEREBRAS_API_KEY",
      set: !!process.env.CEREBRAS_API_KEY?.trim(),
    },
    { provider: "mistral", envKey: "MISTRAL_API_KEY", set: !!process.env.MISTRAL_API_KEY?.trim() },
    {
      provider: "openrouter",
      envKey: "OPENROUTER_API_KEY",
      set: !!process.env.OPENROUTER_API_KEY?.trim(),
    },
    {
      provider: "deepseek",
      envKey: "DEEPSEEK_API_KEY",
      set: !!process.env.DEEPSEEK_API_KEY?.trim(),
    },
    {
      provider: "github",
      envKey: "GITHUB_MODELS_TOKEN",
      set: !!process.env.GITHUB_MODELS_TOKEN?.trim(),
    },
    {
      provider: "sambanova",
      envKey: "SAMBANOVA_API_KEY",
      set: !!process.env.SAMBANOVA_API_KEY?.trim(),
    },
  ];
}
