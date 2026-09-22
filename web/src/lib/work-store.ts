"use client";

export type Triage = "open" | "waiting" | "resolved" | "delegated";

export type Workflow = {
  id: string;
  name: string;
  agentId: string;
  trigger: "manual" | "message";
  enabled: boolean;
};

const TRIAGE_KEY = "aeko-triage";
const FLOW_KEY = "aeko-workflows";

const DEFAULT_FLOWS: Workflow[] = [
  { id: "triage", name: "Inbox triage", agentId: "aeko", trigger: "message", enabled: true },
  { id: "research", name: "Research brief", agentId: "researcher", trigger: "manual", enabled: true },
  { id: "review", name: "Code review", agentId: "code-runner", trigger: "manual", enabled: false },
];

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) || "null") as T ?? fallback;
  } catch {
    return fallback;
  }
}

export function triageMap(): Record<string, Triage> {
  return read(TRIAGE_KEY, {});
}

export function setTriage(roomId: string, status: Triage) {
  const map = triageMap();
  map[roomId] = status;
  localStorage.setItem(TRIAGE_KEY, JSON.stringify(map));
  return map;
}

export function listWorkflows(): Workflow[] {
  const saved = read<Workflow[] | null>(FLOW_KEY, null);
  return saved?.length ? saved : DEFAULT_FLOWS;
}

export function saveWorkflows(flows: Workflow[]) {
  localStorage.setItem(FLOW_KEY, JSON.stringify(flows));
  return flows;
}

export function toggleWorkflow(id: string) {
  return saveWorkflows(listWorkflows().map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));
}
