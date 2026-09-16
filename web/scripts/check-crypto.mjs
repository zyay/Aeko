import { webcrypto } from "node:crypto";

async function roundtrip() {
  const subtle = webcrypto.subtle;
  const a = await subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const b = await subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const bits = await subtle.deriveBits({ name: "ECDH", public: b.publicKey }, a.privateKey, 256);
  const wrapKey = await subtle.importKey("raw", bits, "AES-GCM", false, ["encrypt", "decrypt"]);
  const room = webcrypto.getRandomValues(new Uint8Array(32));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, wrapKey, room);
  const back = new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv }, wrapKey, ct));
  if (Buffer.from(back).toString("hex") !== Buffer.from(room).toString("hex")) {
    throw new Error("wrap mismatch");
  }
  if (new Uint8Array(bits).byteLength !== 32) throw new Error("shared secret must be 32 bytes");
  console.log("crypto vector ok ECDH-P256-RAW32-AESGCM");
}

roundtrip().catch((e) => {
  console.error(e);
  process.exit(1);
});
