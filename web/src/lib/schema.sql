-- Vercel Postgres. Set DATABASE_URL. Ciphertext only.
CREATE TABLE IF NOT EXISTS lyan_users (
  email TEXT PRIMARY KEY,
  public_key TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS lyan_rooms (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS lyan_members (
  room_id TEXT NOT NULL,
  email TEXT NOT NULL,
  wrapped_key TEXT NOT NULL,
  wrap_iv TEXT NOT NULL,
  peer_pub TEXT NOT NULL,
  PRIMARY KEY (room_id, email)
);
CREATE TABLE IF NOT EXISTS lyan_messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  iv TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
