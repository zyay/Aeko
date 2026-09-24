package com.zyay.aeko.ui.chat

import android.app.Application
import android.content.Context
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.zyay.aeko.BuildConfig
import com.zyay.aeko.auth.AuthStore
import com.zyay.aeko.brain.BotRoster
import com.zyay.aeko.brain.BrainStore
import com.zyay.aeko.collab.CollabClient
import com.zyay.aeko.engine.EnginePhase
import com.zyay.aeko.engine.GenerationHud
import com.zyay.aeko.engine.LlmClient
import com.zyay.aeko.engine.OnDeviceEngine
import com.zyay.aeko.memory.VaultStore
import com.zyay.aeko.models.HfModelStore
import com.zyay.aeko.notify.ActivityNotify
import com.zyay.aeko.remote.DeviceStore
import com.zyay.aeko.remote.SshClient
import com.zyay.aeko.ui.components.OrbState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

data class ChatMessage(
    val id: Long,
    val text: String,
    val isUser: Boolean,
    val kind: String = "chat",
    val remoteId: String? = null
)

data class TaskItem(
    val title: String,
    val roomId: String? = null,
    val preview: String = "",
    val updatedAt: Long = 0L
)

data class ChatUiState(
    val messages: List<ChatMessage> = emptyList(),
    val draft: String = "",
    val agentMode: Boolean = false,
    val autoTools: Boolean = true,
    val onlineTools: Boolean = false,
    val codeMode: Boolean = false,
    val phase: EnginePhase = EnginePhase.Idle,
    val hud: GenerationHud = GenerationHud(),
    val vaultName: String? = null,
    val vaultText: String = "",
    val showHud: Boolean = true,
    val account: String? = null,
    val sshLive: Boolean = false,
    val modelReady: Boolean = false,
    val tasks: List<TaskItem> = listOf(TaskItem("General")),
    val currentTask: String = "General",
    val brainMode: String = "byok",
    val roomId: String? = null,
    val inviteHint: String = "",
    val members: List<String> = emptyList(),
    val authUrl: String = BuildConfig.AUTH_URL,
    val brainStatus: String = "",
    val durable: Boolean? = null
)

class ChatViewModel(app: Application) : AndroidViewModel(app) {
    val auth = AuthStore(app)
    val models = HfModelStore(app)
    val devices = DeviceStore(app)
    val ssh = SshClient()
    val brain = BrainStore(app)
    private val collab = CollabClient(app)
    private val engine = OnDeviceEngine(ssh = ssh)
    private val prefs = app.getSharedPreferences("aeko_tasks", Context.MODE_PRIVATE)
    private val _state = MutableStateFlow(
        ChatUiState(
            account = auth.account.value,
            modelReady = models.current().ready,
            onlineTools = brain.valid,
            brainMode = brain.mode
        )
    )
    val state: StateFlow<ChatUiState> = _state
    private var nextId = 1L
    private var sendJob: Job? = null
    @Volatile private var stopFlag = false
    private val seenRemote = mutableSetOf<String>()

    init {
        restoreTasks()
        viewModelScope.launch {
            auth.account.collect { email -> _state.update { it.copy(account = email) } }
        }
        viewModelScope.launch {
            auth.lastError.collect { err ->
                if (!err.isNullOrBlank()) _state.update { it.copy(inviteHint = err) }
            }
        }
        viewModelScope.launch {
            ssh.connected.collect { live -> _state.update { it.copy(sshLive = live) } }
        }
        viewModelScope.launch {
            models.status.collect { st -> _state.update { it.copy(modelReady = st.ready) } }
        }
        viewModelScope.launch(Dispatchers.IO) { pingHealth() }
        viewModelScope.launch(Dispatchers.IO) {
            while (isActive) {
                delay(12_000)
                syncRoom(notify = true)
            }
        }
        viewModelScope.launch(Dispatchers.IO) {
            val token = auth.token()
            if (token.isNotBlank()) runCatching { collab.publishKey(token); pullRooms() }
        }
    }

    private fun persist() {
        val json = JSONArray()
        _state.value.tasks.forEach { t ->
            json.put(
                JSONObject()
                    .put("title", t.title)
                    .put("roomId", t.roomId ?: JSONObject.NULL)
                    .put("preview", t.preview)
                    .put("updatedAt", t.updatedAt)
            )
        }
        prefs.edit()
            .putString("tasks", json.toString())
            .putString("current", _state.value.currentTask)
            .putString("room", _state.value.roomId)
            .apply()
    }

    private fun restoreTasks() {
        val raw = prefs.getString("tasks", null) ?: return
        val arr = runCatching { JSONArray(raw) }.getOrNull() ?: return
        val tasks = buildList {
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                add(
                    TaskItem(
                        o.optString("title"),
                        o.optString("roomId").ifBlank { null },
                        o.optString("preview"),
                        o.optLong("updatedAt")
                    )
                )
            }
        }
        if (tasks.isEmpty()) return
        val current = prefs.getString("current", tasks.first().title) ?: tasks.first().title
        val room = prefs.getString("room", tasks.find { it.title == current }?.roomId)
        _state.update { it.copy(tasks = tasks, currentTask = current, roomId = room) }
    }

    fun onDraft(value: String) {
        _state.update { it.copy(draft = value) }
    }

    fun replyTo(text: String) {
        _state.update { it.copy(draft = "> ${text.take(200)}\n") }
    }

    fun regenerateFrom(messageId: Long) {
        val msgs = _state.value.messages
        val idx = msgs.indexOfFirst { it.id == messageId }
        if (idx <= 0) return
        for (i in idx - 1 downTo 0) {
            if (msgs[i].isUser) {
                send(msgs[i].text)
                return
            }
        }
    }

    private fun touchTask(preview: String) {
        val title = _state.value.currentTask
        val now = System.currentTimeMillis()
        _state.update { ui ->
            ui.copy(
                tasks = ui.tasks.map { t ->
                    if (t.title == title) t.copy(preview = preview.take(120), updatedAt = now) else t
                }
            )
        }
        persist()
    }

    fun toggleAgent() {
        _state.update { it.copy(agentMode = !it.agentMode) }
    }

    fun toggleAuto() {
        _state.update { it.copy(autoTools = !it.autoTools) }
    }

    fun toggleOnline() {
        _state.update { it.copy(onlineTools = !it.onlineTools) }
    }

    fun toggleCode() {
        _state.update { it.copy(codeMode = !it.codeMode) }
    }

    fun attach(uri: Uri, name: String) {
        val text = VaultStore.readText(getApplication(), uri)
        _state.update {
            it.copy(
                vaultName = name,
                vaultText = if (text.isBlank()) it.vaultText else (it.vaultText + "\n\n" + text).take(200_000)
            )
        }
    }

    fun ingestShared(text: String) {
        if (text.isBlank()) return
        _state.update { it.copy(vaultText = (it.vaultText + "\n\n" + text).take(200_000), vaultName = "Shared text") }
    }

    fun applyBrain(valid: Boolean) {
        _state.update { it.copy(onlineTools = valid, brainMode = brain.mode) }
    }

    fun signOut() {
        auth.signOut()
        _state.update { it.copy(account = null, inviteHint = "Signed out") }
    }

    fun retestBrain() {
        viewModelScope.launch(Dispatchers.IO) {
            val ok = runCatching { LlmClient().ping(brain.baseUrl, brain.apiKey, brain.model) }.getOrDefault(false)
            brain.valid = ok
            _state.update { it.copy(brainStatus = if (ok) "Brain reachable" else "Brain test failed", onlineTools = ok, brainMode = brain.mode) }
        }
    }

    fun addTask(title: String) {
        val name = title.ifBlank { "Task ${_state.value.tasks.size + 1}" }
        _state.update { it.copy(tasks = it.tasks + TaskItem(name), currentTask = name, messages = emptyList(), members = emptyList()) }
        persist()
        viewModelScope.launch(Dispatchers.IO) {
            val token = auth.token()
            if (token.isNotBlank()) {
                val err = runCatching {
                    collab.publishKey(token)
                    val id = collab.createRoom(token, name)
                    if (id.isBlank()) throw IllegalStateException("empty room id")
                    _state.update { ui ->
                        ui.copy(
                            roomId = id,
                            tasks = ui.tasks.map { if (it.title == name) it.copy(roomId = id) else it }
                        )
                    }
                    persist()
                }.exceptionOrNull()
                if (err != null) _state.update { it.copy(inviteHint = err.message ?: "Could not create room") }
            }
            ActivityNotify.show(getApplication(), name)
        }
    }

    fun invitePerson(email: String) {
        val room = _state.value.roomId
        viewModelScope.launch(Dispatchers.IO) {
            val token = auth.token()
            if (token.isBlank() || room.isNullOrBlank()) {
                _state.update { it.copy(inviteHint = "Sign in and create a task first") }
                return@launch
            }
            val err = runCatching { collab.invite(token, room, email.trim()) }.exceptionOrNull()
            _state.update {
                if (err == null) {
                    it.copy(
                        inviteHint = "Invited ${email.trim()}",
                        members = (it.members + email.trim()).distinct()
                    )
                } else {
                    it.copy(inviteHint = err.message ?: "invite failed")
                }
            }
        }
    }

    fun selectTask(title: String) {
        val item = _state.value.tasks.find { it.title == title }
        seenRemote.clear()
        _state.update { it.copy(currentTask = title, roomId = item?.roomId, messages = emptyList()) }
        persist()
        viewModelScope.launch(Dispatchers.IO) { syncRoom(notify = false) }
    }

    fun newChat() {
        _state.update {
            ChatUiState(
                agentMode = it.agentMode,
                autoTools = it.autoTools,
                onlineTools = it.onlineTools,
                codeMode = it.codeMode,
                showHud = it.showHud,
                account = it.account,
                sshLive = it.sshLive,
                modelReady = it.modelReady,
                tasks = it.tasks,
                currentTask = it.currentTask,
                brainMode = it.brainMode,
                roomId = it.roomId,
                inviteHint = it.inviteHint,
                members = it.members,
                vaultName = it.vaultName,
                vaultText = it.vaultText
            )
        }
    }

    fun stop() {
        stopFlag = true
        sendJob?.cancel()
        _state.update { it.copy(phase = EnginePhase.Idle) }
    }

    fun send(preset: String? = null) {
        val prompt = (preset ?: _state.value.draft).trim().let { text ->
            if (_state.value.codeMode && !text.lowercase().contains("code")) "Code Mode. $text" else text
        }
        if (prompt.isBlank() || _state.value.phase != EnginePhase.Idle) return
        val online = _state.value.onlineTools
        val sshLive = _state.value.sshLive
        val user = ChatMessage(nextId++, prompt, true)
        _state.update {
            it.copy(
                messages = it.messages + user,
                draft = "",
                phase = EnginePhase.Thinking,
                hud = GenerationHud(0f, backendLabel(), net = online, ssh = sshLive)
            )
        }
        postPlain(prompt)
        touchTask(prompt)
        stopFlag = false
        sendJob = viewModelScope.launch {
            if (_state.value.agentMode) {
                val open = Regex("https://[^\\s]+").find(prompt)?.value
                if (open != null) {
                    com.zyay.aeko.agent.AgentActions.openUrl(getApplication(), open)
                }
            }
            val id = nextId++
            _state.update {
                it.copy(
                    phase = EnginePhase.Speaking,
                    messages = it.messages + ChatMessage(id, "", false)
                )
            }
            val start = System.nanoTime()
            var n = 0
            val full = withContext(Dispatchers.IO) {
                runCatching {
                    engine.reply(
                        prompt,
                        _state.value.vaultText,
                        _state.value.agentMode,
                        online,
                        models.current().ready,
                        brain.baseUrl,
                        brain.apiKey,
                        brain.model,
                        brain.valid,
                        brain.mode,
                        models.current().path,
                        BotRoster.resolve(getApplication(), prompt).prompt,
                        onTrace = { trace ->
                            viewModelScope.launch {
                                _state.update { ui ->
                                    ui.copy(messages = ui.messages + ChatMessage(nextId++, trace, false, kind = "tool"))
                                }
                            }
                        },
                        onDelta = { piece ->
                            n += 1
                            val elapsed = (System.nanoTime() - start) / 1_000_000_000.0
                            val tps = if (elapsed > 0.05) n / elapsed.toFloat() else 18f
                            _state.update { ui ->
                                ui.copy(
                                    hud = GenerationHud(tps, backendLabel(), net = online, ssh = sshLive),
                                    messages = ui.messages.map { msg ->
                                        if (msg.id == id) msg.copy(text = msg.text + piece) else msg
                                    }
                                )
                            }
                        },
                        shouldStop = { stopFlag }
                    )
                }.getOrElse { "LLM error: ${it.message}" }
            }
            val last = _state.value.messages.find { it.id == id }?.text.orEmpty()
            if (last.isBlank() && full.isNotBlank()) {
                _state.update { ui ->
                    ui.copy(messages = ui.messages.map { msg -> if (msg.id == id) msg.copy(text = full) else msg })
                }
            }
            postPlain(_state.value.messages.find { it.id == id }?.text.orEmpty())
            touchTask(_state.value.messages.find { it.id == id }?.text.orEmpty())
            _state.update { it.copy(phase = EnginePhase.Idle) }
        }
    }

    private fun backendLabel(): String {
        return when {
            brain.mode == "gguf" -> "GGUF"
            brain.valid -> "BYOK"
            else -> "On-device"
        }
    }

    private fun postPlain(text: String) {
        if (text.isBlank()) return
        val token = auth.token()
        if (token.isBlank()) return
        viewModelScope.launch(Dispatchers.IO) {
            var room = _state.value.roomId
            var tries = 0
            while (room.isNullOrBlank() && tries < 20) {
                delay(150)
                room = _state.value.roomId
                tries++
            }
            if (room.isNullOrBlank()) return@launch
            runCatching {
                val snap = collab.fetchSnapshot(token, room)
                val enc = collab.encrypt(snap.key, text)
                collab.postCipher(token, room, enc.first, enc.second)
            }.onFailure { err ->
                _state.update { it.copy(inviteHint = err.message ?: "Could not sync message") }
            }
        }
    }

    private fun pingHealth() {
        runCatching {
            val url = java.net.URL("${BuildConfig.AUTH_URL.trimEnd('/')}/api/health")
            val json = JSONObject(url.readText())
            _state.update { it.copy(durable = json.optBoolean("durable", json.optString("db") == "postgres")) }
        }
    }

    private fun pullRooms() {
        val token = auth.token()
        if (token.isBlank()) return
        val rooms = collab.rooms(token)
        val mapped = buildList {
            for (i in 0 until rooms.length()) {
                val o = rooms.optJSONObject(i) ?: continue
                add(
                    TaskItem(
                        o.optString("title"),
                        o.optString("id"),
                        preview = "",
                        updatedAt = o.optLong("lastAt", o.optLong("createdAt"))
                    )
                )
            }
        }
        if (mapped.isEmpty()) return
        _state.update { ui ->
            val merged = (mapped + ui.tasks).distinctBy { it.roomId ?: it.title }
            ui.copy(tasks = merged, roomId = ui.roomId ?: mapped.first().roomId, currentTask = ui.currentTask)
        }
        persist()
    }

    private fun syncRoom(notify: Boolean) {
        val room = _state.value.roomId ?: return
        val token = auth.token()
        if (token.isBlank()) return
        runCatching {
            val snap = collab.fetchSnapshot(token, room)
            val me = auth.account.value
            val incoming = snap.messages.map { m ->
                val text = runCatching { collab.decrypt(snap.key, m.iv, m.ciphertext) }.getOrDefault("(undecryptable)")
                ChatMessage(remoteStableId(m.id), text, m.from.equals(me, ignoreCase = true), remoteId = m.id)
            }
            val generating = _state.value.phase != EnginePhase.Idle
            val firstSync = seenRemote.isEmpty()
            val newRemote = incoming.filter { msg ->
                val rid = msg.remoteId ?: return@filter false
                seenRemote.add(rid)
            }
            _state.update { ui ->
                val merged = if (generating) {
                    val known = ui.messages.mapNotNull { it.remoteId }.toSet()
                    ui.messages + incoming.filter { it.remoteId != null && it.remoteId !in known }
                } else {
                    incoming.ifEmpty { ui.messages }
                }
                val last = merged.lastOrNull()
                val tasks = if (last != null) {
                    ui.tasks.map { t ->
                        if (t.title == ui.currentTask) t.copy(preview = last.text.take(120), updatedAt = System.currentTimeMillis()) else t
                    }
                } else ui.tasks
                ui.copy(members = snap.members, messages = merged.distinctBy { it.remoteId ?: "l-${it.id}" }, tasks = tasks)
            }
            if (!generating) persist()
            val lastNew = newRemote.lastOrNull()
            if (notify && !firstSync && lastNew != null && !lastNew.isUser) {
                ActivityNotify.show(getApplication(), _state.value.currentTask)
            }
        }
    }
}

private fun remoteStableId(id: String): Long {
    var h = 1125899906842597L
    for (c in id) h = h * 131L + c.code
    return 1_000_000_000_000L + (h and 0x7fffffffffffL)
}

fun EnginePhase.toOrb(): OrbState = when (this) {
    EnginePhase.Idle -> OrbState.Idle
    EnginePhase.Thinking -> OrbState.Thinking
    EnginePhase.Speaking -> OrbState.Speaking
}
