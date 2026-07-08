import type { ToolMode } from "./history";

export const MODE_META: Record<
  ToolMode,
  { label: string; short: string; description: string; placeholder: string }
> = {
  business: {
    label: "비즈니스 말투 변환",
    short: "비즈니스 말투",
    description:
      "두서없거나 감정적인 글을 이메일·슬랙에 어울리는 정중하고 세련된 비즈니스 말투로 변환합니다.",
    placeholder:
      "예) 이거 언제까지 해야 되는지 아무도 말 안 해줘서 진짜 답답한데 좀 알려주세요...",
  },
  interview: {
    label: "자소서 면접 질문 생성",
    short: "면접 질문",
    description:
      "자기소개서를 현미경 분석해 취약점을 겨냥한 압박 질문 3가지와 STAR 기반 합격 답변 가이드를 제시합니다.",
    placeholder:
      "예) 저는 대학 시절 학회 활동을 통해 리더십을 길렀고, 팀 프로젝트에서 갈등을 조율한 경험이 있습니다...",
  },
};
