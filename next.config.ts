import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained server bundle so Electron can run it in production.
  output: "standalone",
};

export default nextConfig;
