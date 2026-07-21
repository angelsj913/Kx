import { GoogleGenAI, Modality, createUserContent, type Content, type Part } from "@google/genai";
import type { ToolDef } from "./tools";

export class MissingApiKeyError extends Error {}
export class SafetyRefusalError extends Error {}

const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";
// "나노 바나나" — 카드 등록 없이 하루 500회 무료(2026-07 기준, 공개 자료 확인).
// Imagen 계열(ai.models.generateImages)은 무료 티어가 없어 쓰지 않는다.
const IMAGE_GEN_MODEL = "gemini-2.5-flash-image";

function throwIfSafetyBlocked(response: unknown): void {
  const value = response as {
    promptFeedback?: { blockReason?: string };
    candidates?: { finishReason?: string }[];
  };
  const reason = value?.promptFeedback?.blockReason || value?.candidates?.[0]?.finishReason;
  if (reason && /safety|blocked|prohibited/i.test(reason)) {
    throw new SafetyRefusalError(`Gemini safety refusal: ${reason}`);
  }
}

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
  throwIfSafetyBlocked(response);
  return response.text ?? "";
}

export interface GeneratedImage {
  data: string; // base64
  mimeType: string;
}

/** 텍스트 프롬프트로 이미지를 생성한다(gemini-2.5-flash-image). 1회 재시도 포함. */
export async function geminiGenerateImage(input: {
  prompt: string;
  systemInstruction?: string;
  apiKey?: string;
}): Promise<GeneratedImage> {
  const run = async (prompt: string): Promise<GeneratedImage> => {
    const ai = client(input.apiKey);
    const response = await ai.models.generateContent({
      model: IMAGE_GEN_MODEL,
      contents: prompt,
      config: {
        ...(input.systemInstruction ? { systemInstruction: input.systemInstruction } : {}),
        responseModalities: [Modality.IMAGE],
      },
    });
    throwIfSafetyBlocked(response);

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      throw new Error("이미지를 생성하지 못했어요. 다른 표현으로 다시 시도해 주세요.");
    }
    return {
      data: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || "image/png",
    };
  };

  try {
    return await run(input.prompt);
  } catch (err) {
    if (err instanceof SafetyRefusalError) throw err;
    await new Promise((r) => setTimeout(r, 800));
    const shorter =
      input.prompt.length > 80 ? input.prompt.slice(0, 80).trim() : input.prompt;
    return run(shorter);
  }
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
  throwIfSafetyBlocked(response);
  return response.text ?? "";
}

export async function geminiChatReplyStream(opts: {
  model?: string;
  apiKey?: string;
  systemInstruction: string;
  messages: ChatMessage[];
  onDelta: (delta: string) => void;
  signal?: AbortSignal;
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

  const stream = await ai.models.generateContentStream({
    model: opts.model || DEFAULT_GEMINI_MODEL,
    contents,
    config: {
      systemInstruction: opts.systemInstruction,
      ...(opts.signal ? { abortSignal: opts.signal } : {}),
    },
  });

  let full = "";
  for await (const chunk of stream) {
    const delta = chunk.text ?? "";
    if (delta) {
      full += delta;
      opts.onDelta(delta);
    }
  }
  return full;
}
