"use client";

import { useEffect, useState } from "react";
import { AGENT_TOOLS, listAgents, type AgentDef, type AgentTool } from "@/lib/agents";
import { PINNED_AGENT_KEY } from "@/lib/setup-draft";
import { readUsage } from "@/lib/usage";

const ABOUT: Record<string, string> = {
  "signal-monitor": "Reads the web and your notes, then says what changed and what to do next.",
  "code-runner": "Writes and checks code. It can run a short snippet before it claims the code works.",
  researcher: "Compares sources and returns a short brief with a recommendation.",
  writer: "Drafts docs, emails, and specs in the tone you ask for.",
  aeko: "Everyday assistant. It can search, read, write, and use a connected app.",
  hands: "Uses tools. Mention @Hands when you want a search, a page, code, or a connected app.",
  planner: "Turns a goal into an ordered plan and names the next step.",
  editor: "Cuts filler and returns the revised text plus what changed.",
  reviewer: "Looks for bugs, missing cases, and unclear decisions, starting with the highest risk.",
  translator: "Translates, keeps names and tone, and flags anything ambiguous.",
  operator: "Turns a request into the next action, the tool to use, and how to check the result.",
  jev: "TypeSafe decision model. It returns a next step, a risk score, and a yes or no. It does not write a reply.",
};

function toolLabel(id: AgentTool) {
  return AGENT_TOOLS.find((tool) => tool.id === id)?.label ?? id;
}

export function AgentStep({
  botName,
  botRole,
  botPrompt,
  botTools,
  status,
  onName,
  onRole,
  onPrompt,
  onTools,
  onCreate,
}: {
  botName: string;
  botRole: string;
  botPrompt: string;
  botTools: AgentTool[];
  status: string;
  onName: (value: string) => void;
  onRole: (value: string) => void;
  onPrompt: (value: string) => void;
  onTools: (tools: AgentTool[]) => void;
  onCreate: () => void;
}) {
  const [agents, setAgents] = useState<AgentDef[]>([]);
  const [id, setId] = useState("aeko");

  useEffect(() => {
    const sync = () => {
      const list = listAgents();
      setAgents(list);
      const saved = window.localStorage.getItem(PINNED_AGENT_KEY);
      if (saved && list.some((agent) => agent.id === saved)) setId(saved);
    };
    sync();
    window.addEventListener("aeko-agents-change", sync);
    return () => window.removeEventListener("aeko-agents-change", sync);
  }, []);

  const selected = agents.find((agent) => agent.id === id) ?? agents[0];

  function pick(next: string) {
    setId(next);
    window.localStorage.setItem(PINNED_AGENT_KEY, next);
  }

  return (
    <>
      <h2>Choose who answers</h2>
      <p>Click a bot to pin it. The note under the grid is what that bot does.</p>
      <div className="agent-grid">
        {agents.map((agent) => (
          <button key={agent.id} type="button" className={id === agent.id ? "agent-card on" : "agent-card"} onClick={() => pick(agent.id)}>
            <strong>{agent.name}</strong>
            <span>{agent.use || agent.tagline}</span>
            <em>{agent.tools.length} tools{agent.thinking ? " · thinking" : ""}</em>
          </button>
        ))}
      </div>
      {selected && (
        <div className="agent-detail" key={selected.id}>
          <strong>{selected.name}</strong>
          <p>{ABOUT[selected.id] || selected.tagline}</p>
          {selected.use && <p className="tiny">Use when: {selected.use}</p>}
          <p className="tiny">{selected.kind === "decision" ? "In a channel, type @Jev and the situation. The scores stay in the private thread." : `In a channel, type @${selected.name} and the task.`}</p>
          <p className="tiny">{readUsage().byAgent[selected.id]?.turns || 0} private turns on this device.</p>
          <div className="tool-row">
            {selected.tools.map((tool) => (
              <span key={tool} className="tool on static">{toolLabel(tool)}</span>
            ))}
          </div>
        </div>
      )}
      <p className="pick-label">Your own bot</p>
      <label className="setup-label" htmlFor="bot-own-name">Name</label>
      <input id="bot-own-name" className="field" value={botName} placeholder="Name" onChange={(e) => onName(e.target.value)} />
      <label className="setup-label" htmlFor="bot-own-role">Role</label>
      <input id="bot-own-role" className="field" value={botRole} placeholder="Role, such as release notes" onChange={(e) => onRole(e.target.value)} />
      <label className="setup-label" htmlFor="bot-own-prompt">Instructions</label>
      <textarea id="bot-own-prompt" className="field" value={botPrompt} placeholder="Instructions. At least a sentence about how it should answer." onChange={(e) => onPrompt(e.target.value)} />
      <div className="tool-row">
        {AGENT_TOOLS.map((tool) => {
          const on = botTools.includes(tool.id);
          return (
            <button key={tool.id} type="button" className={on ? "tool on" : "tool"} onClick={() => onTools(on ? botTools.filter((item) => item !== tool.id) : [...botTools, tool.id])}>
              {tool.label}
            </button>
          );
        })}
      </div>
      <button className="solid" type="button" disabled={botName.trim().length < 2 || botPrompt.trim().length < 8} onClick={onCreate}>
        Create bot
      </button>
      {status && <p className="tiny">{status}</p>}
    </>
  );
}
