import { createHash } from "crypto";
import { neon } from "@neondatabase/serverless";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type RoomKind = "channel" | "dm" | "project" | "canvas";
export type RoomVisibility = "open" | "private";
export type UserRow = { email: string; publicKey: string };
export type RoomRow = {
  id: string;
  title: string;
  createdAt: number;
  kind: RoomKind;
  visibility: RoomVisibility;
  topic: string;
};
export type RoomSummary = RoomRow & { lastAt: number; messageCount: number };
export type MemberRow = { roomId: string; email: string; wrappedKey: string; wrapIv: string; peerPub: string };
export type MessageRow = {
  id: string;
  roomId: string;
  from: string;
  iv: string;
  ciphertext: string;
  createdAt: number;
  parentId?: string | null;
};
export type ReactionRow = { messageId: string; email: string; emoji: string };
export type AuditRow = { id: string; roomId: string; actor: string; action: string; hash: string; createdAt: number };
export type WorkflowRow = { id: string; email: string; name: string; yaml: string; enabled: boolean; lastRun: number };

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
  reactions: ReactionRow[];
  audit: AuditRow[];
  workflows: WorkflowRow[];
};

const empty = (): Db => ({
  users: [],
  rooms: [],
  members: [],
  messages: [],
  tokens: [],
  claims: [],
  push: [],
  reactions: [],
  audit: [],
  workflows: [],
});

function asRoom(row: Partial<RoomRow> & { id: string; title: string; createdAt: number }): RoomRow {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    kind: row.kind ?? "channel",
    visibility: row.visibility ?? "open",
    topic: row.topic ?? "",
  };
}

export function normEmail(email: string) {
  return email.trim().toLowerCase();
}

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
      members: parsed.members ?? [],
      messages: parsed.messages ?? [],
      tokens: parsed.tokens ?? [],
      claims: parsed.claims ?? [],
      push: parsed.push ?? [],
      reactions: parsed.reactions ?? [],
      audit: parsed.audit ?? [],
      workflows: parsed.workflows ?? [],
      rooms: (parsed.rooms ?? []).map((r) => asRoom(r)),
    };
  } catch {
    return empty();
  }
}

function save(db: Db) {
  writeFileSync(filePath(), JSON.stringify(db, null, 2));
}

let fileChain = Promise.resolve();
function withFile<T>(fn: (db: Db) => T, persist: boolean): Promise<T> {
  const run = fileChain.then(() => {
    const db = load();
    const out = fn(db);
    if (persist) save(db);
    return out;
  });
  fileChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
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
    await sql`ALTER TABLE aeko_rooms ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'channel'`;
    await sql`ALTER TABLE aeko_rooms ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'open'`;
    await sql`ALTER TABLE aeko_rooms ADD COLUMN IF NOT EXISTS topic TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE aeko_messages ADD COLUMN IF NOT EXISTS parent_id TEXT`;
    await sql`CREATE TABLE IF NOT EXISTS aeko_reactions (
      message_id TEXT NOT NULL, email TEXT NOT NULL, emoji TEXT NOT NULL, PRIMARY KEY (message_id, email, emoji))`;
    await sql`CREATE TABLE IF NOT EXISTS aeko_audit (
      id TEXT PRIMARY KEY, room_id TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, hash TEXT NOT NULL, created_at BIGINT NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS aeko_workflows (
      id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL, yaml TEXT NOT NULL, enabled BOOLEAN NOT NULL, last_run BIGINT NOT NULL)`;
    schemaReady = true;
  }
  return sql;
}

export function dbKind() {
  return pg() ? "postgres" : "file";
}

export async function upsertUser(email: string, publicKey: string) {
  const who = normEmail(email);
  const sql = await ready();
  if (sql) {
    await sql`INSERT INTO aeko_users (email, public_key) VALUES (${who}, ${publicKey})
      ON CONFLICT (email) DO UPDATE SET public_key = ${publicKey}`;
    return;
  }
  await withFile((db) => {
    const i = db.users.findIndex((u) => u.email === who);
    if (i >= 0) db.users[i] = { email: who, publicKey };
    else db.users.push({ email: who, publicKey });
  }, true);
}

export async function getUser(email: string) {
  const who = normEmail(email);
  const sql = await ready();
  if (sql) {
    const rows = await sql`SELECT email, public_key AS "publicKey" FROM aeko_users WHERE email = ${who}`;
    return (rows[0] as UserRow | undefined) ?? undefined;
  }
  return withFile((db) => db.users.find((u) => u.email === who), false);
}

export async function createRoom(
  title: string,
  owner: string,
  wrappedKey: string,
  wrapIv: string,
  peerPub: string,
  meta?: { kind?: RoomKind; visibility?: RoomVisibility; topic?: string },
) {
  const who = normEmail(owner);
  const id = crypto.randomUUID();
  const sql = await ready();
  const createdAt = Date.now();
  const kind = meta?.kind ?? "channel";
  const visibility = meta?.visibility ?? "open";
  const topic = meta?.topic ?? "";
  if (sql) {
    await sql`INSERT INTO aeko_rooms (id, title, created_at, kind, visibility, topic)
      VALUES (${id}, ${title}, ${createdAt}, ${kind}, ${visibility}, ${topic})`;
    await sql`INSERT INTO aeko_members (room_id, email, wrapped_key, wrap_iv, peer_pub)
      VALUES (${id}, ${who}, ${wrappedKey}, ${wrapIv}, ${peerPub})`;
    return id;
  }
  await withFile((db) => {
    db.rooms.push({ id, title, createdAt, kind, visibility, topic });
    db.members.push({ roomId: id, email: who, wrappedKey, wrapIv, peerPub });
  }, true);
  return id;
}

export async function getRoom(id: string) {
  const sql = await ready();
  if (sql) {
    const rows = await sql`SELECT id, title, created_at AS "createdAt", kind, visibility, topic FROM aeko_rooms WHERE id = ${id}`;
    return (rows[0] as RoomRow | undefined) ?? undefined;
  }
  return withFile((db) => db.rooms.find((r) => r.id === id), false);
}

export async function roomsFor(email: string) {
  const rows = await roomsSummaryFor(email);
  return rows.map(({ id, title, createdAt }) => ({ id, title, createdAt }));
}

export async function roomsSummaryFor(email: string) {
  const who = normEmail(email);
  const sql = await ready();
  if (sql) {
    return (await sql`SELECT r.id, r.title, r.created_at AS "createdAt", r.kind, r.visibility, r.topic,
      COALESCE(MAX(m.created_at), r.created_at) AS "lastAt",
      COUNT(m.id)::int AS "messageCount"
      FROM aeko_rooms r
      JOIN aeko_members mem ON mem.room_id = r.id AND mem.email = ${who}
      LEFT JOIN aeko_messages m ON m.room_id = r.id
      GROUP BY r.id, r.title, r.created_at, r.kind, r.visibility, r.topic
      ORDER BY "lastAt" DESC`) as RoomSummary[];
  }
  return withFile((db) => {
    const ids = new Set(db.members.filter((m) => m.email === who).map((m) => m.roomId));
    return db.rooms
      .filter((r) => ids.has(r.id))
      .map((r) => {
        const msgs = db.messages.filter((m) => m.roomId === r.id);
        const lastAt = msgs.length ? Math.max(...msgs.map((m) => m.createdAt)) : r.createdAt;
        return { ...r, lastAt, messageCount: msgs.length };
      })
      .sort((a, b) => b.lastAt - a.lastAt);
  }, false);
}

export async function removeMember(roomId: string, email: string) {
  const who = normEmail(email);
  if (!(await membership(roomId, who))) return false;
  const sql = await ready();
  if (sql) {
    await sql`DELETE FROM aeko_members WHERE room_id = ${roomId} AND email = ${who}`;
    return true;
  }
  return withFile((db) => {
    const before = db.members.length;
    db.members = db.members.filter((m) => !(m.roomId === roomId && m.email === who));
    return db.members.length < before;
  }, true);
}

export async function addMember(roomId: string, email: string, wrappedKey: string, wrapIv: string, peerPub: string) {
  const who = normEmail(email);
  const sql = await ready();
  if (sql) {
    await sql`INSERT INTO aeko_members (room_id, email, wrapped_key, wrap_iv, peer_pub)
      VALUES (${roomId}, ${who}, ${wrappedKey}, ${wrapIv}, ${peerPub})
      ON CONFLICT (room_id, email) DO UPDATE SET wrapped_key = ${wrappedKey}, wrap_iv = ${wrapIv}, peer_pub = ${peerPub}`;
    return;
  }
  await withFile((db) => {
    if (!db.rooms.some((r) => r.id === roomId)) throw new Error("no room");
    db.members = db.members.filter((m) => !(m.roomId === roomId && m.email === who));
    db.members.push({ roomId, email: who, wrappedKey, wrapIv, peerPub });
  }, true);
}

export async function membership(roomId: string, email: string) {
  const who = normEmail(email);
  const sql = await ready();
  if (sql) {
    const rows = await sql`SELECT room_id AS "roomId", email, wrapped_key AS "wrappedKey", wrap_iv AS "wrapIv", peer_pub AS "peerPub"
      FROM aeko_members WHERE room_id = ${roomId} AND email = ${who}`;
    return (rows[0] as MemberRow | undefined) ?? undefined;
  }
  return withFile((db) => db.members.find((m) => m.roomId === roomId && m.email === who), false);
}

export async function membersOf(roomId: string) {
  const sql = await ready();
  if (sql) {
    return (await sql`SELECT room_id AS "roomId", email, wrapped_key AS "wrappedKey", wrap_iv AS "wrapIv", peer_pub AS "peerPub"
      FROM aeko_members WHERE room_id = ${roomId}`) as MemberRow[];
  }
  return withFile((db) => db.members.filter((m) => m.roomId === roomId), false);
}

export async function addMessage(row: Omit<MessageRow, "id" | "createdAt">) {
  const msg: MessageRow = { ...row, from: normEmail(row.from), id: crypto.randomUUID(), createdAt: Date.now() };
  const sql = await ready();
  if (sql) {
    await sql`INSERT INTO aeko_messages (id, room_id, sender, iv, ciphertext, created_at, parent_id)
      VALUES (${msg.id}, ${msg.roomId}, ${msg.from}, ${msg.iv}, ${msg.ciphertext}, ${msg.createdAt}, ${msg.parentId ?? null})`;
    return msg;
  }
  await withFile((db) => {
    db.messages.push(msg);
  }, true);
  return msg;
}

export async function messagesOf(roomId: string) {
  const sql = await ready();
  if (sql) {
    return (await sql`SELECT id, room_id AS "roomId", sender AS "from", iv, ciphertext, created_at AS "createdAt", parent_id AS "parentId"
      FROM aeko_messages WHERE room_id = ${roomId} ORDER BY created_at`) as MessageRow[];
  }
  return withFile(
    (db) => db.messages.filter((m) => m.roomId === roomId).sort((a, b) => a.createdAt - b.createdAt),
    false,
  );
}

export async function updateRoomTitle(roomId: string, email: string, title: string) {
  const who = normEmail(email);
  if (!(await membership(roomId, who))) return false;
  const next = title.trim().slice(0, 120);
  if (!next) return false;
  const sql = await ready();
  if (sql) {
    await sql`UPDATE aeko_rooms SET title = ${next} WHERE id = ${roomId}`;
    return true;
  }
  return withFile((db) => {
    const room = db.rooms.find((r) => r.id === roomId);
    if (!room) return false;
    room.title = next;
    return true;
  }, true);
}

export async function deleteRoom(roomId: string, email: string) {
  const who = normEmail(email);
  if (!(await membership(roomId, who))) return false;
  const sql = await ready();
  if (sql) {
    await sql`DELETE FROM aeko_messages WHERE room_id = ${roomId}`;
    await sql`DELETE FROM aeko_members WHERE room_id = ${roomId}`;
    await sql`DELETE FROM aeko_rooms WHERE id = ${roomId}`;
    return true;
  }
  return withFile((db) => {
    db.messages = db.messages.filter((m) => m.roomId !== roomId);
    db.members = db.members.filter((m) => m.roomId !== roomId);
    db.rooms = db.rooms.filter((r) => r.id !== roomId);
    return true;
  }, true);
}

export async function issueToken(email: string) {
  const who = normEmail(email);
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const sql = await ready();
  if (sql) {
    await sql`DELETE FROM aeko_tokens WHERE email = ${who}`;
    await sql`INSERT INTO aeko_tokens (token, email) VALUES (${token}, ${who})`;
    return token;
  }
  await withFile((db) => {
    db.tokens = db.tokens.filter((t) => t.email !== who);
    db.tokens.push({ token, email: who });
  }, true);
  return token;
}

export async function emailForToken(token: string) {
  const sql = await ready();
  if (sql) {
    const rows = await sql`SELECT email FROM aeko_tokens WHERE token = ${token}`;
    const email = (rows[0] as { email: string } | undefined)?.email;
    return email ? normEmail(email) : undefined;
  }
  const row = await withFile((db) => db.tokens.find((t) => t.token === token), false);
  return row?.email ? normEmail(row.email) : undefined;
}

export async function issueClaim(email: string, name: string) {
  const who = normEmail(email);
  const token = await issueToken(who);
  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  const exp = Date.now() + 60_000;
  const sql = await ready();
  if (sql) {
    await sql`DELETE FROM aeko_claims WHERE email = ${who}`;
    await sql`INSERT INTO aeko_claims (code, email, name, token, exp) VALUES (${code}, ${who}, ${name}, ${token}, ${exp})`;
    return { code, email: who, name };
  }
  await withFile((db) => {
    db.claims = db.claims.filter((c) => c.email !== who);
    db.claims.push({ code, email: who, name, token, exp });
  }, true);
  return { code, email: who, name };
}

export async function consumeClaim(code: string) {
  const now = Date.now();
  const sql = await ready();
  if (sql) {
    const rows = await sql`DELETE FROM aeko_claims WHERE code = ${code} RETURNING email, name, token, exp`;
    const row = rows[0] as { email: string; name: string; token: string; exp: number | string } | undefined;
    if (!row || Number(row.exp) < now) return null;
    return { email: normEmail(row.email), name: row.name, token: row.token };
  }
  return withFile((db) => {
    const row = db.claims.find((c) => c.code === code);
    if (!row) return null;
    db.claims = db.claims.filter((c) => c.code !== code);
    if (row.exp < now) return null;
    return { email: normEmail(row.email), name: row.name, token: row.token };
  }, true);
}

export async function savePush(row: PushRow) {
  const who = normEmail(row.email);
  const sql = await ready();
  if (sql) {
    await sql`INSERT INTO aeko_push (endpoint, email, p256dh, auth) VALUES (${row.endpoint}, ${who}, ${row.p256dh}, ${row.auth})
      ON CONFLICT (endpoint) DO UPDATE SET email = ${who}, p256dh = ${row.p256dh}, auth = ${row.auth}`;
    return;
  }
  await withFile((db) => {
    db.push = db.push.filter((p) => p.endpoint !== row.endpoint);
    db.push.push({ ...row, email: who });
  }, true);
}

export async function pushForRoom(roomId: string, exceptEmail?: string) {
  const people = await membersOf(roomId);
  const skip = exceptEmail ? normEmail(exceptEmail) : "";
  const emails = new Set(people.map((p) => normEmail(p.email)).filter((e) => e && e !== skip));
  const sql = await ready();
  if (sql) {
    const rows = (await sql`SELECT endpoint, email, p256dh, auth FROM aeko_push`) as PushRow[];
    return rows.filter((r) => emails.has(normEmail(r.email)));
  }
  return withFile((db) => db.push.filter((p) => emails.has(normEmail(p.email))), false);
}

export async function addReaction(messageId: string, email: string, emoji: string) {
  const who = normEmail(email);
  const sql = await ready();
  if (sql) {
    await sql`INSERT INTO aeko_reactions (message_id, email, emoji) VALUES (${messageId}, ${who}, ${emoji})
      ON CONFLICT (message_id, email, emoji) DO NOTHING`;
    return;
  }
  await withFile((db) => {
    if (!db.reactions.some((r) => r.messageId === messageId && r.email === who && r.emoji === emoji)) {
      db.reactions.push({ messageId, email: who, emoji });
    }
  }, true);
}

export async function reactionsFor(roomId: string) {
  const sql = await ready();
  if (sql) {
    return (await sql`SELECT r.message_id AS "messageId", r.email, r.emoji
      FROM aeko_reactions r
      JOIN aeko_messages m ON m.id = r.message_id
      WHERE m.room_id = ${roomId}`) as ReactionRow[];
  }
  return withFile((db) => {
    const ids = new Set(db.messages.filter((m) => m.roomId === roomId).map((m) => m.id));
    return db.reactions.filter((r) => ids.has(r.messageId));
  }, false);
}

export async function addAudit(roomId: string, actor: string, action: string, material: string) {
  const row: AuditRow = {
    id: crypto.randomUUID(),
    roomId,
    actor: normEmail(actor),
    action,
    hash: createHash("sha256").update(material).digest("hex"),
    createdAt: Date.now(),
  };
  const sql = await ready();
  if (sql) {
    await sql`INSERT INTO aeko_audit (id, room_id, actor, action, hash, created_at)
      VALUES (${row.id}, ${row.roomId}, ${row.actor}, ${row.action}, ${row.hash}, ${row.createdAt})`;
    return row;
  }
  await withFile((db) => {
    db.audit.push(row);
  }, true);
  return row;
}

export async function auditFor(roomId: string) {
  const sql = await ready();
  if (sql) {
    return (await sql`SELECT id, room_id AS "roomId", actor, action, hash, created_at AS "createdAt"
      FROM aeko_audit WHERE room_id = ${roomId} ORDER BY created_at DESC LIMIT 80`) as AuditRow[];
  }
  return withFile((db) => db.audit.filter((a) => a.roomId === roomId).sort((a, b) => b.createdAt - a.createdAt).slice(0, 80), false);
}

export async function listWorkflows(email: string) {
  const who = normEmail(email);
  const sql = await ready();
  if (sql) {
    return (await sql`SELECT id, email, name, yaml, enabled, last_run AS "lastRun"
      FROM aeko_workflows WHERE email = ${who} ORDER BY name`) as WorkflowRow[];
  }
  return withFile((db) => db.workflows.filter((w) => w.email === who), false);
}

export async function saveWorkflow(email: string, input: { id?: string; name: string; yaml: string; enabled: boolean }) {
  const who = normEmail(email);
  const row: WorkflowRow = {
    id: input.id || crypto.randomUUID(),
    email: who,
    name: input.name.slice(0, 80),
    yaml: input.yaml.slice(0, 8000),
    enabled: input.enabled,
    lastRun: 0,
  };
  const sql = await ready();
  if (sql) {
    await sql`INSERT INTO aeko_workflows (id, email, name, yaml, enabled, last_run)
      VALUES (${row.id}, ${who}, ${row.name}, ${row.yaml}, ${row.enabled}, ${row.lastRun})
      ON CONFLICT (id) DO UPDATE SET name = ${row.name}, yaml = ${row.yaml}, enabled = ${row.enabled}`;
    return row;
  }
  await withFile((db) => {
    db.workflows = db.workflows.filter((w) => w.id !== row.id);
    db.workflows.push(row);
  }, true);
  return row;
}

export async function enabledWorkflows() {
  const sql = await ready();
  if (sql) {
    return (await sql`SELECT id, email, name, yaml, enabled, last_run AS "lastRun" FROM aeko_workflows WHERE enabled = true`) as WorkflowRow[];
  }
  return withFile((db) => db.workflows.filter((w) => w.enabled), false);
}
