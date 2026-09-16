package com.zyay.aeko.collab

import android.content.Context
import android.util.Base64
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.zyay.aeko.BuildConfig
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.math.BigInteger
import java.security.AlgorithmParameters
import java.security.KeyFactory
import java.security.KeyPairGenerator
import java.security.SecureRandom
import java.security.interfaces.ECPublicKey
import java.security.spec.ECGenParameterSpec
import java.security.spec.ECParameterSpec
import java.security.spec.ECPoint
import java.security.spec.ECPublicKeySpec
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
            app, "aeko_collab", master,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }.getOrElse { app.getSharedPreferences("aeko_collab_fb", Context.MODE_PRIVATE) }

    private val root get() = BuildConfig.AUTH_URL.trimEnd('/')

    fun ensureKeys() {
        if (!prefs.getString("jwk", null).isNullOrBlank()) return
        val gen = KeyPairGenerator.getInstance("EC")
        gen.initialize(ECGenParameterSpec("secp256r1"))
        val pair = gen.generateKeyPair()
        val pub = pair.public as ECPublicKey
        prefs.edit()
            .putString("jwk", toJwk(pub).toString())
            .putString("priv", b64(pair.private.encoded))
            .apply()
    }

    fun publicJwkJson(): String {
        ensureKeys()
        return prefs.getString("jwk", "{}").orEmpty()
    }

    fun newRoomKey(): String {
        val bytes = ByteArray(32)
        SecureRandom().nextBytes(bytes)
        return b64(bytes)
    }

    fun wrap(roomKeyB64: String, theirPubJson: String): Pair<String, String> {
        val shared = ecdh(theirPubJson)
        val iv = ByteArray(12).also { SecureRandom().nextBytes(it) }
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(shared, "AES"), GCMParameterSpec(128, iv))
        return b64(iv) to b64(cipher.doFinal(Base64.decode(roomKeyB64, Base64.NO_WRAP)))
    }

    fun unwrap(wrapped: String, iv: String, theirPubJson: String): String {
        val shared = ecdh(theirPubJson)
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
        put("$root/api/me/keys", token, JSONObject().put("publicKey", publicJwkJson()))
    }

    fun rooms(token: String): JSONArray {
        val json = get("$root/api/rooms", token)
        return json.optJSONArray("rooms") ?: JSONArray()
    }

    fun createRoom(token: String, title: String): String {
        ensureKeys()
        val key = newRoomKey()
        val mine = publicJwkJson()
        val wrap = wrap(key, mine)
        val id = post(
            "$root/api/rooms",
            token,
            JSONObject()
                .put("title", title)
                .put("wrappedKey", wrap.second)
                .put("wrapIv", wrap.first)
                .put("peerPub", mine)
        ).optString("id")
        prefs.edit().putString("room_$id", key).apply()
        return id
    }

    data class RoomMsg(val id: String, val from: String, val iv: String, val ciphertext: String)
    data class RoomSnapshot(val key: String, val members: List<String>, val messages: List<RoomMsg>)

    fun roomKey(roomId: String): String? = prefs.getString("room_$roomId", null)

    fun rememberKey(roomId: String, key: String) {
        prefs.edit().putString("room_$roomId", key).apply()
    }

    fun fetchSnapshot(token: String, roomId: String): RoomSnapshot {
        val json = get("$root/api/rooms/$roomId/messages", token)
        val mine = json.optJSONObject("membership") ?: JSONObject()
        val cached = roomKey(roomId)
        val key = cached ?: unwrap(
            mine.optString("wrappedKey"),
            mine.optString("wrapIv"),
            mine.optString("peerPub")
        ).also { rememberKey(roomId, it) }
        val members = json.optJSONArray("members") ?: JSONArray()
        val emails = buildList {
            for (i in 0 until members.length()) add(members.optJSONObject(i)?.optString("email").orEmpty())
        }.filter { it.isNotBlank() }
        val raw = json.optJSONArray("messages") ?: JSONArray()
        val messages = buildList {
            for (i in 0 until raw.length()) {
                val m = raw.optJSONObject(i) ?: continue
                add(RoomMsg(m.optString("id"), m.optString("from"), m.optString("iv"), m.optString("ciphertext")))
            }
        }
        return RoomSnapshot(key, emails, messages)
    }

    fun postCipher(token: String, roomId: String, iv: String, ciphertext: String) {
        post(
            "$root/api/rooms/$roomId/messages",
            token,
            JSONObject().put("iv", iv).put("ciphertext", ciphertext)
        )
        post("$root/api/rooms/$roomId/notify", token, JSONObject())
    }

    fun invite(token: String, roomId: String, email: String) {
        val key = prefs.getString("room_$roomId", null) ?: return
        val lookup = get("$root/api/users?email=${java.net.URLEncoder.encode(email, "UTF-8")}", token)
        val their = lookup.optString("publicKey")
        if (their.isBlank()) throw IllegalStateException("not found")
        val wrap = wrap(key, their)
        post(
            "$root/api/rooms/$roomId/members",
            token,
            JSONObject()
                .put("email", email.trim().lowercase())
                .put("wrappedKey", wrap.second)
                .put("wrapIv", wrap.first)
                .put("peerPub", publicJwkJson())
        )
        post("$root/api/rooms/$roomId/notify", token, JSONObject())
    }

    private fun ecdh(theirPubJson: String): ByteArray {
        val kf = KeyFactory.getInstance("EC")
        val mineRaw = prefs.getString("priv", "").orEmpty()
        if (mineRaw.isBlank()) throw IllegalStateException("missing device key")
        val mine = kf.generatePrivate(PKCS8EncodedKeySpec(Base64.decode(mineRaw, Base64.NO_WRAP)))
        val theirs = parsePublic(theirPubJson)
        val ka = KeyAgreement.getInstance("ECDH")
        ka.init(mine)
        ka.doPhase(theirs, true)
        return ka.generateSecret().copyOf(32)
    }

    private fun parsePublic(json: String): ECPublicKey {
        val o = if (json.trim().startsWith("{")) JSONObject(json) else JSONObject().put("raw", json)
        val kf = KeyFactory.getInstance("EC")
        if (o.has("x") && o.has("y")) {
            val params = AlgorithmParameters.getInstance("EC")
            params.init(ECGenParameterSpec("secp256r1"))
            val spec = params.getParameterSpec(ECParameterSpec::class.java)
            val x = BigInteger(1, b64urlDecode(o.getString("x")))
            val y = BigInteger(1, b64urlDecode(o.getString("y")))
            return kf.generatePublic(ECPublicKeySpec(ECPoint(x, y), spec)) as ECPublicKey
        }
        val raw = o.optString("raw")
        return kf.generatePublic(X509EncodedKeySpec(Base64.decode(raw, Base64.NO_WRAP))) as ECPublicKey
    }

    private fun toJwk(pub: ECPublicKey): JSONObject {
        val p = pub.w
        return JSONObject()
            .put("kty", "EC")
            .put("crv", "P-256")
            .put("x", b64url(i32(p.affineX)))
            .put("y", b64url(i32(p.affineY)))
    }

    private fun i32(n: BigInteger): ByteArray {
        val raw = n.toByteArray()
        val out = ByteArray(32)
        val src = if (raw.size > 32) raw.copyOfRange(raw.size - 32, raw.size) else raw
        System.arraycopy(src, 0, out, 32 - src.size, src.size)
        return out
    }

    private fun b64url(bytes: ByteArray) =
        Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)

    private fun b64urlDecode(s: String): ByteArray {
        var t = s.replace('-', '+').replace('_', '/')
        while (t.length % 4 != 0) t += "="
        return Base64.decode(t, Base64.DEFAULT)
    }

    private fun get(url: String, token: String): JSONObject {
        val req = Request.Builder().url(url).header("Authorization", "Bearer $token").build()
        http.newCall(req).execute().use { res ->
            val body = res.body?.string().orEmpty().ifBlank { "{}" }
            if (!res.isSuccessful) throw IllegalStateException("HTTP ${res.code}: ${body.take(180)}")
            return JSONObject(body)
        }
    }

    private fun post(url: String, token: String, body: JSONObject): JSONObject {
        val req = Request.Builder().url(url).header("Authorization", "Bearer $token")
            .post(body.toString().toRequestBody("application/json".toMediaType())).build()
        http.newCall(req).execute().use { res ->
            val text = res.body?.string().orEmpty().ifBlank { "{}" }
            if (!res.isSuccessful) throw IllegalStateException("HTTP ${res.code}: ${text.take(180)}")
            return JSONObject(text)
        }
    }

    private fun put(url: String, token: String, body: JSONObject) {
        val req = Request.Builder().url(url).header("Authorization", "Bearer $token")
            .put(body.toString().toRequestBody("application/json".toMediaType())).build()
        http.newCall(req).execute().use { res ->
            if (!res.isSuccessful) throw IllegalStateException("HTTP ${res.code}")
        }
    }

    private fun b64(bytes: ByteArray) = Base64.encodeToString(bytes, Base64.NO_WRAP)
}
