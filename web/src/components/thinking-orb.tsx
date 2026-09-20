"use client";

import dynamic from "next/dynamic";

const PackageThinkingOrb = dynamic(
  () => import("thinking-orbs").then((m) => m.ThinkingOrb),
  {
    ssr: false,
    loading: () => (
      <span className="thinking-orb" aria-label="Thinking">
        <span />
        <span />
        <span />
      </span>
    ),
  },
);

export function ThinkingOrb() {
  return <PackageThinkingOrb state="working" size={20} theme="dark" aria-label="Thinking" />;
}
