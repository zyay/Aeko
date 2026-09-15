package com.zyay.lyan.ui.chat

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.ArrowUpward
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Gavel
import androidx.compose.material.icons.outlined.IosShare
import androidx.compose.material.icons.outlined.PrivacyTip
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zyay.lyan.agent.AgentActions
import com.zyay.lyan.engine.EnginePhase
import com.zyay.lyan.ui.components.LyanHalo
import com.zyay.lyan.ui.components.OrbState
import com.zyay.lyan.ui.components.ThinkingOrb
import com.zyay.lyan.ui.theme.LyanBlack
import com.zyay.lyan.ui.theme.LyanChip
import com.zyay.lyan.ui.theme.LyanComposer
import com.zyay.lyan.ui.theme.LyanMuted
import com.zyay.lyan.ui.theme.LyanText

@Composable
fun ChatScreen(
    viewModel: ChatViewModel,
    onPrivacy: () -> Unit,
    onTerms: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val listState = rememberLazyListState()
    val context = LocalContext.current
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            val name = uri.lastPathSegment ?: "document"
            viewModel.attach(uri, name)
        }
    }

    LaunchedEffect(state.messages.size, state.messages.lastOrNull()?.text) {
        if (state.messages.isNotEmpty()) {
            listState.animateScrollToItem(state.messages.lastIndex)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LyanBlack)
            .statusBarsPadding()
            .navigationBarsPadding()
            .imePadding()
    ) {
        TopBar(
            tps = state.hud.tokensPerSecond,
            showHud = state.showHud,
            onNew = viewModel::newChat,
            onPrivacy = onPrivacy,
            onTerms = onTerms
        )
        Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
            if (state.messages.isEmpty()) {
                EmptyHero(phase = state.phase)
            } else {
                LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(state.messages, key = { it.id }) { msg ->
                        MessageRow(msg)
                    }
                }
            }
        }
        if (state.vaultName != null) {
            Text(
                text = "Vault: ${state.vaultName}",
                color = LyanMuted,
                fontSize = 12.sp,
                modifier = Modifier.padding(horizontal = 24.dp, vertical = 4.dp)
            )
        }
        Composer(
            draft = state.draft,
            agentMode = state.agentMode,
            autoTools = state.autoTools,
            busy = state.phase != EnginePhase.Idle,
            onDraft = viewModel::onDraft,
            onSend = {
                val text = state.draft
                viewModel.send()
                if (state.agentMode && text.lowercase().contains("alarm")) {
                    AgentActions.setAlarm(context, "Lyan reminder")
                }
            },
            onToggleAgent = viewModel::toggleAgent,
            onToggleAuto = viewModel::toggleAuto,
            onAttach = { picker.launch(arrayOf("text/plain", "application/pdf", "text/markdown", "*/*")) },
            onShareLast = {
                val last = state.messages.lastOrNull { !it.isUser }?.text.orEmpty()
                if (last.isNotBlank()) AgentActions.share(context, last)
            }
        )
    }
}

@Composable
private fun TopBar(tps: Float, showHud: Boolean, onNew: () -> Unit, onPrivacy: () -> Unit, onTerms: () -> Unit) {
    var menu by remember { mutableStateOf(false) }
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = { menu = true }) {
            Icon(Icons.Outlined.Tune, contentDescription = "Menu", tint = LyanText)
        }
        DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
            DropdownMenuItem(
                text = { Text("Privacy Policy") },
                onClick = { menu = false; onPrivacy() },
                leadingIcon = { Icon(Icons.Outlined.PrivacyTip, contentDescription = null) }
            )
            DropdownMenuItem(
                text = { Text("Terms of Use") },
                onClick = { menu = false; onTerms() },
                leadingIcon = { Icon(Icons.Outlined.Gavel, contentDescription = null) }
            )
        }
        Spacer(Modifier.weight(1f))
        Text("Lyan", color = LyanText, fontWeight = FontWeight.SemiBold, fontSize = 18.sp)
        Spacer(Modifier.weight(1f))
        if (showHud) {
            Text(
                text = "${"%.1f".format(tps)} t/s",
                color = LyanMuted,
                fontSize = 11.sp,
                modifier = Modifier.padding(end = 4.dp)
            )
        }
        IconButton(onClick = onNew) {
            Icon(Icons.Outlined.Refresh, contentDescription = "New chat", tint = LyanText)
        }
    }
}

@Composable
private fun EmptyHero(phase: EnginePhase) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        ThinkingOrb(size = 168.dp, state = phase.toOrb())
        Spacer(Modifier.height(28.dp))
        Text("What's on your mind?", color = LyanText, fontSize = 28.sp, fontWeight = FontWeight.Medium)
        Spacer(Modifier.height(8.dp))
        Text("Private. On-device. No cloud.", color = LyanMuted, fontSize = 14.sp)
    }
}

@Composable
private fun MessageRow(msg: ChatMessage) {
    Column(modifier = Modifier.fillMaxWidth(), horizontalAlignment = if (msg.isUser) Alignment.End else Alignment.Start) {
        if (!msg.isUser) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                ThinkingOrb(size = 22.dp, state = if (msg.text.isEmpty()) OrbState.Speaking else OrbState.Idle, wrapper = false)
                Spacer(Modifier.width(8.dp))
                Text("Lyan", color = LyanMuted, fontSize = 12.sp)
            }
            Spacer(Modifier.height(6.dp))
        }
        Text(
            text = msg.text,
            color = LyanText,
            fontSize = 16.sp,
            lineHeight = 24.sp,
            modifier = Modifier.fillMaxWidth(if (msg.isUser) 0.92f else 1f)
        )
    }
}

@Composable
private fun Composer(
    draft: String,
    agentMode: Boolean,
    autoTools: Boolean,
    busy: Boolean,
    onDraft: (String) -> Unit,
    onSend: () -> Unit,
    onToggleAgent: () -> Unit,
    onToggleAuto: () -> Unit,
    onAttach: () -> Unit,
    onShareLast: () -> Unit
) {
    LyanHalo(
        modifier = Modifier
            .padding(horizontal = 16.dp, vertical = 12.dp)
            .fillMaxWidth(),
        active = !busy,
        cornerRadius = 28.dp
    ) {
        Column(
            modifier = Modifier
                .clip(RoundedCornerShape(28.dp))
                .background(LyanComposer)
                .padding(horizontal = 16.dp, vertical = 14.dp)
        ) {
            BasicTextField(
                value = draft,
                onValueChange = onDraft,
                textStyle = TextStyle(color = LyanText, fontSize = 16.sp, lineHeight = 22.sp),
                cursorBrush = SolidColor(LyanText),
                modifier = Modifier.fillMaxWidth().height(56.dp),
                decorationBox = { inner ->
                    Box(contentAlignment = Alignment.TopStart) {
                        if (draft.isEmpty()) {
                            Text("Build anything.", color = Color(0xFF6B6B6B), fontSize = 16.sp)
                        }
                        inner()
                    }
                }
            )
            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Chip(
                    label = if (agentMode) "Agent" else "Chat",
                    onClick = onToggleAgent
                )
                Spacer(Modifier.width(8.dp))
                Chip(
                    label = if (autoTools) "Auto" else "Manual",
                    onClick = onToggleAuto
                )
                Spacer(Modifier.weight(1f))
                IconButton(onClick = onShareLast) {
                    Icon(Icons.Outlined.IosShare, contentDescription = "Share", tint = LyanMuted)
                }
                IconButton(onClick = onAttach) {
                    Icon(Icons.Outlined.Description, contentDescription = "Vault file", tint = LyanMuted)
                }
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(if (draft.isNotBlank() && !busy) Color.White else Color(0xFF2A2A2A))
                        .clickable(enabled = draft.isNotBlank() && !busy, onClick = onSend),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (draft.isNotBlank()) Icons.Outlined.ArrowUpward else Icons.Outlined.Add,
                        contentDescription = "Send",
                        tint = if (draft.isNotBlank() && !busy) Color.Black else LyanMuted,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun Chip(label: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(LyanChip)
            .border(1.dp, Color(0xFF2E2E2E), RoundedCornerShape(20.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, color = LyanText, fontSize = 13.sp)
        Text("  ▾", color = LyanMuted, fontSize = 11.sp)
    }
}
