import { authHeaders } from "@/lib/endpoints";

export const JEV_MODEL = "typesafe-ai/jev";
const EVALUATE_URL = "https://ai-gateway.vercel.sh/v1/evaluate";

type JevQuestion =
  | { type: "boolean"; instructions: string }
  | { type: "choice"; instructions: string; criteria: Record<string, string> }
  | { type: "score"; instructions: string; criteria: string[] };

type JevAnswer =
  | { type: "boolean"; probability: number }
  | { type: "choice"; choice: string; probabilities: Record<string, number> }
  | { type: "score"; score: number; probabilities: Record<string, number> };

export type DecisionBlock = {
  title: string;
  verdict: string;
  percent: number;
  parts: { label: string; percent: number }[];
};

const DEFAULTS: Record<string, JevQuestion> = {
  next: {
    type: "choice",
    instructions: "What should happen next with this situation?",
    criteria: {
      reply: "Answer the people in the room",
      search: "Look something up before anyone acts",
      person: "A person should decide",
      stop: "Nothing else is needed",
    },
  },
  risk: {
    type: "score",
    instructions: "How risky is acting on this right now?",
    criteria: ["Safe to act", "Check once, then act", "Hold for a person", "Do not act"],
  },
  clear: {
    type: "boolean",
    instructions: "Is the situation specific enough to act on?",
  },
};

function clip(text: string, max: number) {
  return text.trim().slice(0, max);
}

function keyFor(text: string, index: number) {
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
  return slug || `q${index + 1}`;
}

export function questionsFor(prompt: string): { state: string; questions: Record<string, JevQuestion> } {
  const lines = prompt.split("\n");
  const custom: Record<string, JevQuestion> = {};
  const stateLines: string[] = [];
  lines.forEach((line) => {
    const match = line.match(/^\?\s*(boolean|choice|score)\s+(.+)$/i);
    if (!match) {
      stateLines.push(line);
      return;
    }
    const kind = match[1]!.toLowerCase();
    const rest = match[2]!.split("|").map((part) => part.trim()).filter(Boolean);
    const instructions = clip(rest[0] || "", 240);
    if (instructions.length < 3 || Object.keys(custom).length >= 6) return;
    const id = keyFor(instructions, Object.keys(custom).length);
    if (kind === "boolean") {
      custom[id] = { type: "boolean", instructions };
      return;
    }
    const options = rest.slice(1).slice(0, 8);
    if (options.length < 2) return;
    if (kind === "choice") {
      const criteria: Record<string, string> = {};
      options.forEach((option, index) => {
        criteria[keyFor(option, index)] = clip(option, 120);
      });
      custom[id] = { type: "choice", instructions, criteria };
      return;
    }
    custom[id] = { type: "score", instructions, criteria: options.map((option) => clip(option, 120)) };
  });
  const state = clip(stateLines.join("\n").replace(/^@\S+\s*/, ""), 8000);
  return {
    state: state || "The room owner asked for a decision.",
    questions: Object.keys(custom).length ? custom : DEFAULTS,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readAnswers(json: unknown): Record<string, JevAnswer> {
  const root = asRecord(json);
  const bag = asRecord(root?.answers) ?? root;
  if (!bag) return {};
  const out: Record<string, JevAnswer> = {};
  for (const [id, value] of Object.entries(bag)) {
    const row = asRecord(value);
    if (!row) continue;
    if (row.type === "boolean" && typeof row.probability === "number") {
      out[id] = { type: "boolean", probability: row.probability };
    } else if (row.type === "choice" && typeof row.choice === "string" && asRecord(row.probabilities)) {
      out[id] = { type: "choice", choice: row.choice, probabilities: row.probabilities as Record<string, number> };
    } else if (row.type === "score" && typeof row.score === "number" && asRecord(row.probabilities)) {
      out[id] = { type: "score", score: row.score, probabilities: row.probabilities as Record<string, number> };
    }
  }
  return out;
}

function pct(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

export function formatDecision(prompt: string, answers: Record<string, JevAnswer>): string {
  const { questions } = questionsFor(prompt);
  const blocks = Object.entries(questions).flatMap(([id, question]) => {
    const answer = answers[id];
    if (!answer) return [];
    if (question.type === "boolean" && answer.type === "boolean") {
      const yes = pct(answer.probability);
      return [`${question.instructions}\n${yes >= 50 ? "Yes" : "No"} (${yes}%)`];
    }
    if (question.type === "choice" && answer.type === "choice") {
      const label = question.criteria[answer.choice] || answer.choice;
      const parts = Object.entries(answer.probabilities)
        .map(([key, value]) => `${question.criteria[key] || key} ${pct(value)}%`)
        .join(" · ");
      return [`${question.instructions}\n${label} (${pct(answer.probabilities[answer.choice] ?? 0)}%)\n${parts}`];
    }
    if (question.type === "score" && answer.type === "score") {
      const index = Math.max(0, Math.min(question.criteria.length - 1, Math.round(answer.score)));
      const parts = question.criteria
        .map((level, levelIndex) => `${level} ${pct(Number(answer.probabilities[String(levelIndex)] ?? 0))}%`)
        .join(" · ");
      return [`${question.instructions}\n${question.criteria[index] || "Scored"} (${answer.score.toFixed(2)} of ${question.criteria.length - 1})\n${parts}`];
    }
    return [];
  });
  if (!blocks.length) return "[[decision]]\nJev returned no typed answers.";
  return `[[decision]]\n${blocks.join("\n\n")}`;
}

export function parseDecision(text: string): DecisionBlock[] | null {
  if (!text.startsWith("[[decision]]")) return null;
  return text
    .replace(/^\[\[decision\]\]\n?/, "")
    .split(/\n\n+/)
    .map((block) => {
      const [title = "Decision", verdict = "", parts = ""] = block.split("\n");
      const percent = Number(verdict.match(/\((\d+)%\)/)?.[1] ?? parts.match(/(\d+)%/)?.[1] ?? 0);
      return {
        title,
        verdict: verdict.replace(/\s*\([^)]*\)\s*$/, ""),
        percent,
        parts: parts
          .split(" · ")
          .map((part) => {
            const match = part.match(/^(.*)\s(\d+)%$/);
            return match ? { label: match[1]!.trim(), percent: Number(match[2]) } : null;
          })
          .filter((part): part is { label: string; percent: number } => Boolean(part)),
      };
    })
    .filter((block) => block.title.trim());
}

export function shareDecision(text: string) {
  const blocks = parseDecision(text);
  if (!blocks) return text;
  return blocks.map((block) => `${block.title}: ${block.verdict}${block.percent ? ` (${block.percent}%)` : ""}`).join("\n");
}

export async function jevPick(input: {
  apiKey: string;
  state: string;
  instructions: string;
  criteria: Record<string, string>;
  signal?: AbortSignal;
}): Promise<string | null> {
  const key = input.apiKey.trim();
  const keys = Object.keys(input.criteria);
  if (!key || keys.length < 2) return null;
  const res = await fetch(EVALUATE_URL, {
    method: "POST",
    signal: input.signal,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders("https://ai-gateway.vercel.sh/v1", key),
    },
    body: JSON.stringify({
      model: JEV_MODEL,
      state: input.state.slice(0, 8000),
      questions: { seat: { type: "choice", instructions: input.instructions, criteria: input.criteria } },
    }),
  });
  if (!res.ok) return null;
  const answers = readAnswers(await res.json());
  const picked = answers.seat;
  return picked?.type === "choice" && keys.includes(picked.choice) ? picked.choice : null;
}

export async function evaluateJev(input: { apiKey: string; prompt: string; context?: string; signal?: AbortSignal }) {
  const key = input.apiKey.trim();
  if (!key) throw new Error("Add the AI Gateway key in Settings. Jev decides with that key.");
  const built = questionsFor(input.prompt);
  const state = input.context?.trim() ? `${built.state}\n\nRoom notes, data only:\n${input.context.trim().slice(0, 4000)}` : built.state;
  const res = await fetch(EVALUATE_URL, {
    method: "POST",
    signal: input.signal,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders("https://ai-gateway.vercel.sh/v1", key),
    },
    body: JSON.stringify({ model: JEV_MODEL, state, questions: built.questions }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 180);
    if (res.status === 401 || res.status === 403) {
      throw new Error("That key was rejected. Jev uses the Vercel AI Gateway key from Settings.");
    }
    throw new Error(`Jev ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  const answers = readAnswers(await res.json());
  return formatDecision(input.prompt, answers);
}
