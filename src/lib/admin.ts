// 개발자(관리자) 판별. 별도 role 필드 없이 환경변수 allowlist로 관리한다.
// ADMIN_EMAILS: 쉼표로 구분된 이메일 목록. 미설정 시 아래 기본 계정 사용.
const DEFAULT_ADMIN = "zeff@zeffai.com,kxeung9@gmail.com";

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? DEFAULT_ADMIN)
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
