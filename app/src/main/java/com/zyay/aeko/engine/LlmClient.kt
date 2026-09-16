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
        .readTimeout(120, TimeUnit.SECONDS)
        .build()

    fun chat(baseUrl: String, apiKey: String, model: String, user: String, system: String): String {
        val root = baseUrl.trimEnd('/')
        val url = if (root.endsWith("/v1")) "$root/chat/completions" else "$root/v1/chat/completions"
        val messages = JSONArray()
            .put(JSONObject().put("role", "system").put("content", system))
            .put(JSONObject().put("role", "user").put("content", user))
        val body = JSONObject()
            .put("model", model.ifBlank { "gpt-4o-mini" })
            .put("messages", messages)
            .put("temperature", 0.4)
        val req = Request.Builder()
            .url(url)
            .post(body.toString().toRequestBody("application/json; charset=utf-8".toMediaType()))
            .apply { if (apiKey.isNotBlank()) header("Authorization", "Bearer $apiKey") }
            .build()
        http.newCall(req).execute().use { res ->
            val text = res.body?.string().orEmpty()
            if (!res.isSuccessful) throw IllegalStateException("LLM ${res.code}: ${text.take(240)}")
            val json = JSONObject(text)
            return json.optJSONArray("choices")
                ?.optJSONObject(0)
                ?.optJSONObject("message")
                ?.optString("content")
                ?.trim()
                .orEmpty()
                .ifBlank { "(empty)" }
        }
    }

    fun ping(baseUrl: String, apiKey: String, model: String): Boolean {
        val reply = chat(baseUrl, apiKey, model, "Reply with the single word: pong", "ping")
        return reply.contains("pong", ignoreCase = true) || reply.isNotBlank()
    }
}
