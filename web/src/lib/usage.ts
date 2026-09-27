const KEY = "aeko-usage";

export type UsageSnap = {
  turns: number;
  tools: number;
  ms: number;
  chars: number;
  byAgent: Record<string, { turns: number; tools: number }>;
  days: Record<string, number>;
};

function empty(): UsageSnap {
  return { turns: 0, tools: 0, ms: 0, chars: 0, byAgent: {}, days: {} };
}

export function readUsage(): UsageSnap {
  if (typeof window === "undefined") return empty();
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<UsageSnap>;
    return {
      turns: Number(parsed.turns) || 0,
      tools: Number(parsed.tools) || 0,
      ms: Number(parsed.ms) || 0,
      chars: Number(parsed.chars) || 0,
      byAgent: parsed.byAgent && typeof parsed.byAgent === "object" ? parsed.byAgent : {},
      days: parsed.days && typeof parsed.days === "object" ? parsed.days : {},
    };
  } catch {
    return empty();
  }
}

function dayKey(at = Date.now()) {
  return new Date(at).toISOString().slice(0, 10);
}

export function recordUsage(input: { agentId: string; tools: number; ms: number; chars: number }) {
  const snap = readUsage();
  const day = dayKey();
  const agent = snap.byAgent[input.agentId] || { turns: 0, tools: 0 };
  snap.turns += 1;
  snap.tools += Math.max(0, input.tools);
  snap.ms += Math.max(0, input.ms);
  snap.chars += Math.max(0, input.chars);
  snap.byAgent[input.agentId] = { turns: agent.turns + 1, tools: agent.tools + Math.max(0, input.tools) };
  snap.days[day] = (snap.days[day] || 0) + 1;
  const days = Object.keys(snap.days).sort();
  if (days.length > 60) {
    for (const key of days.slice(0, days.length - 60)) delete snap.days[key];
  }
  localStorage.setItem(KEY, JSON.stringify(snap));
  window.dispatchEvent(new Event("aeko-usage-change"));
}

export function todayTurns() {
  return readUsage().days[dayKey()] || 0;
}

export function tokensGuess(chars: number) {
  return Math.max(1, Math.ceil(chars / 4));
}
