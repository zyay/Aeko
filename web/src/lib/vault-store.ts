import { decryptMessage, encryptMessage } from "@/lib/crypto";

const KEY = "aeko_vault_v1";

type VaultEntry = { name: string; iv: string; ciphertext: string } | { name: string; text: string };

function loadAll(): Record<string, VaultEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, VaultEntry>) : {};
  } catch {
    return {};
  }
}

function saveAll(all: Record<string, VaultEntry>) {
  localStorage.setItem(KEY, JSON.stringify(all));
}

function isEncrypted(entry: VaultEntry): entry is { name: string; iv: string; ciphertext: string } {
  return "ciphertext" in entry && "iv" in entry;
}

export async function loadVault(roomId: string, roomKey?: string | null): Promise<{ name: string; text: string } | null> {
  const entry = loadAll()[roomId];
  if (!entry) return null;
  if (isEncrypted(entry)) {
    if (!roomKey || roomKey === "local") return { name: entry.name, text: "(encrypted vault — open room to decrypt)" };
    try {
      const text = await decryptMessage(roomKey, entry.iv, entry.ciphertext);
      return { name: entry.name, text };
    } catch {
      return null;
    }
  }
  return { name: entry.name, text: entry.text };
}

export async function saveVault(roomId: string, name: string, text: string, roomKey?: string | null) {
  const all = loadAll();
  if (!text.trim()) {
    delete all[roomId];
    saveAll(all);
    return;
  }
  if (roomKey && roomKey !== "local") {
    const enc = await encryptMessage(roomKey, text);
    all[roomId] = { name, iv: enc.iv, ciphertext: enc.ciphertext };
  } else {
    all[roomId] = { name, text };
  }
  saveAll(all);
}

export function clearVault(roomId: string) {
  const all = loadAll();
  delete all[roomId];
  saveAll(all);
}
