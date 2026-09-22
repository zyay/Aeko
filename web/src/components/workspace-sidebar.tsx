"use client";

import { useState, type RefObject } from "react";
import { AgentsRail } from "@/components/agents-rail";
import { StatusPill } from "@/components/ui-kit";
import type { BrainConfig, Room } from "@/components/aeko-app-types";
import {
  BrandMark,
  IconHome,
  IconPlus,
  IconSearch,
  IconSettings,
  taskColor,
} from "@/components/ui-primitives";

export function WorkspaceSidebar({
  userEmail,
  brain,
  activeAgentId,
  busy,
  roomId,
  deskSearch,
  deskSearchRef,
  filteredRooms,
  onAgentSelect,
  onDeskSearch,
  onPalette,
  onCreateTask,
  onCreateChannel,
  onSettings,
  onOpenRoom,
}: {
  userEmail: string;
  brain: BrainConfig;
  activeAgentId: string;
  busy: boolean;
  roomId: string | null;
  deskSearch: string;
  deskSearchRef: RefObject<HTMLInputElement>;
  filteredRooms: Room[];
  onAgentSelect: (agentId: string) => void;
  onDeskSearch: (value: string) => void;
  onPalette: () => void;
  onCreateTask: () => void;
  onCreateChannel: (input: { title: string; topic: string; kind: "channel" | "dm" | "project" | "canvas"; visibility: "open" | "private" }) => void;
  onSettings: () => void;
  onOpenRoom: (id: string) => void;
}) {
  const [section, setSection] = useState<"home" | "channel" | "dm" | "agents" | "workflows">("home");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [visibility, setVisibility] = useState<"open" | "private">("open");
  const shown =
    section === "channel" || section === "dm"
      ? filteredRooms.filter((r) => (r.kind ?? "channel") === (section === "dm" ? "dm" : "channel") || (section === "channel" && (r.kind === "project" || r.kind === "canvas" || !r.kind)))
      : filteredRooms;

  return (
    <aside className="workspace-sidebar github-rail">
      <div className="sidebar-brand">
        <BrandMark size={28} />
        <a href="https://getaeko.com" target="_blank" rel="noreferrer">
          Aeko
        </a>
      </div>
      <AgentsRail
        activeId={activeAgentId}
        busy={busy}
        onSelect={(agent) => onAgentSelect(agent.id)}
      />
      <div className="sidebar-search">
        <IconSearch />
        <input
          ref={deskSearchRef}
          value={deskSearch}
          onChange={(e) => onDeskSearch(e.target.value)}
          placeholder="Quick search…"
          aria-label="Search tasks"
        />
      </div>
      <button type="button" className="sidebar-palette-btn" onClick={onPalette}>
        <IconSearch size={16} />
        Command palette
        <kbd>Ctrl K</kbd>
      </button>
      <nav className="sidebar-nav" aria-label="Workspace">
        {(
          [
            ["home", "Home"],
            ["channel", "Channels"],
            ["dm", "DMs"],
            ["agents", "Agents"],
            ["workflows", "Workflows"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className={section === id ? "sidebar-link on" : "sidebar-link"} onClick={() => setSection(id)}>
            <IconHome />
            {label}
          </button>
        ))}
        <button type="button" className="sidebar-link" onClick={() => setCreating(true)}>
          <IconPlus />
          New channel
        </button>
        <button type="button" className="sidebar-link" onClick={onCreateTask}>
          <IconPlus />
          Quick room
        </button>
        <button type="button" className="sidebar-link" onClick={onSettings}>
          <IconSettings />
          Settings
        </button>
        <div className="sidebar-section-label">{section === "home" ? "Inbox" : section}</div>
        {shown.length === 0 ? (
          <p style={{ padding: "6px 10px", fontSize: 12, color: "var(--sidebar-muted)" }}>Nothing here yet</p>
        ) : (
          shown.slice(0, 12).map((r) => (
            <button key={r.id} type="button" className="sidebar-room" onClick={() => onOpenRoom(r.id)}>
              <div className="task-dot" style={{ background: taskColor(r.id) }}>
                {r.title[0]?.toUpperCase()}
              </div>
              <span>{r.title}</span>
            </button>
          ))
        )}
        {creating && (
          <form
            className="sidebar-create"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              onCreateChannel({ title: title.trim(), topic, kind: section === "dm" ? "dm" : "channel", visibility });
              setTitle("");
              setTopic("");
              setCreating(false);
            }}
          >
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Name" aria-label="Channel name" />
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" aria-label="Topic" />
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as "open" | "private")} aria-label="Visibility">
              <option value="open">Open</option>
              <option value="private">Private</option>
            </select>
            <button type="submit">Create</button>
          </form>
        )}
        {section === "workflows" && <WorkflowForm />}
      </nav>
      <div className="sidebar-footer">
        <StatusPill ok={brain.valid} label={brain.valid ? "Model live" : "Model offline"} />
        <div className="sidebar-user">{userEmail}</div>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className="ghostlink">
            Sign out
          </button>
        </form>
        <a href="https://getaeko.com" target="_blank" rel="noreferrer">
          getaeko.com
        </a>
      </div>
    </aside>
  );
}

function WorkflowForm() {
  const [name, setName] = useState("Triage");
  const [yaml, setYaml] = useState("on: message\nagent: aeko");
  const [note, setNote] = useState("");
  return (
    <form
      className="sidebar-create"
      onSubmit={(e) => {
        e.preventDefault();
        void fetch("/api/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, yaml, enabled: true }),
        }).then((res) => setNote(res.ok ? "Saved" : "Could not save"));
      }}
    >
      <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Workflow name" />
      <textarea value={yaml} onChange={(e) => setYaml(e.target.value)} rows={4} aria-label="Workflow yaml" />
      <button type="submit">Save workflow</button>
      {note && <p>{note}</p>}
    </form>
  );
}
