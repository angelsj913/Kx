import type { NextConfig } from "next";

// 클릭재킹 방지(frame-ancestors/X-Frame-Options)와, 다른 곳에서 XSS가 하나라도
// 나왔을 때 피해 범위를 줄이기 위한 최소 CSP. Next.js 하이드레이션·Tailwind
// 인라인 스타일 때문에 script/style은 완전히 잠그지 못했지만(nonce 기반으로
// 더 조이려면 middleware가 필요 — 별도 작업), object-src·base-uri·frame-ancestors
// 같은 실제 공격에 쓰이는 지점은 막는다. 음성 입력 기능이 있어 microphone만 허용한다.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
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
].join("; ");

const nextConfig: NextConfig = {
  // Produce a self-contained server bundle so Electron can run it in production.
  output: "standalone",
  // Disable static generation to avoid prerender errors
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Skip static optimization to avoid prerender errors
  skipTrailingSlashRedirect: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "microphone=(self), camera=(), geolocation=(), payment=()",
          },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
