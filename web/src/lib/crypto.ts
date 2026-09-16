export type BrainMode = "byok" | "server" | "gguf";

export type BrainConfig = {
  mode: BrainMode;
  baseUrl: string;
  apiKey: string;
  model: string;
  proxyViaVercel: boolean;
  valid: boolean;
  onboarded: boolean;
};

const DEVICE = "lyan-device-key";

async function deviceKey(): Promise<CryptoKey> {
  const raw = localStorage.getItem(DEVICE);
  if (raw) {
    const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
  }
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem(DEVICE, btoa(String.fromCharCode(...bytes)));
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function saveSecret(plain: string): Promise<string> {
  const key = await deviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  return JSON.stringify({ iv: btoa(String.fromCharCode(...iv)), ct: btoa(String.fromCharCode(...new Uint8Array(data))) });
}

export async function loadSecret(blob: string): Promise<string> {
  const { iv, ct } = JSON.parse(blob) as { iv: string; ct: string };
  const key = await deviceKey();
  const ivb = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const ctb = Uint8Array.from(atob(ct), (c) => c.charCodeAt(0));
  const out = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivb }, key, ctb);
  return new TextDecoder().decode(out);
}

export async function saveBrain(cfg: BrainConfig) {
  const copy = { ...cfg, apiKey: cfg.apiKey ? await saveSecret(cfg.apiKey) : "" };
  localStorage.setItem("lyan-brain", JSON.stringify(copy));
}

export async function loadBrain(): Promise<BrainConfig | null> {
  const raw = localStorage.getItem("lyan-brain");
  if (!raw) return null;
  const parsed = JSON.parse(raw) as BrainConfig;
  if (parsed.apiKey) parsed.apiKey = await loadSecret(parsed.apiKey).catch(() => "");
  return parsed;
}

export async function generateIdentity() {
  const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const pub = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const priv = await crypto.subtle.exportKey("jwk", pair.privateKey);
  localStorage.setItem("lyan-priv", await saveSecret(JSON.stringify(priv)));
  localStorage.setItem("lyan-pub", JSON.stringify(pub));
  return pub;
}

export function publicJwk(): JsonWebKey | null {
  const raw = localStorage.getItem("lyan-pub");
  return raw ? (JSON.parse(raw) as JsonWebKey) : null;
}

async function privateKey(): Promise<CryptoKey> {
  const blob = localStorage.getItem("lyan-priv");
  if (!blob) throw new Error("no identity");
  const jwk = JSON.parse(await loadSecret(blob)) as JsonWebKey;
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
}

export async function encryptMessage(roomKeyB64: string, plaintext: string) {
  const raw = Uint8Array.from(atob(roomKeyB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
  return {
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ct))),
  };
}

export async function decryptMessage(roomKeyB64: string, iv: string, ciphertext: string) {
  const raw = Uint8Array.from(atob(roomKeyB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
  const ivb = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const ctb = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const out = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivb }, key, ctb);
  return new TextDecoder().decode(out);
}

export function newRoomKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes));
}

export async function wrapRoomKey(roomKeyB64: string, theirPub: JsonWebKey) {
  const their = await crypto.subtle.importKey("jwk", theirPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const mine = await privateKey();
  const bits = await crypto.subtle.deriveBits({ name: "ECDH", public: their }, mine, 256);
  const wrapKey = await crypto.subtle.importKey("raw", bits, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const room = Uint8Array.from(atob(roomKeyB64), (c) => c.charCodeAt(0));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, wrapKey, room);
  return {
    wrapIv: btoa(String.fromCharCode(...iv)),
    wrappedKey: btoa(String.fromCharCode(...new Uint8Array(ct))),
  };
}

export async function unwrapRoomKey(wrappedKey: string, wrapIv: string, theirPub: JsonWebKey) {
  const their = await crypto.subtle.importKey("jwk", theirPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const mine = await privateKey();
  const bits = await crypto.subtle.deriveBits({ name: "ECDH", public: their }, mine, 256);
  const wrapKey = await crypto.subtle.importKey("raw", bits, "AES-GCM", false, ["decrypt"]);
  const iv = Uint8Array.from(atob(wrapIv), (c) => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(wrappedKey), (c) => c.charCodeAt(0));
  const room = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, wrapKey, ct);
  return btoa(String.fromCharCode(...new Uint8Array(room)));
}
