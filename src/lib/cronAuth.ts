import { timingSafeEqual } from "node:crypto";

/**
 * Vercel Cron·운영 스크립트 전용 시크릿 검증.
 *
 * 예전엔 `x-vercel-cron: 1` 헤더만 있으면 통과시켰는데, 이 헤더는 Vercel 인프라가
 * 서명하는 값이 아니라 누구나 요청에 직접 넣을 수 있는 일반 헤더라 사실상 인증이
 * 아니었다. Vercel도 `CRON_SECRET` + `Authorization: Bearer` 검증을 공식으로
 * 권장한다(Vercel Cron은 CRON_SECRET이 설정돼 있으면 이 헤더를 자동으로 붙여 보낸다).
 * 문자열 비교도 타이밍 사이드채널을 막기 위해 상수시간으로 한다.
 */
export function verifyCronSecret(request: Request, secret: string | undefined): boolean {
  if (!secret) return false;

  const header =
    request.headers.get("authorization") ||
    request.headers.get("x-cron-secret") ||
    request.headers.get("x-rag-secret");
  const fromHeader = header?.startsWith("Bearer ") ? header.slice(7) : header;
  if (fromHeader && safeEqual(fromHeader, secret)) return true;

  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("secret");
  if (fromQuery && safeEqual(fromQuery, secret)) return true;

  return false;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
