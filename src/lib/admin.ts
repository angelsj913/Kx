// 개발자(관리자) 판별 — 이메일 allowlist (ADMIN_EMAILS 환경변수, 쉼표 구분)

import type { Session } from "next-auth";

function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Vercel/로컬 ADMIN_EMAILS 만 사용. 소스에 이메일을 하드코딩하지 않는다. */
export const ADMIN_EMAILS = Array.from(new Set(parseList(process.env.ADMIN_EMAILS)));

if (process.env.NODE_ENV === "production" && ADMIN_EMAILS.length === 0) {
  console.error(
    "[admin] ADMIN_EMAILS is empty in production — no users will have admin access. Set ADMIN_EMAILS on the host before deploy.",
  );
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email || ADMIN_EMAILS.length === 0) return false;
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
