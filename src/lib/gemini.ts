import { GoogleGenAI, createUserContent, type Content, type Part } from "@google/genai";
import type { ToolDef } from "./tools";

export class MissingApiKeyError extends Error {}

const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

function client(apiKey?: string): GoogleGenAI {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new MissingApiKeyError(
      "Gemini API 키가 없습니다. 앱 설정에서 키를 입력하거나 서버에 GEMINI_API_KEY를 설정하세요.",
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

/** 도구 입력(텍스트·URL·이미지·오디오)을 멀티모달 content로 조립 */
function buildContents(input: GenInput): string | Content {
  const { tool } = input;
  const text = (input.text ?? "").trim();
  const images = input.images ?? [];
  const audio = input.audio;

  // URL 전용: YouTube fileUri 는 할당·권한 이슈가 잦아 텍스트 메타 요약 경로 사용
  // (chat 라우트에서 oEmbed 메타를 text 에 이미 보강함)
  if (!audio && images.length === 0) {
    return text || "요청을 수행해 주세요.";
  }

  const parts: Part[] = [];

  for (const img of images) {
    parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
  }
  if (audio) {
    parts.push({ inlineData: { data: audio.data, mimeType: audio.mimeType } });
  }

  if (text) {
    parts.push({ text });
  } else {
    parts.push({
      text:
        tool.id === "video-summary"
          ? "첨부된 미디어(오디오·이미지·문서) 내용을 시스템 지침에 따라 영상/강의 요약 형식으로 정리해 주세요."
          : tool.id === "note-a4"
            ? "첨부된 자료(판서·교재 등)를 시스템 지침에 따라 A4 노트로 정리해 주세요."
            : tool.id === "math-solve"
              ? "첨부된 문제 이미지를 읽고 시스템 지침에 따라 풀이·검산해 주세요."
              : "첨부된 자료를 시스템 지침에 따라 분석해 주세요.",
    });
  }

  return createUserContent(parts);
}

export async function geminiGenerateForTool(input: GenInput): Promise<string> {
  const ai = client(input.apiKey);
  const { tool } = input;
  const contents = buildContents(input);

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
