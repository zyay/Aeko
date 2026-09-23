"use client";

import { EmptyState, StatusPill } from "@/components/ui-kit";
import { AgentOrb } from "@/components/agent-orb";
import { getAgent } from "@/lib/agents";
import type { Line } from "@/components/aeko-app-types";

export function ActivityRail({
  userEmail,
  members,
  typers,
  busy,
  activeAgentId,
  enginePhase,
  notifications,
  onOpenNotifications,
}: {
  userEmail: string;
  members: string[];
  typers: string[];
  busy: boolean;
  activeAgentId: string;
  enginePhase: "idle" | "thinking" | "speaking";
  notifications: { id: string; text: string; at: number }[];
  onOpenNotifications: () => void;
}) {
  const agent = getAgent(activeAgentId);
  return (
    <aside className="activity-rail" aria-label="Activity">
      <div className="activity-rail-head">
        <h2>Activity</h2>
        <button type="button" className="activity-bell" onClick={onOpenNotifications} aria-label="Notifications">
          {notifications.length > 0 ? notifications.length : ""}
        </button>
      </div>
      <div className="activity-section">
        <h3>Agent</h3>
        <div className="activity-agent">
          <AgentOrb state={busy ? enginePhase : "idle"} size={32} />
          <div>
            <strong>{agent.name}</strong>
            <p>{busy ? enginePhase : "Ready"}</p>
          </div>
        </div>
      </div>
      <div className="activity-section">
        <h3>People</h3>
        <ul className="activity-people">
          <li><StatusPill ok={true} label={userEmail.split("@")[0]!} /></li>
          {members.filter((m) => m !== userEmail).map((m) => (
            <li key={m}>{m.split("@")[0]}</li>
          ))}
        </ul>
        {typers.length > 0 && <p className="activity-typing">{typers.map((t) => t.split("@")[0]).join(", ")} typing…</p>}
      </div>
      <div className="activity-section">
        <h3>Recent</h3>
        {notifications.length === 0 ? (
          <EmptyState compact title="No activity yet" body="Mentions, notes, and agent runs will show up here." />
        ) : (
          <ul className="activity-feed">
            {notifications.slice(0, 6).map((n) => (
              <li key={n.id}>{n.text}</li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

export function NotificationDrawer({
  open,
  items,
  onClose,
}: {
  open: boolean;
  items: { id: string; text: string; at: number }[];
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="modal-bg" onClick={onClose} role="presentation">
      <div className="modal notification-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Notifications">
        <h2>Notifications</h2>
        {items.length === 0 ? (
          <EmptyState compact title="All caught up" body="New notifications will land in this list." />
        ) : (
          <ul className="activity-feed">
            {items.map((n) => (
              <li key={n.id}>{n.text}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ToolTracePanel({ lines }: { lines: Line[] }) {
  const tools = lines.filter((l) => l.role === "tool");
  if (!tools.length) return null;
  return (
    <details className="tool-trace" open>
      <summary>Tool trace ({tools.length})</summary>
      <ul>
        {tools.map((t) => (
          <li key={t.id}>
            <pre>{t.text.slice(0, 1200)}</pre>
          </li>
        ))}
      </ul>
    </details>
  );
}
