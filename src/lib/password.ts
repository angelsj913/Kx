/**
 * 비밀번호 강도 규칙 — 서버(가입/재설정 라우트)와 클라이언트(입력 폼의 실시간 표시)
 * 양쪽에서 그대로 재사용한다(Node 전용 의존성 없음).
 *
 * 길이만 요구하는 규칙은 "aaaaaaaaaa" 같은 값도 통과시킨다. 완전한 무작위 요구는
 * 오히려 사람들이 예측 가능한 패턴(Password1!)으로 우회하게 만들 뿐이라, 길이를
 * 넉넉히 늘리고 문자 종류 4개 중 3개 이상을 요구하는 절충안(NIST SP 800-63B가
 * 권장하는 방향과도 맞음)으로 정했다. 여기에 흔한 비밀번호 차단·개인정보 포함
 * 차단을 더한다.
 */

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt는 72바이트를 넘으면 뒷부분을 조용히 자른다

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "qwertyuiop",
  "11111111",
  "00000000",
  "iloveyou1",
  "admin1234",
  "letmein123",
  "welcome123",
  "abc123456",
  "zeffai123",
  "zeffai1234",
  "asdfghjkl",
]);

export interface PasswordRuleStatus {
  key: "length" | "classes" | "notCommon" | "notPersonal";
  ok: boolean;
  label: string;
}

export interface PasswordContext {
  email?: string | null;
}

function countCharClasses(password: string): number {
  return [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
}

function containsPersonalInfo(password: string, context?: PasswordContext): boolean {
  const lower = password.toLowerCase();
  const emailLocal = context?.email?.split("@")[0]?.toLowerCase().trim();
  return !!emailLocal && emailLocal.length >= 3 && lower.includes(emailLocal);
}

/** 규칙별 통과 여부 — 입력 중 실시간 체크리스트 표시용. */
export function evaluatePassword(
  password: string,
  context?: PasswordContext,
): PasswordRuleStatus[] {
  return [
    {
      key: "length",
      ok: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
      label: `${PASSWORD_MIN_LENGTH}자 이상 ${PASSWORD_MAX_LENGTH}자 이하`,
    },
    {
      key: "classes",
      ok: countCharClasses(password) >= 3,
      label: "대문자·소문자·숫자·특수문자 중 3종류 이상 조합",
    },
    {
      key: "notCommon",
      ok: password.length === 0 || !COMMON_PASSWORDS.has(password.toLowerCase()),
      label: "너무 흔히 쓰이는 비밀번호가 아닐 것",
    },
    {
      key: "notPersonal",
      ok: !containsPersonalInfo(password, context),
      label: "이메일 아이디를 포함하지 않을 것",
    },
  ];
}

/** 서버 검증용 — 통과/실패와 사용자에게 보여줄 실패 사유 한 줄. */
export function checkPasswordStrength(
  password: string,
  context?: PasswordContext,
): { ok: boolean; reason?: string } {
  const failed = evaluatePassword(password, context).find((r) => !r.ok);
  if (failed) {
    return { ok: false, reason: `비밀번호 조건을 확인해 주세요 — ${failed.label}.` };
  }
  return { ok: true };
}
