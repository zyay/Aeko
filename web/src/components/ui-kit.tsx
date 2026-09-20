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

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon icon={Icons.task} size={22} aria-hidden />
      </div>
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
