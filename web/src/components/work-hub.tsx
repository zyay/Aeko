"use client";

import { useEffect, useState } from "react";
import { AGENT_ROSTER, AGENT_TOOLS, createCustomAgent, listAgents, type AgentDef, type AgentTool } from "@/lib/agents";
import { Mascot } from "@/components/mascot";
import { setTriage, triageMap, type Triage } from "@/lib/work-store";
import type { Room, RoomPreview } from "@/components/aeko-app-types";
import { EmptyState } from "@/components/ui-kit";
import { BUILTIN_SKILLS, CURATED_SKILLS, type SkillEntry } from "@/lib/skills-registry";
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
  onStartAgent,
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
  onStartAgent?: (id: string) => void;
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
        <div className="hub-sections">
          <AgentMeet agents={agents.length ? agents : AGENT_ROSTER} onStart={(id) => onStartAgent?.(id)} />
          <section>
            <h2>People and apps</h2>
            <p>A person joins with an invite from a channel. An app token stays in this browser, and Hands can call only the actions on the card.</p>
            <ConnectionsPanel />
          </section>
          <section>
            <h2>Bots in the room</h2>
            <p>Click one to pin it. In the composer, type @ and their name. Type / for search, a page, code, or a connected app.</p>
            <div className="agent-grid">
              {agents.map((a) => (
                <button key={a.id} type="button" className={activeAgentId === a.id ? "agent-card on" : "agent-card"} onClick={() => onAgentSelect?.(a.id)}>
                  <strong>{a.name}{a.kind === "decision" ? " · Decision" : a.thinking ? " · Thinking" : ""}</strong>
                  <span>{a.use || a.tagline}</span>
                  <em>{a.tools.length} tools · @{a.name}</em>
                </button>
              ))}
            </div>
            <p className="pick-label">Your own bot</p>
            <input className="field" value={botName} placeholder="Name" onChange={(e) => setBotName(e.target.value)} />
            <input className="field" value={botRole} placeholder="Role" onChange={(e) => setBotRole(e.target.value)} />
            <textarea className="field" value={botPrompt} placeholder="Instructions. At least a sentence." onChange={(e) => setBotPrompt(e.target.value)} />
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
              className="solid"
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
          </section>
        </div>
      )}

      {tab === "Skills" && (
        <div className="work-list">
          <p className="work-kicker">Ready skills are already on this device. Name one in the channel, or install more below.</p>
          {BUILTIN_SKILLS.map((s) => (
            <div key={s.id} className="work-row static">
              <div>
                <strong>{s.name}</strong>
                <div className="work-muted">{s.description}</div>
              </div>
              <span className="head-chip on">Ready</span>
            </div>
          ))}
          {installed.length === 0 && (
            <p className="work-kicker">No extra skills installed yet.</p>
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
            rooms={rooms.map((room) => ({ id: room.id, title: room.title }))}
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

function AgentMeet({ agents, onStart }: { agents: AgentDef[]; onStart: (id: string) => void }) {
  const [index, setIndex] = useState(0);
  const [color, setColor] = useState("");
  const agent = agents[index] ?? agents[0];
  const colors = ["", "#111111", "#4C8DFF", "#ff5a1f", "#8e8e93"];

  useEffect(() => {
    setColor(window.localStorage.getItem("aeko-mascot-color") || "");
  }, []);

  function paint(next: string) {
    setColor(next);
    if (next) window.localStorage.setItem("aeko-mascot-color", next);
    else window.localStorage.removeItem("aeko-mascot-color");
    window.dispatchEvent(new Event("aeko-mascot"));
  }

  const presets = ["#111111", "#4C8DFF", "#ff5a1f", "#8e8e93"];
  if (!agent) return null;
  return (
    <section className="agent-meet">
      <p className="desk-kicker">Meet a bot</p>
      <h2>{agent.name}</h2>
      <Mascot size={96} color={color || presets[index % presets.length]} label={agent.name} />
      <p>
        {agent.kind === "decision"
          ? "Jev scores the situation into a next step, a risk, and a yes or no. Type @Jev and the situation. The scores stay in the private thread."
          : `${agent.use || agent.tagline} Tools: ${agent.tools.length}${agent.thinking ? ". Prefers thinking." : "."} In a channel, type @${agent.name} and the task.`}
      </p>
      <div className="meet-names">
        {agents.map((item, i) => (
          <button key={item.id} type="button" className={i === index ? "on" : ""} onClick={() => setIndex(i)}>
            {item.name}
          </button>
        ))}
      </div>
      <div className="meet-nav">
        <button type="button" className="setup-back" onClick={() => setIndex((i) => (i - 1 + agents.length) % agents.length)}>Previous</button>
        <button type="button" className="solid slim" onClick={() => onStart(agent.id)}>Start chat</button>
        <button type="button" className="setup-back" onClick={() => setIndex((i) => (i + 1) % agents.length)}>Next</button>
      </div>
      <p className="pick-label">Your face color</p>
      <div className="swatches">
        {colors.map((item) => (
          <button key={item || "theme"} type="button" className={color === item ? "on" : ""} aria-label={item || "Theme color"} style={{ background: item || "currentColor" }} onClick={() => paint(item)} />
        ))}
      </div>
    </section>
  );
}

function WorkflowForm({ roomId, rooms, onSaved }: { roomId: string | null; rooms: { id: string; title: string }[]; onSaved: () => void }) {
  const [name, setName] = useState("Triage");
  const [channel, setChannel] = useState(roomId || rooms[0]?.id || "");
  const [agent, setAgent] = useState("aeko");
  const [note, setNote] = useState("");
  const yaml = `on: message\nchannel: ${channel}\nagent: ${agent}`;
  return (
    <form
      className="sidebar-create"
      onSubmit={(e) => {
        e.preventDefault();
        if (!channel) {
          setNote("Open or create a channel first. A workflow runs inside one room.");
          return;
        }
        void fetch("/api/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, yaml, enabled: true }),
        }).then((res) => {
          setNote(res.ok ? "Saved. The chosen bot runs once when a message arrives in that room." : "Could not save");
          if (res.ok) onSaved();
        });
      }}
    >
      <p className="work-kicker">Where: this page. What: one bot step after a message. How: name it, pick the room, pick the bot, then save.</p>
      <label className="setup-label" htmlFor="flow-name">Name</label>
      <input id="flow-name" value={name} onChange={(e) => setName(e.target.value)} />
      <label className="setup-label" htmlFor="flow-room">Room</label>
      <select id="flow-room" className="field" value={channel} onChange={(e) => setChannel(e.target.value)}>
        {!rooms.length && <option value="">No room yet</option>}
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>{room.title}</option>
        ))}
      </select>
      <label className="setup-label" htmlFor="flow-agent">Bot</label>
      <select id="flow-agent" className="field" value={agent} onChange={(e) => setAgent(e.target.value)}>
        {AGENT_ROSTER.map((item) => (
          <option key={item.id} value={item.id}>{item.name} — {item.tagline}</option>
        ))}
      </select>
      <button type="submit" className="solid">Save workflow</button>
      {note && <p className="tiny">{note}</p>}
    </form>
  );
}
