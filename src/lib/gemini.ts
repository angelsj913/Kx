import { GoogleGenAI, createUserContent, type Content } from "@google/genai";
import type { ToolDef } from "./tools";

export class MissingApiKeyError extends Error {}

export interface GenInput {
  tool: ToolDef;
  /** 텍스트 도구의 입력, 또는 url 도구의 영상 주소 */
  text?: string;
  /** 오디오 도구의 입력 (base64) */
  audio?: { data: string; mimeType: string };
}

const MODEL = "gemini-2.5-flash";

export async function generateForTool(input: GenInput): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new MissingApiKeyError("서버에 GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const { tool } = input;

  let contents: string | Content;
  if (tool.inputType === "url") {
    // YouTube 등 영상 URL을 fileData로 직접 전달
    contents = createUserContent([
      { fileData: { fileUri: input.text ?? "" } },
      "위 영상의 내용을 지침에 따라 정리해줘.",
    ]);
  } else if (tool.inputType === "audio" && input.audio) {
    contents = createUserContent([
      { inlineData: { data: input.audio.data, mimeType: input.audio.mimeType } },
      "위 오디오의 내용을 지침에 따라 정리해줘.",
    ]);
  } else {
    contents = input.text ?? "";
  }

  const needsJson = tool.outputType === "pptx" || tool.outputType === "xlsx";

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction: tool.systemInstruction,
      ...(needsJson ? { responseMimeType: "application/json" } : {}),
    },
  });

  return response.text ?? "";
}
