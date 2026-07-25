import type { NextConfig } from "next";

// 보안 헤더(CSP 포함)는 middleware.ts 에서 nonce 기반으로 설정한다.
// 여기서 중복 CSP를 넣으면 nonce와 충돌한다.

const nextConfig: NextConfig = {
  // Produce a self-contained server bundle so Electron can run it in production.
  output: "standalone",
  images: {
    remotePatterns: [
      // Vercel Blob (사용자 업로드/생성 이미지) + Google 프로필 사진(로그인 아바타)
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
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
