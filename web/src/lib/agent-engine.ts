import type { Line } from "@/components/aeko-app-types";
import type { AgentDef, AgentTool } from "@/lib/agents";
import type { BrainConfig } from "@/components/aeko-app-types";
import type { ChatMessage } from "@/lib/llm";
import { streamChat } from "@/lib/llm";
import { httpFetch, webSearch, readVault, runCodeSnippet } from "@/lib/web-tools";

const TOOL_RE = /\[\[tool:(\w+)\]\]\s*(\{[\s\S]*?\})/g;
const MAX_STEPS = 5;

function wantsWeb(text: string) {
  return /search|look up|latest|news|what is|who is|weather|web|http/i.test(text);
}

export function shouldInvokeAgent(prompt: string, agentMode: boolean) {
  return agentMode || /^@(aeko|signal|code|signal-monitor|code-runner|researcher|writer)\b/i.test(prompt) || /^\/agent\b/i.test(prompt);
}

async function runTool(
  name: AgentTool,
  args: Record<string, string>,
  ctx: { prompt: string; vault?: string; vaultName?: string },
): Promise<string> {
  if (name === "web_search") return webSearch(args.query || ctx.prompt);
  if (name === "http_fetch") return httpFetch(args.url || ctx.prompt.match(/https:\/\/[^\s]+/)?.[0] || "");
  if (name === "file_read") return readVault(ctx.vault, ctx.vaultName);
  if (name === "code_run") return runCodeSnippet(args.code || ctx.prompt);
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
    onTool: (line: Line) => void;
  },
): Promise<string[]> {
  const traces: string[] = [];
  const allowSearch = opts.tools.includes("web_search");
  const allowFetch = opts.tools.includes("http_fetch");
  const runSearch = allowSearch && (opts.webMode || opts.agentMode || wantsWeb(prompt));
  const url = prompt.match(/https:\/\/[^\s]+/)?.[0];

  const emit = async (name: AgentTool, args: Record<string, string> = {}) => {
    if (!opts.tools.includes(name) && name !== "file_read" && name !== "code_run") return "";
    const note = await runTool(name, args, { ...opts, prompt }).catch((e) => `${name}:\n${String(e)}`);
    traces.push(note);
    opts.onTool({ id: `${Date.now()}-${name}`, role: "tool", text: note, at: Date.now() });
    return note;
  };

  if (runSearch) await emit("web_search", { query: prompt });
  if (allowFetch && url) await emit("http_fetch", { url });
  if (opts.vault?.trim() && opts.tools.includes("file_read")) await emit("file_read");
  if (opts.tools.includes("code_run") && (/```/.test(prompt) || /\bcode\b/i.test(prompt))) await emit("code_run", { code: prompt });

  return traces;
}

export function buildAgentSystem(agent: AgentDef, flags: { codeMode: boolean; vault: boolean; agentMode: boolean }) {
  const toolHelp = [
    "Tools: emit [[tool:name]] {\"key\":\"value\"} then wait for results.",
    "web_search, http_fetch, file_read, code_run",
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
}): Promise<{ text: string; meta: AgentRunMeta }> {
  const started = Date.now();
  const toolsUsed: string[] = [];
  let messages = [...opts.history];
  let full = "";

  for (let step = 0; step < MAX_STEPS; step++) {
    let chunk = "";
    chunk = await streamChat({
      baseUrl: opts.brain.baseUrl,
      apiKey: opts.brain.apiKey,
      model: opts.brain.model,
      messages,
      useProxy: opts.useProxy,
      signal: opts.signal,
      onDelta: (d) => {
        chunk += d;
        full += d;
        opts.onDelta(d);
      },
    });

    const calls = [...chunk.matchAll(TOOL_RE)];
    if (!calls.length) break;

    for (const call of calls) {
      const name = call[1] as AgentTool;
      let args: Record<string, string> = {};
      try {
        args = JSON.parse(call[2]!) as Record<string, string>;
      } catch {
        args = {};
      }
      toolsUsed.push(name);
      const note = await runTool(name, args, { prompt: chunk }).catch((e) => String(e));
      opts.onTool({ id: `${Date.now()}-${name}`, role: "tool", text: note, at: Date.now() });
      messages = [...messages, { role: "assistant", content: chunk }, { role: "user", content: `Tool ${name} result:\n${note}` }];
      full = "";
    }
  }

  return { text: full, meta: { steps: toolsUsed.length + 1, tools: toolsUsed, ms: Date.now() - started } };
}
