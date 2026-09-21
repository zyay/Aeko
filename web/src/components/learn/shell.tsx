"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

const NAV = [
  { href: "/learn/plan", label: "Home", icon: "⌂" },
  { href: "/learn/library", label: "Library", icon: "▤" },
  { href: "/learn/vocabulary", label: "Vocab", icon: "+" },
  { href: "/learn/chat", label: "Chat", icon: "◉" },
  { href: "/learn/skills", label: "Skills", icon: "◈" },
];

const MORE = [
  { href: "/learn/stats", label: "Statistics" },
  { href: "/learn/exams", label: "Exams" },
  { href: "/learn/collections", label: "Collections" },
  { href: "/learn/mcp", label: "MCP studio" },
  { href: "/learn/settings", label: "Tutor settings" },
];

const SIDEBAR = [
  ...NAV,
  { href: "/learn/stats", label: "Statistics", icon: "▥" },
  { href: "/learn/exams", label: "Exams", icon: "✓" },
  { href: "/learn/collections", label: "Collections", icon: "☰" },
  { href: "/learn/mcp", label: "MCP studio", icon: "⚙" },
  { href: "/learn/settings", label: "Settings", icon: "⚙" },
];

function AbcLogo() {
  return (
    <div className="learn-logo" aria-hidden>
      <span />
    </div>
  );
}

export function LearnShell({
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
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="learn-root">
      <div className="learn-shell">
        <aside className="learn-sidebar">
          <Link href="/learn/plan" className="learn-brand">
            <AbcLogo />
            abc
          </Link>
          <nav className="learn-nav" aria-label="Learn">
            {SIDEBAR.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href || pathname.startsWith(item.href + "/") ? "learn-nav-link on" : "learn-nav-link"}
              >
                <span className="learn-nav-icon" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="learn-sidebar-foot">learn english easily</div>
        </aside>

        <div className="learn-main">
          <header className="learn-topbar">
            <div>
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
            {action}
          </header>
          <div className="learn-scroll">{children}</div>
        </div>
      </div>

      <nav className="learn-mobile-nav" aria-label="Mobile">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={pathname === item.href || pathname.startsWith(item.href + "/") ? "on" : ""}>
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <button type="button" className={moreOpen ? "on" : ""} onClick={() => setMoreOpen((v) => !v)} aria-expanded={moreOpen}>
          <span aria-hidden>⋯</span>
          More
        </button>
      </nav>

      {moreOpen && (
        <div className="learn-more-sheet" role="dialog" aria-label="More navigation">
          {MORE.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function LearnAuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="learn-root learn-auth">
      <div>
        <Link href="/learn" className="learn-brand" style={{ justifyContent: "center", marginBottom: 24 }}>
          <AbcLogo />
          abc
        </Link>
        {children}
      </div>
    </div>
  );
}
