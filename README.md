# Lyan

Android-native personal AI employee. Intelligence without surveillance. Power without the cloud.

## Web UI (official Beam + Orbkit)

```bash
cd web
npm install
npx shadcn@latest add zzzzshawn/orbkit/shdr-21
npm run dev
```

- Composer: [`border-beam`](https://libraries.dev/beam) (`npm install border-beam`)
- Orb: official [`Shdr21`](https://github.com/zzzzshawn/orbkit) via `npx shadcn@latest add zzzzshawn/orbkit/shdr-21`

## Android APK

- Dark composer with Lyan’s own pulsing halo (not a third-party beam library).
- Idle / thinking / speaking orb on the home canvas and while streaming.
- On-device replies, local vault text from files you attach (Storage Access Framework).
- Agent Mode: copy, share, alarm intents. No Accessibility Service in this build.
- In-app Privacy Policy and Terms. Prompts are not sent to a remote model.

## Install

Download `Lyan-1.0.0.apk` from [GitHub Releases](https://github.com/zyay/Lyan/releases). Android may ask you to allow installs from your browser.

## Build

```bash
./gradlew assembleRelease
```

The signed APK is written to `app/build/outputs/apk/release/`.

## Legal

See [PRIVACY.md](PRIVACY.md) and [TERMS.md](TERMS.md).

Lyan is not affiliated with xAI or Grok. The UI follows a familiar composer pattern; branding is Lyan.

## License

MIT — see [LICENSE](LICENSE).
