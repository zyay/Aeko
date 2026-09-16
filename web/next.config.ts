import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  outputFileTracingRoot: process.cwd(),
  transpilePackages: [
    "border-beam",
    "thinking-orbs",
    "liquid-gooey",
    "img-fx",
    "voice-beam",
    "@bible-strong/avatar-react",
    "@bible-strong/avatar-core",
  ],
};

export default nextConfig;
