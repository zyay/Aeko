"use client";

import type { AgentDef } from "@/lib/agents";
import { AGENT_ROSTER } from "@/lib/agents";
import { AgentOrb } from "@/components/agent-orb";

export function AgentsRail({
  activeId,
  onSelect,
  busy,
}: {
  activeId: string;
  onSelect: (agent: AgentDef) => void;
  busy?: boolean;
}) {
  return (
    <div className="agents-rail">
      <div className="agents-rail-label">Live agents</div>
      <div className="agents-rail-list">
        {AGENT_ROSTER.map((agent) => {
          const on = activeId === agent.id;
          return (
            <button
              key={agent.id}
              type="button"
              className={`agent-chip${on ? " on" : ""}`}
              onClick={() => onSelect(agent)}
              title={`${agent.name} — ${agent.tagline}`}
            >
              {on ? (
                <span className="agent-chip-orb">
                  <AgentOrb size={36} state={busy ? "thinking" : "idle"} />
                </span>
              ) : (
                <span className="agent-chip-avatar" style={{ background: agent.accent }}>
                  <img src={agent.avatar} alt="" />
                </span>
              )}
              <span className="agent-chip-copy">
                <strong>{agent.name}</strong>
                <small>{agent.tagline}</small>
              </span>
              <span className="agent-chip-dot" aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}
