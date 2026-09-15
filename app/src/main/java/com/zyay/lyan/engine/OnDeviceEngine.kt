package com.zyay.lyan.engine

import com.zyay.lyan.tools.OnlineTools
import org.json.JSONObject

data class GenerationHud(
    val tokensPerSecond: Float = 0f,
    val backend: String = "On-device",
    val net: Boolean = false
)

enum class EnginePhase { Idle, Thinking, Speaking }

class OnDeviceEngine(
    private val tools: OnlineTools = OnlineTools()
) {
    fun reply(
        prompt: String,
        vault: String,
        agentEnabled: Boolean,
        onlineEnabled: Boolean
    ): String {
        val notes = mutableListOf<String>()
        if (onlineEnabled) {
            var leftover = prompt
            for (round in 0 until 3) {
                val call = nextTool(leftover, notes.isNotEmpty()) ?: break
                notes += execute(call)
                leftover = ""
            }
        }
        val cited = if (vault.isNotBlank()) {
            val snippet = vault.take(900).trim()
            "\n\nFrom your local vault:\n\"$snippet${if (vault.length > 900) "…" else ""}\""
        } else ""
        val netBlock = if (notes.isNotEmpty()) "\n\nOnline tools (this device):\n" + notes.joinToString("\n\n") else ""
        val lower = prompt.lowercase()
        val body = when {
            !onlineEnabled && (lower.contains("search the web") || lower.contains("look up") || lower.startsWith("http")) ->
                "Online tools are off. Turn on Online in the composer if you want Lyan to fetch public HTTPS pages from this phone. Prompts still stay off any cloud model."
            lower.contains("privacy") ->
                "Local-first: chat and vault stay on device. Sign-in (optional) uses Vercel + Google/GitHub. Online tools, when enabled, make HTTPS requests from this phone — not a Lyan inference API."
            lower.contains("liability") || lower.contains("red flag") ->
                "Liability red flags: uncapped indemnity, one-sided limitation of liability, hidden auto-renew, IP assignment without carve-outs. Attach the contract for local citations."
            lower.contains("code") || lower.contains("python") || lower.contains("bug") ->
                "Code Mode is local. Paste the snippet and I will walk the failure and return a corrected block."
            agentEnabled && (lower.contains("invoice") || lower.contains("expense")) ->
                "Agent Mode can copy, share, or open an expense app via intents. Attach the invoice locally."
            prompt.isBlank() -> "Give me a task."
            else ->
                "Lyan, on-device.\n\nYou said: \"$prompt\"\n\nI reason here. Optional Online tools search/fetch public HTTPS. Optional Vercel sign-in is identity only — no cloud LLM."
        }
        return body + cited + netBlock
    }

    private fun nextTool(prompt: String, alreadyFetched: Boolean): JSONObject? {
        if (alreadyFetched) return null
        val urlMatch = Regex("https://[^\\s]+").find(prompt)?.value
        if (urlMatch != null && OnlineTools.isPublicHttpUrl(urlMatch)) {
            return JSONObject().put("tool", "http_fetch").put("url", urlMatch)
        }
        val wantsNet = Regex(
            "search|look up|latest|news|what is|who is|weather|web|http",
            RegexOption.IGNORE_CASE
        ).containsMatchIn(prompt)
        if (!wantsNet) return null
        return JSONObject().put("tool", "web_search").put("query", prompt.take(180))
    }

    private fun execute(call: JSONObject): String {
        return when (call.optString("tool")) {
            "web_search" -> "web_search:\n" + tools.search(call.optString("query"))
            "http_fetch" -> "http_fetch:\n" + tools.fetch(call.optString("url"))
            else -> "unknown tool"
        }
    }
}
