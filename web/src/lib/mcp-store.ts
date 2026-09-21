"use client";

import type { McpPreset } from "@/lib/skills-registry";

export type McpServerConfig = McpPreset & {
  enabled: boolean;
  envValues?: Record<string, string>;
};

const KEY = "abc-mcp-servers";

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
  return saveMcpServers([{ ...preset, enabled: true, envValues: {} }, ...list]);
}

export function toggleMcp(id: string, enabled: boolean) {
  return saveMcpServers(listMcpServers().map((s) => (s.id === id ? { ...s, enabled } : s)));
}

export function removeMcp(id: string) {
  return saveMcpServers(listMcpServers().filter((s) => s.id !== id));
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
    } else if (s.url) {
      mcpServers[s.name] = { url: s.url };
    }
  }
  return JSON.stringify({ mcpServers }, null, 2);
}

export function setMcpEnv(id: string, key: string, value: string) {
  return saveMcpServers(listMcpServers().map((s) => (s.id === id ? { ...s, envValues: { ...s.envValues, [key]: value } } : s)));
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
