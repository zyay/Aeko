"use client";

import { APP_CATALOG, actionHelp, type AppId } from "@/lib/connected-apps";

export type StoredConnection = {
  id: AppId;
  account: string;
  token: string;
  connectedAt: number;
};

const KEY = "aeko-connections";

function read(): StoredConnection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown[];
    return raw.filter((item): item is StoredConnection => {
      if (!item || typeof item !== "object") return false;
      const row = item as StoredConnection;
      return APP_CATALOG.some((app) => app.id === row.id) && typeof row.token === "string" && row.token.length > 0;
    });
  } catch {
    return [];
  }
}

function write(rows: StoredConnection[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event("aeko-connections-change"));
}

export function listConnections() {
  return read().map((row) => ({ id: row.id, account: row.account, connectedAt: row.connectedAt }));
}

export function connectionToken(id: string) {
  return read().find((row) => row.id === id)?.token ?? "";
}

export function saveConnection(id: AppId, token: string, account: string) {
  const next = read().filter((row) => row.id !== id);
  next.push({ id, token: token.trim(), account, connectedAt: Date.now() });
  write(next);
}

export function removeConnection(id: AppId) {
  write(read().filter((row) => row.id !== id));
}

export function describeConnections() {
  const rows = listConnections();
  if (!rows.length) {
    return "app_list:\nNo apps connected. GitHub, Linear, Notion, and Slack can be added in Settings. The token stays in this browser.";
  }
  const lines = rows.map((row) => {
    const meta = APP_CATALOG.find((app) => app.id === row.id);
    const who = row.account ? ` as ${row.account}` : "";
    return `${row.id}${who} — ${meta ? actionHelp(row.id) : ""}`;
  });
  return `app_list:\n${lines.join("\n")}`;
}

async function postApp(app: string, action: string, args: Record<string, string>, token: string) {
  const res = await fetch("/api/tools/app", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app, action, args, token }),
  });
  let json: { text?: string; error?: string; account?: string } = {};
  try {
    json = (await res.json()) as { text?: string; error?: string; account?: string };
  } catch {
    json = {};
  }
  return { ok: res.ok, status: res.status, text: json.text || "", error: json.error || "", account: json.account || "" };
}

export async function testConnection(app: AppId, token: string) {
  const result = await postApp(app, "me", {}, token.trim());
  if (!result.ok) throw new Error(result.error || result.text || "Could not connect.");
  return result.account || "connected";
}

export async function callConnectedApp(app: string, action: string, args: Record<string, string>) {
  const meta = APP_CATALOG.find((item) => item.id === app);
  const label = meta?.label ?? app;
  const token = connectionToken(app);
  if (!token) return `${label} is not connected. Add the token in Settings. It stays in this browser.`;
  const result = await postApp(app, action, args, token);
  if (!result.ok) return `${label} ${action}:\n${result.error || result.text || `The call failed (${result.status}).`}`;
  return `${label} ${action}:\n${result.text || "Empty response."}`;
}
