package com.zyay.lyan.ui.chat

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.zyay.lyan.engine.EnginePhase
import com.zyay.lyan.engine.GenerationHud
import com.zyay.lyan.engine.OnDeviceEngine
import com.zyay.lyan.memory.VaultStore
import com.zyay.lyan.ui.components.OrbState
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

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
    val phase: EnginePhase = EnginePhase.Idle,
    val hud: GenerationHud = GenerationHud(),
    val vaultName: String? = null,
    val vaultText: String = "",
    val showHud: Boolean = true
)

class ChatViewModel(app: Application) : AndroidViewModel(app) {
    private val engine = OnDeviceEngine()
    private val _state = MutableStateFlow(ChatUiState())
    val state: StateFlow<ChatUiState> = _state
    private var nextId = 1L

    fun onDraft(value: String) {
        _state.update { it.copy(draft = value) }
    }

    fun toggleAgent() {
        _state.update { it.copy(agentMode = !it.agentMode) }
    }

    fun toggleAuto() {
        _state.update { it.copy(autoTools = !it.autoTools) }
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
        _state.update { ChatUiState(agentMode = it.agentMode, autoTools = it.autoTools, showHud = it.showHud) }
    }

    fun send() {
        val prompt = _state.value.draft.trim()
        if (prompt.isBlank() || _state.value.phase != EnginePhase.Idle) return
        val user = ChatMessage(nextId++, prompt, true)
        _state.update {
            it.copy(
                messages = it.messages + user,
                draft = "",
                phase = EnginePhase.Thinking,
                hud = GenerationHud(0f, "NPU/CPU local")
            )
        }
        viewModelScope.launch {
            delay(420)
            val full = engine.reply(prompt, _state.value.vaultText, _state.value.agentMode)
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
                        hud = GenerationHud(tps, "On-device"),
                        messages = ui.messages.map { msg ->
                            if (msg.id == id) msg.copy(text = snapshot) else msg
                        }
                    )
                }
                delay(16)
            }
            _state.update { it.copy(phase = EnginePhase.Idle, hud = it.hud.copy(tokensPerSecond = it.hud.tokensPerSecond)) }
        }
    }
}

fun EnginePhase.toOrb(): OrbState = when (this) {
    EnginePhase.Idle -> OrbState.Idle
    EnginePhase.Thinking -> OrbState.Thinking
    EnginePhase.Speaking -> OrbState.Speaking
}
