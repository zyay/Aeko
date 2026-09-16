package com.zyay.lyan.collab

import android.content.Context
import android.util.Base64
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.zyay.lyan.BuildConfig
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.security.KeyFactory
import java.security.KeyPairGenerator
import java.security.SecureRandom
import java.security.spec.ECGenParameterSpec
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.X509EncodedKeySpec
import javax.crypto.Cipher
import javax.crypto.KeyAgreement
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

class CollabClient(context: Context) {
    private val app = context.applicationContext
    private val http = OkHttpClient()
    private val prefs = runCatching {
        val master = MasterKey.Builder(app).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
        EncryptedSharedPreferences.create(
            app, "lyan_collab", master,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }.getOrElse { app.getSharedPreferences("lyan_collab_fb", Context.MODE_PRIVATE) }

    private val root get() = BuildConfig.AUTH_URL.trimEnd('/')

    fun ensureKeys() {
        if (!prefs.getString("pub", null).isNullOrBlank()) return
        val gen = KeyPairGenerator.getInstance("EC")
        gen.initialize(ECGenParameterSpec("secp256r1"))
        val pair = gen.generateKeyPair()
        prefs.edit()
            .putString("pub", b64(pair.public.encoded))
            .putString("priv", b64(pair.private.encoded))
            .apply()
    }

    fun publicB64(): String = prefs.getString("pub", "").orEmpty()

    fun newRoomKey(): String {
        val bytes = ByteArray(32)
        SecureRandom().nextBytes(bytes)
        return b64(bytes)
    }

    fun wrap(roomKeyB64: String, theirPubB64: String): Pair<String, String> {
        val shared = ecdh(theirPubB64)
        val iv = ByteArray(12).also { SecureRandom().nextBytes(it) }
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(shared, "AES"), GCMParameterSpec(128, iv))
        return b64(iv) to b64(cipher.doFinal(Base64.decode(roomKeyB64, Base64.NO_WRAP)))
    }

    fun unwrap(wrapped: String, iv: String, theirPubB64: String): String {
        val shared = ecdh(theirPubB64)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(shared, "AES"), GCMParameterSpec(128, Base64.decode(iv, Base64.NO_WRAP)))
        return b64(cipher.doFinal(Base64.decode(wrapped, Base64.NO_WRAP)))
    }

    fun encrypt(roomKey: String, plain: String): Pair<String, String> {
        val iv = ByteArray(12).also { SecureRandom().nextBytes(it) }
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(Base64.decode(roomKey, Base64.NO_WRAP), "AES"), GCMParameterSpec(128, iv))
        return b64(iv) to b64(cipher.doFinal(plain.toByteArray(Charsets.UTF_8)))
    }

    fun decrypt(roomKey: String, iv: String, ct: String): String {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(Base64.decode(roomKey, Base64.NO_WRAP), "AES"), GCMParameterSpec(128, Base64.decode(iv, Base64.NO_WRAP)))
        return String(cipher.doFinal(Base64.decode(ct, Base64.NO_WRAP)), Charsets.UTF_8)
    }

    fun publishKey(token: String) {
        ensureKeys()
        put("$root/api/me/keys", token, JSONObject().put("publicKey", JSONObject().put("kty", "EC").put("raw", publicB64()).toString()))
    }

    fun rooms(token: String): JSONArray {
        val json = get("$root/api/rooms", token)
        return json.optJSONArray("rooms") ?: JSONArray()
    }

    fun createRoom(token: String, title: String): String {
        ensureKeys()
        val key = newRoomKey()
        val wrap = wrap(key, publicB64())
        val id = post(
            "$root/api/rooms",
            token,
            JSONObject()
                .put("title", title)
                .put("wrappedKey", wrap.second)
                .put("wrapIv", wrap.first)
                .put("peerPub", JSONObject().put("kty", "EC").put("raw", publicB64()).toString())
        ).optString("id")
        prefs.edit().putString("room_$id", key).apply()
        return id
    }

    private fun ecdh(theirPubB64: String): ByteArray {
        val kf = KeyFactory.getInstance("EC")
        val mine = kf.generatePrivate(PKCS8EncodedKeySpec(Base64.decode(prefs.getString("priv", "")!!, Base64.NO_WRAP)))
        val theirs = kf.generatePublic(X509EncodedKeySpec(Base64.decode(theirPubB64, Base64.NO_WRAP)))
        val ka = KeyAgreement.getInstance("ECDH")
        ka.init(mine)
        ka.doPhase(theirs, true)
        return ka.generateSecret().copyOf(32)
    }

    private fun get(url: String, token: String): JSONObject {
        val req = Request.Builder().url(url).header("Authorization", "Bearer $token").build()
        http.newCall(req).execute().use { res ->
            return JSONObject(res.body?.string().orEmpty().ifBlank { "{}" })
        }
    }

    private fun post(url: String, token: String, body: JSONObject): JSONObject {
        val req = Request.Builder().url(url).header("Authorization", "Bearer $token")
            .post(body.toString().toRequestBody("application/json".toMediaType())).build()
        http.newCall(req).execute().use { res ->
            return JSONObject(res.body?.string().orEmpty().ifBlank { "{}" })
        }
    }

    private fun put(url: String, token: String, body: JSONObject) {
        val req = Request.Builder().url(url).header("Authorization", "Bearer $token")
            .put(body.toString().toRequestBody("application/json".toMediaType())).build()
        http.newCall(req).execute()
    }

    private fun b64(bytes: ByteArray) = Base64.encodeToString(bytes, Base64.NO_WRAP)
}
