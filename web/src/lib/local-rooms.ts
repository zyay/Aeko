import type { Line } from "@/components/aeko-app-types";

export type LocalRoom = {
  id: string;
  title: string;
  createdAt: number;
  lastAt: number;
  messages: Line[];
};

const KEY = "aeko_local_v1";

function load(): LocalRoom[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalRoom[];
  } catch {
    return [];
  }
}

function save(rooms: LocalRoom[]) {
  localStorage.setItem(KEY, JSON.stringify(rooms));
}

export function listLocalRooms() {
  return load().sort((a, b) => b.lastAt - a.lastAt);
}

export function getLocalRoom(id: string) {
  return load().find((r) => r.id === id) ?? null;
}

export function createLocalRoom(title: string) {
  const rooms = load();
  const room: LocalRoom = {
    id: `local-${Date.now()}`,
    title,
    createdAt: Date.now(),
    lastAt: Date.now(),
    messages: [],
  };
  rooms.unshift(room);
  save(rooms);
  return room;
}

export function appendLocalMessage(roomId: string, line: Line) {
  const rooms = load();
  const idx = rooms.findIndex((r) => r.id === roomId);
  if (idx < 0) return;
  rooms[idx]!.messages.push(line);
  rooms[idx]!.lastAt = line.at ?? Date.now();
  save(rooms);
}

export function replaceLocalMessages(roomId: string, messages: Line[]) {
  const rooms = load();
  const idx = rooms.findIndex((r) => r.id === roomId);
  if (idx < 0) return;
  rooms[idx]!.messages = messages;
  rooms[idx]!.lastAt = messages[messages.length - 1]?.at ?? rooms[idx]!.lastAt;
  save(rooms);
}

export function updateLocalMessage(roomId: string, id: string, text: string) {
  const rooms = load();
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return;
  room.messages = room.messages.map((m) => (m.id === id ? { ...m, text } : m));
  save(rooms);
}
