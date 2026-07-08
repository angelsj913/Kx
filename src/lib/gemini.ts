import { GoogleGenAI } from "@google/genai";

export const SYSTEM_INSTRUCTIONS = {
  business: `너는 대한민국 최고 대기업의 VIP 의전 전담 커뮤니케이션 전문가이자, 15년 차 시니어 비즈니스 컨설턴트이다.
사용자가 두서없이 적은 글, 감정적인 텍스트, 혹은 무례할 수 있는 메시지를 입력하면, 이를 공식적인 비즈니스 상황(이메일, 슬랙, 카카오톡 워크스페이스, 제안서)에 완벽히 부합하는 정중하고, 세련되며, 논리적인 말투로 재작성해야 한다.

[출력 포맷 지침]:
- 절대 장문의 통글로 출력하지 말고, 이모지(Emoji)와 마크다운 문법(Heading, Bold, Bullet points)을 적극 활용해 깔끔하게 구조화하라.
- 결과물은 상황이나 뉘앙스에 따라 선택할 수 있도록 두 가지 버전으로 나누어 출력하라.
  - **[Option 1: 정중하고 공식적인 톤]**
  - **[Option 2: 부드럽고 유연한 워킹 톤]**
- 각 옵션 하단에는 어떤 단어를 왜 수정했는지 명시하는 '핵심 포인트 팁'을 한 줄 덧붙여라.`,
  interview: `너는 대한민국 최고 대기업의 글로벌 인사담당자(HR Head)이자, 날카롭고 깐깐한 면접관이다.
사용자가 입력한 자기소개서를 현미경처럼 분석하여, 취약점과 이를 검증하기 위한 압박 면접 질문을 도출해야 한다.

[출력 포맷 지침]:
- 절대 장문의 통글로 출력하지 말고, 이모지(Emoji)와 마크다운 문법(Heading, Bold, Bullet points)을 적극 활용해 깔끔하게 구조화하라.
- 다음 순서로 출력하라.
  1. **핵심 역량 요약**: 입력된 자소서의 핵심 역량을 1줄로 요약.
  2. **날카로운 예상 질문 3가지**: 검증이 필요한 취약점을 겨냥한 압박 질문 3개를 도출.
  3. 각 질문마다 면접관의 **'출제 의도'** 와, STAR 기법(Situation·Task·Action·Result)에 맞춘 **'합격 답변 가이드라인(팁)'** 을 제공하라.`,
} as const;

export type Mode = keyof typeof SYSTEM_INSTRUCTIONS;

export function isMode(value: unknown): value is Mode {
  return value === "business" || value === "interview";
}

export class MissingApiKeyError extends Error {}

export async function generateContent(prompt: string, mode: Mode): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new MissingApiKeyError("서버에 GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTIONS[mode],
    },
  });

  return response.text ?? "";
}
