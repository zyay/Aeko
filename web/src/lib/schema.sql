-- Vercel Postgres. Set DATABASE_URL. Ciphertext only.
CREATE TABLE IF NOT EXISTS aeko_users (
  email TEXT PRIMARY KEY,
  public_key TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS aeko_rooms (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS aeko_members (
  room_id TEXT NOT NULL,
  email TEXT NOT NULL,
  wrapped_key TEXT NOT NULL,
  wrap_iv TEXT NOT NULL,
  peer_pub TEXT NOT NULL,
  PRIMARY KEY (room_id, email)
);
CREATE TABLE IF NOT EXISTS aeko_messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  iv TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS aeko_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS aeko_claims (
  code TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  token TEXT NOT NULL,
  exp BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS aeko_push (
  endpoint TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL
);
