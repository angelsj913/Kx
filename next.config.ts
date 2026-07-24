import type { NextConfig } from "next";

// 보안 헤더(CSP 포함)는 middleware.ts 에서 nonce 기반으로 설정한다.
// 여기서 중복 CSP를 넣으면 nonce와 충돌한다.

const nextConfig: NextConfig = {
  // Produce a self-contained server bundle so Electron can run it in production.
  output: "standalone",
  // Disable static generation to avoid prerender errors
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Skip static optimization to avoid prerender errors
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
