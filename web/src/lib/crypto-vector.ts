/**
 * Interop lock: ECDH P-256 → 32 raw shared bytes → AES-256-GCM wrap of a 32-byte room key.
 * Web: crypto.subtle.deriveBits(ECDH, 256)
 * Android: KeyAgreement.generateSecret().copyOf(32)
 * IV 12 bytes, tag 128 bits. No HKDF.
 */
export const AEKO_WRAP_ALG = "ECDH-P256-RAW32-AESGCM";
