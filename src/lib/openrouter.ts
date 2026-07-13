import { MissingApiKeyError, type ChatMessage } from "./gemini";
import type { ToolDef } from "./tools";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openrouter/free";

function requireKey(apiKey?: string): string {
  const key = apiKey || process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new MissingApiKeyError(
      "OpenRouter API 키가 없습니다. Vercel 환경 변수 OPENROUTER_API_KEY를 설정하세요. (openrouter.ai 에서 무료 발급)",
    );
  }
  return key;
}

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string | unknown[];
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: OpenRouterMessage[],
  jsonMode = false
): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXTAUTH_URL || "https://kx.vercel.app",
      "X-Title": "ZEFF",
    },
    body: JSON.stringify({
      model,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    let msg = `OpenRouter 오류 (${res.status})`;
    try {
      const err = await res.json();
      const detail =
        err?.error?.message ||
        err?.error?.metadata?.raw ||
        err?.message ||
        (typeof err?.error === "string" ? err.error : null);
      if (detail) msg = String(detail);
      // 메타데이터에 provider 오류 코드가 있으면 붙임
      const code = err?.error?.code || err?.error?.metadata?.provider_name;
      if (code && !msg.includes(String(code))) msg = `${msg} [${code}]`;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const data = await res.json();
  // error 필드가 200과 함께 오는 경우
  if (data?.error?.message) {
    throw new Error(String(data.error.message));
  }
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((p: { text?: string; content?: string }) => p?.text ?? p?.content ?? "")
      .join("");
  }
  return "";
}

export async function openrouterGenerateForTool(input: {
  tool: ToolDef;
  text: string;
  model?: string;
  apiKey?: string;
}): Promise<string> {
  const key = requireKey(input.apiKey);
  const jsonMode =
    input.tool.outputType === "pptx" ||
    input.tool.outputType === "xlsx" ||
    input.tool.outputType === "structured";

  return callOpenRouter(
    key,
    input.model || DEFAULT_MODEL,
    [
      { role: "system", content: input.tool.systemInstruction },
      { role: "user", content: input.text },
    ],
    jsonMode
  );
}

/** ChatMessage → OpenRouter(OpenAI 호환) content 파트 */
function toContent(m: ChatMessage): string | unknown[] {
  if (!m.files || m.files.length === 0) return m.text;
  const parts: unknown[] = [];
  for (const f of m.files) {
    const dataUrl = `data:${f.mimeType};base64,${f.data}`;
    if (f.mimeType.startsWith("image/")) {
      parts.push({ type: "image_url", image_url: { url: dataUrl } });
    } else {
      parts.push({
        type: "file",
        file: { filename: "attachment", file_data: dataUrl },
      });
    }
  }
  if (m.text) parts.push({ type: "text", text: m.text });
  return parts;
}

export async function openrouterChatReply(opts: {
  model?: string;
  apiKey?: string;
  systemInstruction: string;
  messages: ChatMessage[];
}): Promise<string> {
  const key = requireKey(opts.apiKey);
  const messages: OpenRouterMessage[] = [
    { role: "system", content: opts.systemInstruction },
    ...opts.messages.map((m) => ({
      role: (m.role === "model" ? "assistant" : "user") as "assistant" | "user",
      content: toContent(m),
    })),
  ];
  return callOpenRouter(key, opts.model || DEFAULT_MODEL, messages);
}
