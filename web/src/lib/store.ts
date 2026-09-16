import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type UserRow = { email: string; publicKey: string };
export type RoomRow = { id: string; title: string; createdAt: number };
export type MemberRow = { roomId: string; email: string; wrappedKey: string; wrapIv: string; peerPub: string };
export type MessageRow = {
  id: string;
  roomId: string;
  from: string;
  iv: string;
  ciphertext: string;
  createdAt: number;
};

type TokenRow = { token: string; email: string };
type Db = {
  users: UserRow[];
  rooms: RoomRow[];
  members: MemberRow[];
  messages: MessageRow[];
  tokens: TokenRow[];
};

const empty = (): Db => ({ users: [], rooms: [], members: [], messages: [], tokens: [] });

function filePath() {
  const dir = process.env.VERCEL ? "/tmp/lyan" : join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  return join(dir, "lyan-store.json");
}

function load(): Db {
  try {
    const parsed = JSON.parse(readFileSync(filePath(), "utf8")) as Partial<Db>;
    return {
      users: parsed.users ?? [],
      rooms: parsed.rooms ?? [],
      members: parsed.members ?? [],
      messages: parsed.messages ?? [],
      tokens: parsed.tokens ?? [],
    };
  } catch {
    return empty();
  }
}

function save(db: Db) {
  writeFileSync(filePath(), JSON.stringify(db, null, 2));
}

export function upsertUser(email: string, publicKey: string) {
  const db = load();
  const i = db.users.findIndex((u) => u.email === email);
  if (i >= 0) db.users[i] = { email, publicKey };
  else db.users.push({ email, publicKey });
  save(db);
}

export function getUser(email: string) {
  return load().users.find((u) => u.email === email);
}

export function createRoom(title: string, owner: string, wrappedKey: string, wrapIv: string, peerPub: string) {
  const db = load();
  const id = crypto.randomUUID();
  db.rooms.push({ id, title, createdAt: Date.now() });
  db.members.push({ roomId: id, email: owner, wrappedKey, wrapIv, peerPub });
  save(db);
  return id;
}

export function roomsFor(email: string) {
  const db = load();
  const ids = new Set(db.members.filter((m) => m.email === email).map((m) => m.roomId));
  return db.rooms.filter((r) => ids.has(r.id));
}

export function addMember(roomId: string, email: string, wrappedKey: string, wrapIv: string, peerPub: string) {
  const db = load();
  if (!db.rooms.some((r) => r.id === roomId)) throw new Error("no room");
  db.members = db.members.filter((m) => !(m.roomId === roomId && m.email === email));
  db.members.push({ roomId, email, wrappedKey, wrapIv, peerPub });
  save(db);
}

export function membership(roomId: string, email: string) {
  return load().members.find((m) => m.roomId === roomId && m.email === email);
}

export function membersOf(roomId: string) {
  return load().members.filter((m) => m.roomId === roomId);
}

export function addMessage(row: Omit<MessageRow, "id" | "createdAt">) {
  const db = load();
  const msg: MessageRow = { ...row, id: crypto.randomUUID(), createdAt: Date.now() };
  db.messages.push(msg);
  save(db);
  return msg;
}

export function messagesOf(roomId: string) {
  return load().messages.filter((m) => m.roomId === roomId).sort((a, b) => a.createdAt - b.createdAt);
}

export function issueToken(email: string) {
  const db = load();
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  db.tokens = db.tokens.filter((t) => t.email !== email);
  db.tokens.push({ token, email });
  save(db);
  return token;
}

export function emailForToken(token: string) {
  return load().tokens.find((t) => t.token === token)?.email;
}
