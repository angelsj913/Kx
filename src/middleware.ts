import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * 사이트 앞문(공사 중 게이트).
 * - 기존 페이지·기능은 건드리지 않고, 미들웨어에서만 차단한다.
 * - 관리자(JWT isAdmin)는 통과.
 * - MAINTENANCE_MODE=0 이면 게이트 해제.
 */
function maintenanceEnabled(): boolean {
  return process.env.MAINTENANCE_MODE !== "0";
}

function isPublicPath(pathname: string): boolean {
  if (pathname === "/under-construction") return true;
  if (pathname === "/login") return true;
  // NextAuth + 로그인 보조 API
  if (pathname.startsWith("/api/auth")) return true;
  // 결제·크론은 외부에서 호출되므로 게이트 밖
  if (pathname.startsWith("/api/paymentwall")) return true;
  if (pathname.startsWith("/api/cron")) return true;
  // 정적·메타
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;
  if (pathname === "/manifest.webmanifest") return true;
  if (pathname.startsWith("/logo")) return true;
  if (pathname.startsWith("/landing/")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  if (!maintenanceEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const secret =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  const token = secret
    ? await getToken({ req, secret })
    : null;

  if (token?.isAdmin === true) {
    return NextResponse.next();
  }

  // API는 JSON 503, 페이지는 공사 중 문으로 리다이렉트
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "under_construction", message: "사이트 공사 중입니다." },
      { status: 503 },
    );
  }

  const url = req.nextUrl.clone();
  url.pathname = "/under-construction";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * 정적 파일·이미지 확장자는 제외하고 나머지 전 경로에 게이트 적용.
     */
    "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp4|webm|woff2?)$).*)",
  ],
};
