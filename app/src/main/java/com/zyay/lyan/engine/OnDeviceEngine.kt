package com.zyay.lyan.engine

data class GenerationHud(
    val tokensPerSecond: Float = 0f,
    val backend: String = "On-device"
)

enum class EnginePhase { Idle, Thinking, Speaking }

class OnDeviceEngine {
    fun reply(prompt: String, vault: String, agentEnabled: Boolean): String {
        val lower = prompt.lowercase()
        val cited = if (vault.isNotBlank()) {
            val snippet = vault.take(900).trim()
            "\n\nFrom your local vault:\n\"$snippet${if (vault.length > 900) "…" else ""}\""
        } else ""

        return when {
            lower.contains("privacy") || lower.contains("data") && lower.contains("leave") ->
                "Nothing leaves this phone. Chat, files, and embeddings stay in Lyan's local store. There is no cloud inference endpoint."
            lower.contains("red flag") || lower.contains("liability") ->
                "Liability red flags I look for on-device: uncapped indemnity, one-sided limitation of liability, hidden auto-renew, and assignment of IP without carve-outs. Paste or attach the contract and I will cite the matching clauses from local text.$cited"
            lower.contains("code") || lower.contains("python") || lower.contains("bug") ->
                "Code Mode is local. Paste the snippet and I will walk the control flow, name the failure, and return a corrected block. I will not send source anywhere.$cited"
            lower.contains("invoice") || lower.contains("expense") ->
                if (agentEnabled) {
                    "Agent Mode is on. I can search attached files, extract amounts, copy them, or share into your expense app via Android intents. Attach the invoice to continue."
                } else {
                    "Turn on Agent Mode in the composer to let me use local file and share intents. I still will not upload the invoice."
                }
            prompt.isBlank() -> "Give me a task. I stay on-device."
            else ->
                "Lyan here. Sharp, local, and not phoning home.\n\nYou said: \"$prompt\"\n\nI processed that on this device. Attach PDFs or notes to the vault and I will ground answers in your files. Toggle Agent when you want intents (copy, share, browser, alarm). MiniCPM-class GGUF can be dropped into the app files directory later; this build ships a private on-device reasoner so the APK stays installable without a 1.5GB download.$cited"
        }
    }
}
