package com.zyay.lyan.legal

object LegalCopy {
    const val privacy = """
LYAN PRIVACY POLICY
Effective: 16 September 2026
Operator: zyay (open-source project Lyan)

1. Principle
Keys stay on this phone (EncryptedSharedPreferences). Prompts go to the OpenAI-compatible URL you set, not to Vercel (proxy off by default).

2. Optional Vercel sign-in
GitHub/Google via Auth.js. Identity + encrypted rooms.

3. Ciphertext rooms
Vercel stores iv/ciphertext, member emails, wrapped keys. Not your LLM prompt.

4. Hugging Face / SSH / Online tools
Opt-in. Valid key test turns Online on. Notifications never include message text.

5. Contact
https://github.com/zyay/Lyan
"""

    const val terms = """
LYAN TERMS OF USE
Effective: 16 September 2026

Install the signed APK from GitHub Releases (latest). Enable unknown sources.

You bring the brain (API key+URL, own server, or GGUF). Shared tasks are E2E ciphertext. SSH/VNC can control a PC you configure.

MIT, as-is. https://github.com/zyay/Lyan
"""
}
