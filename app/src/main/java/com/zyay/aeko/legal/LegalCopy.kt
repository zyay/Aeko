package com.zyay.aeko.legal

object LegalCopy {
    const val privacy = """
AEKO PRIVACY POLICY
Effective: 16 September 2026
Operator: zyay (open-source project Aeko)

1. Principle
Keys stay on this phone (EncryptedSharedPreferences). Prompts go to the OpenAI-compatible URL you set, not to Vercel (proxy off by default).

2. Optional Vercel sign-in
GitHub/Google via Auth.js. Identity + encrypted rooms.

3. Ciphertext rooms
Vercel stores iv/ciphertext, member emails, wrapped keys (ECDH P-256 JWK). Not your LLM prompt.

4. Hugging Face / SSH / Online tools
Opt-in. Valid key test turns Online on. Notifications never include message text.

5. Web mascot
Strobi via @bible-strong/avatar-react is AGPL on the website only.

6. Contact
hello@getaeko.com
https://github.com/zyay/Aeko
"""

    const val terms = """
AEKO TERMS OF USE
Effective: 16 September 2026

Install is from source in this repository. A public APK release is not published right now.

You bring the brain (API key+URL, own server, or GGUF). Shared tasks are E2E ciphertext (JWK ECDH). SSH/VNC can control a PC you configure.

Web mascot (Strobi) is AGPL. The rest of Aeko is MIT.

https://github.com/zyay/Aeko
hello@getaeko.com
"""
}
