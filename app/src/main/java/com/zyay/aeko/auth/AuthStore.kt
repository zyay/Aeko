package com.zyay.aeko.auth

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.zyay.aeko.BuildConfig
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class AuthStore(context: Context) {
    private val app = context.applicationContext
    private val http = OkHttpClient()
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

    fun signIn(context: Context) {
        val uri = Uri.parse("${BuildConfig.AUTH_URL.trimEnd('/')}/login?android=1")
        val tabs = CustomTabsIntent.Builder().build()
        tabs.intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
        tabs.launchUrl(context, uri)
    }

    fun signOut() {
        prefs.edit().clear().apply()
        _account.value = null
    }

    fun token(): String = prefs.getString("token", "").orEmpty()

    fun capture(uri: Uri?) {
        if (uri == null || uri.host != "auth" || (uri.scheme != "aeko" && uri.scheme != "lyan")) return
        val code = uri.getQueryParameter("code")
        if (!code.isNullOrBlank()) {
            Thread { exchange(code) }.start()
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
                val json = JSONObject(res.body?.string().orEmpty().ifBlank { "{}" })
                val email = json.optString("email")
                val token = json.optString("token")
                if (email.isNotBlank() && token.isNotBlank()) save(email, json.optString("name"), token)
            }
        }
    }

    private fun save(email: String, name: String, token: String) {
        prefs.edit()
            .putString("email", email)
            .putString("name", name)
            .putString("token", token)
            .apply()
        _account.value = email
    }
}
