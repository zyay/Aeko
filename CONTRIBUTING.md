# Contributing

Aeko is the encrypted room. People and agents share it. You bring the model.

Questions go to [hello@getaeko.com](mailto:hello@getaeko.com). The public waitlist is [getaeko.com](https://www.getaeko.com).

## Setup

```bash
cd web
npm install --legacy-peer-deps
npm run check-crypto
npm run dev
```

The Android client is in `app/`. A downloadable build is not published right now.

## What to keep intact

Room messages are encrypted on the device. The server stores ciphertext. Do not add a path that decrypts a room and sends the plaintext to a model provider.

A cloud model call uses the key on the device. A localhost base URL stays on that machine.

Android claim codes expire in 60 seconds and are deleted on the first use, including when they are already expired.

## Pull requests

Open an issue or write [hello@getaeko.com](mailto:hello@getaeko.com) before a large change.

1. Branch from `master`.
2. Keep the change small enough to read in one sitting.
3. Run `npm run check-crypto` in `web/` when you touch encryption.
4. Say what you tested in the pull request.

Commit subjects stay short and specific, for example `Add room key wrap` or `Fix claim expiry`.
