package com.zyay.lyan.ui.chat

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.zyay.lyan.auth.AuthStore
import com.zyay.lyan.engine.EnginePhase
import com.zyay.lyan.engine.GenerationHud
import com.zyay.lyan.engine.OnDeviceEngine
import com.zyay.lyan.memory.VaultStore
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
    val phase: EnginePhase = EnginePhase.Idle,
    val hud: GenerationHud = GenerationHud(),
    val vaultName: String? = null,
    val vaultText: String = "",
    val showHud: Boolean = true,
    val account: String? = null
)

class ChatViewModel(app: Application) : AndroidViewModel(app) {
    private val engine = OnDeviceEngine()
    val auth = AuthStore(app)
    private val _state = MutableStateFlow(ChatUiState(account = auth.account.value))
    val state: StateFlow<ChatUiState> = _state
    private var nextId = 1L

    init {
        viewModelScope.launch {
            auth.account.collect { email ->
                _state.update { it.copy(account = email) }
            }
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

    fun newChat() {
        _state.update {
            ChatUiState(
                agentMode = it.agentMode,
                autoTools = it.autoTools,
                onlineTools = it.onlineTools,
                showHud = it.showHud,
                account = it.account
            )
        }
    }

    fun send() {
        val prompt = _state.value.draft.trim()
        if (prompt.isBlank() || _state.value.phase != EnginePhase.Idle) return
        val online = _state.value.onlineTools
        val user = ChatMessage(nextId++, prompt, true)
        _state.update {
            it.copy(
                messages = it.messages + user,
                draft = "",
                phase = EnginePhase.Thinking,
                hud = GenerationHud(0f, if (online) "Local+NET" else "NPU/CPU local", net = online)
            )
        }
        viewModelScope.launch {
            delay(200)
            val full = withContext(Dispatchers.IO) {
                engine.reply(prompt, _state.value.vaultText, _state.value.agentMode, online)
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
                        hud = GenerationHud(tps, if (online) "Local+NET" else "On-device", net = online),
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
