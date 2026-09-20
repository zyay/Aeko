import { generateIdentity, publicJwk } from "@/lib/crypto";

export async function ensureIdentity(): Promise<JsonWebKey> {
  const existing = publicJwk();
  if (existing) return existing;
  return generateIdentity();
}

export async function syncIdentityToServer(): Promise<boolean> {
  const pub = await ensureIdentity();
  const res = await fetch("/api/me/keys", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKey: JSON.stringify(pub) }),
  });
  return res.ok;
}
