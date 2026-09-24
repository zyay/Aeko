export type AgentTool = "web_search" | "http_fetch" | "file_read" | "code_run" | "doc_edit" | "skill_read";

export type AgentDef = {
  id: string;
  name: string;
  tagline: string;
  avatar: string;
  accent: string;
  systemPrompt: string;
  tools: AgentTool[];
};

export const AGENT_ROSTER: AgentDef[] = [
  {
    id: "signal-monitor",
    name: "Signal Monitor",
    tagline: "Research & web intel",
    avatar: "/agents/a.svg",
    accent: "#111111",
    systemPrompt:
      "You are Signal Monitor, a research agent. Watch for changes, summarize sources, and surface what matters. Cite tool output when used. Be crisp and actionable.",
    tools: ["web_search", "http_fetch", "file_read", "doc_edit", "skill_read"],
  },
  {
    id: "code-runner",
    name: "Code Runner",
    tagline: "Engineering & debugging",
    avatar: "/agents/b.svg",
    accent: "#111111",
    systemPrompt:
      "You are Code Runner, an engineering agent. Write clean code, explain tradeoffs, and debug step by step. Prefer fenced code blocks.",
    tools: ["http_fetch", "code_run", "file_read", "skill_read"],
  },
  {
    id: "researcher",
    name: "Researcher",
    tagline: "Deep dives & synthesis",
    avatar: "/agents/a.svg",
    accent: "#111111",
    systemPrompt: "You are Researcher. Combine sources, compare options, and produce structured briefs with clear recommendations.",
    tools: ["web_search", "http_fetch", "file_read", "doc_edit", "skill_read"],
  },
  {
    id: "writer",
    name: "Writer",
    tagline: "Docs, emails, specs",
    avatar: "/agents/aeko.svg",
    accent: "#111111",
    systemPrompt: "You are Writer. Draft polished prose, specs, and messages. Match tone to the audience.",
    tools: ["file_read", "doc_edit", "web_search", "skill_read"],
  },
  {
    id: "aeko",
    name: "Aeko",
    tagline: "General assistant",
    avatar: "/agents/aeko.svg",
    accent: "#111111",
    systemPrompt: "You are Aeko, a sharp personal assistant. Be concise, useful, and direct.",
    tools: ["web_search", "http_fetch", "file_read", "code_run", "doc_edit", "skill_read"],
  },
  {
    id: "planner",
    name: "Planner",
    tagline: "Plans and checklists",
    avatar: "/agents/aeko.svg",
    accent: "#111111",
    systemPrompt: "You are Planner. Turn a goal into a short ordered plan with owners, risks, and the next concrete step.",
    tools: ["file_read", "doc_edit", "skill_read"],
  },
  {
    id: "editor",
    name: "Editor",
    tagline: "Tighten writing",
    avatar: "/agents/aeko.svg",
    accent: "#111111",
    systemPrompt: "You are Editor. Cut filler, fix structure, and return the revised text plus a short note on what changed.",
    tools: ["file_read", "doc_edit", "skill_read"],
  },
  {
    id: "reviewer",
    name: "Reviewer",
    tagline: "Code and spec review",
    avatar: "/agents/b.svg",
    accent: "#111111",
    systemPrompt: "You are Reviewer. Find bugs, missing cases, and unclear decisions. Lead with the highest risk.",
    tools: ["file_read", "code_run", "http_fetch", "skill_read"],
  },
  {
    id: "translator",
    name: "Translator",
    tagline: "Faithful translation",
    avatar: "/agents/a.svg",
    accent: "#111111",
    systemPrompt: "You are Translator. Translate faithfully, keep names and tone, and note anything ambiguous.",
    tools: ["file_read", "doc_edit", "skill_read"],
  },
  {
    id: "operator",
    name: "Operator",
    tagline: "Workflows and follow-through",
    avatar: "/agents/b.svg",
    accent: "#111111",
    systemPrompt: "You are Operator. Turn a request into the next action, the tool to use, and the result to check.",
    tools: ["web_search", "http_fetch", "file_read", "doc_edit", "skill_read"],
  },
];

const ROOM_AGENT_KEY = "aeko_room_agent_v1";
const CUSTOM_KEY = "aeko-custom-agents";

export const AGENT_TOOLS: { id: AgentTool; label: string }[] = [
  { id: "web_search", label: "Search" },
  { id: "http_fetch", label: "Read pages" },
  { id: "file_read", label: "Files" },
  { id: "code_run", label: "Code" },
  { id: "doc_edit", label: "Documents" },
  { id: "skill_read", label: "Skills" },
];

function isAgent(value: unknown): value is AgentDef {
  if (!value || typeof value !== "object") return false;
  const agent = value as AgentDef;
  return typeof agent.id === "string" && agent.id.startsWith("c-") && typeof agent.name === "string" && typeof agent.systemPrompt === "string" && Array.isArray(agent.tools);
}

export function listCustomAgents(): AgentDef[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]") as unknown[];
    return raw.filter(isAgent).map((agent) => ({
      ...agent,
      tagline: agent.tagline || "Custom bot",
      avatar: agent.avatar || "/agents/aeko.svg",
      accent: "#111111",
      tools: agent.tools.filter((tool): tool is AgentTool => AGENT_TOOLS.some((item) => item.id === tool)),
    }));
  } catch {
    return [];
  }
}

export function listAgents(): AgentDef[] {
  return [...AGENT_ROSTER, ...listCustomAgents()];
}

export function upsertCustomAgent(agent: AgentDef) {
  if (typeof window === "undefined") return;
  const next = listCustomAgents().filter((item) => item.id !== agent.id);
  next.push(agent);
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("aeko-agents-change"));
}

export function slugAgent(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "bot";
}

export function buildCustomAgent(
  input: { name: string; tagline: string; systemPrompt: string; tools: AgentTool[] },
  id?: string,
): AgentDef {
  const name = input.name.trim();
  return {
    id: id || `c-${slugAgent(name)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    tagline: input.tagline.trim() || "Custom bot",
    avatar: "/agents/aeko.svg",
    accent: "#111111",
    systemPrompt: input.systemPrompt.trim() || `You are ${name}. Be concise and useful.`,
    tools: input.tools.length ? input.tools : ["file_read", "doc_edit", "skill_read"],
  };
}

export function createCustomAgent(input: { name: string; tagline: string; systemPrompt: string; tools: AgentTool[] }): AgentDef {
  const agent = buildCustomAgent(input);
  upsertCustomAgent(agent);
  return agent;
}

export function getAgent(id: string): AgentDef {
  return listAgents().find((a) => a.id === id) ?? AGENT_ROSTER.find((a) => a.id === "aeko")!;
}

export function getRoomAgentId(roomId: string | null): string {
  if (!roomId || typeof window === "undefined") return "aeko";
  try {
    const map = JSON.parse(localStorage.getItem(ROOM_AGENT_KEY) || "{}") as Record<string, string>;
    return map[roomId] ?? "aeko";
  } catch {
    return "aeko";
  }
}

export function setRoomAgentId(roomId: string, agentId: string) {
  if (typeof window === "undefined") return;
  try {
    const map = JSON.parse(localStorage.getItem(ROOM_AGENT_KEY) || "{}") as Record<string, string>;
    map[roomId] = agentId;
    localStorage.setItem(ROOM_AGENT_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function encodeAssistantPayload(text: string, agentId: string) {
  if (agentId === "aeko") return `[[aeko]]${text}`;
  return `[[agent:${agentId}]]${text}`;
}

export const AGENT_PREFIX_RE = /^\[\[agent:([a-z0-9-]+)\]\]/;

const MENTION_ALIASES: { id: string; names: string[] }[] = [
  { id: "signal-monitor", names: ["signal monitor", "signal-monitor", "signal"] },
  { id: "code-runner", names: ["code runner", "code-runner", "code"] },
  { id: "researcher", names: ["researcher", "research"] },
  { id: "writer", names: ["writer"] },
  { id: "aeko", names: ["aeko", "agent"] },
  { id: "planner", names: ["planner", "plan"] },
  { id: "editor", names: ["editor", "edit"] },
  { id: "reviewer", names: ["reviewer", "review"] },
  { id: "translator", names: ["translator", "translate"] },
  { id: "operator", names: ["operator", "ops"] },
];

export function parseAgentMention(text: string): string | null {
  const hits = [...text.matchAll(/@([a-z0-9][a-z0-9 -]{0,40})/gi)];
  const custom = listCustomAgents();
  for (const hit of hits) {
    const raw = hit[1]!.trim().toLowerCase();
    const own = custom.find((agent) => raw === agent.name.toLowerCase() || raw === agent.id || raw.startsWith(`${agent.name.toLowerCase()} `));
    if (own) return own.id;
    const found = MENTION_ALIASES.find((a) => a.names.some((n) => raw === n || raw.startsWith(`${n} `)));
    if (found) return found.id;
  }
  return null;
}

export function mentionQuery(text: string): string | null {
  const m = text.match(/@([a-z0-9 -]*)$/i);
  return m ? m[1]!.trim().toLowerCase() : null;
}

