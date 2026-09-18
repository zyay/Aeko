export type Line = { id: string; role: "user" | "aeko" | "tool"; text: string; at?: number };
export type Room = { id: string; title: string; lastAt?: number; messageCount?: number; local?: boolean };
export type RoomPreview = { text: string; lastAt: number };
export type View = "desk" | "chat" | "brain";

export type BrainConfig = {
  mode: "byok" | "server" | "gguf";
  baseUrl: string;
  apiKey: string;
  model: string;
  proxyViaVercel: boolean;
  valid: boolean;
  onboarded: boolean;
};
