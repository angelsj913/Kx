// 개발자(관리자) 판별 — 이메일 allowlist
// ADMIN_EMAILS 환경변수(쉼표 구분) + 아래 기본 관리자는 항상 포함

import type { Session } from "next-auth";

const DEFAULT_ADMINS = ["zeff@zeffai.com", "kxeung9@gmail.com"];

function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** 기본 관리자 + Vercel ADMIN_EMAILS (중복 제거) */
export const ADMIN_EMAILS = Array.from(
  new Set([...DEFAULT_ADMINS, ...parseList(process.env.ADMIN_EMAILS)]),
);

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/** 세션이 관리자인지 (플래그 또는 이메일 allowlist) */
export function isAdminSession(
  session: Session | null | undefined
): session is Session & { user: NonNullable<Session["user"]> } {
  if (!session?.user) return false;
  if (session.user.isAdmin === true) return true;
  return isAdminEmail(session.user.email);
}
