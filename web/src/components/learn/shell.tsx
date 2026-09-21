"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/learn/plan", label: "Home", icon: "⌂" },
  { href: "/learn/library", label: "Library", icon: "▤" },
  { href: "/learn/chat", label: "GPT chat", icon: "◉" },
  { href: "/learn/stats", label: "Statistics", icon: "▥" },
  { href: "/learn/exams", label: "Exams", icon: "✓" },
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

  return (
    <div className="learn-root">
      <div className="learn-shell">
        <aside className="learn-sidebar">
          <Link href="/learn/plan" className="learn-brand">
            <AbcLogo />
            abc
          </Link>
          <nav className="learn-nav" aria-label="Learn">
            {NAV.map((item) => (
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
            <Link href="/learn/vocabulary" className={pathname.startsWith("/learn/vocabulary") ? "learn-nav-link on" : "learn-nav-link"}>
              <span className="learn-nav-icon">+</span>
              Vocabulary
            </Link>
            <Link href="/learn/skills" className={pathname.startsWith("/learn/skills") ? "learn-nav-link on" : "learn-nav-link"}>
              <span className="learn-nav-icon">◈</span>
              Skills hub
            </Link>
            <Link href="/learn/mcp" className={pathname.startsWith("/learn/mcp") ? "learn-nav-link on" : "learn-nav-link"}>
              <span className="learn-nav-icon">⚙</span>
              MCP studio
            </Link>
            <Link href="/learn/collections" className={pathname.startsWith("/learn/collections") ? "learn-nav-link on" : "learn-nav-link"}>
              <span className="learn-nav-icon">☰</span>
              Collections
            </Link>
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
          <Link key={item.href} href={item.href} className={pathname === item.href ? "on" : ""}>
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
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
