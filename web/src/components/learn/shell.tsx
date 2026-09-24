"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  CommentIcon,
  GearIcon,
  MoonIcon,
  SunIcon,
  GraphIcon,
  HomeIcon,
  BookIcon,
  MortarBoardIcon,
  RepoIcon,
  ZapIcon,
} from "@primer/octicons-react";
import { Icon } from "@/components/icons";
import { FloraFrame, useFloraTheme } from "@/components/flora-shell";

const SIDEBAR: { href: string; label: string; icon: typeof HomeIcon }[] = [
  { href: "/learn/plan", label: "Home", icon: HomeIcon },
  { href: "/learn/library", label: "Library", icon: BookIcon },
  { href: "/learn/vocabulary", label: "Vocabulary", icon: MortarBoardIcon },
  { href: "/learn/chat", label: "Chat", icon: CommentIcon },
  { href: "/learn/skills", label: "Skills", icon: RepoIcon },
  { href: "/learn/stats", label: "Statistics", icon: GraphIcon },
  { href: "/learn/exams", label: "Exams", icon: ZapIcon },
  { href: "/learn/collections", label: "Collections", icon: BookIcon },
  { href: "/learn/mcp", label: "MCP", icon: GearIcon },
  { href: "/learn/settings", label: "Settings", icon: GearIcon },
];

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
  const { theme, setMode } = useFloraTheme();

  return (
    <div className="flora learn-root" data-theme={theme}>
      <div className="flora-stage" />
      <header className="flora-top">
        <Link href="/learn/plan" className="flora-brand">
          <span className="flora-mark" aria-hidden>
            <i /><i /><i /><i />
          </span>
          <span className="flora-title">Learn</span>
        </Link>
        <button type="button" className="flora-icon-corner" aria-label={theme === "dark" ? "Light theme" : "Dark theme"} title={theme === "dark" ? "Light theme" : "Dark theme"} onClick={() => setMode(theme === "dark" ? "light" : "dark")}>
          <Icon icon={theme === "dark" ? SunIcon : MoonIcon} size={16} />
        </button>
      </header>
      <nav className="flora-rail" aria-label="Learn">
        {SIDEBAR.map((item) => {
          const on = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} className={on ? "on" : ""} aria-label={item.label} title={item.label}>
              <Icon icon={item.icon} size={16} />
            </Link>
          );
        })}
      </nav>
      <motion.main className="flora-learn" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 420, damping: 34 }}>
        <header>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
          {action}
        </header>
        {children}
      </motion.main>
    </div>
  );
}

export function LearnAuthShell({ children }: { children: ReactNode }) {
  return (
    <FloraFrame>
      <div className="flora-sheet flora-auth-card">{children}</div>
    </FloraFrame>
  );
}
