package com.zyay.lyan.ui.chat

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountCircle
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.ArrowUpward
import androidx.compose.material.icons.outlined.AttachFile
import androidx.compose.material.icons.outlined.Code
import androidx.compose.material.icons.outlined.Computer
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.Gavel
import androidx.compose.material.icons.outlined.IosShare
import androidx.compose.material.icons.outlined.Menu
import androidx.compose.material.icons.outlined.PrivacyTip
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.Text
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
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
import com.zyay.lyan.ui.theme.LyanSurface
import com.zyay.lyan.ui.theme.LyanText
import kotlinx.coroutines.launch

private val suggestions = listOf(
    "Summarize liability clauses in this contract",
    "Fix this Python bug",
    "Search the web for MiniCPM on Android",
    "Extract the invoice total"
)

@Composable
fun ChatScreen(
    viewModel: ChatViewModel,
    onPrivacy: () -> Unit,
    onTerms: () -> Unit,
    onModels: () -> Unit,
    onDevices: () -> Unit,
    onVnc: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val listState = rememberLazyListState()
    val context = LocalContext.current
    val drawer = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) viewModel.attach(uri, uri.lastPathSegment ?: "document")
    }

    LaunchedEffect(state.messages.size, state.messages.lastOrNull()?.text) {
        if (state.messages.isNotEmpty()) listState.animateScrollToItem(state.messages.lastIndex)
    }

    ModalNavigationDrawer(
        drawerState = drawer,
        drawerContent = {
            ModalDrawerSheet(drawerContainerColor = LyanSurface) {
                Column(Modifier.fillMaxHeight().padding(20.dp)) {
                    ThinkingOrb(size = 56.dp, state = OrbState.Idle)
                    Spacer(Modifier.height(12.dp))
                    Text("Lyan", color = LyanText, fontSize = 22.sp, fontWeight = FontWeight.SemiBold)
                    Text("Personal AI employee", color = LyanMuted, fontSize = 13.sp)
                    Spacer(Modifier.height(20.dp))
                    DrawerRow("New chat", Icons.Outlined.Add) {
                        viewModel.newChat()
                        scope.launch { drawer.close() }
                    }
                    DrawerRow("Models (Hugging Face)", Icons.Outlined.Download) {
                        scope.launch { drawer.close() }
                        onModels()
                    }
                    DrawerRow("Devices (SSH)", Icons.Outlined.Computer) {
                        scope.launch { drawer.close() }
                        onDevices()
                    }
                    DrawerRow("PC screen (VNC)", Icons.Outlined.Computer) {
                        scope.launch { drawer.close() }
                        onVnc()
                    }
                    DrawerRow("Sign ${if (state.account == null) "in" else "out"}", Icons.Outlined.AccountCircle) {
                        if (state.account == null) viewModel.auth.signIn(context) else viewModel.auth.signOut()
                        scope.launch { drawer.close() }
                    }
                    DrawerRow("Privacy", Icons.Outlined.PrivacyTip) {
                        scope.launch { drawer.close() }
                        onPrivacy()
                    }
                    DrawerRow("Terms", Icons.Outlined.Gavel) {
                        scope.launch { drawer.close() }
                        onTerms()
                    }
                    Spacer(Modifier.weight(1f))
                    Text(
                        state.account ?: "Not signed in · local-first",
                        color = LyanMuted,
                        fontSize = 12.sp
                    )
                }
            }
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(LyanBlack)
                .statusBarsPadding()
                .navigationBarsPadding()
                .imePadding()
        ) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { scope.launch { drawer.open() } }) {
                    Icon(Icons.Outlined.Menu, contentDescription = "Menu", tint = LyanText)
                }
                Text("Lyan", color = LyanText, fontWeight = FontWeight.SemiBold, fontSize = 18.sp)
                Spacer(Modifier.weight(1f))
                Text(
                    "${"%.1f".format(state.hud.tokensPerSecond)} t/s${if (state.hud.net) " · NET" else ""}${if (state.sshLive) " · SSH" else ""}",
                    color = LyanMuted,
                    fontSize = 11.sp
                )
                IconButton(onClick = viewModel::newChat) {
                    Icon(Icons.Outlined.Add, contentDescription = "New chat", tint = LyanText)
                }
            }

            Box(Modifier.weight(1f).fillMaxWidth()) {
                if (state.messages.isEmpty()) {
                    Column(
                        Modifier.fillMaxSize().padding(horizontal = 20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        ThinkingOrb(size = 196.dp, state = state.phase.toOrb())
                        Spacer(Modifier.height(24.dp))
                        Text("What's on your mind?", color = LyanText, fontSize = 30.sp, fontWeight = FontWeight.Medium)
                        Spacer(Modifier.height(8.dp))
                        Text("On-device. Sign-in optional. Online tools opt-in.", color = LyanMuted, fontSize = 14.sp)
                        Spacer(Modifier.height(22.dp))
                        suggestions.forEach { tip ->
                            Text(
                                tip,
                                color = LyanText,
                                fontSize = 13.sp,
                                modifier = Modifier
                                    .padding(bottom = 8.dp)
                                    .clip(RoundedCornerShape(20.dp))
                                    .border(1.dp, Color(0xFF2A2A2A), RoundedCornerShape(20.dp))
                                    .clickable { viewModel.send(tip) }
                                    .padding(horizontal = 14.dp, vertical = 10.dp)
                            )
                        }
                    }
                } else {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(18.dp)
                    ) {
                        items(state.messages, key = { it.id }) { MessageRow(it) }
                    }
                }
            }

            if (state.vaultName != null) {
                Text(
                    "Vault · ${state.vaultName}",
                    color = LyanMuted,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 4.dp)
                )
            }

            Composer(
                draft = state.draft,
                agentMode = state.agentMode,
                autoTools = state.autoTools,
                onlineTools = state.onlineTools,
                codeMode = state.codeMode,
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
                onToggleOnline = viewModel::toggleOnline,
                onToggleCode = viewModel::toggleCode,
                onAttach = { picker.launch(arrayOf("text/plain", "application/pdf", "text/markdown", "*/*")) },
                onShareLast = {
                    val last = state.messages.lastOrNull { !it.isUser }?.text.orEmpty()
                    if (last.isNotBlank()) AgentActions.share(context, last)
                }
            )
        }
    }
}

@Composable
private fun DrawerRow(label: String, icon: ImageVector, onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).clickable(onClick = onClick).padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = LyanText, modifier = Modifier.size(22.dp))
        Spacer(Modifier.width(12.dp))
        Text(label, color = LyanText, fontSize = 16.sp)
    }
}

@Composable
private fun MessageRow(msg: ChatMessage) {
    val code = msg.text.contains("```") || msg.text.contains("def ") || msg.text.contains("fun ")
    Column(Modifier.fillMaxWidth(), horizontalAlignment = if (msg.isUser) Alignment.End else Alignment.Start) {
        if (!msg.isUser) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                ThinkingOrb(size = 22.dp, state = if (msg.text.isEmpty()) OrbState.Speaking else OrbState.Idle, wrapper = false)
                Spacer(Modifier.width(8.dp))
                Text("Lyan", color = LyanMuted, fontSize = 12.sp)
            }
            Spacer(Modifier.height(8.dp))
        } else {
            Text("You", color = LyanMuted, fontSize = 12.sp)
            Spacer(Modifier.height(4.dp))
        }
        Box(
            Modifier
                .fillMaxWidth(if (msg.isUser) 0.92f else 1f)
                .then(
                    if (msg.isUser) Modifier.clip(RoundedCornerShape(18.dp)).background(Color(0xFF161616)).padding(12.dp)
                    else Modifier
                )
        ) {
            Text(
                text = msg.text,
                color = LyanText,
                fontSize = 16.sp,
                lineHeight = 24.sp,
                fontFamily = if (code && !msg.isUser) FontFamily.Monospace else FontFamily.SansSerif
            )
        }
    }
}

@Composable
private fun Composer(
    draft: String,
    agentMode: Boolean,
    autoTools: Boolean,
    onlineTools: Boolean,
    codeMode: Boolean,
    busy: Boolean,
    onDraft: (String) -> Unit,
    onSend: () -> Unit,
    onToggleAgent: () -> Unit,
    onToggleAuto: () -> Unit,
    onToggleOnline: () -> Unit,
    onToggleCode: () -> Unit,
    onAttach: () -> Unit,
    onShareLast: () -> Unit
) {
    LyanHalo(
        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp).fillMaxWidth(),
        active = !busy,
        cornerRadius = 28.dp
    ) {
        Column(
            Modifier.clip(RoundedCornerShape(28.dp)).background(LyanComposer).padding(14.dp)
        ) {
            BasicTextField(
                value = draft,
                onValueChange = onDraft,
                textStyle = TextStyle(color = LyanText, fontSize = 16.sp, lineHeight = 22.sp),
                cursorBrush = SolidColor(LyanText),
                modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp),
                decorationBox = { inner ->
                    Box {
                        if (draft.isEmpty()) Text("Build anything.", color = Color(0xFF6B6B6B), fontSize = 16.sp)
                        inner()
                    }
                }
            )
            Spacer(Modifier.height(10.dp))
            Row(Modifier.horizontalScroll(rememberScrollState()), verticalAlignment = Alignment.CenterVertically) {
                Chip(if (agentMode) "Agent" else "Chat", onToggleAgent)
                Spacer(Modifier.width(8.dp))
                Chip(if (autoTools) "Auto" else "Manual", onToggleAuto)
                Spacer(Modifier.width(8.dp))
                Chip(if (onlineTools) "Online" else "Offline", onToggleOnline)
                Spacer(Modifier.width(8.dp))
                Chip(if (codeMode) "Code" else "General", onToggleCode)
                Spacer(Modifier.width(8.dp))
                IconButton(onClick = onShareLast) {
                    Icon(Icons.Outlined.IosShare, null, tint = LyanMuted)
                }
                IconButton(onClick = onAttach) {
                    Icon(Icons.Outlined.AttachFile, null, tint = LyanMuted)
                }
                Icon(Icons.Outlined.Search, null, tint = if (onlineTools) Color.White else LyanMuted, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Box(
                    Modifier.size(36.dp).clip(CircleShape)
                        .background(if (draft.isNotBlank() && !busy) Color.White else Color(0xFF2A2A2A))
                        .clickable(enabled = draft.isNotBlank() && !busy, onClick = onSend),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        if (draft.isNotBlank()) Icons.Outlined.ArrowUpward else Icons.Outlined.Add,
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
        Modifier.clip(RoundedCornerShape(20.dp)).background(LyanChip)
            .border(1.dp, Color(0xFF2E2E2E), RoundedCornerShape(20.dp))
            .clickable(onClick = onClick).padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (label == "Code" || label == "General") {
            Icon(Icons.Outlined.Code, null, tint = LyanText, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(4.dp))
        }
        Text(label, color = LyanText, fontSize = 13.sp)
        Text("  ▾", color = LyanMuted, fontSize = 11.sp)
    }
}
