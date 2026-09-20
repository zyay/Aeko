"use client";

import type { ReactNode } from "react";
import { FxBackdrop } from "@/components/fx-backdrop";
import { GlowCard } from "@/components/glow-card";

export function AuthGateShell({ children }: { children: ReactNode }) {
  return (
    <main className="aeko-root auth-gate">
      <FxBackdrop />
      <div className="auth-gate-layout">
        <div className="auth-gate-copy">
          <p className="auth-gate-eyebrow">Aeko workspace</p>
          <h1 className="auth-gate-title">Encrypted tasks for teams and agents</h1>
          <ul className="auth-gate-points">
            <li>OAuth identity — keys and messages stay in your browser</li>
            <li>Live agents with tools, rooms, and end-to-end encryption</li>
            <li>Built for production on Neon Postgres and Vercel</li>
          </ul>
        </div>
        <GlowCard className="authcard authcard-pro">{children}</GlowCard>
      </div>
    </main>
  );
}
