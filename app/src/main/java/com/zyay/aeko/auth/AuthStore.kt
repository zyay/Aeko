package com.zyay.aeko.auth

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.zyay.aeko.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class AuthStore(context: Context) {
    private val app = context.applicationContext
    private val http = OkHttpClient()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val prefs = runCatching {
        val master = MasterKey.Builder(app).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
        EncryptedSharedPreferences.create(
            app,
            "aeko_auth",
            master,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }.getOrElse {
        app.getSharedPreferences("aeko_auth_fallback", Context.MODE_PRIVATE)
    }

    private val _account = MutableStateFlow(prefs.getString("email", null))
    val account: StateFlow<String?> = _account
    private val _lastError = MutableStateFlow<String?>(null)
    val lastError: StateFlow<String?> = _lastError

    fun signIn(context: Context) {
        val uri = Uri.parse("${BuildConfig.AUTH_URL.trimEnd('/')}/login?android=1")
        val tabs = CustomTabsIntent.Builder().build()
        tabs.intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
        tabs.launchUrl(context, uri)
    }

    fun signOut() {
        prefs.edit().clear().apply()
        _account.value = null
        _lastError.value = null
    }

    fun token(): String = prefs.getString("token", "").orEmpty()

    fun capture(uri: Uri?) {
        if (uri == null || uri.host != "auth" || (uri.scheme != "aeko" && uri.scheme != "lyan")) return
        val code = uri.getQueryParameter("code")
        if (!code.isNullOrBlank()) {
            scope.launch { exchange(code) }
            return
        }
        val email = uri.getQueryParameter("email") ?: return
        val token = uri.getQueryParameter("token").orEmpty()
        if (token.isBlank()) return
        save(email, uri.getQueryParameter("name").orEmpty(), token)
    }

    private fun exchange(code: String) {
        val url = "${BuildConfig.AUTH_URL.trimEnd('/')}/api/android/claim"
        val body = JSONObject().put("code", code).toString().toRequestBody("application/json".toMediaType())
        val req = Request.Builder().url(url).post(body).build()
        runCatching {
            http.newCall(req).execute().use { res ->
                val raw = res.body?.string().orEmpty().ifBlank { "{}" }
                if (!res.isSuccessful) {
                    _lastError.value = "Sign-in failed (${res.code}). Attach Neon DATABASE_URL if this persists."
                    return
                }
                val json = JSONObject(raw)
                val email = json.optString("email")
                val token = json.optString("token")
                if (email.isBlank() || token.isBlank()) {
                    _lastError.value = "Sign-in claim was empty"
                    return
                }
                save(email, json.optString("name"), token)
            }
        }.onFailure {
            _lastError.value = it.message ?: "Sign-in network error"
        }
    }

    private fun save(email: String, name: String, token: String) {
        val who = email.trim().lowercase()
        prefs.edit()
            .putString("email", who)
            .putString("name", name)
            .putString("token", token)
            .apply()
        _lastError.value = null
        _account.value = who
    }
}
