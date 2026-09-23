"use client";

import type { ReactNode } from "react";
import { GlowCard } from "@/components/glow-card";
import { Icon, Icons } from "@/components/icons";

export function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`status-pill${ok ? " ok" : ""}`}>
      <Icon icon={Icons.check} size={12} aria-hidden />
      {label}
    </span>
  );
}

export function UiBanner({
  tone = "info",
  children,
  action,
}: {
  tone?: "info" | "warn";
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`ui-banner ${tone}`}>
      <div className="ui-banner-body">{children}</div>
      {action ? <div className="ui-banner-action">{action}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <GlowCard as="section" className="ui-panel" beam={false}>
      <header className="ui-panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className="ui-panel-body">{children}</div>
    </GlowCard>
  );
}

function EmptyArt() {
  return (
    <svg className="empty-art" viewBox="0 0 180 140" aria-hidden>
      <g transform="translate(18 18)">
        <rect x="18" y="8" width="92" height="64" rx="14" fill="#FFE7A3" transform="rotate(-7 64 40)" />
        <rect x="28" y="16" width="92" height="64" rx="14" fill="#FFC2D8" transform="rotate(5 74 48)" />
        <rect x="22" y="28" width="96" height="62" rx="14" fill="#C8F5DE" />
        <path d="M8 62c0-8 6-14 14-14h36l8-10h48c8 0 14 6 14 14v40c0 8-6 14-14 14H22c-8 0-14-6-14-14V62z" fill="#4C8DFF" />
        <path d="M22 48h34c2 0 4-1 5-3l6-8" fill="none" stroke="#8CB6FF" strokeWidth="5" strokeLinecap="round" />
        <circle cx="118" cy="36" r="13" fill="#1C1C1E" />
        <path d="M118 30v12M112 36h12" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function EmptyState({
  title,
  body,
  action,
  compact,
  plain,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  compact?: boolean;
  plain?: boolean;
}) {
  return (
    <div className={compact ? "empty-state compact" : "empty-state"}>
      {!plain && !compact && <EmptyArt />}
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function IconBtn({
  label,
  children,
  onClick,
  danger,
  className,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  className?: string;
}) {
  return (
    <button type="button" className={`icon-btn${danger ? " danger" : ""}${className ? ` ${className}` : ""}`} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

export function KbdHint({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <kbd className="kbd-hint" onClick={onClick} role={onClick ? "button" : undefined}>
      {children}
    </kbd>
  );
}
