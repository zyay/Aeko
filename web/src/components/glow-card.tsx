"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { BeamFrame } from "@/components/beam-frame";

type GlowCardProps<T extends ElementType = "div"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  beam?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function GlowCard<T extends ElementType = "div">({
  as,
  children,
  className = "",
  beam = true,
  ...rest
}: GlowCardProps<T>) {
  const Tag = as ?? "div";
  const body = (
    <Tag className={`glow-card ${className}`.trim()} {...rest}>
      <span className="glow-card-shine" aria-hidden />
      {children}
    </Tag>
  );
  if (!beam) return body;
  return <BeamFrame theme="dark">{body}</BeamFrame>;
}
