"use client";

import { useEffect, useState } from "react";
import { AGENT_ROSTER, AGENT_TOOLS, createCustomAgent, listAgents, type AgentTool } from "@/lib/agents";
import { setTriage, triageMap, type Triage } from "@/lib/work-store";
import type { Room, RoomPreview } from "@/components/aeko-app-types";
import { EmptyState } from "@/components/ui-kit";
import { CURATED_SKILLS, type SkillEntry } from "@/lib/skills-registry";
import { installSkill, listInstalledSkills, removeSkill } from "@/lib/skills-store";
import { ConnectionsPanel } from "@/components/connections-panel";

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
  const [agents, setAgents] = useState(AGENT_ROSTER);
  const [botName, setBotName] = useState("");
  const [botRole, setBotRole] = useState("");
  const [botPrompt, setBotPrompt] = useState("");
  const [botTools, setBotTools] = useState<AgentTool[]>(["file_read", "doc_edit", "skill_read", "app_list", "app_call"]);

  useEffect(() => {
    setMap(triageMap());
    setAgents(listAgents());
    setInstalled(listInstalledSkills());
    const syncAgents = () => setAgents(listAgents());
    window.addEventListener("aeko-agents-change", syncAgents);
    const refresh = () => setInstalled(listInstalledSkills());
    window.addEventListener("abc-skills-change", refresh);
    void fetch("/api/workflows")
      .then((r) => r.json())
      .then((j: { workflows?: { id: string; name: string; enabled: boolean; yaml: string }[] }) => setFlows(j.workflows ?? []))
      .catch(() => setFlows([]));
    return () => {
      window.removeEventListener("abc-skills-change", refresh);
      window.removeEventListener("aeko-agents-change", syncAgents);
    };
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
          {rooms.length === 0 && <p className="work-kicker">No channels yet. Start Brief, Research, Canvas, or Build from Home.</p>}
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
        <div className="setup-fields">
          <p className="work-kicker">The selected bot answers in this channel. @Hands searches, opens a page, reads the note, runs code, and calls a connected app.</p>
          <ConnectionsPanel />
          <div className="pick-grid">
            {agents.map((a) => (
              <button key={a.id} type="button" className={activeAgentId === a.id ? "pick on" : "pick"} onClick={() => onAgentSelect?.(a.id)}>
                <strong>{a.name}</strong>
                <span>{a.tagline}</span>
              </button>
            ))}
          </div>
          <p className="work-kicker">Your own bot</p>
          <input className="field" value={botName} placeholder="Name" onChange={(e) => setBotName(e.target.value)} />
          <input className="field" value={botRole} placeholder="Role" onChange={(e) => setBotRole(e.target.value)} />
          <textarea className="field" value={botPrompt} placeholder="Instructions" onChange={(e) => setBotPrompt(e.target.value)} />
          <div className="tool-row">
            {AGENT_TOOLS.map((tool) => {
              const on = botTools.includes(tool.id);
              return (
                <button key={tool.id} type="button" className={on ? "tool on" : "tool"} onClick={() => setBotTools((current) => (on ? current.filter((id) => id !== tool.id) : [...current, tool.id]))}>
                  {tool.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="blackpill"
            disabled={botName.trim().length < 2 || botPrompt.trim().length < 8}
            onClick={() => {
              const agent = createCustomAgent({ name: botName, tagline: botRole, systemPrompt: botPrompt, tools: botTools });
              setBotName("");
              setBotRole("");
              setBotPrompt("");
              onAgentSelect?.(agent.id);
            }}
          >
            Create bot
          </button>
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
          {flows.length === 0 && <p className="work-kicker">No workflows yet. A saved one runs a single agent step when a message lands in its channel.</p>}
          {flows.map((f) => (
            <div key={f.id} className="work-row static">
              <div>
                <strong>{f.name}</strong>
                <div className="work-muted">
                  {f.yaml.match(/^agent:\s*(\S+)/m)?.[1] ?? "aeko"} · {f.yaml.match(/^channel:\s*(\S+)/m)?.[1] || "no channel"}
                </div>
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
      <p className="work-kicker">{roomId ? `Runs when a message arrives in this channel (${roomId}).` : "Open a channel first. This workflow needs a channel id."}</p>
      <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Workflow name" />
      <textarea value={yaml} onChange={(e) => setYaml(e.target.value)} rows={4} aria-label="Workflow yaml" />
      <button type="submit">Save workflow</button>
      {note && <p>{note}</p>}
    </form>
  );
}
