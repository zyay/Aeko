# Lyan

Android-native personal AI employee. Local-first. Optional Hugging Face GGUF download, SSH to your PC, noVNC screen, and OpenHands-style tools.

[![CI](https://github.com/zyay/Lyan/actions/workflows/ci.yml/badge.svg)](https://github.com/zyay/Lyan/actions/workflows/ci.yml)

## Install (sideload)

The APK is **always signed** (release keystore if present, otherwise the Android debug key).

1. Download [Lyan.apk](https://github.com/zyay/Lyan/releases/tag/latest)
2. Settings → Apps → Special access → Install unknown apps → allow your browser
3. Open `Lyan.apk`

If Android says the file is damaged, you had an **unsigned** build. Use this latest signed file.

## Hugging Face models

Menu → **Models**. Paste a `resolve/main/*.gguf` URL (default MiniCPM Q4) and optional HF token. File lands in app storage. llama.cpp inference is not in this APK yet.

## SSH + PC screen

Menu → **Devices**: OpenSSH host/user/password, Connect, run commands.  
Menu → **PC screen**: WebView to your noVNC URL (e.g. `http://192.168.1.10:6080/vnc.html`). PC needs VNC + websockify.

## OpenHands-style tools

Turn **Online** on for live `web_search` / `http_fetch`. With SSH connected, ask Lyan to run a command or read `/path` on the PC. Agent mode can open `https://` URLs.

## Web

`cd web && npm install && npm run dev` — Vercel Auth.js, border-beam, SHDR-21.
