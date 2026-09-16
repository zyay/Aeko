package com.zyay.aeko.remote

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class DeviceStore(context: Context) {
    private val app = context.applicationContext
    private val prefs = runCatching {
        val master = MasterKey.Builder(app).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
        EncryptedSharedPreferences.create(
            app,
            "aeko_devices",
            master,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }.getOrElse { app.getSharedPreferences("aeko_devices_fb", Context.MODE_PRIVATE) }

    var host: String
        get() = prefs.getString("host", "") ?: ""
        set(value) { prefs.edit().putString("host", value).apply() }
    var port: Int
        get() = prefs.getInt("port", 22)
        set(value) { prefs.edit().putInt("port", value).apply() }
    var user: String
        get() = prefs.getString("user", "") ?: ""
        set(value) { prefs.edit().putString("user", value).apply() }
    var password: String
        get() = prefs.getString("password", "") ?: ""
        set(value) { prefs.edit().putString("password", value).apply() }
    var keyPath: String
        get() = prefs.getString("keyPath", "") ?: ""
        set(value) { prefs.edit().putString("keyPath", value).apply() }
    var hostFingerprint: String
        get() = prefs.getString("hostFp", "") ?: ""
        set(value) { prefs.edit().putString("hostFp", value).apply() }
    var vncUrl: String
        get() = prefs.getString("vnc", "http://10.0.2.2:6080/vnc.html") ?: ""
        set(value) { prefs.edit().putString("vnc", value).apply() }
}
