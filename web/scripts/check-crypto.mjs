import { createHmac, webcrypto } from "node:crypto";

const SALT = Buffer.from("aeko-room-wrap-v2");
const INFO = Buffer.from("aeko-ecdh-aes");

function hkdfManual(ikm) {
  const prk = createHmac("sha256", SALT).update(ikm).digest();
  return createHmac("sha256", prk).update(Buffer.concat([INFO, Buffer.from([1])])).digest().subarray(0, 32);
}

async function hkdfWeb(ikm) {
  const subtle = webcrypto.subtle;
  const base = await subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const bits = await subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: SALT, info: INFO }, base, 256);
  return Buffer.from(bits);
}

async function roundtrip() {
  const subtle = webcrypto.subtle;
  const a = await subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const b = await subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const bits = await subtle.deriveBits({ name: "ECDH", public: b.publicKey }, a.privateKey, 256);
  if (new Uint8Array(bits).byteLength !== 32) throw new Error("shared secret must be 32 bytes");

  const manual = hkdfManual(Buffer.from(bits));
  const web = await hkdfWeb(bits);
  if (!manual.equals(web)) throw new Error("HKDF mismatch between HMAC and WebCrypto");

  const wrapKey = await subtle.importKey("raw", web, "AES-GCM", false, ["encrypt", "decrypt"]);
  const room = webcrypto.getRandomValues(new Uint8Array(32));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, wrapKey, room);
  const back = new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv }, wrapKey, ct));
  if (Buffer.from(back).toString("hex") !== Buffer.from(room).toString("hex")) throw new Error("hkdf wrap mismatch");

  const legacy = await subtle.importKey("raw", bits, "AES-GCM", false, ["encrypt", "decrypt"]);
  const legacyCt = await subtle.encrypt({ name: "AES-GCM", iv }, legacy, room);
  const legacyBack = new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv }, legacy, legacyCt));
  if (Buffer.from(legacyBack).toString("hex") !== Buffer.from(room).toString("hex")) throw new Error("legacy wrap mismatch");

  console.log("crypto vector ok ECDH-P256-HKDF-SHA256-AESGCM + legacy RAW32");
}

roundtrip().catch((error) => {
  console.error(error);
  process.exit(1);
});
