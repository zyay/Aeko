package com.zyay.aeko.tools

import java.net.InetAddress
import java.net.URI
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

class OnlineTools(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .callTimeout(12, TimeUnit.SECONDS)
        .followRedirects(true)
        .build()
) {
    fun search(query: String): String {
        val q = query.trim().take(200)
        if (q.isBlank()) return "Empty query."
        val url = "https://html.duckduckgo.com/html/?q=" + java.net.URLEncoder.encode(q, Charsets.UTF_8.name())
        val html = get(url) ?: return "Search failed."
        val titles = Regex("""class="result__a"[^>]*>(.*?)</a>""", RegexOption.IGNORE_CASE)
            .findAll(html)
            .map { it.groupValues[1].replace(Regex("<[^>]+>"), "").trim() }
            .filter { it.isNotBlank() }
            .take(5)
            .toList()
        val snippets = Regex("""class="result__snippet"[^>]*>(.*?)</""", RegexOption.IGNORE_CASE)
            .findAll(html)
            .map { it.groupValues[1].replace(Regex("<[^>]+>"), "").trim() }
            .filter { it.isNotBlank() }
            .take(5)
            .toList()
        if (titles.isEmpty()) return "No public search hits for \"$q\"."
        return titles.mapIndexed { i, title ->
            val snip = snippets.getOrNull(i).orEmpty()
            "${i + 1}. $title${if (snip.isNotBlank()) " — $snip" else ""}"
        }.joinToString("\n")
    }

    fun fetch(rawUrl: String): String {
        val url = rawUrl.trim()
        if (!isPublicHttpUrl(url)) return "Blocked URL (SSRF guard)."
        val body = get(url) ?: return "Fetch failed."
        val text = body
            .replace(Regex("(?is)<script[^>]*>.*?</script>"), " ")
            .replace(Regex("(?is)<style[^>]*>.*?</style>"), " ")
            .replace(Regex("<[^>]+>"), " ")
            .replace(Regex("\\s+"), " ")
            .trim()
            .take(4000)
        return text.ifBlank { "Empty page." }
    }

    private fun get(url: String): String? {
        if (!isPublicHttpUrl(url)) return null
        val request = Request.Builder()
            .url(url)
            .header("User-Agent", "Aeko/1.0 (on-device agent; +https://github.com/zyay/Lyan)")
            .build()
        return runCatching {
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@use null
                response.body?.string()?.take(250_000)
            }
        }.getOrNull()
    }

    companion object {
        fun isPublicHttpUrl(raw: String): Boolean {
            val uri = runCatching { URI(raw) }.getOrNull() ?: return false
            if (uri.scheme != "https" && uri.scheme != "http") return false
            if (uri.scheme == "http") return false
            val host = uri.host?.lowercase() ?: return false
            if (host == "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host == "0.0.0.0") {
                return false
            }
            val address = runCatching { InetAddress.getByName(host) }.getOrNull() ?: return false
            return !(address.isAnyLocalAddress || address.isLoopbackAddress ||
                address.isLinkLocalAddress || address.isSiteLocalAddress || address.isMulticastAddress)
        }
    }
}
