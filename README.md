# Lyan

Highlight-style agent workspace: colorful bots, inbox of tasks, encrypted threads. Your OpenAI-compatible brain. Android + web.

[![CI](https://github.com/zyay/Lyan/actions/workflows/ci.yml/badge.svg)](https://github.com/zyay/Lyan/actions/workflows/ci.yml)

## Install

1. Download [Lyan.apk](https://github.com/zyay/Lyan/releases/tag/latest)
2. Allow unknown sources
3. Open the APK

## Vercel (web)

Import `zyay/Lyan` on Vercel. **Root Directory: `web`**.

Environment:

- `AUTH_SECRET` (random 32+ chars)
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- `AUTH_URL` = `https://<project>.vercel.app`
- `DATABASE_URL` or `POSTGRES_URL` — Vercel Postgres / Neon (see `web/src/lib/schema.sql`)

GitHub OAuth callback: `https://<project>.vercel.app/api/auth/callback/github`  
Google: `.../api/auth/callback/google`

Health: `GET /api/health`

Without Postgres the API falls back to a JSON file (`/tmp` on Vercel — not durable).

Local: `cd web && npm install && npm run dev`

## Libraries.dev + mascot

Official packages on web: `border-beam`, `thinking-orbs`, `liquid-gooey`, `img-fx` (+ `three`), `voice-beam`. Mascot is `@bible-strong/avatar-react` `createAvatar` + Strobi `.avatar.json` (AGPL).


## Brains

API key + URL, own `/v1` server, or GGUF on Android. Test key never sent to Vercel (proxy off unless `LYAN_LLM_PROXY=1`).

## Tasks

Sign in, create a bot/task, invite by email. AES-GCM ciphertext on Vercel. Notifications have no message body.
