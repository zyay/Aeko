"use client";

import { useEffect, useState } from "react";
import { AGENT_ROSTER, listAgents } from "@/lib/agents";
import { ENDPOINT_TEMPLATES, type EndpointTemplate } from "@/lib/endpoints";

const PIN_KEY = "aeko-pinned-agent";

export function BotPick() {
  const [id, setId] = useState("aeko");
  const [agents, setAgents] = useState(AGENT_ROSTER);

  useEffect(() => {
    const sync = () => {
      const list = listAgents();
      setAgents(list);
      const saved = window.localStorage.getItem(PIN_KEY);
      if (saved && list.some((a) => a.id === saved)) setId(saved);
    };
    sync();
    window.addEventListener("aeko-agents-change", sync);
    return () => window.removeEventListener("aeko-agents-change", sync);
  }, []);

  function pick(next: string) {
    setId(next);
    window.localStorage.setItem(PIN_KEY, next);
  }

  return (
    <div className="pick-block">
      <p className="pick-label">Bot</p>
      <div className="pick-grid">
        {agents.map((agent) => (
          <button key={agent.id} type="button" className={id === agent.id ? "pick on" : "pick"} onClick={() => pick(agent.id)}>
            <strong>{agent.name}</strong>
            <span>{agent.tagline}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function EndpointPick({
  activeModel,
  activeBase,
  onPick,
}: {
  activeModel: string;
  activeBase: string;
  onPick: (template: EndpointTemplate) => void;
}) {
  return (
    <div className="pick-block">
      <p className="pick-label">Endpoint</p>
      <div className="pick-grid">
        {ENDPOINT_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            className={activeModel === template.model && activeBase === template.baseUrl ? "pick on" : "pick"}
            onClick={() => onPick(template)}
          >
            <strong>{template.label}</strong>
            <span>{template.provider} · {template.note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
