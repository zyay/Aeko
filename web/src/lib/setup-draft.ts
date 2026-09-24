import type { AgentDef, AgentTool } from "@/lib/agents";
import { upsertCustomAgent } from "@/lib/agents";
import { saveBrain, type BrainConfig } from "@/lib/crypto";

export const SETUP_DRAFT_KEY = "aeko-setup-draft";
export const WORKSPACE_NAME_KEY = "aeko-workspace-name";
export const WORKSPACE_PURPOSE_KEY = "aeko-workspace-purpose";
export const PINNED_AGENT_KEY = "aeko-pinned-agent";

export type SetupDraft = {
  workspace: string;
  purpose: string;
  agentId: string;
  custom: AgentDef | null;
  baseUrl: string;
  model: string;
  mode: "byok" | "server";
  apiKey: string;
  skippedConnection: boolean;
  step?: number;
  own?: boolean;
  botName?: string;
  botRole?: string;
  botPrompt?: string;
  botTools?: AgentTool[];
  provider?: string;
};

export function readSetupDraft(): SetupDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SETUP_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as SetupDraft;
    if (!draft || typeof draft.workspace !== "string") return null;
    return draft;
  } catch {
    return null;
  }
}

export function writeSetupDraft(draft: SetupDraft) {
  localStorage.setItem(SETUP_DRAFT_KEY, JSON.stringify(draft));
}

export function clearSetupDraft() {
  localStorage.removeItem(SETUP_DRAFT_KEY);
}

export async function applySetupDraft(current: BrainConfig): Promise<{ cfg: BrainConfig; agentId: string | null; saved: boolean }> {
  const draft = readSetupDraft();
  if (!draft) return { cfg: current, agentId: null, saved: false };
  if (draft.custom?.id) upsertCustomAgent(draft.custom);
  if (draft.agentId) localStorage.setItem(PINNED_AGENT_KEY, draft.agentId);
  if (draft.workspace.trim()) localStorage.setItem(WORKSPACE_NAME_KEY, draft.workspace.trim());
  if (draft.purpose.trim()) localStorage.setItem(WORKSPACE_PURPOSE_KEY, draft.purpose.trim());
  const connected = draft.mode === "server" || Boolean(draft.apiKey.trim());
  const skipped = draft.skippedConnection;
  const cfg: BrainConfig = skipped
    ? current
    : {
        ...current,
        mode: draft.mode,
        baseUrl: draft.baseUrl || current.baseUrl,
        model: draft.model || current.model,
        apiKey: draft.apiKey,
        proxyViaVercel: false,
        valid: connected,
        onboarded: true,
      };
  if (!skipped) await saveBrain(cfg);
  clearSetupDraft();
  return { cfg, agentId: draft.agentId || null, saved: !skipped };
}
