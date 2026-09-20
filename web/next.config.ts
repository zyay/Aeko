import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: false },
  outputFileTracingRoot: process.cwd(),
  transpilePackages: ["border-beam", "thinking-orbs"],
};

export default nextConfig;
