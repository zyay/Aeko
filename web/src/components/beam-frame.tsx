"use client";

import { BorderBeam } from "border-beam";

export function BeamFrame({ children, theme = "light" }: { children: React.ReactNode; theme?: "light" | "dark" }) {
  return (
    <BorderBeam size="md" colorVariant="colorful" strength={0.7} theme={theme}>
      {children}
    </BorderBeam>
  );
}
