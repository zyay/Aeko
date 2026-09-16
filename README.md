# Lyan

Personal AI employee: **your** OpenAI-compatible brain, encrypted task threads, Teams-style workspace on Android and the web.

[![CI](https://github.com/zyay/Lyan/actions/workflows/ci.yml/badge.svg)](https://github.com/zyay/Lyan/actions/workflows/ci.yml)

## Install

1. Download [Lyan.apk](https://github.com/zyay/Lyan/releases/tag/latest) (always signed)
2. Allow unknown sources for your browser
3. Open the APK

Web (PC): deploy `web/` on Vercel, or `cd web && npm install && npm run dev`.

## Three brains (equal)

During onboarding pick one:

- **API key + base URL** — OpenAI, Groq, OpenRouter, LM Studio, Ollama, vLLM (`POST /v1/chat/completions`)
- **Own server** — same schema, optional bearer
- **Download GGUF** — Hugging Face file on Android (`Models`). llama.cpp JNI is not in this APK yet; use BYOK until then.

**Test** pings the endpoint. A valid key turns **Online** tools on (search/fetch/SSH as before). The key never goes to Vercel unless you set `LYAN_LLM_PROXY=1`.

Web calls your URL **from the browser**. Your server must allow CORS, or use a local server.

## Encrypted tasks

Sign in (GitHub/Google). Create a task, invite by email (they must sign in once). Messages are AES-GCM; Vercel stores ciphertext only.

Postgres schema: `web/src/lib/schema.sql` (`DATABASE_URL`). Without it, the API uses a JSON file (`web/data` locally, `/tmp` on Vercel — set Postgres for production).

## Notifications

“New activity in task X” — no message body. Android `POST_NOTIFICATIONS`; web Notification API. Poll ~15–20s.

## SSH / VNC / HF

Menu → Models, Devices, PC screen — unchanged.

## Privacy / Terms

See in-app screens or `/privacy` `/terms` on the web.
