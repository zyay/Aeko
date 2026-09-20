"use client";

import dynamic from "next/dynamic";
import type { OrbState } from "@/components/ui/orbkit-core";

const Shdr21 = dynamic(() => import("@/components/ui/shdr-21").then((m) => m.Shdr21), {
  ssr: false,
  loading: () => <span className="agent-orb-fallback" aria-hidden />,
});

export function AgentOrb({ state = "idle", size = 44 }: { state?: OrbState; size?: number }) {
  return (
    <div className="agent-orb-wrap" style={{ width: size, height: size }}>
      <Shdr21 size={size} state={state} pauseOffscreen wrapper="glass" ariaLabel="Agent status" />
    </div>
  );
}
