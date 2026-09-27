import type { Line } from "@/components/aeko-app-types";
import { parseAgentMention, type AgentDef, type AgentTool } from "@/lib/agents";
import type { BrainConfig } from "@/components/aeko-app-types";
import type { ChatMessage } from "@/lib/llm";
import { streamChat } from "@/lib/llm";
import { calcExpression, clockNow, httpFetch, jsonCheck, outlineText, readNotes, readVault, runCodeSnippet, webSearch, wordCount, writeNote } from "@/lib/web-tools";
import { callConnectedApp, describeConnections } from "@/lib/connections";
import { findSkill, formatSkillList, formatSkillPack, matchingSkills } from "@/lib/skill-context";
import { AGENT_GUARD } from "@/lib/room-policy";
import { seatGuide, type ChatSeat } from "@/lib/model-board";

const TOOL_RE = /\[\[tool:(\w+)\]\]\s*(\{[\s\S]*?\})/g;
const MAX_STEPS = 8;

const TOOL_SPECS: Record<AgentTool, { description: string; properties: Record<string, object>; required: string[] }> = {
  web_search: {
    description: "Search the public web. Use this before you cite anything you did not already observe. Then open the best https link with http_fetch.",
    properties: { query: { type: "string", description: "Short search query." } },
    required: ["query"],
  },
  http_fetch: {
    description: "Read one public https page and return its text. Use a URL from the user or from a web_search observation.",
    properties: { url: { type: "string", description: "https URL only." } },
    required: ["url"],
  },
  file_read: {
    description: "Read the channel document or attached vault. Call this before you rewrite it.",
    properties: {},
    required: [],
  },
  code_run: {
    description: "Run a small javascript snippet and return its value. The snippet must return a value. No imports, no network, no filesystem.",
    properties: { code: { type: "string", description: "Javascript that returns a value." } },
    required: ["code"],
  },
  doc_edit: {
    description: "Prepare a full rewrite of the channel document. After this observation, put the complete new document between [[doc]] and [[/doc]].",
    properties: { note: { type: "string", description: "What should change." } },
    required: [],
  },
  skill_list: {
    description: "List installed skills. Call this before skill_read when you do not know the skill name.",
    properties: {},
    required: [],
  },
  skill_read: {
    description: "Read one installed skill by name and follow it.",
    properties: { name: { type: "string", description: "Skill name from skill_list." } },
    required: ["name"],
  },
  app_list: {
    description: "List apps connected in this browser and the actions each one allows. Call this before app_call. Tokens are never included.",
    properties: {},
    required: [],
  },
  clock: {
    description: "Read the current local time. Use this when the task depends on the date or the hour.",
    properties: {},
    required: [],
  },
  calc: {
    description: "Evaluate one arithmetic expression. Digits and + - * / ( ) % only.",
    properties: { expression: { type: "string", description: "Arithmetic expression." } },
    required: ["expression"],
  },
  note_read: {
    description: "Read short notes saved for this channel. Notes are local to this browser.",
    properties: {},
    required: [],
  },
  note_write: {
    description: "Save one short note for this channel. Never save a key, a token, or a secret.",
    properties: { text: { type: "string", description: "The note to keep." } },
    required: ["text"],
  },
  json_check: {
    description: "Check whether a string is valid JSON. Use before you treat text as data.",
    properties: { text: { type: "string", description: "JSON text." } },
    required: ["text"],
  },
  word_count: {
    description: "Count words and characters in a passage.",
    properties: { text: { type: "string", description: "The passage." } },
    required: ["text"],
  },
  outline: {
    description: "Extract headings and list items from a passage.",
    properties: { text: { type: "string", description: "The passage." } },
    required: ["text"],
  },
  app_call: {
    description:
      "Call one checked action on a connected app. Read: github me, repos, issues, issue, search; linear me, teams, issues; notion me, search, page; slack me, channels. Write only when the user asked: github create_issue, linear create_issue, slack post.",
    properties: {
      app: { type: "string", description: "github, linear, notion, or slack." },
      action: { type: "string", description: "Action id from app_list." },
      owner: { type: "string", description: "GitHub owner." },
      repo: { type: "string", description: "GitHub repo name." },
      number: { type: "string", description: "GitHub issue number." },
      query: { type: "string", description: "Search text." },
      title: { type: "string", description: "Issue title." },
      body: { type: "string", description: "Issue body." },
      team: { type: "string", description: "Linear team id from linear teams." },
      page: { type: "string", description: "Notion page id." },
      channel: { type: "string", description: "Slack channel id or name." },
      text: { type: "string", description: "Slack message text." },
    },
    required: ["app", "action"],
  },
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
  return Boolean(parseAgentMention(prompt));
}

export type ToolContext = { prompt: string; vault?: string; vaultName?: string; roomId?: string | null };

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
  if (name === "skill_list") return formatSkillList(ctx.roomId);
  if (name === "skill_read") {
    const skill = findSkill(args.name || args.query || ctx.prompt);
    if (!skill) return "skill_read:\nNo installed skill matched. Install one on the desk Skills tab, or pin it to this channel.";
    return `skill_read:\n# ${skill.name}\n${(skill.content || skill.description).slice(0, 4000)}`;
  }
  if (name === "clock") return clockNow();
  if (name === "calc") return calcExpression(args.expression || args.query || "");
  if (name === "note_read") return readNotes(ctx.roomId);
  if (name === "note_write") return writeNote(ctx.roomId, args.text || args.note || "");
  if (name === "json_check") return jsonCheck(args.text || args.json || "");
  if (name === "word_count") return wordCount(args.text || ctx.prompt);
  if (name === "outline") return outlineText(args.text || ctx.vault || ctx.prompt);
  if (name === "app_list") return describeConnections();
  if (name === "app_call") {
    const app = (args.app || "").toLowerCase();
    if (!app) return "app_call:\nName the app: github, linear, notion, or slack. Call app_list if you are not sure it is connected.";
    return callConnectedApp(app, (args.action || "").toLowerCase(), args);
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
    const note = await runTool(name, args, { prompt, vault: opts.vault, vaultName: opts.vaultName, roomId: opts.roomId }).catch((e) => `${name}:\n${String(e)}`);
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
  if (opts.tools.includes("app_list") && /github|linear|notion|slack|connected app/i.test(prompt)) {
    await emit("app_list");
  }
  if (opts.tools.includes("clock") && /\b(time|date|today|tomorrow)\b/i.test(prompt)) await emit("clock");
  if (opts.tools.includes("calc")) {
    const math = prompt.match(/(?:^|\s)([\d][\d\s+\-*/().%]{2,40})/);
    if (math?.[1] && /[+\-*/%]/.test(math[1])) await emit("calc", { expression: math[1] });
  }
  if (opts.tools.includes("note_read") && /\b(notes?|remember|saved)\b/i.test(prompt)) await emit("note_read");
  if (opts.tools.includes("json_check") && /\{[\s\S]*\}/.test(prompt) && /\bjson\b/i.test(prompt)) await emit("json_check", { text: prompt.match(/\{[\s\S]*\}/)?.[0] || "" });
  if (opts.tools.includes("word_count") && /\b(word count|how long|how many words)\b/i.test(prompt)) await emit("word_count", { text: prompt });
  if (opts.tools.includes("outline") && /\b(outline|headings|structure)\b/i.test(prompt)) await emit("outline", { text: opts.vault || prompt });
  if (opts.tools.includes("skill_read")) {
    const pack = formatSkillPack(matchingSkills(prompt, opts.roomId ?? null));
    if (pack) {
      traces.push(`skill_read:\n${pack}`);
      opts.onTool({ id: `${Date.now()}-skill_read`, role: "tool", text: `skill_read:\n${pack}`, at: Date.now() });
    }
  }

  return traces;
}

const HANDS = [
  "Act with your tools before you answer when the task needs facts, a page, the channel document, code, or a skill.",
  "Call web_search, then http_fetch the best https link, before you cite the web.",
  "Call file_read before you rewrite a document. After doc_edit, put the full new document between [[doc]] and [[/doc]].",
  "Call skill_list, then skill_read the matching name, before you follow a skill.",
  "code_run takes javascript that returns a value. No imports and no network.",
  "Call app_list before app_call. If the app is not connected, say which token is missing in Settings. Do not invent issues, pages, or messages.",
  "Call clock for the current time, calc for arithmetic, json_check for JSON, word_count for length, outline for headings, note_read before you rely on a saved note, and note_write only when asked to remember something.",
  "Never invent an observation. If a tool fails, say the error and try a different call.",
  "Prefer the tool interface. If it is missing, emit [[tool:name]] {\"key\":\"value\"} and wait.",
].join(" ");

export function buildAgentSystem(agent: AgentDef, flags: { codeMode: boolean; vault: boolean; agentMode: boolean; fast?: boolean; thinking?: boolean; seat?: ChatSeat }) {
  const toolHelp = `Tools you may call: ${agent.tools.join(", ") || "none"}. ${HANDS}`;
  const pace = flags.seat
    ? seatGuide(flags.seat)
    : flags.fast
      ? "Fast mode. Finish in a few sentences and skip extra tool calls."
      : flags.thinking
        ? "Thinking mode. Work through the task in this private thread, then give one clear answer. Do not mention that you are thinking."
        : "";
  return [AGENT_GUARD, agent.systemPrompt, toolHelp, pace, flags.agentMode ? "Agent mode on." : "", flags.vault ? "Vault attached." : "", flags.codeMode ? "Use fenced code blocks." : ""]
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
  onReset?: () => void;
  toolCtx?: ToolContext;
  maxSteps?: number;
}): Promise<{ text: string; meta: AgentRunMeta }> {
  const started = Date.now();
  const toolsUsed: string[] = [];
  let messages = [...opts.history];
  let full = "";

  const ctx: ToolContext = {
    prompt: opts.toolCtx?.prompt || "",
    vault: opts.toolCtx?.vault,
    vaultName: opts.toolCtx?.vaultName,
    roomId: opts.toolCtx?.roomId,
  };

  const steps = Math.min(MAX_STEPS, Math.max(1, opts.maxSteps ?? MAX_STEPS));
  for (let step = 0; step < steps; step++) {
    const last = step === steps - 1;
    if (last && toolsUsed.length) {
      messages = [...messages, { role: "user", content: "Final step. Answer from the observations. Do not call tools." }];
    }
    let chunk = "";
    const turn = await streamChat({
      baseUrl: opts.brain.baseUrl,
      apiKey: opts.brain.apiKey,
      model: opts.brain.model,
      messages,
      tools: last ? undefined : toolDefs(opts.agent.tools),
      useProxy: opts.useProxy,
      signal: opts.signal,
      onDelta: (d) => {
        chunk += d;
        full += d;
        opts.onDelta(d);
      },
    });
    chunk = turn.text || chunk;
    if (last) break;

    const native = turn.toolCalls.filter((call) => opts.agent.tools.includes(call.name as AgentTool));
    const textCalls = native.length ? [] : [...chunk.matchAll(TOOL_RE)].filter((call) => opts.agent.tools.includes(call[1] as AgentTool));
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
        const note = await runTool(name, stringArgs(call.arguments), ctx).catch((e) => String(e));
        opts.onTool({ id: `${Date.now()}-${name}`, role: "tool", text: note, at: Date.now() });
        messages = [...messages, { role: "tool", tool_call_id: call.id || name, content: note }];
      }
      full = "";
      opts.onReset?.();
      continue;
    }

    const observations: string[] = [];
    for (const call of textCalls) {
      const name = call[1] as AgentTool;
      let args: Record<string, string> = {};
      try {
        args = JSON.parse(call[2]!) as Record<string, string>;
      } catch {
        args = {};
      }
      toolsUsed.push(name);
      const note = await runTool(name, args, ctx).catch((e) => String(e));
      observations.push(note);
      opts.onTool({ id: `${Date.now()}-${name}`, role: "tool", text: note, at: Date.now() });
    }
    messages = [...messages, { role: "assistant", content: chunk }, { role: "user", content: `Observations:\n${observations.join("\n\n")}` }];
    full = "";
    opts.onReset?.();
  }

  return { text: full, meta: { steps: toolsUsed.length + 1, tools: toolsUsed, ms: Date.now() - started } };
}
