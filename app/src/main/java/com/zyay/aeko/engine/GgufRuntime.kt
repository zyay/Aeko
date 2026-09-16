package com.zyay.aeko.engine

/**
 * GGUF: llama.cpp JNI is optional (drop a prefab AAR into app/libs).
 * Default path is llama-server OpenAI /v1 on loopback, then the user's brain URL.
 * Never invent tokens.
 */
class GgufRuntime(private val llm: LlmClient = LlmClient()) {
    val nativeReady: Boolean = false

    fun complete(
        modelPath: String,
        prompt: String,
        system: String,
        onDelta: (String) -> Unit,
        shouldStop: () -> Boolean,
        extraBaseUrl: String = ""
    ) {
        val urls = listOf(extraBaseUrl, "http://127.0.0.1:8080/v1", "http://127.0.0.1:11434/v1")
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinct()
        var last: Throwable? = null
        for (url in urls) {
            val ok = runCatching {
                llm.stream(url, "", "gguf", prompt, system, onDelta, shouldStop)
            }
            if (ok.isSuccess) return
            last = ok.exceptionOrNull()
        }
        throw IllegalStateException(
            "GGUF is on disk at $modelPath. JNI is not packaged. " +
                "Start llama-server --port 8080 -m <that file>, or set brain URL to that /v1. Last: ${last?.message}"
        )
    }

    companion object {
        val instance by lazy { GgufRuntime() }
    }
}
