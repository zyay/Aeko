package com.zyay.lyan.brain

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class BrainStore(context: Context) {
    private val app = context.applicationContext
    private val prefs = runCatching {
        val master = MasterKey.Builder(app).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
        EncryptedSharedPreferences.create(
            app,
            "lyan_brain",
            master,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }.getOrElse { app.getSharedPreferences("lyan_brain_fallback", Context.MODE_PRIVATE) }

    var mode: String
        get() = prefs.getString("mode", "byok") ?: "byok"
        set(value) { prefs.edit().putString("mode", value).apply() }

    var baseUrl: String
        get() = prefs.getString("url", "https://api.openai.com/v1") ?: ""
        set(value) { prefs.edit().putString("url", value).apply() }

    var apiKey: String
        get() = prefs.getString("key", "") ?: ""
        set(value) { prefs.edit().putString("key", value).apply() }

    var model: String
        get() = prefs.getString("model", "gpt-4o-mini") ?: "gpt-4o-mini"
        set(value) { prefs.edit().putString("model", value).apply() }

    var valid: Boolean
        get() = prefs.getBoolean("valid", false)
        set(value) { prefs.edit().putBoolean("valid", value).apply() }

    var onboarded: Boolean
        get() = prefs.getBoolean("onboarded", false)
        set(value) { prefs.edit().putBoolean("onboarded", value).apply() }
}
