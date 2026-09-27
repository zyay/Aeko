import { jevPick } from "@/lib/jev";

export type Seat = "fast" | "reason" | "code" | "write" | "decide";
export type ChatSeat = Exclude<Seat, "decide">;

export type ModelBoard = Record<ChatSeat, string>;

export type Route = { seat: Seat; model: string; via: "rules" | "jev"; provider: string };

const KEY = "aeko-model-board";

export const CHAT_SEATS: { id: ChatSeat; label: string; hint: string; placeholder: string }[] = [
  { id: "fast", label: "Fast", hint: "Short answers and lookups", placeholder: "openai/gpt-4o-mini" },
  { id: "reason", label: "Reason", hint: "Plans, tradeoffs, hard questions", placeholder: "openai/gpt-6-astra" },
  { id: "code", label: "Code", hint: "Code, bugs, and reviews", placeholder: "openai/gpt-4o-mini" },
  { id: "write", label: "Write", hint: "Docs, mail, and tone", placeholder: "openai/gpt-4o-mini" },
];

const EMPTY: ModelBoard = { fast: "", reason: "", code: "", write: "" };

function readAll(): Record<string, ModelBoard> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}") as Record<string, ModelBoard>;
  } catch {
    return {};
  }
}

export function getBoard(agentId: string): ModelBoard {
  const saved = readAll()[agentId];
  return {
    fast: typeof saved?.fast === "string" ? saved.fast : "",
    reason: typeof saved?.reason === "string" ? saved.reason : "",
    code: typeof saved?.code === "string" ? saved.code : "",
    write: typeof saved?.write === "string" ? saved.write : "",
  };
}

export function setBoard(agentId: string, board: ModelBoard) {
  const all = readAll();
  all[agentId] = {
    fast: board.fast.trim().slice(0, 200),
    reason: board.reason.trim().slice(0, 200),
    code: board.code.trim().slice(0, 200),
    write: board.write.trim().slice(0, 200),
  };
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

const PROV_KEY = "aeko-seat-provider";

export function getSeatProviders(agentId: string): Record<ChatSeat, string> {
  if (typeof window === "undefined") return { fast: "", reason: "", code: "", write: "" };
  try {
    const all = JSON.parse(window.localStorage.getItem(PROV_KEY) || "{}") as Record<string, Partial<Record<ChatSeat, string>>>;
    const saved = all[agentId] || {};
    return {
      fast: typeof saved.fast === "string" ? saved.fast : "",
      reason: typeof saved.reason === "string" ? saved.reason : "",
      code: typeof saved.code === "string" ? saved.code : "",
      write: typeof saved.write === "string" ? saved.write : "",
    };
  } catch {
    return { fast: "", reason: "", code: "", write: "" };
  }
}

export function setSeatProviders(agentId: string, map: Record<ChatSeat, string>) {
  const all = (() => {
    try {
      return JSON.parse(window.localStorage.getItem(PROV_KEY) || "{}") as Record<string, Record<ChatSeat, string>>;
    } catch {
      return {};
    }
  })();
  all[agentId] = {
    fast: map.fast.trim().slice(0, 40),
    reason: map.reason.trim().slice(0, 40),
    code: map.code.trim().slice(0, 40),
    write: map.write.trim().slice(0, 40),
  };
  window.localStorage.setItem(PROV_KEY, JSON.stringify(all));
}

function scoreSeat(prompt: string): Seat {
  if (/\b(should we|yes or no|which option|decide|how risky|priority)\b/i.test(prompt)) return "decide";
  if (/\b(code|bug|function|typescript|debug|refactor|compile|stack trace)\b/i.test(prompt)) return "code";
  if (/\b(write|draft|email|rewrite|tone|spec|announce)\b/i.test(prompt)) return "write";
  if (/\b(why|plan|tradeoff|compare|design|architect|risk)\b/i.test(prompt)) return "reason";
  return "fast";
}

export async function routeTurn(input: {
  agentId: string;
  prompt: string;
  apiKey: string;
  gateway: boolean;
  fallback: string;
  force?: ChatSeat;
  signal?: AbortSignal;
}): Promise<Route> {
  const board = getBoard(input.agentId);
  const providers = getSeatProviders(input.agentId);
  const modelFor = (seat: ChatSeat) => board[seat].trim() || input.fallback;
  const pack = (seat: Seat, model: string, via: Route["via"]): Route => ({
    seat,
    model,
    via,
    provider: seat === "decide" ? "" : providers[seat] || "",
  });
  if (input.force) return pack(input.force, modelFor(input.force), "rules");

  const filled = CHAT_SEATS.map((seat) => seat.id).filter((seat) => board[seat].trim());
  const distinct = new Set(filled.map((seat) => board[seat].trim()));
  const scored = scoreSeat(input.prompt);
  const rules: Seat = scored === "decide" && !input.gateway ? "reason" : scored;
  if (!input.gateway || distinct.size < 2) {
    if (rules === "decide") return pack("decide", "", "rules");
    return pack(rules, modelFor(rules), "rules");
  }

  const criteria: Record<string, string> = {};
  for (const seat of CHAT_SEATS) {
    if (!board[seat.id].trim()) continue;
    criteria[seat.id] = seat.hint;
  }
  criteria.decide = "Score a yes or no, a choice, or a risk. Do not write a reply.";
  const picked = await jevPick({
    apiKey: input.apiKey,
    state: input.prompt.slice(0, 4000),
    instructions: "Which seat should handle this situation?",
    criteria,
    signal: input.signal,
  }).catch(() => null);
  const seat = (picked && (picked === "decide" || filled.includes(picked as ChatSeat)) ? picked : rules) as Seat;
  return pack(seat, seat === "decide" ? "" : modelFor(seat), picked ? "jev" : "rules");
}

export function seatGuide(seat: ChatSeat) {
  if (seat === "fast") return "This turn is the fast seat. Answer in a few sentences and skip extra tool calls.";
  if (seat === "code") return "This turn is the code seat. Show the change, the risk, and how to check it.";
  if (seat === "write") return "This turn is the write seat. Return the finished text, then one line on what changed.";
  return "This turn is the reason seat. Compare the options, then recommend one.";
}
