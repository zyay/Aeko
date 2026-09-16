package com.zyay.lyan.legal

object LegalCopy {
    const val privacy = """
LYAN PRIVACY POLICY
Effective: 16 September 2026
Operator: zyay (open-source project Lyan)

1. Principle
Lyan is local-first. Chat and vault stay on this device. No cloud inference API.

2. Optional Vercel sign-in
GitHub/Google via Auth.js. Identity only.

3. Optional Hugging Face downloads
When you tap Download GGUF, this phone fetches a model file from huggingface.co over HTTPS. An optional HF token is stored on device. The GGUF is not uploaded back.

4. Optional Online tools
web_search and http_fetch run from the phone when Online is on. Private IPs are blocked for fetch.

5. Optional SSH and noVNC
You enter PC host credentials. Commands and SFTP run to that host. noVNC loads a URL you set (often LAN HTTP). You are responsible for securing that PC.

6. Permissions
INTERNET for HF, tools, SSH, VNC, OAuth. SAF for vault files.

7. Contact
https://github.com/zyay/Lyan
"""

    const val terms = """
LYAN TERMS OF USE
Effective: 16 September 2026

Install the signed APK from GitHub Releases (latest). Enable unknown sources.

Hugging Face downloads, SSH, and VNC are opt-in. Remote command execution can harm the PC you connect to. Outputs are not professional advice.

OpenHands-style tools are a local registry (search, fetch, ssh_exec/read, open_url), not the Python OpenHands runtime.

MIT, as-is. https://github.com/zyay/Lyan
"""
}
