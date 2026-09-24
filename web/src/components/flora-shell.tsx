"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { MoonIcon, SunIcon } from "@primer/octicons-react";
import { Icon, Icons } from "@/components/icons";
import { Mascot } from "@/components/mascot";
import { signOutNow } from "@/lib/sign-out";

export type FloraTab = "Home" | "Stream" | "Agents" | "Skills" | "Workflows";

const THEME_KEY = "aeko-theme";
const spring = { type: "spring" as const, stiffness: 420, damping: 34 };

function useRise() {
  const reduce = useReducedMotion();
  return reduce ? { duration: 0 } : spring;
}

export function useFloraTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);
  function setMode(next: "dark" | "light") {
    setTheme(next);
    window.localStorage.setItem(THEME_KEY, next);
  }
  return { theme, setMode };
}

export function FloraFrame({ children }: { children: ReactNode }) {
  const { theme, setMode } = useFloraTheme();
  const rise = useRise();
  return (
    <div className="flora" data-theme={theme}>
      <div className="flora-stage">
        <motion.div className="flora-center plain" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={rise}>
          {children}
        </motion.div>
      </div>
      <button
        type="button"
        className="flora-icon-corner"
        aria-label={theme === "dark" ? "Light theme" : "Dark theme"}
        title={theme === "dark" ? "Light theme" : "Dark theme"}
        onClick={() => setMode(theme === "dark" ? "light" : "dark")}
      >
        <Icon icon={theme === "dark" ? SunIcon : MoonIcon} size={16} />
      </button>
    </div>
  );
}

export function FloraShell({
  title,
  userEmail,
  brainOk,
  taskCount,
  active,
  onActive,
  onShare,
  onSearch,
  onSettings,
  onCreateChannel,
  onNotify,
  children,
}: {
  title: string;
  userEmail: string;
  brainOk: boolean;
  taskCount: number;
  active: FloraTab;
  onActive: (tab: FloraTab) => void;
  onShare: () => void;
  onSearch: () => void;
  onSettings: () => void;
  onCreateChannel: (input: { title: string; topic: string; kind: "channel" | "dm" | "project" | "canvas"; visibility: "open" | "private" }) => void;
  onNotify: () => void;
  children: ReactNode;
}) {
  const { theme, setMode } = useFloraTheme();
  const rise = useRise();
  const [panel, setPanel] = useState<"create" | "account" | null>(null);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [kind, setKind] = useState<"channel" | "dm" | "project" | "canvas">("channel");
  const [visibility, setVisibility] = useState<"open" | "private">("open");

  function create(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateChannel({ title: name.trim(), topic, kind, visibility });
    setName("");
    setTopic("");
    setPanel(null);
    onActive("Home");
  }

  const rails: { id: FloraTab; label: string; icon: typeof Icons.home }[] = [
    { id: "Home", label: "Channels", icon: Icons.home },
    { id: "Stream", label: "Stream", icon: Icons.task },
    { id: "Agents", label: "Agents", icon: Icons.agent },
    { id: "Skills", label: "Skills", icon: Icons.file },
    { id: "Workflows", label: "Workflows", icon: Icons.brain },
  ];

  return (
    <div className="flora" data-theme={theme}>
      <div className="flora-stage">{children}</div>
      <header className="flora-top">
        <button type="button" className="flora-brand" onClick={() => onActive("Home")}>
          <Mascot size={18} />
          <span className="flora-title">{title}</span>
          <span className="flora-caret">▾</span>
        </button>
        <button type="button" className="flora-share" onClick={onShare}>Share</button>
      </header>
      <nav className="flora-rail" aria-label="Workspace">
        <motion.button type="button" className="flora-plus" aria-label="New channel" title="New channel" whileTap={{ scale: 0.9 }} transition={rise} onClick={() => setPanel(panel === "create" ? null : "create")}>
          <Icon icon={Icons.plus} size={18} />
        </motion.button>
        {rails.map((item) => (
          <motion.button key={item.id} type="button" className={active === item.id ? "on" : ""} aria-label={item.label} title={item.label} whileTap={{ scale: 0.9 }} transition={rise} onClick={() => { setPanel(null); onActive(item.id); }}>
            <Icon icon={item.icon} size={16} />
          </motion.button>
        ))}
        <motion.button type="button" aria-label="Search" title="Search" whileTap={{ scale: 0.9 }} transition={rise} onClick={onSearch}>
          <Icon icon={Icons.search} size={16} />
        </motion.button>
        <motion.button type="button" aria-label="Settings" title="Settings" whileTap={{ scale: 0.9 }} transition={rise} onClick={onSettings}>
          <Icon icon={Icons.gear} size={16} />
        </motion.button>
        <div className="flora-rail-gap" />
        <button type="button" aria-label={theme === "dark" ? "White theme" : "Black theme"} onClick={() => setMode(theme === "dark" ? "light" : "dark")}>
          <Icon icon={theme === "dark" ? SunIcon : MoonIcon} size={16} />
        </button>
        <button type="button" className="flora-avatar" aria-label="Account" onClick={() => setPanel(panel === "account" ? null : "account")}>
          {(userEmail[0] ?? "A").toUpperCase()}
        </button>
      </nav>
      {panel === "create" && (
        <motion.form className="flora-pop" onSubmit={create} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={rise}>
          <strong>New channel</strong>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Channel name" />
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" aria-label="Topic" />
          <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} aria-label="Kind">
            <option value="channel">Channel</option>
            <option value="dm">DM</option>
            <option value="project">Project</option>
            <option value="canvas">Canvas</option>
          </select>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value as "open" | "private")} aria-label="Visibility">
            <option value="open">Open</option>
            <option value="private">Private</option>
          </select>
          <button type="submit">Create</button>
        </motion.form>
      )}
      {panel === "account" && (
        <motion.div className="flora-pop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={rise}>
          <strong>{userEmail}</strong>
          <p>{brainOk ? "Model live" : "Model offline"}</p>
          <button type="button" className="flora-pop-btn" onClick={onSettings}>Settings</button>
          <Link href="/learn/plan">Learn</Link>
          <form action={signOutNow}>
            <button type="submit" className="flora-signout">Sign out</button>
          </form>
        </motion.div>
      )}
      <div className="flora-foot left">{brainOk ? "E2EE · live" : "E2EE · offline"}</div>
      <button type="button" className="flora-foot right" onClick={onNotify}>
        Tasks <b>{taskCount}</b> active
      </button>
    </div>
  );
}
