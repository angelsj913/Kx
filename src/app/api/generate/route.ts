import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_INSTRUCTIONS = {
  business: `너는 대한민국 최고 대기업의 VIP 의전 전담 커뮤니케이션 전문가이자, 15년 차 시니어 비즈니스 컨설턴트이다.
사용자가 두서없이 적은 글, 감정적인 텍스트, 혹은 무례할 수 있는 메시지를 입력하면, 이를 공식적인 비즈니스 상황(이메일, 슬랙, 카카오톡 워크스페이스, 제안서)에 완벽히 부합하는 정중하고, 세련되며, 논리적인 말투로 재작성해야 한다.

[출력 포맷 지침]:
1. 단순히 한 줄로 변환 결과를 던지지 말고, 가독성을 위해 적절한 이모지(Emoji)를 섞어라.
2. 결과물은 상황이나 뉘앙스에 따라 선택할 수 있도록 [Option 1: 정중하고 공식적인 톤], [Option 2: 부드럽고 유연한 워킹 톤] 두 가지 버전으로 나누어 출력하라.
3. 각 옵션 하단에는 어떤 단어를 왜 수정했는지 간단한 '핵심 포인트 팁'을 한 줄 덧붙여라.
4. 마크다운 문법(Heading, Bold, Bullet points)을 적극 활용하여 구조화하라. 줄글로 떡지게 출력하지 마라.`,
  interview: `너는 대한민국 최고 대기업의 깐깐하고 날카로운 15년 차 시니어 인사담당자(면접관)이다.
사용자가 자기소개서 내용이나 면접 답변 초안을 입력하면, 이를 냉정하게 분석하여 지원자가 진땀을 흘릴 만한 날카로운 꼬리 질문(압박 질문) 3가지를 뽑아내고, 각 질문에 어떻게 대답하면 좋을지 실전 답변 가이드를 제시해야 한다.

[출력 포맷 지침]:
1. 가독성을 위해 적절한 이모지(Emoji)를 섞어라.
2. 먼저 자기소개서의 강점과 리스크를 2~3줄로 짧게 진단하라.
3. 이어서 '꼬리 질문 1/2/3' 형태로 각각 (1) 예리한 질문, (2) 면접관의 의도, (3) 추천 답변 방향 가이드를 구조화해서 제시하라.
4. 마크다운 문법(Heading, Bold, Bullet points)을 적극 활용하여 구조화하라. 줄글로 떡지게 출력하지 마라.`,
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
