"use client";

import type { RefObject } from "react";
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
  onSettings: () => void;
  onOpenRoom: (id: string) => void;
}) {
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
        <button type="button" className="sidebar-link on">
          <IconHome />
          Home
        </button>
        <button type="button" className="sidebar-link" onClick={onCreateTask}>
          <IconPlus />
          New task
        </button>
        <button type="button" className="sidebar-link" onClick={onSettings}>
          <IconSettings />
          Settings
        </button>
        <div className="sidebar-section-label">Recent tasks</div>
        {filteredRooms.length === 0 ? (
          <p style={{ padding: "6px 10px", fontSize: 12, color: "var(--sidebar-muted)" }}>No tasks yet</p>
        ) : (
          filteredRooms.slice(0, 8).map((r) => (
            <button key={r.id} type="button" className="sidebar-room" onClick={() => onOpenRoom(r.id)}>
              <div className="task-dot" style={{ background: taskColor(r.id) }}>
                {r.title[0]?.toUpperCase()}
              </div>
              <span>{r.title}</span>
            </button>
          ))
        )}
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
