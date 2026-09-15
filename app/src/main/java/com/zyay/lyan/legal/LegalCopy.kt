package com.zyay.lyan.legal

object LegalCopy {
    const val privacy = """
LYAN PRIVACY POLICY
Effective: 15 September 2026
Operator: zyay (open-source project Lyan)

1. Principle
Lyan is built for on-device intelligence. Chat prompts, attachments, vault indexes, and conversation history are processed and stored on your Android device. Lyan does not operate a cloud inference API and does not sell personal data.

2. Data we store on device
• Messages you type and replies Lyan generates
• Files you explicitly attach (text extracted locally)
• Preferences such as Agent Mode and onboarding completion
This data stays in app storage. Uninstalling Lyan deletes it, subject to Android backups you enable.

3. Permissions
• Storage / SAF: only files you pick or share into Lyan
• Clipboard / Intents: only when Agent Mode is on and you request copy, share, browser, or alarm actions
Lyan does not require Accessibility Services in this build. Optional screen-control features will remain opt-in and explained before any future enablement.

4. Network
This APK does not send prompts to a remote model. If a later build adds optional model download, that transfer is user-initiated and the weights are stored locally. No analytics SDK is bundled.

5. Children
Lyan is not directed at children under 13 (or the digital consent age in your country).

6. Contact
Project issues: https://github.com/zyay/Lyan
"""

    const val terms = """
LYAN TERMS OF USE
Effective: 15 September 2026

1. License
Lyan is provided as open-source software. You may install the APK from GitHub Releases for personal use. The software is provided "as is" without warranty of any kind.

2. Not professional advice
Outputs can be wrong. Do not treat Lyan as legal, medical, financial, or safety-critical advice. You remain responsible for actions you take.

3. Agent Mode
When Agent Mode is enabled, Lyan may trigger Android intents you request (share, copy, open a URL, set an alarm). You must confirm sensitive actions. Do not grant permissions you do not understand.

4. Acceptable use
Do not use Lyan to break the law, harm others, or process data you are not allowed to possess.

5. Limitation of liability
To the maximum extent permitted by law, the authors are not liable for indirect, incidental, or consequential damages arising from use of Lyan.

6. Governing note
These terms accompany the GitHub project zyay/Lyan. If you do not agree, do not use the app.
"""
}
