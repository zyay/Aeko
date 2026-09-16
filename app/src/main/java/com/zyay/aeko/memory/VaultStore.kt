package com.zyay.aeko.memory

import android.content.Context
import java.io.BufferedReader
import java.io.InputStreamReader

object VaultStore {
    fun readText(context: Context, uri: android.net.Uri): String {
        return try {
            context.contentResolver.openInputStream(uri)?.use { stream ->
                BufferedReader(InputStreamReader(stream)).readText()
            }?.take(120_000) ?: ""
        } catch (_: Exception) {
            ""
        }
    }
}
