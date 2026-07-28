/** 입력 모더레이션 카테고리 — `allowed`는 통과 */
export type ModerationCategory =
  | "allowed"
  | "sexual_explicit"
  | "csam"
  | "credential_exfil"
  | "source_dump"
  | "cross_user_pii"
  | "violence_howto"
  | "jailbreak";

export interface ModerationPolicyMeta {
  messageKey: string;
  log: boolean;
}

export const MODERATION_POLICY: Record<
  Exclude<ModerationCategory, "allowed">,
  ModerationPolicyMeta
> = {
  sexual_explicit: { messageKey: "moderation.sexual", log: true },
  csam: { messageKey: "moderation.csam", log: true },
  credential_exfil: { messageKey: "moderation.credentials", log: true },
  source_dump: { messageKey: "moderation.sourceDump", log: true },
  cross_user_pii: { messageKey: "moderation.pii", log: true },
  violence_howto: { messageKey: "moderation.violence", log: true },
  jailbreak: { messageKey: "moderation.jailbreak", log: true },
};

/** 서버·클라이언트 공용 정책 문구 (i18n.ts와 동일 문장 유지) */
export const MODERATION_MESSAGES: Record<
  Exclude<ModerationCategory, "allowed">,
  Record<"ko" | "en", string>
> = {
  sexual_explicit: {
    ko: "성적으로 노골적인 요청은 처리할 수 없어요. 다른 주제로 물어봐 주세요.",
    en: "We can't process explicit sexual requests. Please ask about something else.",
  },
  csam: {
    ko: "해당 요청은 처리할 수 없어요.",
    en: "This request cannot be processed.",
  },
  credential_exfil: {
    ko: "서버 비밀·환경 변수·API 키 같은 민감 정보는 제공하거나 탐색할 수 없어요.",
    en: "We can't expose or retrieve server secrets, environment variables, or API keys.",
  },
  source_dump: {
    ko: "전체 소스 코드나 내부 API 목록을 한꺼번에 덤프하는 요청은 도와드리기 어려워요. 필요한 기능이나 파일 범위를 구체적으로 알려주세요.",
    en: "We can't dump the entire codebase or internal API list at once. Tell us the specific feature or file scope you need.",
  },
  cross_user_pii: {
    ko: "다른 사용자의 개인정보는 제공할 수 없어요.",
    en: "We can't provide other users' personal information.",
  },
  violence_howto: {
    ko: "위험한 행위를 실행하는 방법은 안내할 수 없어요. 법률·규정·안전 정보가 필요하면 그렇게 물어봐 주세요.",
    en: "We can't provide instructions for dangerous acts. Ask about laws, regulations, or safety information instead.",
  },
  jailbreak: {
    ko: "시스템 지침을 우회하려는 요청은 처리할 수 없어요. 일반적인 질문으로 다시 시도해 주세요.",
    en: "We can't process requests that try to bypass system instructions. Please try a normal question.",
  },
};

export function resolveModerationLocale(lang?: string | null): "ko" | "en" {
  if (!lang) return "ko";
  const base = lang.toLowerCase().split("-")[0];
  return base === "en" ? "en" : "ko";
}

export function getModerationMessage(
  category: Exclude<ModerationCategory, "allowed">,
  lang?: string | null,
): string {
  const locale = resolveModerationLocale(lang);
  return MODERATION_MESSAGES[category][locale];
}
