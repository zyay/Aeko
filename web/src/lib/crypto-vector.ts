/**
 * New wraps: ECDH P-256 → 32 shared bytes → HKDF-SHA256 → AES-256-GCM.
 * Salt "aeko-room-wrap-v2", info "aeko-ecdh-aes", wrapIv prefixed with "v2.".
 * Older wraps stay ECDH-P256-RAW32-AESGCM and still unwrap.
 * Web: crypto.subtle.deriveBits(ECDH, 256) then HKDF.
 * Android: KeyAgreement.generateSecret().copyOf(32) then the same HKDF.
 * IV 12 bytes, tag 128 bits, fresh for every message and every wrap.
 */
export const AEKO_WRAP_ALG = "ECDH-P256-HKDF-SHA256-AESGCM";
export const AEKO_WRAP_LEGACY = "ECDH-P256-RAW32-AESGCM";
