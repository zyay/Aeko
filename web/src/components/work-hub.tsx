"use client";

import { useEffect, useState } from "react";
import { AGENT_ROSTER } from "@/lib/agents";
import { setTriage, triageMap, type Triage } from "@/lib/work-store";
import type { Room, RoomPreview } from "@/components/aeko-app-types";
import { EmptyState } from "@/components/ui-kit";
import { CURATED_SKILLS, type SkillEntry } from "@/lib/skills-registry";
import { installSkill, listInstalledSkills, removeSkill } from "@/lib/skills-store";

const TABS = ["Home", "Stream", "Agents", "Skills", "Workflows"] as const;
const STATUSES: Triage[] = ["open", "waiting", "resolved", "delegated"];

export function WorkHub({
  rooms,
  previews = {},
  formatTime,
  onOpenRoom,
  onCreate,
  tab: tabProp,
  onTab,
  activeAgentId,
  onAgentSelect,
  roomId,
}: {
  rooms: Room[];
  previews?: Record<string, RoomPreview>;
  formatTime?: (ts: number) => string;
  onOpenRoom: (id: string) => void;
  onCreate?: () => void;
  tab?: (typeof TABS)[number];
  onTab?: (tab: (typeof TABS)[number]) => void;
  activeAgentId?: string;
  onAgentSelect?: (id: string) => void;
  roomId?: string | null;
}) {
  const [localTab, setLocalTab] = useState<(typeof TABS)[number]>("Home");
  const tab = tabProp ?? localTab;
  const setTab = (next: (typeof TABS)[number]) => {
    setLocalTab(next);
    onTab?.(next);
  };
  const [triage, setMap] = useState<Record<string, Triage>>({});
  const [flows, setFlows] = useState<{ id: string; name: string; enabled: boolean; yaml: string }[]>([]);
  const [installed, setInstalled] = useState<SkillEntry[]>([]);
  const [skillQuery, setSkillQuery] = useState("");
  const [found, setFound] = useState<SkillEntry[]>(CURATED_SKILLS.slice(0, 8));
  const [skillNote, setSkillNote] = useState("");

  useEffect(() => {
    setMap(triageMap());
    setInstalled(listInstalledSkills());
    const refresh = () => setInstalled(listInstalledSkills());
    window.addEventListener("abc-skills-change", refresh);
    void fetch("/api/workflows")
      .then((r) => r.json())
      .then((j: { workflows?: { id: string; name: string; enabled: boolean; yaml: string }[] }) => setFlows(j.workflows ?? []))
      .catch(() => setFlows([]));
    return () => window.removeEventListener("abc-skills-change", refresh);
  }, []);

  return (
    <section className="work-hub" aria-label="Workspace">
      {tabProp == null && (
      <div className="work-tabs">
        {TABS.map((t) => (
          <button key={t} type="button" className={tab === t ? "head-chip on" : "head-chip"} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      )}
      {tab === "Home" && (
        <div className="work-list">
          {rooms.length === 0 ? (
            <EmptyState
              plain
              title="No channels yet"
              body="Create a channel for your team. Agents join when you mention them."
              action={onCreate ? <button type="button" className="studio-create" onClick={onCreate}>Create channel</button> : undefined}
            />
          ) : (
            <div className="studio-grid">
              {rooms.map((r) => (
                <button key={r.id} type="button" className="studio-card rise" onClick={() => onOpenRoom(r.id)}>
                  <strong>{r.title}</strong>
                  <span>{previews[r.id]?.text || r.topic || "No messages yet"}</span>
                  <em>{r.kind ?? "channel"}{formatTime ? ` · ${formatTime(previews[r.id]?.lastAt ?? r.lastAt ?? 0)}` : ""}</em>
                </button>
              ))}
            </div>
          )}
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
                className={activeAgentId === a.id ? "head-chip on" : "head-chip"}
                onClick={() => onAgentSelect?.(a.id)}
              >
                {activeAgentId === a.id ? "Active" : "Use"}
              </button>
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

      {tab === "Skills" && (
        <div className="work-list">
          <p className="work-kicker">Installed skills are read by channel agents when you name them, pin them, or type /.</p>
          {installed.length === 0 && (
            <EmptyState title="No skills yet" body="Install a skill below. Agents can read it when you name it or pin it to a channel." />
          )}
          {installed.map((s) => (
            <div key={s.id} className="work-row static">
              <div>
                <strong>{s.name}</strong>
                <div className="work-muted">{s.content ? "SKILL.md loaded" : s.description}</div>
              </div>
              <button type="button" className="head-chip" onClick={() => setInstalled(removeSkill(s.id))}>
                Remove
              </button>
            </div>
          ))}
          <form
            className="sidebar-create"
            onSubmit={(e) => {
              e.preventDefault();
              const q = skillQuery.trim();
              void fetch(`/api/skills/search?q=${encodeURIComponent(q || "filename:SKILL.md")}`)
                .then((r) => r.json())
                .then((j: { curated?: SkillEntry[]; github?: SkillEntry[] }) => {
                  const rows = [...(j.curated ?? []), ...(j.github ?? [])];
                  setFound(rows.slice(0, 8));
                  setSkillNote(rows.length ? "" : "No matches");
                })
                .catch(() => setSkillNote("Search failed"));
            }}
          >
            <input value={skillQuery} onChange={(e) => setSkillQuery(e.target.value)} placeholder="Search skills" aria-label="Search skills" />
            <button type="submit">Search</button>
          </form>
          {skillNote && <p>{skillNote}</p>}
          {found.map((s) => (
            <div key={s.id} className="work-row static">
              <div>
                <strong>{s.name}</strong>
                <div className="work-muted">{s.description}</div>
              </div>
              <button
                type="button"
                className="head-chip"
                onClick={() => {
                  setSkillNote("Fetching skill…");
                  void installSkill(s).then((next) => {
                    setInstalled(next);
                    setSkillNote(next.some((x) => x.id === s.id && x.content) ? "Installed with SKILL.md" : "Installed");
                  });
                }}
              >
                Install
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "Workflows" && (
        <div className="work-list">
          <WorkflowForm
            roomId={roomId ?? null}
            onSaved={() => {
              void fetch("/api/workflows")
                .then((r) => r.json())
                .then((j: { workflows?: { id: string; name: string; enabled: boolean; yaml: string }[] }) => setFlows(j.workflows ?? []));
            }}
          />
          {flows.map((f) => (
            <div key={f.id} className="work-row static">
              <div>
                <strong>{f.name}</strong>
                <div className="work-muted">{f.yaml.match(/^agent:\s*(\S+)/m)?.[1] ?? "aeko"} · message</div>
              </div>
              <span className={f.enabled ? "head-chip on" : "head-chip"}>{f.enabled ? "On" : "Off"}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function WorkflowForm({ roomId, onSaved }: { roomId: string | null; onSaved: () => void }) {
  const [name, setName] = useState("Triage");
  const [yaml, setYaml] = useState(`on: message\nchannel: ${roomId ?? ""}\nagent: aeko`);
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
        }).then((res) => {
          setNote(res.ok ? "Saved" : "Could not save");
          if (res.ok) onSaved();
        });
      }}
    >
      <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Workflow name" />
      <textarea value={yaml} onChange={(e) => setYaml(e.target.value)} rows={4} aria-label="Workflow yaml" />
      <button type="submit">Save workflow</button>
      {note && <p>{note}</p>}
    </form>
  );
}
