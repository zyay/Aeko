package com.zyay.aeko.engine

import com.zyay.aeko.remote.SshClient
import com.zyay.aeko.tools.OnlineTools
import org.json.JSONObject

data class GenerationHud(
    val tokensPerSecond: Float = 0f,
    val backend: String = "On-device",
    val net: Boolean = false,
    val ssh: Boolean = false
)

enum class EnginePhase { Idle, Thinking, Speaking }

class OnDeviceEngine(
    private val tools: OnlineTools = OnlineTools(),
    private val ssh: SshClient? = null,
    private val llm: LlmClient = LlmClient(),
    private val gguf: GgufRuntime = GgufRuntime.instance
) {
    fun reply(
        prompt: String,
        vault: String,
        agentEnabled: Boolean,
        onlineEnabled: Boolean,
        modelReady: Boolean,
        brainUrl: String = "",
        brainKey: String = "",
        brainModel: String = "",
        brainValid: Boolean = false,
        brainMode: String = "byok",
        ggufPath: String? = null,
        persona: String = "You are Aeko, a sharp personal assistant. Be concise, useful, and direct.",
        onTrace: (String) -> Unit = {},
        onDelta: (String) -> Unit = {},
        shouldStop: () -> Boolean = { false }
    ): String {
        val notes = mutableListOf<String>()
        if (onlineEnabled || (ssh?.connected?.value == true && wantsSsh(prompt))) {
            for (round in 0 until 4) {
                if (shouldStop()) return ""
                val call = nextTool(prompt, notes, onlineEnabled) ?: break
                val result = execute(call)
                notes += result
                onTrace(result.take(1200))
            }
        }
        val cited = if (vault.isNotBlank()) {
            val snippet = vault.take(900).trim()
            "\n\nFrom your local vault:\n\"$snippet${if (vault.length > 900) "…" else ""}\""
        } else ""
        val netBlock = if (notes.isNotEmpty()) "\n\nOpenHands-style tools:\n" + notes.joinToString("\n\n") else ""
        val lower = prompt.lowercase()
        val system = buildString {
            append(persona)
            if (agentEnabled) append(" Agent mode is on. Act with tools, then answer from the observations.")
            append(" When a search result includes an https link, the next step is to read that page before you summarize.")
            if (vault.isNotBlank()) append(" The user attached a local vault; prefer it.")
        }
        val user = buildString {
            append(prompt)
            if (vault.isNotBlank()) append("\n\nVault:\n").append(vault.take(4000))
            if (notes.isNotEmpty()) append("\n\nTool results:\n").append(notes.joinToString("\n\n"))
        }
        if (brainMode == "gguf") {
            if (ggufPath.isNullOrBlank()) {
                val msg = "No GGUF on disk. Open Models and download, or switch brain mode to API/server."
                onDelta(msg)
                return msg
            }
            var acc = ""
            gguf.complete(ggufPath, user, system, {
                acc += it
                onDelta(it)
            }, shouldStop, brainUrl)
            return acc.ifBlank { "(empty)" }
        }
        if (brainValid && brainUrl.isNotBlank()) {
            var acc = ""
            llm.stream(brainUrl, brainKey, brainModel, user, system, {
                acc += it
                onDelta(it)
            }, shouldStop)
            return acc.ifBlank { "(empty)" }
        }
        val brain = if (modelReady) {
            "GGUF file is on disk. Set brain mode to GGUF and run llama-server on :8080, or use API/server."
        } else {
            "No GGUF yet — open Models to download from Hugging Face."
        }
        val body = when {
            !onlineEnabled && wantsWeb(lower) && !wantsSsh(prompt) ->
                "Online tools are off. Turn on Online to search/fetch HTTPS from this phone."
            wantsSsh(prompt) && ssh?.connected?.value != true ->
                "SSH is disconnected. Open Devices, connect to your PC (OpenSSH), then retry."
            lower.contains("privacy") ->
                "Local-first chat. Optional Vercel sign-in. Optional HF download, SSH, and noVNC are opt-in."
            lower.contains("code") || lower.contains("python") || lower.contains("bug") ->
                "Code Mode is local. Paste the snippet for a walkthrough.$cited"
            prompt.isBlank() -> "Give me a task."
            else ->
                "Aeko, on-device.\n\nYou said: \"$prompt\"\n\n$brain\nOnline = search/fetch. Devices = SSH exec/read on your PC. PC screen = noVNC."
        }
        val out = body + cited + netBlock
        onDelta(out)
        return out
    }

    private fun wantsWeb(lower: String) =
        Regex("search|look up|latest|news|what is|who is|weather|web|http", RegexOption.IGNORE_CASE)
            .containsMatchIn(lower)

    private fun wantsSsh(prompt: String) =
        Regex("ssh|on my pc|on the computer|remote|list /|cat /|run command", RegexOption.IGNORE_CASE)
            .containsMatchIn(prompt)

    private fun nextTool(prompt: String, notes: List<String>, online: Boolean): JSONObject? {
        if (notes.size >= 4) return null
        val lower = prompt.lowercase()
        val seen = notes.joinToString("\n")
        if (ssh?.connected?.value == true && wantsSsh(prompt) && notes.none { it.startsWith("ssh_") }) {
            val path = Regex("/[\\w./-]+").find(prompt)?.value
            if (path != null && (lower.contains("read") || lower.contains("cat") || lower.contains("open file"))) {
                return JSONObject().put("tool", "ssh_read").put("path", path)
            }
            val cmd = when {
                lower.contains("list") -> "ls -la"
                else -> prompt.substringAfter("run ", "uname -a").take(200)
            }
            return JSONObject().put("tool", "ssh_exec").put("command", cmd)
        }
        if (!online) return null
        val searched = notes.firstOrNull { it.startsWith("web_search:") }
        if (searched != null) {
            val next = Regex("https://[^\\s]+").findAll(searched)
                .map { it.value.trimEnd('.', ',', ')') }
                .filter { OnlineTools.isPublicHttpUrl(it) && !it.contains("duckduckgo.com", true) && !seen.contains(it) }
                .distinct()
                .firstOrNull()
            if (next != null && notes.count { it.startsWith("http_fetch:") } < 2) {
                return JSONObject().put("tool", "http_fetch").put("url", next)
            }
            return null
        }
        if (notes.any { it.startsWith("http_fetch:") }) return null
        val urlMatch = Regex("https://[^\\s]+").find(prompt)?.value?.trimEnd('.', ',', ')')
        if (urlMatch != null && OnlineTools.isPublicHttpUrl(urlMatch)) {
            return JSONObject().put("tool", "http_fetch").put("url", urlMatch)
        }
        if (wantsWeb(lower)) {
            return JSONObject().put("tool", "web_search").put("query", prompt.take(180))
        }
        return null
    }

    private fun execute(call: JSONObject): String {
        return when (call.optString("tool")) {
            "web_search" -> "web_search:\n" + tools.search(call.optString("query"))
            "http_fetch" -> "http_fetch:\n" + tools.fetch(call.optString("url"))
            "ssh_exec" -> "ssh_exec:\n" + (ssh?.exec(call.optString("command")) ?: "no ssh")
            "ssh_read" -> "ssh_read:\n" + (ssh?.read(call.optString("path")) ?: "no ssh")
            else -> "unknown tool"
        }
    }
}
