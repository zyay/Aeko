# Aeko

Highlight-style agent workspace: colorful bots, inbox of tasks, encrypted threads. Your OpenAI-compatible brain. Android + web.

[![CI](https://github.com/zyay/Lyan/actions/workflows/ci.yml/badge.svg)](https://github.com/zyay/Lyan/actions/workflows/ci.yml)

Live: [https://aeko.vercel.app](https://aeko.vercel.app) · GitHub repo stays **`zyay/Lyan`**. Product name **Aeko**.

## Install (Android)

1. Download [Aeko.apk](https://github.com/zyay/Lyan/releases/tag/latest)
2. Allow unknown sources
3. Open the APK

## Production checklist (dashboard — CLI cannot finish these)

Do these once. Until Neon is attached, `/api/health` reports `"db":"file"` and rooms vanish on Vercel.

1. **Neon** — create a project, copy the pooled URL, set `DATABASE_URL` on Vercel project **aeko**. Production health must show `"db":"postgres"` and `"durable":true`.
2. **GitHub OAuth** app callbacks:
   - `https://aeko.vercel.app/api/auth/callback/github`
3. **Google OAuth** callbacks:
   - `https://aeko.vercel.app/api/auth/callback/google`
4. Install **[Vercel for GitHub](https://github.com/apps/vercel)** on `zyay/Lyan`, then `vercel git connect`.
5. Optional Web Push: `AEKO_VAPID_PUBLIC` / `AEKO_VAPID_PRIVATE` (never put LLM keys here).

Environment:

| Name | Value |
| --- | --- |
| `AUTH_SECRET` | random 32+ chars |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth app |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth |
| `AUTH_URL` | `https://aeko.vercel.app` |
| `AUTH_TRUST_HOST` | `true` |
| `DATABASE_URL` or `POSTGRES_URL` | Neon |
| `AEKO_LLM_PROXY` | `0` (keep off) |
| `AEKO_VAPID_PUBLIC` / `AEKO_VAPID_PRIVATE` | Web Push |

Health: `GET /api/health` → `{ ok, db, durable, auth }`. If production is still `"file"`, rooms are not durable.

Optional GitHub secrets for deploy: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Signing: `LYAN_KEYSTORE_*`.

Local: `cd web && npm install --legacy-peer-deps && npm run check-crypto && npm run dev`

Wrap crypto lock: ECDH P-256, 32 raw shared bytes, AES-256-GCM (`web/scripts/check-crypto.mjs`). Android uses the same in `CollabClient`.

Android sign-in uses a one-time `/api/android/claim` code on `aeko://auth?code=…` (legacy `lyan://` still works). Bearer tokens are not put in the query string.

## Libraries.dev + mascot

Web: `border-beam`, `thinking-orbs`, `liquid-gooey`, `img-fx` + `three`, `voice-beam`. Mascot: `@bible-strong/avatar-react` Strobi JSON (**AGPL**, web only). Android uses Compose blobs.

## Brains

API key + URL, own `/v1` server, or GGUF download on Android. Keys never go to Vercel unless you set `AEKO_LLM_PROXY=1`. GGUF inference uses llama.cpp JNI when a native lib is present, otherwise **llama-server** on `127.0.0.1:8080/v1` — never a fake GGUF reply.

## Tasks

Sign in, create a bot/task, invite by email. AES-GCM + ECDH P-256 JWK on both web and Android. Notifications have no message body (`New activity in {task}`).
