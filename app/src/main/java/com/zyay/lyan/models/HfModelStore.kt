package com.zyay.lyan.models

import android.content.Context
import java.io.File
import java.util.concurrent.atomic.AtomicBoolean
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

data class ModelStatus(
    val ready: Boolean = false,
    val downloading: Boolean = false,
    val progress: Float = 0f,
    val bytes: Long = 0,
    val total: Long = 0,
    val message: String = "No GGUF on device",
    val path: String? = null
)

class HfModelStore(context: Context) {
    private val dir = File(context.filesDir, "models").apply { mkdirs() }
    private val file = File(dir, "minicpm.gguf")
    private val prefs = context.getSharedPreferences("lyan_models", Context.MODE_PRIVATE)
    private val cancel = AtomicBoolean(false)
    private val client = OkHttpClient.Builder()
        .followRedirects(true)
        .callTimeout(0, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.SECONDS)
        .build()

    private val _status = MutableStateFlow(current())
    val status: StateFlow<ModelStatus> = _status

    var url: String
        get() = prefs.getString("url", DEFAULT_URL) ?: DEFAULT_URL
        set(value) { prefs.edit().putString("url", value).apply() }

    var token: String
        get() = prefs.getString("token", "") ?: ""
        set(value) { prefs.edit().putString("token", value).apply() }

    fun current(): ModelStatus {
        val ready = file.exists() && file.length() > 1024
        return ModelStatus(
            ready = ready,
            path = if (ready) file.absolutePath else null,
            bytes = if (file.exists()) file.length() else 0,
            message = if (ready) "Model downloaded. llama.cpp runtime is next — file is ready on device." else "No GGUF on device"
        )
    }

    fun cancel() {
        cancel.set(true)
    }

    suspend fun download() = withContext(Dispatchers.IO) {
        cancel.set(false)
        _status.value = ModelStatus(downloading = true, message = "Connecting to Hugging Face…")
        val request = Request.Builder().url(url).apply {
            if (token.isNotBlank()) header("Authorization", "Bearer $token")
            header("User-Agent", "Lyan/1.0")
        }.build()
        runCatching {
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    _status.value = ModelStatus(message = "HTTP ${response.code}")
                    return@withContext
                }
                val total = response.body?.contentLength() ?: -1L
                val tmp = File(dir, "minicpm.gguf.part")
                tmp.outputStream().use { out ->
                    val input = response.body?.byteStream() ?: return@use
                    val buf = ByteArray(64 * 1024)
                    var read = 0L
                    while (true) {
                        if (cancel.get()) {
                            tmp.delete()
                            _status.value = current().copy(message = "Cancelled")
                            return@withContext
                        }
                        val n = input.read(buf)
                        if (n <= 0) break
                        out.write(buf, 0, n)
                        read += n
                        val p = if (total > 0) read.toFloat() / total else 0f
                        _status.value = ModelStatus(
                            downloading = true,
                            progress = p.coerceIn(0f, 1f),
                            bytes = read,
                            total = total,
                            message = "Downloading ${(read / 1_000_000)} MB"
                        )
                    }
                }
                if (file.exists()) file.delete()
                tmp.renameTo(file)
                _status.value = current()
            }
        }.onFailure {
            _status.value = ModelStatus(message = it.message ?: "Download failed")
        }
    }

    companion object {
        const val DEFAULT_URL =
            "https://huggingface.co/QuantFactory/MiniCPM-2B-dpo-GGUF/resolve/main/MiniCPM-2B-dpo.Q4_K_M.gguf"
    }
}
