"use client";

import type { ReactNode } from "react";

export function WorkspaceShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="workspace">
      {sidebar}
      {children}
    </div>
  );
}

export function WorkspaceRoot({ children }: { children: ReactNode }) {
  return (
    <div className="aeko-root">
      {children}
    </div>
  );
}
