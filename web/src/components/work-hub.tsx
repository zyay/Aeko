"use client";

import { useEffect, useState } from "react";
import { AGENT_ROSTER } from "@/lib/agents";
import { listWorkflows, setTriage, toggleWorkflow, triageMap, type Triage, type Workflow } from "@/lib/work-store";
import type { Room } from "@/components/aeko-app-types";

const TABS = ["Home", "Stream", "Agents", "Workflows"] as const;
const STATUSES: Triage[] = ["open", "waiting", "resolved", "delegated"];

export function WorkHub({
  rooms,
  onOpenRoom,
}: {
  rooms: Room[];
  onOpenRoom: (id: string) => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Home");
  const [triage, setMap] = useState<Record<string, Triage>>({});
  const [flows, setFlows] = useState<Workflow[]>([]);

  useEffect(() => {
    setMap(triageMap());
    setFlows(listWorkflows());
  }, []);

  const waiting = rooms.filter((r) => (triage[r.id] ?? "open") === "waiting" || (triage[r.id] ?? "open") === "open");

  return (
    <section className="work-hub" aria-label="Workspace">
      <div className="work-tabs">
        {TABS.map((t) => (
          <button key={t} type="button" className={tab === t ? "head-chip on" : "head-chip"} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Home" && (
        <div className="work-list">
          <p className="work-kicker">What needs you</p>
          {waiting.length === 0 && <p className="work-empty">Inbox is clear. Start a task and an agent can pick it up.</p>}
          {waiting.slice(0, 6).map((r) => (
            <button key={r.id} type="button" className="work-row" onClick={() => onOpenRoom(r.id)}>
              <strong>{r.title}</strong>
              <span>{triage[r.id] ?? "open"}</span>
            </button>
          ))}
        </div>
      )}

      {tab === "Stream" && (
        <div className="work-list">
          {rooms.map((r) => (
            <div key={r.id} className="work-row static">
              <button type="button" onClick={() => onOpenRoom(r.id)}>
                <strong>{r.title}</strong>
              </button>
              <select
                aria-label={`Status for ${r.title}`}
                value={triage[r.id] ?? "open"}
                onChange={(e) => setMap(setTriage(r.id, e.target.value as Triage))}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {tab === "Agents" && (
        <div className="work-list">
          {AGENT_ROSTER.map((a) => (
            <div key={a.id} className="work-row static">
              <div>
                <strong>{a.name}</strong>
                <div className="work-muted">{a.tagline}</div>
              </div>
              <button
                type="button"
                className="head-chip"
                onClick={() => {
                  const url = `${window.location.origin}/add/agent?id=${a.id}`;
                  void navigator.clipboard.writeText(url);
                }}
              >
                Copy invite
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "Workflows" && (
        <div className="work-list">
          {flows.map((f) => (
            <div key={f.id} className="work-row static">
              <div>
                <strong>{f.name}</strong>
                <div className="work-muted">
                  {f.agentId} · {f.trigger}
                </div>
              </div>
              <button
                type="button"
                className={f.enabled ? "head-chip on" : "head-chip"}
                onClick={() => setFlows(toggleWorkflow(f.id))}
              >
                {f.enabled ? "On" : "Off"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
