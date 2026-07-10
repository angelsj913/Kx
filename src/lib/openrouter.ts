import { MissingApiKeyError, type ChatMessage } from "./gemini";
import type { ToolDef } from "./tools";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

function requireKey(apiKey?: string): string {
  const key = apiKey || process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new MissingApiKeyError(
      "OpenRouter API 키가 없습니다. 앱 설정에서 키를 입력하세요. (openrouter.ai에서 무료 발급)"
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
      "X-Title": "zeff",
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
      if (err?.error?.message) msg = err.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
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
      // PDF 등 문서
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
