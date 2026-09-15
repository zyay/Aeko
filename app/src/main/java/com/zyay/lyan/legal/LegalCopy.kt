package com.zyay.lyan.legal

object LegalCopy {
    const val privacy = """
LYAN PRIVACY POLICY
Effective: 15 September 2026
Operator: zyay (open-source project Lyan)

1. Principle
Lyan is local-first. Chat prompts, attachments, vault indexes, and conversation history are processed and stored on your Android device or in the browser tab. Lyan does not operate a cloud inference API and does not sell personal data.

2. Optional Vercel sign-in
If you sign in, GitHub or Google OAuth runs through the Lyan Vercel app (Auth.js). A session cookie (web) or encrypted prefs (Android, email/name only) identify you. Chat transcripts are not uploaded in this release.

3. Optional Online tools (Android)
Offline is default. When Online is on, this device may HTTPS web_search (DuckDuckGo HTML) and http_fetch public pages. Localhost and private IPs are blocked. Disable Online and no tool HTTP runs.

4. Permissions
• INTERNET: OAuth and Online tools
• Storage / SAF: files you pick
• Clipboard / Intents: Agent Mode
No Accessibility Service in this build.

5. Children
Not directed at children under 13.

6. Contact
https://github.com/zyay/Lyan
"""

    const val terms = """
LYAN TERMS OF USE
Effective: 15 September 2026

1. License
Open-source APK and web app, provided "as is" without warranty.

2. Not professional advice
Outputs can be wrong. Not legal, medical, or financial advice.

3. Agent Mode and Online tools
Agent Mode may fire intents you request. Online tools fetch public HTTPS pages from the phone. You remain responsible.

4. Sign-in
Optional GitHub/Google via Vercel.

5. Limitation of liability
To the maximum extent permitted by law, authors are not liable for damages arising from use of Lyan.

6. Project
https://github.com/zyay/Lyan
"""
}
