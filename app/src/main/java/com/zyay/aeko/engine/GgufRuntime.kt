package com.zyay.aeko.engine

/**
 * GGUF path: load a llama.cpp JNI/prefab if the vendor shipped `libaeko_llama.so`.
 * Otherwise talk to a local llama-server OpenAI endpoint (default 127.0.0.1:8080/v1).
 * Never invent tokens.
 */
class GgufRuntime(private val llm: LlmClient = LlmClient()) {
    val nativeReady: Boolean = runCatching {
        System.loadLibrary("aeko_llama")
        nativePing()
    }.getOrDefault(false)

    fun complete(
        modelPath: String,
        prompt: String,
        system: String,
        onDelta: (String) -> Unit,
        shouldStop: () -> Boolean
    ) {
        if (nativeReady) {
            nativeStream(modelPath, "$system\n\n$prompt", onDelta)
            return
        }
        val urls = listOf("http://127.0.0.1:8080/v1", "http://127.0.0.1:11434/v1")
        var last: Throwable? = null
        for (url in urls) {
            val ok = runCatching {
                llm.stream(url, "", "gguf", prompt, system, onDelta, shouldStop)
            }
            if (ok.isSuccess) return
            last = ok.exceptionOrNull()
        }
        throw IllegalStateException(
            "GGUF is on disk at $modelPath but llama.cpp JNI is not in this APK. " +
                "Start llama-server --port 8080 -m <that file> (OpenAI /v1). Last: ${last?.message}"
        )
    }

    private external fun nativePing(): Boolean
    private external fun nativeStream(modelPath: String, prompt: String, cb: (String) -> Unit)

    companion object {
        val instance by lazy { GgufRuntime() }
    }
}
