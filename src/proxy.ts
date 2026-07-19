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

  // 접속 국가 기반 "기본" 언어 — 한국이면 ko, 그 외 국가는 en.
  // 이건 기본값일 뿐이고, 사용자가 직접 고른 언어(localStorage)가 항상 우선한다
  // (languageStore.readFromStorage 참고).
  //
  // 이전엔 "쿠키가 없을 때만" 심어서, 한 번 잘못 잡힌 값(예: 한국 사용자가 어떤
  // 이유로 en 쿠키를 받았을 때)이 1년(maxAge)간 고착돼 "한국인데 영어가 기본"으로
  // 남는 버그가 있었다. 이제 국가 헤더가 있으면 매 방문마다 재계산해 덮어써서
  // 스스로 교정되게 한다(명시적 선택은 localStorage라 영향 없음).
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
  // 국가 헤더를 못 받는 로컬/일부 환경에서는 세팅하지 않아 기존 값·앱 기본(ko)이 유지된다.

  return res;
});

export const config = {
  // 엔트리·랜딩·앱 전체에서 동작하되 API·_next·정적 파일(점 포함 경로)은 제외 —
  // 어디로 처음 들어오든 국가 기본 언어 쿠키를 심을 수 있게 한다.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
