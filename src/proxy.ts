import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { GEO_COOKIE } from "@/lib/constants";

/**
 * Next.js 16 proxy(구 middleware) — 한 곳에서 처리한다.
 *  0) 공사 중 게이트: 관리자 외 방문자를 /under-construction 으로 (MAINTENANCE_MODE=0 이면 해제)
 *  1) /app 보호: 미로그인 접근은 로그인으로 리다이렉트 (Auth.js는 /app 에서만 실행)
 *  2) 보안 응답 헤더(CSP/HSTS/X-Content-Type-Options 등) — 모든 HTML
 *  3) 접속 국가 기반 "기본" 언어 쿠키(사용자가 고른 언어가 항상 우선)
 *
 * CSP script-src 정책 — 왜 nonce/strict-dynamic을 쓰지 않는가:
 * 이전 버전은 `'nonce-<uuid>' 'strict-dynamic'`을 썼는데, 이 조합은 프로덕션에서
 * 사이트의 모든 JS를 차단했다. 이유는 두 가지가 겹친다.
 *  (a) Next.js는 nonce를 `x-nonce`가 아니라 *요청 헤더의* Content-Security-Policy를
 *      파싱해서 얻는다(app-render/get-script-nonce-from-header). 응답에만 CSP를 달면
 *      script 태그에 nonce가 붙지 않는다.
 *  (b) 랜딩(/)은 정적 프리렌더 페이지라 요청마다 다른 nonce를 주입하는 것 자체가 불가능하다
 *      (Next.js 공식 문서도 nonce는 동적 렌더링 전용이라고 명시).
 * `strict-dynamic`이 있으면 규격상 `'self'`가 무시되므로, nonce 없는 정적 청크는 전부 거부된다.
 * 따라서 정적 렌더링을 유지하는 한 `'unsafe-inline'`이 필요하다(Next.js가 하이드레이션
 * 데이터를 인라인 script로 주입하기 때문). 진짜 nonce CSP가 필요하면 랜딩을 동적 렌더링으로
 * 전환하는 별도 작업이 선행돼야 한다.
 */
function applySecurityHeaders(res: NextResponse, isDev: boolean) {
  const csp = [
    "default-src 'self'",
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data: blob:",
    "media-src 'self' https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https:",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
    "upgrade-insecure-requests",
  ]
    .join("; ")
    .replace(/\s{2,}/g, " ")
    .trim();

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set(
    "Permissions-Policy",
    "microphone=(self), camera=(), geolocation=(), payment=()",
  );
  if (!isDev) {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
}

function applyGeoLangCookie(req: NextRequest, res: NextResponse) {
  const country = (req.headers.get("x-vercel-ip-country") || "").toUpperCase();
  if (!country) return;
  const geoLang = country === "KR" ? "ko" : "en";
  if (req.cookies.get(GEO_COOKIE)?.value !== geoLang) {
    res.cookies.set(GEO_COOKIE, geoLang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: false,
    });
  }
}

/** 기본 ON. 공개 재오픈 시 Vercel env MAINTENANCE_MODE=0 */
function maintenanceEnabled(): boolean {
  return process.env.MAINTENANCE_MODE !== "0";
}

function isMaintenancePublicPath(pathname: string): boolean {
  return pathname === "/under-construction" || pathname === "/login";
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isDev = process.env.NODE_ENV === "development";

  let session: Session | null | undefined;

  // 0) 공사 중 앞문 — 관리자만 통과 (기존 페이지는 그대로, 리다이렉트만)
  if (maintenanceEnabled() && !isMaintenancePublicPath(pathname)) {
    session = await auth();
    if (session?.user?.isAdmin !== true) {
      const url = req.nextUrl.clone();
      url.pathname = "/under-construction";
      url.search = "";
      const redirectRes = NextResponse.redirect(url);
      applySecurityHeaders(redirectRes, isDev);
      applyGeoLangCookie(req, redirectRes);
      return redirectRes;
    }
  }

  // 1) Auth.js JWT decode only for /app — marketing pages skip session work at the edge.
  if (pathname.startsWith("/app")) {
    session = session ?? (await auth());
    if (!session?.user) {
      const loginUrl = new URL("/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      const redirectRes = NextResponse.redirect(loginUrl);
      applySecurityHeaders(redirectRes, isDev);
      applyGeoLangCookie(req, redirectRes);
      return redirectRes;
    }
  }

  const res = NextResponse.next();
  applySecurityHeaders(res, isDev);
  applyGeoLangCookie(req, res);
  return res;
}

export const config = {
  // 페이지 전반에서 동작하되 API·_next·정적 파일(점 포함 경로)은 제외.
  // CSP는 HTML 렌더링 응답에서 가장 중요하고, 국가 언어 쿠키도 페이지 진입에서만 필요.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
