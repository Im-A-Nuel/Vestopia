import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lets a second dev server (chain-mode e2e) run next to the main one.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
