import type { Line } from "@/components/aeko-app-types";
import type { ChatMessage } from "@/lib/llm";
import { AGENT_PREFIX_RE, getAgent } from "@/lib/agents";

export const AEKO_PREFIX = "[[aeko]]";

export function parseAssistantPayload(plaintext: string): { text: string; agentId: string } {
  if (plaintext.startsWith(AEKO_PREFIX)) {
    return { text: plaintext.slice(AEKO_PREFIX.length), agentId: "aeko" };
  }
  const match = AGENT_PREFIX_RE.exec(plaintext);
  if (match) {
    return { text: plaintext.slice(match[0].length), agentId: match[1]! };
  }
  return { text: plaintext, agentId: "aeko" };
}

export function encodeCanvas(text: string) {
  return `[[canvas]]${text}`;
}

export function encodeNote(time: string, text: string) {
  return `[[note]]${time}\n${text}`;
}

export function encodePatch(id: string, title: string, status: "open" | "review" | "merged") {
  return `[[patch]]${id}\t${title}\t${status}`;
}

function recordKind(plaintext: string): Line["record"] | undefined {
  if (plaintext.startsWith("[[canvas]]")) return "canvas";
  if (plaintext.startsWith("[[note]]")) return "note";
  if (plaintext.startsWith("[[patch]]")) return "patch";
  return undefined;
}

export function decryptLine(
  id: string,
  from: string,
  userEmail: string | null,
  plaintext: string,
  at?: number,
  parentId?: string | null,
): Line {
  const record = recordKind(plaintext);
  if (record) {
    const text = plaintext.replace(/^\[\[(canvas|note|patch)\]\]/, "");
    return { id, role: "system", text, at, author: from, parentId, record };
  }
  if (plaintext.startsWith(AEKO_PREFIX) || AGENT_PREFIX_RE.test(plaintext)) {
    const parsed = parseAssistantPayload(plaintext);
    return { id, role: "aeko", text: parsed.text, at, agentId: parsed.agentId, parentId };
  }
  const role = from === userEmail ? "user" : "member";
  return { id, role, text: plaintext, at, author: role === "member" ? from : undefined, parentId };
}

export function buildChatHistory(lines: Line[], system: string, extraContext: string, maxTurns = 20): ChatMessage[] {
  const out: ChatMessage[] = [{ role: "system", content: system }];
  const convo = lines.filter((l) => !l.record && (l.role === "user" || l.role === "aeko" || l.role === "member")).slice(-maxTurns);
  for (const line of convo) {
    if (line.role === "aeko") {
      const name = getAgent(line.agentId ?? "aeko").name;
      out.push({ role: "assistant", content: `[${name}] ${line.text}` });
    } else {
      out.push({ role: "user", content: line.author ? `[${line.author}] ${line.text}` : line.text });
    }
  }
  if (extraContext.trim()) {
    const last = out[out.length - 1];
    if (last?.role === "user") last.content = `${last.content}\n\n${extraContext}`;
    else out.push({ role: "user", content: extraContext });
  }
  return out;
}
