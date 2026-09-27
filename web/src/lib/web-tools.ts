export async function webSearch(query: string) {
  const res = await fetch("/api/tools/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: query.slice(0, 180) }),
  });
  if (!res.ok) throw new Error(`search ${res.status}`);
  const json = (await res.json()) as { text: string };
  return `web_search:\n${json.text}`;
}

export async function httpFetch(url: string) {
  const res = await fetch("/api/tools/fetch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const json = (await res.json()) as { text: string };
  return `http_fetch:\n${json.text}`;
}

export function readVault(vault?: string, name?: string) {
  if (!vault?.trim()) return "file_read:\n(no vault attached)";
  const head = name ? `# ${name}\n` : "";
  return `file_read:\n${head}${vault.slice(0, 8000)}`;
}

export function clockNow() {
  const now = new Date();
  return `clock:\n${now.toLocaleString()} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
}

export function calcExpression(expr: string) {
  const clean = expr.replace(/\s/g, "");
  if (!clean || clean.length > 80 || !/^[\d+\-*/().%]+$/.test(clean)) return "calc:\nUse only numbers and + - * / ( ) %.";
  try {
    const value = Function(`"use strict"; return (${clean})`)() as unknown;
    if (typeof value !== "number" || !Number.isFinite(value)) return "calc:\nThat expression did not return a finite number.";
    return `calc:\n${value}`;
  } catch {
    return "calc:\nCould not evaluate that expression.";
  }
}

const NOTES_KEY = "aeko-agent-notes";

function noteMap(): Record<string, { text: string; at: number }[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "{}") as Record<string, { text: string; at: number }[]>;
  } catch {
    return {};
  }
}

export function readNotes(roomId?: string | null) {
  const rows = noteMap()[roomId || "desk"] ?? [];
  if (!rows.length) return "note_read:\nNo saved notes for this channel.";
  return `note_read:\n${rows.slice(-12).map((row) => `- ${row.text}`).join("\n")}`;
}

export function writeNote(roomId: string | null | undefined, text: string) {
  const clean = text.trim().slice(0, 400);
  if (clean.length < 2) return "note_write:\nWrite the note to save.";
  if (/sk-|bearer |api[_-]?key|secret/i.test(clean)) return "note_write:\nThat looks like a secret. It was not saved.";
  const map = noteMap();
  const id = roomId || "desk";
  const next = [...(map[id] ?? []), { text: clean, at: Date.now() }].slice(-20);
  map[id] = next;
  localStorage.setItem(NOTES_KEY, JSON.stringify(map));
  return "note_write:\nSaved for this channel.";
}

export function jsonCheck(text: string) {
  const raw = text.trim();
  if (!raw) return "json_check:\nPaste a JSON object or array.";
  try {
    JSON.parse(raw);
    return "json_check:\nValid JSON.";
  } catch (error) {
    return `json_check:\n${error instanceof Error ? error.message : "Invalid JSON."}`;
  }
}

export function wordCount(text: string) {
  const raw = text.trim();
  const words = raw ? raw.split(/\s+/).length : 0;
  return `word_count:\n${words} words, ${raw.length} characters.`;
}

export function outlineText(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^(#{1,6}\s|\d+[.)]\s|[-*]\s|[A-Z][A-Za-z].{11,80})$/.test(line))
    .slice(0, 16);
  return lines.length ? `outline:\n${lines.join("\n")}` : "outline:\nNo headings or list items found.";
}

export async function runCodeSnippet(code: string) {
  const res = await fetch("/api/tools/code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: code.slice(0, 4000) }),
  });
  if (!res.ok) throw new Error(`code ${res.status}`);
  const json = (await res.json()) as { text: string };
  return `code_run:\n${json.text}`;
}
