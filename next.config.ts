import type { NextConfig } from "next";

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
};

export default nextConfig;
