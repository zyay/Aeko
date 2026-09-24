# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| latest on master | Yes |

## Reporting a vulnerability

Do not open a public issue. Do not send key material or decrypted message contents.

Email [hello@getaeko.com](mailto:hello@getaeko.com), or use GitHub → Security → Advisories → Report a vulnerability.

We will:

1. Acknowledge within 24 hours
2. Assess and confirm within 72 hours
3. Patch critical issues within 14 days
4. Credit you in the release notes unless you prefer to stay unnamed

## Scope

- The web app served for [getaeko.com](https://www.getaeko.com)
- The Android app
- API routes under `/api/*`

## Out of scope

- Third-party services (GitHub, Google, Neon, Vercel)
- Social engineering
- Denial of service

## What the product already does

Room messages are encrypted on the device before they are stored. The server stores ciphertext. A fresh 12-byte IV is used for every message, and AES-GCM rejects a tampered tag. New room-key wraps derive the AES key with HKDF-SHA256. Older wraps still open. Android private keys sit in encrypted preferences backed by the Android Keystore.
