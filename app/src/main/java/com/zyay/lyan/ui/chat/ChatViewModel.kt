package com.zyay.lyan.ui.chat

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.zyay.lyan.auth.AuthStore
import com.zyay.lyan.brain.BrainStore
import com.zyay.lyan.collab.CollabClient
import com.zyay.lyan.engine.EnginePhase
import com.zyay.lyan.engine.GenerationHud
import com.zyay.lyan.engine.OnDeviceEngine
import com.zyay.lyan.memory.VaultStore
import com.zyay.lyan.models.HfModelStore
import com.zyay.lyan.notify.ActivityNotify
import com.zyay.lyan.remote.DeviceStore
import com.zyay.lyan.remote.SshClient
import com.zyay.lyan.ui.components.OrbState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class ChatMessage(
    val id: Long,
    val text: String,
    val isUser: Boolean
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
    val tasks: List<String> = listOf("General"),
    val currentTask: String = "General",
    val brainMode: String = "byok",
    val roomId: String? = null,
    val inviteHint: String = ""
)

class ChatViewModel(app: Application) : AndroidViewModel(app) {
    val auth = AuthStore(app)
    val models = HfModelStore(app)
    val devices = DeviceStore(app)
    val ssh = SshClient()
    val brain = BrainStore(app)
    private val collab = CollabClient(app)
    private val engine = OnDeviceEngine(ssh = ssh)
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

    init {
        viewModelScope.launch {
            auth.account.collect { email -> _state.update { it.copy(account = email) } }
        }
        viewModelScope.launch {
            ssh.connected.collect { live -> _state.update { it.copy(sshLive = live) } }
        }
        viewModelScope.launch {
            models.status.collect { st -> _state.update { it.copy(modelReady = st.ready) } }
        }
    }

    fun onDraft(value: String) {
        _state.update { it.copy(draft = value) }
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

    fun addTask(title: String) {
        val name = title.ifBlank { "Task ${_state.value.tasks.size + 1}" }
        _state.update { it.copy(tasks = it.tasks + name, currentTask = name) }
        viewModelScope.launch(Dispatchers.IO) {
            val token = auth.token()
            if (token.isNotBlank()) runCatching {
                collab.publishKey(token)
                val id = collab.createRoom(token, name)
                _state.update { it.copy(roomId = id.ifBlank { it.roomId }) }
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
            val err = runCatching { collab.invite(token, room, email) }.exceptionOrNull()
            _state.update { it.copy(inviteHint = if (err == null) "Invited $email" else (err.message ?: "invite failed")) }
        }
    }

    fun selectTask(title: String) {
        _state.update { it.copy(currentTask = title) }
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
                inviteHint = it.inviteHint
            )
        }
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
                hud = GenerationHud(0f, if (online) "Local+NET" else "On-device", net = online, ssh = sshLive)
            )
        }
        viewModelScope.launch {
            delay(200)
            if (_state.value.agentMode) {
                val open = Regex("https://[^\\s]+").find(prompt)?.value
                if (open != null) {
                    com.zyay.lyan.agent.AgentActions.openUrl(getApplication(), open)
                }
            }
            val full = withContext(Dispatchers.IO) {
                engine.reply(
                    prompt,
                    _state.value.vaultText,
                    _state.value.agentMode,
                    online,
                    models.current().ready,
                    brain.baseUrl,
                    brain.apiKey,
                    brain.model,
                    brain.valid
                )
            }
            _state.update { it.copy(phase = EnginePhase.Speaking) }
            val id = nextId++
            _state.update { it.copy(messages = it.messages + ChatMessage(id, "", false)) }
            val start = System.nanoTime()
            var built = ""
            val words = full.split(Regex("(?<=\\s)"))
            words.forEachIndexed { index, chunk ->
                built += chunk
                val elapsed = (System.nanoTime() - start) / 1_000_000_000.0
                val tps = if (elapsed > 0.05) (index + 1) / elapsed.toFloat() else 18f
                val snapshot = built
                _state.update { ui ->
                    ui.copy(
                        hud = GenerationHud(tps, if (online) "Local+NET" else "On-device", net = online, ssh = sshLive),
                        messages = ui.messages.map { msg ->
                            if (msg.id == id) msg.copy(text = snapshot) else msg
                        }
                    )
                }
                delay(12)
            }
            _state.update { it.copy(phase = EnginePhase.Idle) }
        }
    }
}

fun EnginePhase.toOrb(): OrbState = when (this) {
    EnginePhase.Idle -> OrbState.Idle
    EnginePhase.Thinking -> OrbState.Thinking
    EnginePhase.Speaking -> OrbState.Speaking
}
