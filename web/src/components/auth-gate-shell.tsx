"use client";

import type { ReactNode } from "react";
import { FloraFrame } from "@/components/flora-shell";

export function AuthGateShell({ children }: { children: ReactNode }) {
  return (
    <FloraFrame>
      <section className="flora-sheet flora-signin authcard">
        {children}
      </section>
    </FloraFrame>
  );
}
