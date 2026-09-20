export type AgentTool = "web_search" | "http_fetch" | "file_read" | "code_run";

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
    accent: "#2f81f7",
    systemPrompt:
      "You are Signal Monitor, a research agent. Watch for changes, summarize sources, and surface what matters. Cite tool output when used. Be crisp and actionable.",
    tools: ["web_search", "http_fetch", "file_read"],
  },
  {
    id: "code-runner",
    name: "Code Runner",
    tagline: "Engineering & debugging",
    avatar: "/agents/b.svg",
    accent: "#3fb950",
    systemPrompt:
      "You are Code Runner, an engineering agent. Write clean code, explain tradeoffs, and debug step by step. Prefer fenced code blocks.",
    tools: ["http_fetch", "code_run", "file_read"],
  },
  {
    id: "researcher",
    name: "Researcher",
    tagline: "Deep dives & synthesis",
    avatar: "/agents/a.svg",
    accent: "#58a6ff",
    systemPrompt: "You are Researcher. Combine sources, compare options, and produce structured briefs with clear recommendations.",
    tools: ["web_search", "http_fetch", "file_read"],
  },
  {
    id: "writer",
    name: "Writer",
    tagline: "Docs, emails, specs",
    avatar: "/agents/aeko.svg",
    accent: "#a371f7",
    systemPrompt: "You are Writer. Draft polished prose, specs, and messages. Match tone to the audience.",
    tools: ["file_read"],
  },
  {
    id: "aeko",
    name: "Aeko",
    tagline: "General assistant",
    avatar: "/agents/aeko.svg",
    accent: "#2f81f7",
    systemPrompt: "You are Aeko, a sharp personal assistant. Be concise, useful, and direct.",
    tools: ["web_search", "http_fetch", "file_read", "code_run"],
  },
];

const ROOM_AGENT_KEY = "aeko_room_agent_v1";

export function getAgent(id: string): AgentDef {
  return AGENT_ROSTER.find((a) => a.id === id) ?? AGENT_ROSTER.find((a) => a.id === "aeko")!;
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

export function parseAgentMention(text: string): string | null {
  const m = text.match(/^@(aeko|signal-monitor|code-runner|researcher|writer|signal|code)\b/i);
  if (!m) return null;
  const map: Record<string, string> = {
    aeko: "aeko",
    signal: "signal-monitor",
    "signal-monitor": "signal-monitor",
    code: "code-runner",
    "code-runner": "code-runner",
    researcher: "researcher",
    writer: "writer",
  };
  return map[m[1]!.toLowerCase()] ?? null;
}
