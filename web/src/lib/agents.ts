export type AgentTool = "web_search" | "http_fetch" | "file_read" | "code_run" | "doc_edit" | "skill_list" | "skill_read" | "app_list" | "app_call" | "clock" | "calc" | "note_read" | "note_write" | "json_check" | "word_count" | "outline";

export type AgentDef = {
  id: string;
  name: string;
  tagline: string;
  avatar: string;
  accent: string;
  systemPrompt: string;
  tools: AgentTool[];
  kind?: "decision";
  use?: string;
  thinking?: boolean;
};

export const AGENT_ROSTER: AgentDef[] = [
  {
    id: "jev",
    name: "Jev",
    tagline: "TypeSafe decisions",
    avatar: "/agents/aeko.svg",
    accent: "#111111",
    kind: "decision",
    use: "Yes or no, a choice, or a risk score. Not a written reply.",
    thinking: true,
    systemPrompt:
      "You are Jev, a TypeSafe decision model. You do not write prose. You score a situation into a next step, a risk, and whether it is specific enough to act.",
    tools: [],
  },
  {
    id: "signal-monitor",
    name: "Signal Monitor",
    tagline: "Research & web intel",
    avatar: "/agents/a.svg",
    accent: "#111111",
    systemPrompt:
      "You are Signal Monitor, a research agent. Watch for changes, summarize sources, and surface what matters. Cite tool output when used. Be crisp and actionable.",
    use: "News, competitors, and what changed. Cite pages it opened.",
    thinking: true,
    tools: ["web_search", "http_fetch", "file_read", "doc_edit", "skill_list", "skill_read", "app_list", "app_call", "clock", "note_read", "note_write", "outline", "word_count"],
  },
  {
    id: "code-runner",
    name: "Code Runner",
    tagline: "Engineering & debugging",
    avatar: "/agents/b.svg",
    accent: "#111111",
    systemPrompt:
      "You are Code Runner, an engineering agent. Write clean code, explain tradeoffs, and debug step by step. Run a snippet before you claim it works.",
    use: "Write, run, and check a small patch. Say how to verify it.",
    thinking: true,
    tools: ["web_search", "http_fetch", "code_run", "file_read", "skill_list", "skill_read", "clock", "calc", "note_read", "json_check", "outline"],
  },
  {
    id: "researcher",
    name: "Researcher",
    tagline: "Deep dives & synthesis",
    avatar: "/agents/a.svg",
    accent: "#111111",
    systemPrompt: "You are Researcher. Combine sources, compare options, and produce structured briefs with clear recommendations. Name what you did not verify.",
    use: "A brief with options, sources, and one recommendation.",
    thinking: true,
    tools: ["web_search", "http_fetch", "file_read", "doc_edit", "skill_list", "skill_read", "clock", "outline", "word_count", "note_read"],
  },
  {
    id: "writer",
    name: "Writer",
    tagline: "Docs, emails, specs",
    avatar: "/agents/aeko.svg",
    accent: "#111111",
    systemPrompt: "You are Writer. Draft polished prose, specs, and messages. Match tone to the audience. Return the finished text first.",
    use: "Docs, mail, specs, and announcements.",
    tools: ["web_search", "http_fetch", "file_read", "doc_edit", "skill_list", "skill_read", "outline", "word_count", "note_read"],
  },
  {
    id: "aeko",
    name: "Aeko",
    tagline: "General assistant",
    avatar: "/agents/aeko.svg",
    accent: "#111111",
    systemPrompt: "You are Aeko, a sharp personal assistant. Be concise, useful, and direct. Use a tool when a fact, page, note, or app is required.",
    use: "Everyday tasks, mixed tools, and a first pass.",
    tools: ["web_search", "http_fetch", "file_read", "code_run", "doc_edit", "skill_list", "skill_read", "app_list", "app_call", "clock", "calc", "note_read", "note_write", "json_check", "word_count", "outline"],
  },
  {
    id: "hands",
    name: "Hands",
    tagline: "Acts with tools",
    avatar: "/agents/b.svg",
    accent: "#111111",
    systemPrompt:
      "You are Hands. You work like an OpenHands agent: call a tool, read the observation, then call the next tool. Search, open the best page, read the channel document, run code, and use a connected app when the task names GitHub, Linear, Notion, or Slack. Never claim a result you did not observe.",
    use: "Search, open a page, run code, or call GitHub, Linear, Notion, Slack.",
    tools: ["web_search", "http_fetch", "file_read", "code_run", "doc_edit", "skill_list", "skill_read", "app_list", "app_call", "clock", "calc", "note_read", "note_write", "json_check", "outline"],
  },
  {
    id: "planner",
    name: "Planner",
    tagline: "Plans and checklists",
    avatar: "/agents/aeko.svg",
    accent: "#111111",
    systemPrompt: "You are Planner. Turn a goal into a short ordered plan with owners, risks, and the next concrete step.",
    use: "A checklist before the work starts.",
    thinking: true,
    tools: ["web_search", "file_read", "doc_edit", "skill_list", "skill_read", "clock", "outline", "note_read"],
  },
  {
    id: "editor",
    name: "Editor",
    tagline: "Tighten writing",
    avatar: "/agents/aeko.svg",
    accent: "#111111",
    systemPrompt: "You are Editor. Cut filler, fix structure, and return the revised text plus a short note on what changed.",
    use: "Tighten a draft that already exists.",
    tools: ["file_read", "doc_edit", "skill_list", "skill_read", "outline", "word_count"],
  },
  {
    id: "reviewer",
    name: "Reviewer",
    tagline: "Code and spec review",
    avatar: "/agents/b.svg",
    accent: "#111111",
    systemPrompt: "You are Reviewer. Find bugs, missing cases, and unclear decisions. Lead with the highest risk. Do not write an exploit.",
    use: "Review code or a spec before it ships.",
    thinking: true,
    tools: ["web_search", "http_fetch", "file_read", "code_run", "skill_list", "skill_read", "json_check", "outline"],
  },
  {
    id: "translator",
    name: "Translator",
    tagline: "Faithful translation",
    avatar: "/agents/a.svg",
    accent: "#111111",
    systemPrompt: "You are Translator. Translate faithfully, keep names and tone, and note anything ambiguous.",
    use: "Move text between languages without rewriting the meaning.",
    tools: ["file_read", "doc_edit", "skill_list", "skill_read", "word_count"],
  },
  {
    id: "operator",
    name: "Operator",
    tagline: "Workflows and follow-through",
    avatar: "/agents/b.svg",
    accent: "#111111",
    systemPrompt: "You are Operator. Turn a request into the next action, the tool to use, and the result to check.",
    use: "A workflow: next action, who does it, how to check.",
    thinking: true,
    tools: ["web_search", "http_fetch", "file_read", "code_run", "doc_edit", "skill_list", "skill_read", "app_list", "app_call", "clock", "calc", "note_read", "note_write", "json_check", "outline"],
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
  { id: "skill_list", label: "Skill list" },
  { id: "skill_read", label: "Skills" },
  { id: "app_list", label: "Apps" },
  { id: "app_call", label: "App actions" },
  { id: "clock", label: "Clock" },
  { id: "calc", label: "Math" },
  { id: "note_read", label: "Notes" },
  { id: "note_write", label: "Save note" },
  { id: "json_check", label: "JSON" },
  { id: "word_count", label: "Word count" },
  { id: "outline", label: "Outline" },
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
    tools: input.tools.length ? input.tools : ["web_search", "file_read", "doc_edit", "skill_list", "skill_read", "app_list", "app_call"],
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
  { id: "jev", names: ["jev", "typesafe", "typesafe jev"] },
  { id: "signal-monitor", names: ["signal monitor", "signal-monitor", "signal"] },
  { id: "code-runner", names: ["code runner", "code-runner", "code"] },
  { id: "researcher", names: ["researcher", "research"] },
  { id: "writer", names: ["writer"] },
  { id: "aeko", names: ["aeko", "agent"] },
  { id: "hands", names: ["hands", "open hands", "openhands"] },
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

