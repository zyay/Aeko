import { neon } from "@neondatabase/serverless";
import { normEmail } from "@/lib/store";
import type { LearnSnapshot } from "@/lib/learn-store";

function pg() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? neon(url) : null;
}

let schemaReady = false;

async function ready() {
  const sql = pg();
  if (!sql) return null;
  if (!schemaReady) {
    await sql`CREATE TABLE IF NOT EXISTS learn_profiles (
      email TEXT PRIMARY KEY,
      profile_json TEXT NOT NULL,
      updated_at BIGINT NOT NULL
    )`;
    await sql`CREATE TABLE IF NOT EXISTS learn_vocabulary (
      email TEXT NOT NULL,
      word_id TEXT NOT NULL,
      data_json TEXT NOT NULL,
      PRIMARY KEY (email, word_id)
    )`;
    schemaReady = true;
  }
  return sql;
}

export async function getLearnProfile(email: string): Promise<LearnSnapshot | null> {
  const sql = await ready();
  if (!sql) return null;
  const who = normEmail(email);
  const rows = await sql`SELECT profile_json FROM learn_profiles WHERE email = ${who} LIMIT 1`;
  if (!rows.length) return null;
  try {
    return JSON.parse(String(rows[0].profile_json)) as LearnSnapshot;
  } catch {
    return null;
  }
}

export async function upsertLearnProfile(email: string, snapshot: LearnSnapshot) {
  const sql = await ready();
  if (!sql) return false;
  const who = normEmail(email);
  const json = JSON.stringify(snapshot);
  const now = Date.now();
  await sql`INSERT INTO learn_profiles (email, profile_json, updated_at) VALUES (${who}, ${json}, ${now})
    ON CONFLICT (email) DO UPDATE SET profile_json = ${json}, updated_at = ${now}`;
  return true;
}
