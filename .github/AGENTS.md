# AGENTS.md

Architecture notes for coding agents working in this repo. Do not weaken cryptography while editing.

## Layout

- `web/` — Next.js workspace (Vercel). Rooms, BYOK models, agent loop, abc Learn.
- `app/` — Android client. On-device GGUF via llama.cpp, collab client, vault.
- `web/src/lib/store.ts` — Neon or local JSON store. Ciphertext only for room messages.
- `web/src/lib/crypto.ts` — client ECDH + AES-GCM. Keys never go to logs.

## E2EE rule

Room messages are encrypted on the device. The Next.js server stores ciphertext.

A cloud model call is not E2EE. The browser sends the prompt to the provider with the user's key. If `baseUrl` is localhost, treat the run as local-only. Do not add a server path that decrypts a room and forwards plaintext to OpenAI.

## Claims

Android one-time claim codes expire in 60 seconds and are deleted on first consume, even if already expired.

## Agent loop

`web/src/lib/agent-engine.ts` runs a short tool loop in the browser request. Long jobs must not assume a Vercel function can stay open for minutes. Keep steps bounded.

## Work surface

Home, Stream, Agents, and Workflows live in `web/src/components/work-hub.tsx`. Triage state is local (`aeko-triage`). Agent invite links are `/add/agent?id=`.

## Product UI

Treat the web app as production software. Design tokens are `web/src/app/flora.css`. Cursor rules in `.cursor/rules/` cover identity, kits, motion, a11y, and verification. Do not introduce a second styling stack (Tailwind/shadcn) on top of flora.
