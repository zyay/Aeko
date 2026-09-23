export type Line = {
  id: string;
  role: "user" | "aeko" | "tool" | "member" | "system";
  text: string;
  at?: number;
  author?: string;
  agentId?: string;
  parentId?: string | null;
  record?: "canvas" | "note" | "patch";
  meta?: { ms?: number; tools?: string[] };
};
export type Room = {
  id: string;
  title: string;
  lastAt?: number;
  messageCount?: number;
  local?: boolean;
  kind?: "channel" | "dm" | "project" | "canvas";
  visibility?: "open" | "private";
  topic?: string;
};
export type RoomPreview = { text: string; lastAt: number };
export type View = "desk" | "chat" | "brain";

export type BrainConfig = {
  mode: "byok" | "server";
  baseUrl: string;
  apiKey: string;
  model: string;
  proxyViaVercel: boolean;
  valid: boolean;
  onboarded: boolean;
  onboardingStep?: number;
};
