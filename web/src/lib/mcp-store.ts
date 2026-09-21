"use client";

import type { McpPreset } from "@/lib/skills-registry";

export type McpServerConfig = McpPreset & {
  enabled: boolean;
  envValues?: Record<string, string>;
  risky?: boolean;
};

const KEY = "abc-mcp-servers";
const RISKY = new Set(["filesystem", "puppeteer"]);

export function listMcpServers(): McpServerConfig[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as McpServerConfig[];
  } catch {
    return [];
  }
}

export function saveMcpServers(servers: McpServerConfig[]) {
  localStorage.setItem(KEY, JSON.stringify(servers.slice(0, 50)));
  return servers;
}

export function addMcpPreset(preset: McpPreset): McpServerConfig[] {
  const list = listMcpServers();
  if (list.some((s) => s.id === preset.id)) return list;
  return saveMcpServers([{ ...preset, enabled: true, envValues: {}, risky: RISKY.has(preset.id) }, ...list]);
}

export function toggleMcp(id: string, enabled: boolean) {
  return saveMcpServers(listMcpServers().map((s) => (s.id === id ? { ...s, enabled } : s)));
}

export function removeMcp(id: string) {
  return saveMcpServers(listMcpServers().filter((s) => s.id !== id));
}

export function validateMcpExport(servers: McpServerConfig[]): string[] {
  const errors: string[] = [];
  for (const s of servers.filter((x) => x.enabled)) {
    for (const key of s.env ?? []) {
      if (!s.envValues?.[key]?.trim()) errors.push(`${s.name}: missing ${key}`);
    }
    if (s.transport === "stdio" && !s.command) errors.push(`${s.name}: missing command`);
    if ((s.transport === "sse" || s.transport === "streamable-http") && !s.url) errors.push(`${s.name}: missing url`);
  }
  return errors;
}

export function exportMcpJson(servers: McpServerConfig[]) {
  const mcpServers: Record<string, unknown> = {};
  for (const s of servers.filter((x) => x.enabled)) {
    if (s.transport === "stdio" && s.command) {
      mcpServers[s.name] = {
        command: s.command,
        args: s.args ?? [],
        env: s.envValues ?? {},
      };
    } else if (s.transport === "sse" && s.url) {
      mcpServers[s.name] = { url: s.url, transport: "sse" };
    } else if (s.transport === "streamable-http" && s.url) {
      mcpServers[s.name] = { url: s.url, transport: "streamable-http" };
    } else if (s.url) {
      mcpServers[s.name] = { url: s.url };
    }
  }
  return JSON.stringify({ mcpServers }, null, 2);
}

export function importMcpJson(text: string, merge = true): McpServerConfig[] {
  const parsed = JSON.parse(text) as { mcpServers?: Record<string, { command?: string; args?: string[]; env?: Record<string, string>; url?: string; transport?: string }> };
  const entries = Object.entries(parsed.mcpServers ?? {});
  const imported: McpServerConfig[] = entries.map(([name, cfg], i) => ({
    id: `import-${i}-${name}`.replace(/\s+/g, "-").toLowerCase(),
    name,
    description: "Imported MCP server",
    transport: (cfg.transport as McpPreset["transport"]) || (cfg.command ? "stdio" : cfg.url ? "sse" : "stdio"),
    command: cfg.command,
    args: cfg.args,
    url: cfg.url,
    env: Object.keys(cfg.env ?? {}),
    envValues: cfg.env ?? {},
    tags: ["imported"],
    niche: "Imported",
    enabled: true,
    risky: cfg.args?.includes(".") ?? false,
  }));
  if (!merge) return saveMcpServers(imported);
  const existing = listMcpServers();
  const ids = new Set(existing.map((s) => s.id));
  return saveMcpServers([...imported.filter((s) => !ids.has(s.id)), ...existing]);
}

export function setMcpEnv(id: string, key: string, value: string) {
  return saveMcpServers(listMcpServers().map((s) => (s.id === id ? { ...s, envValues: { ...s.envValues, [key]: value } } : s)));
}

export function downloadText(filename: string, text: string, mime?: string) {
  const type = mime ?? (filename.endsWith(".json") ? "application/json" : filename.endsWith(".md") ? "text/markdown" : "text/plain");
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function isRiskyPreset(id: string) {
  return RISKY.has(id);
}
