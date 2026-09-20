"use client";

import { BorderBeam } from "border-beam";

export function BeamFrame({ children, theme = "dark" }: { children: React.ReactNode; theme?: "light" | "dark" }) {
  return (
    <BorderBeam size="md" colorVariant="colorful" strength={0.45} theme={theme}>
      {children}
    </BorderBeam>
  );
}
