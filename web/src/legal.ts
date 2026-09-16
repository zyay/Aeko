export const privacyText = `LYAN PRIVACY POLICY
Effective: 16 September 2026
Operator: zyay (open-source project Lyan)

1. Principle
Lyan is local-first. Your LLM key and prompts go to the URL you set (OpenAI-compatible), never to Vercel by default. Optional Vercel LLM proxy is off unless you enable LYAN_LLM_PROXY.

2. Identity
GitHub/Google via Auth.js on Vercel. Email is used for task membership.

3. Encrypted tasks
Room messages are AES-GCM ciphertext. Vercel stores iv + ciphertext, member emails, and wrapped room keys. Operators can see ciphertext and emails, not your plaintext or your API key.

4. Brains
BYOK / own server: requests leave this device to your base URL. GGUF downloads stay on Android storage.

5. Notifications
“New activity in task X” — no message body.

6. Tools
Android Online: web_search / http_fetch / SSH. Auto-on after a valid key test.

7. Contact
https://github.com/zyay/Lyan
`;

export const termsText = `LYAN TERMS OF USE
Effective: 16 September 2026

1. License
MIT, as-is.

2. Your models
You are responsible for API keys, own servers, and GGUF licenses.

3. Collaboration
Invites use the email of a signed-in account. E2E requires both devices to hold matching identity keys. Recovery passphrase is your job.

4. Remote tools
SSH and Agent intents can affect devices you connect. Not professional advice.

5. Sideload
Install the signed APK from GitHub Releases (latest). Enable unknown sources.

Project: https://github.com/zyay/Lyan
`;
