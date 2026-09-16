"use client";

import { BorderBeam } from "border-beam";

export function BeamFrame({ children }: { children: React.ReactNode }) {
  return (
    <BorderBeam size="md" colorVariant="colorful" strength={0.7} theme="dark">
      {children}
    </BorderBeam>
  );
}
