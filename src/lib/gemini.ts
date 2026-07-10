import { GoogleGenAI, createUserContent, type Content } from "@google/genai";
import type { ToolDef } from "./tools";

export class MissingApiKeyError extends Error {}

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

function client(apiKey?: string): GoogleGenAI {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new MissingApiKeyError(
      "Gemini API 키가 없습니다. 앱 설정에서 키를 입력하거나 서버에 GEMINI_API_KEY를 설정하세요."
    );
  }
  return new GoogleGenAI({ apiKey: key });
}

export interface GenInput {
  tool: ToolDef;
  text?: string;
  audio?: { data: string; mimeType: string };
  images?: { data: string; mimeType: string }[];
  model?: string;
  apiKey?: string;
}

export async function geminiGenerateForTool(input: GenInput): Promise<string> {
  const ai = client(input.apiKey);
  const { tool } = input;

  let contents: string | Content;
  if (tool.inputType === "url") {
    contents = createUserContent([
      { fileData: { fileUri: input.text ?? "" } },
      "위 영상의 내용을 지침에 따라 정리해줘.",
    ]);
  } else if (tool.inputType === "audio" && input.audio) {
    contents = createUserContent([
      { inlineData: { data: input.audio.data, mimeType: input.audio.mimeType } },
      "위 오디오의 내용을 지침에 따라 정리해줘.",
    ]);
  } else if (tool.inputType === "image" && input.images && input.images.length > 0) {
    contents = createUserContent([
      ...input.images.map((img) => ({ inlineData: { data: img.data, mimeType: img.mimeType } })),
      input.text || "위 이미지의 내용을 지침에 따라 분석해줘.",
    ]);
  } else {
    contents = input.text ?? "";
  }

  const needsJson =
    tool.outputType === "pptx" ||
    tool.outputType === "xlsx" ||
    tool.outputType === "structured";

  const response = await ai.models.generateContent({
    model: input.model || DEFAULT_GEMINI_MODEL,
    contents,
    config: {
      systemInstruction: tool.systemInstruction,
      ...(needsJson ? { responseMimeType: "application/json" } : {}),
    },
  });

  return response.text ?? "";
}

// ── 채팅 ──

export interface ChatFile {
  data: string; // base64
  mimeType: string;
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  files?: ChatFile[];
}

export async function geminiChatReply(opts: {
  model?: string;
  apiKey?: string;
  systemInstruction: string;
  messages: ChatMessage[];
}): Promise<string> {
  const ai = client(opts.apiKey);

  const contents: Content[] = opts.messages.map((m) => ({
    role: m.role,
    parts: [
      ...(m.files ?? []).map((f) => ({
        inlineData: { data: f.data, mimeType: f.mimeType },
      })),
      ...(m.text ? [{ text: m.text }] : []),
    ],
  }));

  const response = await ai.models.generateContent({
    model: opts.model || DEFAULT_GEMINI_MODEL,
    contents,
    config: { systemInstruction: opts.systemInstruction },
  });

  return response.text ?? "";
}
