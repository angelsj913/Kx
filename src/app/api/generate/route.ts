import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_INSTRUCTIONS = {
  business:
    "너는 프로페셔널한 비즈니스 커뮤니케이션 전문가야. 사용자가 두서없거나 감정적인 글을 입력하면, 직장 생활이나 공식적인 상황에서 쓰기 좋은 정중하고 세련된 말투로 변환해 줘.",
  interview:
    "너는 대기업의 깐깐한 인사담당자야. 사용자가 자기소개서 내용을 입력하면, 이를 분석해서 날카로운 꼬리 질문(압박 질문) 3가지를 뽑아내고, 각각 어떻게 대답하면 좋을지 가이드를 제시해 줘.",
} as const;

type Mode = keyof typeof SYSTEM_INSTRUCTIONS;

function isMode(value: unknown): value is Mode {
  return value === "business" || value === "interview";
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "서버에 GEMINI_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  let prompt: string;
  let mode: Mode;
  try {
    const body = await request.json();
    prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    mode = isMode(body?.mode) ? body.mode : "business";
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다." },
      { status: 400 }
    );
  }

  if (!prompt) {
    return NextResponse.json(
      { error: "요청할 내용을 입력해 주세요." },
      { status: 400 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS[mode],
      },
    });

    const text = response.text ?? "";
    if (!text) {
      return NextResponse.json(
        { error: "AI가 빈 응답을 반환했습니다. 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Gemini API error:", err);
    return NextResponse.json(
      { error: "AI 요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
