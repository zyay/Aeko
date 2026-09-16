package com.zyay.aeko.remote

import com.jcraft.jsch.ChannelExec
import com.jcraft.jsch.ChannelSftp
import com.jcraft.jsch.HostKey
import com.jcraft.jsch.HostKeyRepository
import com.jcraft.jsch.JSch
import com.jcraft.jsch.Session
import com.jcraft.jsch.UserInfo
import java.io.ByteArrayOutputStream
import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.withContext

class SshClient {
    private val jsch = JSch()
    private var session: Session? = null
    private val _connected = MutableStateFlow(false)
    val connected: StateFlow<Boolean> = _connected
    private val _log = MutableStateFlow("Disconnected")
    val log: StateFlow<String> = _log

    suspend fun connect(
        host: String,
        port: Int,
        user: String,
        password: String,
        keyPath: String = "",
        expectedFingerprint: String = "",
        onTrust: (String) -> Unit = {}
    ): String =
        withContext(Dispatchers.IO) {
            disconnect()
            runCatching {
                if (keyPath.isNotBlank() && File(keyPath).isFile) {
                    jsch.addIdentity(keyPath)
                }
                val s = jsch.getSession(user, host, port)
                if (password.isNotBlank()) s.setPassword(password)
                s.hostKeyRepository = FingerprintHosts(jsch, expectedFingerprint, onTrust)
                s.setConfig("StrictHostKeyChecking", "yes")
                s.connect(12_000)
                val fp = s.hostKey?.getFingerPrint(jsch) ?: expectedFingerprint
                session = s
                _connected.value = true
                _log.value = "Connected to $user@$host:$port · $fp"
                _log.value
            }.getOrElse {
                _connected.value = false
                _log.value = it.message ?: "SSH failed"
                _log.value
            }
        }

    fun disconnect() {
        runCatching { session?.disconnect() }
        session = null
        _connected.value = false
        _log.value = "Disconnected"
    }

    fun exec(command: String): String {
        val s = session ?: return "SSH not connected."
        if (command.isBlank()) return "Empty command."
        return runCatching {
            val channel = s.openChannel("exec") as ChannelExec
            channel.setCommand(command.take(4000))
            val err = ByteArrayOutputStream()
            channel.setErrStream(err)
            val out = channel.inputStream
            channel.connect(8_000)
            val body = out.readBytes().decodeToString().take(8000)
            val errors = err.toString().take(2000)
            channel.disconnect()
            (body + if (errors.isNotBlank()) "\n$errors" else "").ifBlank { "(no output)" }
        }.getOrElse { it.message ?: "exec failed" }
    }

    fun read(path: String): String {
        val s = session ?: return "SSH not connected."
        val safe = path.trim()
        if (safe.contains("..") || !safe.startsWith("/")) return "Path must be absolute without .."
        return runCatching {
            val channel = s.openChannel("sftp") as ChannelSftp
            channel.connect(8_000)
            val text = channel.get(safe).bufferedReader().use { it.readText().take(8000) }
            channel.disconnect()
            text.ifBlank { "(empty file)" }
        }.getOrElse { it.message ?: "sftp failed" }
    }
}

private class FingerprintHosts(
    private val jsch: JSch,
    private val expected: String,
    private val onTrust: (String) -> Unit
) : HostKeyRepository {
    override fun check(host: String?, key: ByteArray?): Int {
        if (host.isNullOrBlank() || key == null) return HostKeyRepository.NOT_INCLUDED
        val fp = HostKey(host, key).getFingerPrint(jsch) ?: return HostKeyRepository.NOT_INCLUDED
        if (expected.isBlank()) {
            onTrust(fp)
            return HostKeyRepository.OK
        }
        return if (expected.equals(fp, ignoreCase = true)) HostKeyRepository.OK else HostKeyRepository.CHANGED
    }

    override fun add(hostkey: HostKey?, ui: UserInfo?) {}
    override fun remove(host: String?, type: String?) {}
    override fun remove(host: String?, type: String?, key: ByteArray?) {}
    override fun getKnownHostsRepositoryID(): String = "aeko-tofu"
    override fun getHostKey(): Array<HostKey> = emptyArray()
    override fun getHostKey(host: String?, type: String?): Array<HostKey> = emptyArray()
}
