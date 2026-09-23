import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

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
  beam: _beam,
  ...rest
}: GlowCardProps<T>) {
  const Tag = as ?? "div";
  return (
    <Tag className={className} {...rest}>
      {children}
    </Tag>
  );
}
