import { MissingApiKeyError, type ChatMessage } from "./gemini";
import type { ToolDef } from "./tools";

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";

function requireKey(apiKey?: string): string {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) {
    throw new MissingApiKeyError(
      "Groq API 키가 없습니다. 앱 설정에서 키를 입력하세요. (console.groq.com에서 무료 발급)"
    );
  }
  return key;
}

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callGroq(
  apiKey: string,
  model: string,
  messages: GroqMessage[],
  jsonMode = false
): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    let msg = `Groq 오류 (${res.status})`;
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

export async function groqGenerateForTool(input: {
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

  return callGroq(
    key,
    input.model || DEFAULT_MODEL,
    [
      { role: "system", content: input.tool.systemInstruction },
      { role: "user", content: input.text },
    ],
    jsonMode
  );
}

/** Groq 텍스트 모델은 파일 첨부를 지원하지 않으므로 텍스트만 전달한다 (멀티모달은 Gemini 전용). */
export async function groqChatReply(opts: {
  model?: string;
  apiKey?: string;
  systemInstruction: string;
  messages: ChatMessage[];
}): Promise<string> {
  const key = requireKey(opts.apiKey);
  const messages: GroqMessage[] = [
    { role: "system", content: opts.systemInstruction },
    ...opts.messages.map((m) => ({
      role: (m.role === "model" ? "assistant" : "user") as "assistant" | "user",
      content: m.text,
    })),
  ];
  return callGroq(key, opts.model || DEFAULT_MODEL, messages);
}
