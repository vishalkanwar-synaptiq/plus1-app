import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Pin the workspace root to this repo so a stray lockfile higher up isn't picked up.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
