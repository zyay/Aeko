package com.zyay.aeko.remote

import android.content.Context

class DeviceStore(context: Context) {
    private val prefs = context.getSharedPreferences("aeko_devices", Context.MODE_PRIVATE)

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
    var vncUrl: String
        get() = prefs.getString("vnc", "http://10.0.2.2:6080/vnc.html") ?: ""
        set(value) { prefs.edit().putString("vnc", value).apply() }
}
