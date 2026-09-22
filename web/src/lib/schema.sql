-- Vercel Postgres. Set DATABASE_URL. Ciphertext only.
CREATE TABLE IF NOT EXISTS aeko_users (
  email TEXT PRIMARY KEY,
  public_key TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS aeko_rooms (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'channel',
  visibility TEXT NOT NULL DEFAULT 'open',
  topic TEXT NOT NULL DEFAULT ''
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
  created_at BIGINT NOT NULL,
  parent_id TEXT
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
CREATE TABLE IF NOT EXISTS aeko_reactions (
  message_id TEXT NOT NULL,
  email TEXT NOT NULL,
  emoji TEXT NOT NULL,
  PRIMARY KEY (message_id, email, emoji)
);
CREATE TABLE IF NOT EXISTS aeko_audit (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  hash TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS aeko_workflows (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  yaml TEXT NOT NULL,
  enabled BOOLEAN NOT NULL,
  last_run BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS learn_profiles (
  email TEXT PRIMARY KEY,
  profile_json TEXT NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS learn_vocabulary (
  email TEXT NOT NULL,
  word_id TEXT NOT NULL,
  data_json TEXT NOT NULL,
  PRIMARY KEY (email, word_id)
);
