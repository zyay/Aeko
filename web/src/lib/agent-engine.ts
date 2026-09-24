import type { Line } from "@/components/aeko-app-types";
import { parseAgentMention, type AgentDef, type AgentTool } from "@/lib/agents";
import type { BrainConfig } from "@/components/aeko-app-types";
import type { ChatMessage } from "@/lib/llm";
import { streamChat } from "@/lib/llm";
import { httpFetch, webSearch, readVault, runCodeSnippet } from "@/lib/web-tools";
import { findSkill, formatSkillPack, matchingSkills } from "@/lib/skill-context";

const TOOL_RE = /\[\[tool:(\w+)\]\]\s*(\{[\s\S]*?\})/g;
const MAX_STEPS = 8;

const TOOL_SPECS: Record<AgentTool, { description: string; properties: Record<string, object>; required: string[] }> = {
  web_search: { description: "Search the public web.", properties: { query: { type: "string" } }, required: ["query"] },
  http_fetch: { description: "Read a public https page.", properties: { url: { type: "string" } }, required: ["url"] },
  file_read: { description: "Read the channel document.", properties: {}, required: [] },
  code_run: { description: "Run a fenced javascript snippet.", properties: { code: { type: "string" } }, required: ["code"] },
  doc_edit: { description: "Plan a rewrite of the channel document.", properties: { note: { type: "string" } }, required: [] },
  skill_read: { description: "Read an installed skill by name.", properties: { name: { type: "string" } }, required: ["name"] },
};

function toolDefs(tools: AgentTool[]) {
  return tools.map((name) => ({
    type: "function" as const,
    function: {
      name,
      description: TOOL_SPECS[name].description,
      parameters: { type: "object", properties: TOOL_SPECS[name].properties, required: TOOL_SPECS[name].required },
    },
  }));
}

function stringArgs(raw: string): Record<string, string> {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) out[key] = typeof value === "string" ? value : JSON.stringify(value);
    return out;
  } catch {
    return {};
  }
}

function wantsWeb(text: string) {
  return /search|look up|latest|news|what is|who is|weather|web|http/i.test(text);
}

export function shouldInvokeAgent(prompt: string, _agentMode: boolean) {
  return Boolean(parseAgentMention(prompt)) || /^\/agent\b/i.test(prompt);
}

export type ToolContext = { prompt: string; vault?: string; vaultName?: string };

function searchQuery(prompt: string) {
  return prompt.replace(/@[a-z0-9][a-z0-9 -]*/gi, " ").replace(/\s+/g, " ").trim().slice(0, 180);
}

function fencedCode(prompt: string) {
  const block = prompt.match(/```(?:js|javascript)?\s*([\s\S]*?)```/i);
  return block?.[1]?.trim() ?? "";
}

function pageUrls(text: string) {
  return [...text.matchAll(/https:\/\/[^\s)]+/g)].map((m) => m[0].replace(/[.,]+$/, "")).filter((url) => !/duckduckgo\.com/i.test(url));
}

async function runTool(name: AgentTool, args: Record<string, string>, ctx: ToolContext): Promise<string> {
  if (name === "web_search") return webSearch(args.query || searchQuery(ctx.prompt) || ctx.prompt.slice(0, 180));
  if (name === "http_fetch") return httpFetch(args.url || ctx.prompt.match(/https:\/\/[^\s]+/)?.[0] || "");
  if (name === "file_read") return readVault(ctx.vault, ctx.vaultName);
  if (name === "code_run") {
    const code = args.code || fencedCode(ctx.prompt);
    if (!code) return "code_run:\nNo fenced javascript block to run.";
    return runCodeSnippet(code);
  }
  if (name === "doc_edit") return `doc_edit:\nRewrite the channel document. Put the full new text between [[doc]] and [[/doc]]. Request: ${args.note || ctx.prompt}`;
  if (name === "skill_read") {
    const skill = findSkill(args.name || args.query || ctx.prompt);
    if (!skill) return "skill_read:\nNo installed skill matched. Install one on the desk Skills tab, or pin it to this channel.";
    return `skill_read:\n# ${skill.name}\n${(skill.content || skill.description).slice(0, 4000)}`;
  }
  return `Unknown tool: ${name}`;
}

export async function executeAgentTools(
  prompt: string,
  opts: {
    tools: AgentTool[];
    webMode: boolean;
    agentMode: boolean;
    vault?: string;
    vaultName?: string;
    roomId?: string | null;
    onTool: (line: Line) => void;
  },
): Promise<string[]> {
  const traces: string[] = [];
  const allowSearch = opts.tools.includes("web_search");
  const allowFetch = opts.tools.includes("http_fetch");
  const deep = /research|deep dive|investigate|prehľadaj|nájdi/i.test(prompt);
  const asksLookup = wantsWeb(prompt) || deep;
  const runSearch = allowSearch && (opts.webMode || asksLookup);
  const url = prompt.match(/https:\/\/[^\s]+/)?.[0];

  const emit = async (name: AgentTool, args: Record<string, string> = {}) => {
    if (!opts.tools.includes(name)) return "";
    const note = await runTool(name, args, { prompt, vault: opts.vault, vaultName: opts.vaultName }).catch((e) => `${name}:\n${String(e)}`);
    traces.push(note);
    opts.onTool({ id: `${Date.now()}-${name}`, role: "tool", text: note, at: Date.now() });
    return note;
  };

  if (runSearch) {
    const found = await emit("web_search", { query: searchQuery(prompt) || prompt.slice(0, 180) });
    if (deep && allowFetch) {
      for (const page of pageUrls(found).slice(0, 2)) await emit("http_fetch", { url: page });
    }
  }
  if (allowFetch && url) await emit("http_fetch", { url });
  if (opts.vault?.trim() && opts.tools.includes("file_read")) await emit("file_read");
  if (opts.tools.includes("doc_edit") && /document|canvas|doc|prepis|uprav|rewrite|draft/i.test(prompt)) await emit("doc_edit", { note: prompt });
  const snippet = fencedCode(prompt);
  if (opts.tools.includes("code_run") && snippet) await emit("code_run", { code: snippet });
  if (opts.tools.includes("skill_read")) {
    const pack = formatSkillPack(matchingSkills(prompt, opts.roomId ?? null));
    if (pack) {
      traces.push(`skill_read:\n${pack}`);
      opts.onTool({ id: `${Date.now()}-skill_read`, role: "tool", text: `skill_read:\n${pack}`, at: Date.now() });
    }
  }

  return traces;
}

export function buildAgentSystem(agent: AgentDef, flags: { codeMode: boolean; vault: boolean; agentMode: boolean }) {
  const toolHelp = [
    `Tools you may call: ${agent.tools.join(", ")}.`,
    "You may call tools. Prefer the tool interface. If tools are unavailable, emit [[tool:name]] {\"key\":\"value\"} and wait. web_search uses query. http_fetch uses url. code_run uses code. file_read reads the channel document. skill_read uses name. doc_edit means you then wrap the full document in [[doc]]...[[/doc]]. Follow any Skill blocks already in the conversation.",
  ].join(" ");
  return [agent.systemPrompt, toolHelp, flags.agentMode ? "Agent mode on." : "", flags.vault ? "Vault attached." : "", flags.codeMode ? "Use fenced code blocks." : ""]
    .filter(Boolean)
    .join(" ");
}

export type AgentRunMeta = { steps: number; tools: string[]; ms: number };

export async function runAgentLoop(opts: {
  brain: BrainConfig;
  agent: AgentDef;
  history: ChatMessage[];
  useProxy: boolean;
  signal?: AbortSignal;
  onDelta: (text: string) => void;
  onTool: (line: Line) => void;
  toolCtx?: ToolContext;
}): Promise<{ text: string; meta: AgentRunMeta }> {
  const started = Date.now();
  const toolsUsed: string[] = [];
  let messages = [...opts.history];
  let full = "";

  for (let step = 0; step < MAX_STEPS; step++) {
    let chunk = "";
    const turn = await streamChat({
      baseUrl: opts.brain.baseUrl,
      apiKey: opts.brain.apiKey,
      model: opts.brain.model,
      messages,
      tools: toolDefs(opts.agent.tools),
      useProxy: opts.useProxy,
      signal: opts.signal,
      onDelta: (d) => {
        chunk += d;
        full += d;
        opts.onDelta(d);
      },
    });
    chunk = turn.text || chunk;

    const native = turn.toolCalls.filter((call) => opts.agent.tools.includes(call.name as AgentTool));
    const textCalls = native.length ? [] : [...chunk.matchAll(TOOL_RE)];
    if (!native.length && !textCalls.length) break;

    if (native.length) {
      messages = [
        ...messages,
        {
          role: "assistant",
          content: chunk,
          tool_calls: native.map((call) => ({
            id: call.id || call.name,
            type: "function" as const,
            function: { name: call.name, arguments: call.arguments || "{}" },
          })),
        },
      ];
      for (const call of native) {
        const name = call.name as AgentTool;
        toolsUsed.push(name);
        const note = await runTool(name, stringArgs(call.arguments), { prompt: chunk, vault: opts.toolCtx?.vault, vaultName: opts.toolCtx?.vaultName }).catch((e) => String(e));
        opts.onTool({ id: `${Date.now()}-${name}`, role: "tool", text: note, at: Date.now() });
        messages = [...messages, { role: "tool", tool_call_id: call.id || name, content: note }];
      }
      full = "";
      continue;
    }

    for (const call of textCalls) {
      const name = call[1] as AgentTool;
      if (!opts.agent.tools.includes(name)) continue;
      let args: Record<string, string> = {};
      try {
        args = JSON.parse(call[2]!) as Record<string, string>;
      } catch {
        args = {};
      }
      toolsUsed.push(name);
      const note = await runTool(name, args, { prompt: chunk, vault: opts.toolCtx?.vault, vaultName: opts.toolCtx?.vaultName }).catch((e) => String(e));
      opts.onTool({ id: `${Date.now()}-${name}`, role: "tool", text: note, at: Date.now() });
      messages = [...messages, { role: "assistant", content: chunk }, { role: "user", content: `Tool ${name} result:\n${note}` }];
      full = "";
    }
  }

  return { text: full, meta: { steps: toolsUsed.length + 1, tools: toolsUsed, ms: Date.now() - started } };
}
