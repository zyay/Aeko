package com.zyay.lyan.engine

import com.zyay.lyan.remote.SshClient
import com.zyay.lyan.tools.OnlineTools
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
    private val ssh: SshClient? = null
) {
    fun reply(
        prompt: String,
        vault: String,
        agentEnabled: Boolean,
        onlineEnabled: Boolean,
        modelReady: Boolean
    ): String {
        val notes = mutableListOf<String>()
        if (onlineEnabled || (ssh?.connected?.value == true && wantsSsh(prompt))) {
            var leftover = prompt
            for (round in 0 until 5) {
                val call = nextTool(leftover, notes.size, onlineEnabled) ?: break
                notes += execute(call)
                leftover = ""
            }
        }
        val cited = if (vault.isNotBlank()) {
            val snippet = vault.take(900).trim()
            "\n\nFrom your local vault:\n\"$snippet${if (vault.length > 900) "…" else ""}\""
        } else ""
        val netBlock = if (notes.isNotEmpty()) "\n\nOpenHands-style tools:\n" + notes.joinToString("\n\n") else ""
        val lower = prompt.lowercase()
        val brain = if (modelReady) "GGUF on disk (download complete; llama.cpp runtime next)." else "No GGUF yet — open Models to download from Hugging Face."
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
                "Lyan, on-device.\n\nYou said: \"$prompt\"\n\n$brain\nOnline = search/fetch. Devices = SSH exec/read on your PC. PC screen = noVNC."
        }
        return body + cited + netBlock
    }

    private fun wantsWeb(lower: String) =
        Regex("search|look up|latest|news|what is|who is|weather|web|http", RegexOption.IGNORE_CASE)
            .containsMatchIn(lower)

    private fun wantsSsh(prompt: String) =
        Regex("ssh|on my pc|on the computer|remote|list /|cat /|run command", RegexOption.IGNORE_CASE)
            .containsMatchIn(prompt)

    private fun nextTool(prompt: String, done: Int, online: Boolean): JSONObject? {
        if (done >= 4) return null
        val lower = prompt.lowercase()
        if (ssh?.connected?.value == true && wantsSsh(prompt) && done == 0) {
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
        if (done > 0) return null
        val urlMatch = Regex("https://[^\\s]+").find(prompt)?.value
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
