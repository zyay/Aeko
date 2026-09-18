package com.zyay.aeko.ui.chat

import android.content.Context
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.outlined.ArrowBack
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Send
import androidx.compose.material.icons.outlined.AttachFile
import androidx.compose.material.icons.outlined.Stop
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.ExperimentalFoundationApi
import com.zyay.aeko.agent.AgentActions
import com.zyay.aeko.engine.EnginePhase
import com.zyay.aeko.ui.components.ThinkingOrb
import com.zyay.aeko.ui.components.AekoHalo
import com.zyay.aeko.ui.theme.AekoChip
import com.zyay.aeko.ui.theme.AekoComposer
import com.zyay.aeko.ui.theme.AekoInk
import com.zyay.aeko.ui.theme.AekoLine
import com.zyay.aeko.ui.theme.AekoMuted
import com.zyay.aeko.ui.theme.AekoSurface

private val chips = listOf("This works", "Make it shorter", "Search the web", "Turn this into a checklist")

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ChatScreen(
    viewModel: ChatViewModel,
    onBack: () -> Unit,
    onModels: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val listState = rememberLazyListState()
    var sheet by remember { mutableStateOf<ChatMessage?>(null) }
    val context = LocalContext.current
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) viewModel.attach(uri, uri.lastPathSegment ?: "document")
    }

    LaunchedEffect(state.messages.size, state.messages.lastOrNull()?.text) {
        if (state.messages.isNotEmpty()) listState.animateScrollToItem(state.messages.lastIndex)
    }

    Box(Modifier.fillMaxSize().background(AekoComposer).statusBarsPadding().navigationBarsPadding().imePadding()) {
        Column(Modifier.fillMaxSize()) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) { Icon(Icons.Outlined.ArrowBack, null, tint = AekoInk) }
                ThinkingOrb(size = 36.dp, state = state.phase.toOrb())
                Spacer(Modifier.width(8.dp))
                Column(Modifier.weight(1f)) {
                    Text(state.currentTask, fontWeight = FontWeight.SemiBold, fontSize = 17.sp, color = AekoInk, maxLines = 1)
                    Text(
                        when (state.phase) {
                            EnginePhase.Idle -> "Ready · ${state.hud.backend}"
                            EnginePhase.Thinking -> "Thinking…"
                            EnginePhase.Speaking -> "Generating · ${"%.0f".format(state.hud.tokensPerSecond)} tok/s"
                        },
                        color = AekoMuted,
                        fontSize = 12.sp
                    )
                }
                if (state.phase != EnginePhase.Idle) {
                    IconButton(onClick = { viewModel.stop() }) {
                        Icon(Icons.Outlined.Stop, contentDescription = "Stop", tint = AekoInk)
                    }
                }
                IconButton(onClick = onModels) { Text("···", color = AekoInk) }
            }

            Row(
                Modifier
                    .padding(horizontal = 16.dp, vertical = 4.dp)
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                ModeChip("Code", state.codeMode) { viewModel.toggleCode() }
                ModeChip("Agent", state.agentMode) { viewModel.toggleAgent() }
                if (state.vaultName != null) {
                    Text(
                        "Vault · ${state.vaultName}",
                        color = AekoMuted,
                        fontSize = 12.sp,
                        modifier = Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .background(AekoChip)
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    )
                }
            }

            if (state.members.isNotEmpty()) {
                Row(Modifier.padding(horizontal = 16.dp, vertical = 4.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    state.members.forEach { email ->
                        Text(
                            email,
                            color = AekoMuted,
                            fontSize = 11.sp,
                            modifier = Modifier.clip(RoundedCornerShape(999.dp)).background(AekoChip).padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }

            Box(Modifier.weight(1f).fillMaxWidth()) {
                if (state.messages.isEmpty()) {
                    Text(
                        "Ask anything to start — search, code, or attach a file.",
                        color = AekoInk,
                        fontSize = 15.sp,
                        modifier = Modifier.padding(20.dp)
                    )
                } else {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(state.messages, key = { it.id }) { msg ->
                            Text(
                                msg.text.ifBlank { if (msg.kind == "chat" && state.phase != EnginePhase.Idle) "▍" else "" },
                                color = if (msg.kind == "tool") AekoMuted else AekoInk,
                                fontSize = if (msg.kind == "tool") 13.sp else 15.sp,
                                lineHeight = 22.sp,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .then(
                                        if (msg.isUser) Modifier.clip(RoundedCornerShape(18.dp)).background(AekoSurface).padding(12.dp)
                                        else if (msg.kind == "tool") Modifier.clip(RoundedCornerShape(12.dp)).background(AekoChip).padding(10.dp)
                                        else Modifier
                                    )
                                    .combinedClickable(onClick = {}, onLongClick = { sheet = msg })
                            )
                        }
                    }
                }
            }

            Row(
                Modifier.padding(horizontal = 16.dp, vertical = 6.dp).horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                chips.forEach { c ->
                    Text(
                        c,
                        modifier = Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .border(1.dp, AekoLine, RoundedCornerShape(999.dp))
                            .clickable { viewModel.send(c) }
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        color = AekoInk,
                        fontSize = 13.sp
                    )
                }
            }

            AekoHalo(modifier = Modifier.padding(horizontal = 16.dp).fillMaxWidth(), active = state.phase == EnginePhase.Idle, cornerRadius = 20.dp) {
                Row(
                    Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(AekoComposer)
                        .border(1.dp, AekoLine, RoundedCornerShape(20.dp))
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.Bottom
                ) {
                    IconButton(onClick = { picker.launch(arrayOf("*/*")) }, modifier = Modifier.size(36.dp)) {
                        Icon(Icons.Outlined.AttachFile, null, tint = AekoInk, modifier = Modifier.size(18.dp))
                    }
                    BasicTextField(
                        value = state.draft,
                        onValueChange = viewModel::onDraft,
                        textStyle = TextStyle(color = AekoInk, fontSize = 15.sp),
                        cursorBrush = SolidColor(AekoInk),
                        modifier = Modifier.weight(1f).height(44.dp),
                        decorationBox = { inner ->
                            Box(contentAlignment = Alignment.CenterStart) {
                                if (state.draft.isEmpty()) Text("Message ${state.currentTask}", color = AekoMuted, fontSize = 15.sp)
                                inner()
                            }
                        }
                    )
                    IconButton(onClick = { viewModel.send() }, enabled = state.draft.isNotBlank() && state.phase == EnginePhase.Idle) {
                        Icon(Icons.AutoMirrored.Outlined.Send, contentDescription = "Send", tint = if (state.draft.isNotBlank()) AekoInk else AekoMuted)
                    }
                }
            }

            if (state.account != null && state.roomId != null) {
                var invite by remember { mutableStateOf("") }
                Row(
                    Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    BasicTextField(
                        value = invite,
                        onValueChange = { invite = it },
                        textStyle = TextStyle(color = AekoInk, fontSize = 14.sp),
                        modifier = Modifier
                            .weight(1f)
                            .height(40.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(AekoComposer)
                            .border(1.dp, AekoLine, RoundedCornerShape(14.dp))
                            .padding(horizontal = 12.dp, vertical = 10.dp),
                        decorationBox = { inner ->
                            Box(contentAlignment = Alignment.CenterStart) {
                                if (invite.isEmpty()) Text("Invite by email", color = AekoMuted, fontSize = 14.sp)
                                inner()
                            }
                        }
                    )
                    Text(
                        "Invite",
                        color = Color.White,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        modifier = Modifier
                            .padding(start = 8.dp)
                            .clip(RoundedCornerShape(999.dp))
                            .background(AekoInk)
                            .clickable {
                                viewModel.invitePerson(invite)
                                invite = ""
                            }
                            .padding(horizontal = 16.dp, vertical = 10.dp)
                    )
                }
            }
            if (state.inviteHint.isNotBlank()) {
                Text(state.inviteHint, color = AekoMuted, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp))
            }
            Spacer(Modifier.height(4.dp))
        }

        sheet?.let { msg ->
            Box(Modifier.fillMaxSize().background(Color(0x48000000)).clickable { sheet = null }, contentAlignment = Alignment.BottomCenter) {
                Column(
                    Modifier
                        .padding(12.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .background(AekoComposer)
                        .padding(8.dp)
                        .clickable(enabled = false) {}
                ) {
                    Text(
                        "Reply",
                        modifier = Modifier.fillMaxWidth().padding(12.dp).clickable {
                            viewModel.replyTo(msg.text)
                            sheet = null
                        }
                    )
                    Text(
                        "Copy",
                        modifier = Modifier.fillMaxWidth().padding(12.dp).clickable {
                            AgentActions.copy(context, msg.text)
                            sheet = null
                        }
                    )
                    if (!msg.isUser) {
                        Text(
                            "Regenerate",
                            modifier = Modifier.fillMaxWidth().padding(12.dp).clickable {
                                viewModel.regenerateFrom(msg.id)
                                sheet = null
                            }
                        )
                    }
                    Text("Cancel", color = AekoMuted, modifier = Modifier.fillMaxWidth().padding(12.dp).clickable { sheet = null })
                }
            }
        }
    }
}

@Composable
private fun ModeChip(label: String, on: Boolean, toggle: () -> Unit) {
    Text(
        label + if (on) " on" else "",
        color = if (on) Color.White else AekoInk,
        fontSize = 12.sp,
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(if (on) AekoInk else AekoChip)
            .clickable { toggle() }
            .padding(horizontal = 10.dp, vertical = 6.dp)
    )
}
