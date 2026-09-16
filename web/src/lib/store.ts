import { neon } from "@neondatabase/serverless";
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
type ClaimRow = { code: string; email: string; name: string; token: string; exp: number };
export type PushRow = { email: string; endpoint: string; p256dh: string; auth: string };
type Db = {
  users: UserRow[];
  rooms: RoomRow[];
  members: MemberRow[];
  messages: MessageRow[];
  tokens: TokenRow[];
  claims: ClaimRow[];
  push: PushRow[];
};

const empty = (): Db => ({ users: [], rooms: [], members: [], messages: [], tokens: [], claims: [], push: [] });

function filePath() {
  const dir = process.env.VERCEL ? "/tmp/aeko" : join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  return join(dir, "aeko-store.json");
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
      claims: parsed.claims ?? [],
      push: parsed.push ?? [],
    };
  } catch {
    return empty();
  }
}

function save(db: Db) {
  writeFileSync(filePath(), JSON.stringify(db, null, 2));
}

function pg() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? neon(url) : null;
}

let schemaReady = false;
async function ready() {
  const sql = pg();
  if (!sql) return null;
  if (!schemaReady) {
    await sql`CREATE TABLE IF NOT EXISTS aeko_users (email TEXT PRIMARY KEY, public_key TEXT NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS aeko_rooms (id TEXT PRIMARY KEY, title TEXT NOT NULL, created_at BIGINT NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS aeko_members (
      room_id TEXT NOT NULL, email TEXT NOT NULL, wrapped_key TEXT NOT NULL, wrap_iv TEXT NOT NULL, peer_pub TEXT NOT NULL,
      PRIMARY KEY (room_id, email))`;
    await sql`CREATE TABLE IF NOT EXISTS aeko_messages (
      id TEXT PRIMARY KEY, room_id TEXT NOT NULL, sender TEXT NOT NULL, iv TEXT NOT NULL, ciphertext TEXT NOT NULL, created_at BIGINT NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS aeko_tokens (token TEXT PRIMARY KEY, email TEXT NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS aeko_claims (code TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL, token TEXT NOT NULL, exp BIGINT NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS aeko_push (endpoint TEXT PRIMARY KEY, email TEXT NOT NULL, p256dh TEXT NOT NULL, auth TEXT NOT NULL)`;
    schemaReady = true;
  }
  return sql;
}

export function dbKind() {
  return pg() ? "postgres" : "file";
}

export async function upsertUser(email: string, publicKey: string) {
  const sql = await ready();
  if (sql) {
    await sql`INSERT INTO aeko_users (email, public_key) VALUES (${email}, ${publicKey})
      ON CONFLICT (email) DO UPDATE SET public_key = ${publicKey}`;
    return;
  }
  const db = load();
  const i = db.users.findIndex((u) => u.email === email);
  if (i >= 0) db.users[i] = { email, publicKey };
  else db.users.push({ email, publicKey });
  save(db);
}

export async function getUser(email: string) {
  const sql = await ready();
  if (sql) {
    const rows = await sql`SELECT email, public_key AS "publicKey" FROM aeko_users WHERE email = ${email}`;
    return (rows[0] as UserRow | undefined) ?? undefined;
  }
  return load().users.find((u) => u.email === email);
}

export async function createRoom(title: string, owner: string, wrappedKey: string, wrapIv: string, peerPub: string) {
  const id = crypto.randomUUID();
  const sql = await ready();
  const createdAt = Date.now();
  if (sql) {
    await sql`INSERT INTO aeko_rooms (id, title, created_at) VALUES (${id}, ${title}, ${createdAt})`;
    await sql`INSERT INTO aeko_members (room_id, email, wrapped_key, wrap_iv, peer_pub)
      VALUES (${id}, ${owner}, ${wrappedKey}, ${wrapIv}, ${peerPub})`;
    return id;
  }
  const db = load();
  db.rooms.push({ id, title, createdAt });
  db.members.push({ roomId: id, email: owner, wrappedKey, wrapIv, peerPub });
  save(db);
  return id;
}

export async function getRoom(id: string) {
  const sql = await ready();
  if (sql) {
    const rows = await sql`SELECT id, title, created_at AS "createdAt" FROM aeko_rooms WHERE id = ${id}`;
    return (rows[0] as RoomRow | undefined) ?? undefined;
  }
  return load().rooms.find((r) => r.id === id);
}

export async function roomsFor(email: string) {
  const sql = await ready();
  if (sql) {
    return (await sql`SELECT r.id, r.title, r.created_at AS "createdAt" FROM aeko_rooms r
      JOIN aeko_members m ON m.room_id = r.id WHERE m.email = ${email} ORDER BY r.created_at DESC`) as RoomRow[];
  }
  const db = load();
  const ids = new Set(db.members.filter((m) => m.email === email).map((m) => m.roomId));
  return db.rooms.filter((r) => ids.has(r.id));
}

export async function addMember(roomId: string, email: string, wrappedKey: string, wrapIv: string, peerPub: string) {
  const sql = await ready();
  if (sql) {
    await sql`INSERT INTO aeko_members (room_id, email, wrapped_key, wrap_iv, peer_pub)
      VALUES (${roomId}, ${email}, ${wrappedKey}, ${wrapIv}, ${peerPub})
      ON CONFLICT (room_id, email) DO UPDATE SET wrapped_key = ${wrappedKey}, wrap_iv = ${wrapIv}, peer_pub = ${peerPub}`;
    return;
  }
  const db = load();
  if (!db.rooms.some((r) => r.id === roomId)) throw new Error("no room");
  db.members = db.members.filter((m) => !(m.roomId === roomId && m.email === email));
  db.members.push({ roomId, email, wrappedKey, wrapIv, peerPub });
  save(db);
}

export async function membership(roomId: string, email: string) {
  const sql = await ready();
  if (sql) {
    const rows = await sql`SELECT room_id AS "roomId", email, wrapped_key AS "wrappedKey", wrap_iv AS "wrapIv", peer_pub AS "peerPub"
      FROM aeko_members WHERE room_id = ${roomId} AND email = ${email}`;
    return (rows[0] as MemberRow | undefined) ?? undefined;
  }
  return load().members.find((m) => m.roomId === roomId && m.email === email);
}

export async function membersOf(roomId: string) {
  const sql = await ready();
  if (sql) {
    return (await sql`SELECT room_id AS "roomId", email, wrapped_key AS "wrappedKey", wrap_iv AS "wrapIv", peer_pub AS "peerPub"
      FROM aeko_members WHERE room_id = ${roomId}`) as MemberRow[];
  }
  return load().members.filter((m) => m.roomId === roomId);
}

export async function addMessage(row: Omit<MessageRow, "id" | "createdAt">) {
  const msg: MessageRow = { ...row, id: crypto.randomUUID(), createdAt: Date.now() };
  const sql = await ready();
  if (sql) {
    await sql`INSERT INTO aeko_messages (id, room_id, sender, iv, ciphertext, created_at)
      VALUES (${msg.id}, ${msg.roomId}, ${msg.from}, ${msg.iv}, ${msg.ciphertext}, ${msg.createdAt})`;
    return msg;
  }
  const db = load();
  db.messages.push(msg);
  save(db);
  return msg;
}

export async function messagesOf(roomId: string) {
  const sql = await ready();
  if (sql) {
    return (await sql`SELECT id, room_id AS "roomId", sender AS "from", iv, ciphertext, created_at AS "createdAt"
      FROM aeko_messages WHERE room_id = ${roomId} ORDER BY created_at`) as MessageRow[];
  }
  return load().messages.filter((m) => m.roomId === roomId).sort((a, b) => a.createdAt - b.createdAt);
}

export async function issueToken(email: string) {
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const sql = await ready();
  if (sql) {
    await sql`DELETE FROM aeko_tokens WHERE email = ${email}`;
    await sql`INSERT INTO aeko_tokens (token, email) VALUES (${token}, ${email})`;
    return token;
  }
  const db = load();
  db.tokens = db.tokens.filter((t) => t.email !== email);
  db.tokens.push({ token, email });
  save(db);
  return token;
}

export async function emailForToken(token: string) {
  const sql = await ready();
  if (sql) {
    const rows = await sql`SELECT email FROM aeko_tokens WHERE token = ${token}`;
    return (rows[0] as { email: string } | undefined)?.email;
  }
  return load().tokens.find((t) => t.token === token)?.email;
}

export async function issueClaim(email: string, name: string) {
  const token = await issueToken(email);
  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  const exp = Date.now() + 120_000;
  const sql = await ready();
  if (sql) {
    await sql`DELETE FROM aeko_claims WHERE email = ${email}`;
    await sql`INSERT INTO aeko_claims (code, email, name, token, exp) VALUES (${code}, ${email}, ${name}, ${token}, ${exp})`;
    return { code, email, name };
  }
  const db = load();
  db.claims = db.claims.filter((c) => c.email !== email);
  db.claims.push({ code, email, name, token, exp });
  save(db);
  return { code, email, name };
}

export async function consumeClaim(code: string) {
  const now = Date.now();
  const sql = await ready();
  if (sql) {
    const rows = await sql`SELECT email, name, token, exp FROM aeko_claims WHERE code = ${code}`;
    const row = rows[0] as { email: string; name: string; token: string; exp: number } | undefined;
    if (!row || Number(row.exp) < now) return null;
    await sql`DELETE FROM aeko_claims WHERE code = ${code}`;
    return { email: row.email, name: row.name, token: row.token };
  }
  const db = load();
  const row = db.claims.find((c) => c.code === code);
  if (!row || row.exp < now) return null;
  db.claims = db.claims.filter((c) => c.code !== code);
  save(db);
  return { email: row.email, name: row.name, token: row.token };
}

export async function savePush(row: PushRow) {
  const sql = await ready();
  if (sql) {
    await sql`INSERT INTO aeko_push (endpoint, email, p256dh, auth) VALUES (${row.endpoint}, ${row.email}, ${row.p256dh}, ${row.auth})
      ON CONFLICT (endpoint) DO UPDATE SET email = ${row.email}, p256dh = ${row.p256dh}, auth = ${row.auth}`;
    return;
  }
  const db = load();
  db.push = db.push.filter((p) => p.endpoint !== row.endpoint);
  db.push.push(row);
  save(db);
}

export async function pushForRoom(roomId: string) {
  const people = await membersOf(roomId);
  const emails = new Set(people.map((p) => p.email));
  const sql = await ready();
  if (sql) {
    const rows = (await sql`SELECT endpoint, email, p256dh, auth FROM aeko_push`) as PushRow[];
    return rows.filter((r) => emails.has(r.email));
  }
  return load().push.filter((p) => emails.has(p.email));
}
