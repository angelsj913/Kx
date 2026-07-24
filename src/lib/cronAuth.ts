import { timingSafeEqual } from "node:crypto";

/**
 * Vercel Cron·운영 스크립트 전용 시크릿 검증.
 *
 * Bearer / x-cron-secret / x-rag-secret 헤더만 허용한다.
 * 쿼리 `?secret=` 은 액세스·프록시 로그와 Referer로 유출되기 쉬워 프로덕션에서 거부한다.
 * (비프로덕션만 로컬 스크립트 편의를 위해 쿼리를 허용한다.)
 */
export function verifyCronSecret(request: Request, secret: string | undefined): boolean {
  if (!secret) return false;

  const header =
    request.headers.get("authorization") ||
    request.headers.get("x-cron-secret") ||
    request.headers.get("x-rag-secret");
  const fromHeader = header?.startsWith("Bearer ") ? header.slice(7) : header;
  if (fromHeader && safeEqual(fromHeader, secret)) return true;

  if (process.env.NODE_ENV !== "production") {
    const url = new URL(request.url);
    const fromQuery = url.searchParams.get("secret");
    if (fromQuery && safeEqual(fromQuery, secret)) return true;
  }

  return false;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
