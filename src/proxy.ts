import { NextResponse } from "next/server";
import { auth } from "@/auth";

/** 접속 국가로 정한 "기본" 언어 쿠키 이름 — languageStore와 공유(문자열로 맞춤). */
const GEO_COOKIE = "zeff-geo-lang";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  // /app 보호 (기존 동작 유지)
  const isLoggedIn = !!req.auth;
  if (pathname.startsWith("/app") && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.next();

  // #15 접속 국가 기반 기본 언어 — 아직 쿠키가 없을 때(최초 방문)만 심는다.
  // 이건 "기본값"일 뿐이고, 사용자가 직접 고른 언어(localStorage)가 항상 우선한다
  // (languageStore.readFromStorage 참고). 한국이면 ko, 그 외 국가는 en.
  if (!req.cookies.get(GEO_COOKIE)) {
    const country = (req.headers.get("x-vercel-ip-country") || "").toUpperCase();
    // 국가를 못 받는 로컬/일부 환경에서는 세팅하지 않아 앱 기본(ko)이 유지된다.
    if (country) {
      res.cookies.set(GEO_COOKIE, country === "KR" ? "ko" : "en", {
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
  // 엔트리·랜딩·앱 전체에서 동작하되 API·_next·정적 파일(점 포함 경로)은 제외 —
  // 어디로 처음 들어오든 국가 기본 언어 쿠키를 심을 수 있게 한다.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
