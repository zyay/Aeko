package com.zyay.aeko.engine

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class LlmClient {
    private val http = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(180, TimeUnit.SECONDS)
        .build()

    fun chat(baseUrl: String, apiKey: String, model: String, user: String, system: String): String {
        var acc = ""
        stream(baseUrl, apiKey, model, user, system, { acc += it }, { false })
        return acc.trim().ifBlank { "(empty)" }
    }

    fun stream(
        baseUrl: String,
        apiKey: String,
        model: String,
        user: String,
        system: String,
        onDelta: (String) -> Unit,
        shouldStop: () -> Boolean
    ) {
        val root = baseUrl.trimEnd('/')
        val url = if (root.endsWith("/v1")) "$root/chat/completions" else "$root/v1/chat/completions"
        val messages = JSONArray()
            .put(JSONObject().put("role", "system").put("content", system))
            .put(JSONObject().put("role", "user").put("content", user))
        val body = JSONObject()
            .put("model", model.ifBlank { "gpt-4o-mini" })
            .put("messages", messages)
            .put("temperature", 0.4)
            .put("stream", true)
        val req = Request.Builder()
            .url(url)
            .post(body.toString().toRequestBody("application/json; charset=utf-8".toMediaType()))
            .apply { if (apiKey.isNotBlank()) header("Authorization", "Bearer $apiKey") }
            .build()
        http.newCall(req).execute().use { res ->
            if (!res.isSuccessful) {
                val err = res.body?.string().orEmpty()
                throw IllegalStateException("LLM ${res.code}: ${err.take(240)}")
            }
            val source = res.body?.source() ?: return
            val buf = StringBuilder()
            while (!source.exhausted()) {
                if (shouldStop()) return
                val line = source.readUtf8Line() ?: break
                if (!line.startsWith("data:")) continue
                val data = line.removePrefix("data:").trim()
                if (data == "[DONE]" || data.isBlank()) continue
                val json = runCatching { JSONObject(data) }.getOrNull() ?: continue
                val piece = json.optJSONArray("choices")
                    ?.optJSONObject(0)
                    ?.optJSONObject("delta")
                    ?.optString("content")
                    .orEmpty()
                if (piece.isNotEmpty()) {
                    buf.append(piece)
                    onDelta(piece)
                }
            }
            if (buf.isBlank()) {
                throw IllegalStateException("empty stream")
            }
        }
    }

    fun ping(baseUrl: String, apiKey: String, model: String): Boolean {
        val reply = chat(baseUrl, apiKey, model, "Reply with the single word: pong", "ping")
        return reply.contains("pong", ignoreCase = true) || reply.isNotBlank()
    }
}
