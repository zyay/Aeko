"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { MoonIcon, SunIcon } from "@primer/octicons-react";

const DeskField = dynamic(() => import("@/components/desk-field").then((m) => m.DeskField), { ssr: false });
import { Icon, Icons } from "@/components/icons";
import { Mascot } from "@/components/mascot";
import { signOutNow } from "@/lib/sign-out";

export type FloraTab = "Home" | "Stream" | "Agents" | "Skills" | "Workflows";

const THEME_KEY = "aeko-theme";
const spring = { type: "spring" as const, stiffness: 520, damping: 38 };

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
    <div className="flora flora-plain" data-theme={theme}>
      <DeskField light={theme === "light"} />
      <div className="flora-stage">
        <motion.div className="flora-center plain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={rise}>
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
  hint,
  children,
}: {
  title: string;
  hint?: string;
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

  const overview: { id: FloraTab; label: string; icon: typeof Icons.home }[] = [
    { id: "Home", label: "Channels", icon: Icons.home },
    { id: "Stream", label: "Stream", icon: Icons.task },
  ];
  const workspace: { id: FloraTab; label: string; icon: typeof Icons.home }[] = [
    { id: "Agents", label: "Agents", icon: Icons.agent },
    { id: "Skills", label: "Skills", icon: Icons.file },
    { id: "Workflows", label: "Workflows", icon: Icons.brain },
  ];

  return (
    <div className="flora" data-theme={theme}>
      <DeskField light={theme === "light"} />
      <nav className="flora-rail" aria-label="Workspace" data-tour="rail">
        <button type="button" className="flora-team" title={hint ? `${title}. ${hint}` : title} onClick={() => onActive("Home")}>
          <Mascot size={20} />
          <span>
            <b>Aeko</b>
            <em>{title}</em>
          </span>
        </button>
        <motion.button type="button" className="flora-plus" aria-label="New channel" title="New channel" whileTap={{ scale: 0.98 }} transition={rise} onClick={() => setPanel(panel === "create" ? null : "create")}>
          <Icon icon={Icons.plus} size={16} />
          <span>Add New</span>
        </motion.button>
        <p className="flora-rail-label">Overview</p>
        {overview.map((item) => (
          <motion.button key={item.id} type="button" className={active === item.id ? "on" : ""} aria-label={item.label} title={item.label} whileTap={{ scale: 0.98 }} transition={rise} onClick={() => { setPanel(null); onActive(item.id); }}>
            <Icon icon={item.icon} size={16} />
            <span>{item.label}</span>
          </motion.button>
        ))}
        <p className="flora-rail-label">Workspace</p>
        {workspace.map((item) => (
          <motion.button key={item.id} type="button" className={active === item.id ? "on" : ""} aria-label={item.label} title={item.label} data-tour={item.id === "Agents" ? "agents" : undefined} whileTap={{ scale: 0.98 }} transition={rise} onClick={() => { setPanel(null); onActive(item.id); }}>
            <Icon icon={item.icon} size={16} />
            <span>{item.label}</span>
          </motion.button>
        ))}
        <motion.button type="button" aria-label="Settings" title="Settings" data-tour="settings" whileTap={{ scale: 0.98 }} transition={rise} onClick={onSettings}>
          <Icon icon={Icons.gear} size={16} />
          <span>Settings</span>
        </motion.button>
        <div className="flora-rail-gap" />
        <button type="button" className="flora-status" onClick={onNotify}>
          {brainOk ? "Live" : "Offline"} · {taskCount}
        </button>
        <button type="button" aria-label={theme === "dark" ? "Light theme" : "Dark theme"} title={theme === "dark" ? "Light theme" : "Dark theme"} onClick={() => setMode(theme === "dark" ? "light" : "dark")}>
          <Icon icon={theme === "dark" ? SunIcon : MoonIcon} size={16} />
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
        <button type="button" className="flora-account" aria-label="Account" onClick={() => setPanel(panel === "account" ? null : "account")}>
          <span className="flora-avatar">{(userEmail[0] ?? "A").toUpperCase()}</span>
          <span>{userEmail}</span>
        </button>
      </nav>
      <header className="flora-top">
        <div className="flora-crumbs">
          <span>Aeko</span>
          <span>/</span>
          <strong>{title}</strong>
        </div>
        <div className="flora-top-actions">
          <button type="button" className="flora-find" onClick={onSearch}>
            Find…
            <kbd>Ctrl K</kbd>
          </button>
          <button type="button" className="flora-share" data-tour="share" onClick={onShare}>Share</button>
        </div>
      </header>
      <div className="flora-stage">{children}</div>
      {panel === "create" && (
        <motion.form className="flora-pop" onSubmit={create} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={rise}>
          <strong>Create</strong>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Channel name" />
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Description" aria-label="Topic" />
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
        <motion.div className="flora-pop flora-pop-account" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={rise}>
          <strong>{userEmail}</strong>
          <p>{brainOk ? "Ready" : "Connect a model in Settings"}</p>
          <button type="button" className="flora-pop-btn" onClick={onSettings}>Settings</button>
          <Link href="/learn/plan">Learn</Link>
          <form action={signOutNow}>
            <button type="submit" className="flora-signout">Log Out</button>
          </form>
        </motion.div>
      )}
    </div>
  );
}
