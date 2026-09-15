# Lyan

Android-native personal AI employee. Local-first. Optional Vercel identity. Optional on-device internet tools.

[![CI](https://github.com/zyay/Lyan/actions/workflows/ci.yml/badge.svg)](https://github.com/zyay/Lyan/actions/workflows/ci.yml)

## Install APK (always latest)

Every green `master` build publishes a rolling GitHub Release:

https://github.com/zyay/Lyan/releases/tag/latest

Download `Lyan.apk`. Allow installs from the browser.

## Web (Vercel + Auth.js)

Root Directory on Vercel: `web`.

```bash
cd web
npm install
npm run dev
```

Env (Vercel / `.env.local`):

- `AUTH_SECRET`
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- `AUTH_URL` (production origin)

OAuth callback: `{AUTH_URL}/api/auth/callback/github` and `.../google`.

Android Custom Tabs open `/login?android=1` then `lyan://auth`.

Composer uses official [`border-beam`](https://libraries.dev/beam). Orb is [`Shdr21`](https://github.com/zzzzshawn/orbkit).

## Android

- Default: on-device replies, local vault
- Agent: copy / share / alarm intents
- Online (opt-in): `web_search`, `http_fetch` with SSRF guards
- Sign in: GitHub or Google via Vercel (not required to chat)

```bash
./gradlew assembleRelease
```

GitHub Actions secrets for signed rolling APK:

- `LYAN_KEYSTORE_BASE64`
- `LYAN_KEYSTORE_PASSWORD`
- `LYAN_KEY_ALIAS`
- `LYAN_KEY_PASSWORD`

Optional: `LYAN_AUTH_URL` (defaults to `https://lyan.vercel.app`).

## Legal

See [PRIVACY.md](PRIVACY.md) and [TERMS.md](TERMS.md).

Lyan is not affiliated with xAI or Grok.

## License

MIT — see [LICENSE](LICENSE).
