import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { GEO_COOKIE } from "@/lib/constants";

/**
 * Next.js 16 proxy(구 middleware) — 세 가지를 한 곳에서 처리한다.
 *  1) /app 보호: 미로그인 접근은 로그인으로 리다이렉트
 *  2) CSP nonce 주입 + 보안 응답 헤더(CSP/HSTS/X-Content-Type-Options 등)
 *  3) 접속 국가 기반 "기본" 언어 쿠키(사용자가 고른 언어가 항상 우선)
 *
 * CSP는 script-src에서 unsafe-inline/unsafe-eval을 빼고 nonce + strict-dynamic으로 잠근다
 * (개발 모드만 HMR용 unsafe-eval 허용).
 */
export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isDev = process.env.NODE_ENV === "development";

  // 1) /app 보호 (기존 동작 유지)
  const isLoggedIn = !!req.auth;
  if (pathname.startsWith("/app") && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2) CSP nonce — UUID면 충분(예측 불가·요청마다 유일). Buffer 미의존.
  const nonce = crypto.randomUUID();
  const csp = [
    "default-src 'self'",
    isDev
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
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

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const res = NextResponse.next({ request: { headers: requestHeaders } });

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

  // 3) 접속 국가 기반 기본 언어 — 한국이면 ko, 그 외 en. 사용자 선택(localStorage)이 항상 우선.
  // 국가 헤더가 있으면 매 방문마다 재계산해 덮어써 스스로 교정되게 한다.
  const country = (req.headers.get("x-vercel-ip-country") || "").toUpperCase();
  if (country) {
    const geoLang = country === "KR" ? "ko" : "en";
    if (req.cookies.get(GEO_COOKIE)?.value !== geoLang) {
      res.cookies.set(GEO_COOKIE, geoLang, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        httpOnly: false, // 클라이언트(document.cookie)에서 읽어야 함
      });
    }
  }

  return res;
});

export const config = {
  // 페이지 전반에서 동작하되 API·_next·정적 파일(점 포함 경로)은 제외.
  // CSP는 HTML 렌더링 응답에서 가장 중요하고, 국가 언어 쿠키도 페이지 진입에서만 필요.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
