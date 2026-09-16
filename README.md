# Lyan

Highlight-style agent workspace: colorful bots, inbox of tasks, encrypted threads. Your OpenAI-compatible brain. Android + web.

[![CI](https://github.com/zyay/Lyan/actions/workflows/ci.yml/badge.svg)](https://github.com/zyay/Lyan/actions/workflows/ci.yml)

## Install (Android)

1. Download [Lyan.apk](https://github.com/zyay/Lyan/releases/tag/latest)
2. Allow unknown sources
3. Open the APK

## Vercel dashboard (you must click this)

Import **`zyay/Lyan`**. Set **Root Directory = `web`**.

Environment:

| Name | Value |
| --- | --- |
| `AUTH_SECRET` | random 32+ chars |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth app |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth |
| `AUTH_URL` | `https://<project>.vercel.app` |
| `AUTH_TRUST_HOST` | `true` |
| `DATABASE_URL` or `POSTGRES_URL` | Vercel Postgres / Neon |
| `LYAN_LLM_PROXY` | `0` (keep off) |

OAuth callbacks:

- `https://<host>/api/auth/callback/github`
- `https://<host>/api/auth/callback/google`

Health: `GET /api/health` → `{ ok, db: "postgres"|"file" }`. Without `DATABASE_URL` rooms live in `/tmp` and vanish.

Optional GitHub secrets for deploy: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

Local: `cd web && npm install --legacy-peer-deps && npm run dev`

## Libraries.dev + mascot

Web: `border-beam`, `thinking-orbs`, `liquid-gooey`, `img-fx` + `three`, `voice-beam`. Mascot: `@bible-strong/avatar-react` `createAvatar` + Strobi JSON (**AGPL**). Android uses Compose blobs (native Libraries.dev ports are not on npm).

## Brains

API key + URL, own `/v1` server, or GGUF download on Android. Test never sends the key to Vercel.

## Tasks

Sign in, create a bot/task, invite by email. AES-GCM + ECDH P-256 JWK on both web and Android. Notifications have no message body.
