package com.zyay.lyan.ui.chat

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
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
import androidx.compose.material.icons.outlined.ArrowBack
import androidx.compose.material.icons.outlined.AttachFile
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
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.ExperimentalFoundationApi
import com.zyay.lyan.engine.EnginePhase
import com.zyay.lyan.ui.components.BlobAvatar
import com.zyay.lyan.ui.components.LyanHalo
import com.zyay.lyan.ui.theme.BlobGreen
import com.zyay.lyan.ui.theme.LyanChip
import com.zyay.lyan.ui.theme.LyanComposer
import com.zyay.lyan.ui.theme.LyanInk
import com.zyay.lyan.ui.theme.LyanLine
import com.zyay.lyan.ui.theme.LyanMuted
import com.zyay.lyan.ui.theme.LyanSurface

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
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) viewModel.attach(uri, uri.lastPathSegment ?: "document")
    }

    LaunchedEffect(state.messages.size, state.messages.lastOrNull()?.text) {
        if (state.messages.isNotEmpty()) listState.animateScrollToItem(state.messages.lastIndex)
    }

    Box(Modifier.fillMaxSize().background(LyanComposer).statusBarsPadding().navigationBarsPadding().imePadding()) {
        Column(Modifier.fillMaxSize()) {
            Text("Highlight", color = LyanMuted, fontSize = 13.sp, modifier = Modifier.padding(horizontal = 20.dp, vertical = 6.dp))
            Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.Outlined.ArrowBack, null, tint = LyanInk) }
                BlobAvatar(BlobGreen, 32.dp)
                Spacer(Modifier.width(8.dp))
                Text(state.currentTask, fontWeight = FontWeight.SemiBold, fontSize = 18.sp, color = LyanInk, modifier = Modifier.weight(1f))
                IconButton(onClick = onModels) { Text("···", color = LyanInk) }
            }
            if (state.members.isNotEmpty()) {
                Row(Modifier.padding(horizontal = 16.dp, vertical = 4.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    state.members.forEach { email ->
                        Text(
                            email,
                            color = LyanMuted,
                            fontSize = 11.sp,
                            modifier = Modifier.clip(RoundedCornerShape(999.dp)).background(LyanChip).padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }
            Box(Modifier.weight(1f).fillMaxWidth()) {
                if (state.messages.isEmpty()) {
                    Text(
                        "Want me to start this task, or is this the shape of week you wanted?",
                        color = LyanInk,
                        fontSize = 16.sp,
                        modifier = Modifier.padding(20.dp)
                    )
                } else {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(20.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        items(state.messages, key = { it.id }) { msg ->
                            Text(
                                msg.text,
                                color = LyanInk,
                                fontSize = 16.sp,
                                lineHeight = 24.sp,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .then(
                                        if (msg.isUser) Modifier.clip(RoundedCornerShape(18.dp)).background(LyanSurface).padding(12.dp)
                                        else Modifier
                                    )
                                    .combinedClickable(onClick = {}, onLongClick = { sheet = msg })
                            )
                        }
                    }
                }
            }
            Column(Modifier.padding(horizontal = 16.dp)) {
                chips.forEach { c ->
                    Text(
                        c,
                        modifier = Modifier
                            .padding(bottom = 8.dp)
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .border(1.dp, LyanLine, RoundedCornerShape(16.dp))
                            .clickable { viewModel.send(c) }
                            .padding(12.dp),
                        color = LyanInk,
                        fontSize = 15.sp
                    )
                }
            }
            LyanHalo(modifier = Modifier.padding(16.dp).fillMaxWidth(), active = state.phase == EnginePhase.Idle, cornerRadius = 22.dp) {
            Row(
                Modifier
                    .clip(RoundedCornerShape(22.dp))
                    .background(LyanComposer)
                    .border(1.dp, LyanLine, RoundedCornerShape(22.dp))
                    .padding(horizontal = 10.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    Modifier.size(28.dp).clip(CircleShape).background(LyanSurface).clickable { picker.launch(arrayOf("*/*")) },
                    contentAlignment = Alignment.Center
                ) { Icon(Icons.Outlined.Add, null, tint = LyanInk, modifier = Modifier.size(16.dp)) }
                Spacer(Modifier.width(8.dp))
                BasicTextField(
                    value = state.draft,
                    onValueChange = viewModel::onDraft,
                    textStyle = TextStyle(color = LyanInk, fontSize = 15.sp),
                    cursorBrush = SolidColor(LyanInk),
                    modifier = Modifier.weight(1f).height(40.dp),
                    decorationBox = { inner ->
                        Box(contentAlignment = Alignment.CenterStart) {
                            if (state.draft.isEmpty()) Text("Ask ${state.currentTask}", color = LyanMuted)
                            inner()
                        }
                    }
                )
                IconButton(onClick = { if (state.draft.isNotBlank()) viewModel.send() }) {
                    Icon(Icons.Outlined.AttachFile, null, tint = LyanMuted)
                }
            }
            }
            var invite by remember { mutableStateOf("") }
            Row(
                Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                BasicTextField(
                    value = invite,
                    onValueChange = { invite = it },
                    textStyle = TextStyle(color = LyanInk, fontSize = 14.sp),
                    modifier = Modifier
                        .weight(1f)
                        .height(40.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(LyanComposer)
                        .border(1.dp, LyanLine, RoundedCornerShape(16.dp))
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    decorationBox = { inner ->
                        Box(contentAlignment = Alignment.CenterStart) {
                            if (invite.isEmpty()) Text("Add people (email)", color = LyanMuted, fontSize = 14.sp)
                            inner()
                        }
                    }
                )
                Text(
                    "Invite",
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier
                        .padding(start = 8.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(LyanInk)
                        .clickable { viewModel.invitePerson(invite) }
                        .padding(horizontal = 16.dp, vertical = 10.dp)
                )
            }
            if (state.inviteHint.isNotBlank()) {
                Text(state.inviteHint, color = LyanMuted, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp))
            }
        }
        sheet?.let { msg ->
            Box(Modifier.fillMaxSize().background(Color(0x48000000)).clickable { sheet = null }, contentAlignment = Alignment.BottomCenter) {
                Column(
                    Modifier
                        .padding(12.dp)
                        .clip(RoundedCornerShape(24.dp))
                        .background(LyanComposer)
                        .padding(10.dp)
                        .clickable(enabled = false) {}
                ) {
                    Row(Modifier.padding(8.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("❤️", "🙌", "😂", "😮", "😢", "😡").forEach { e ->
                            Text(e, fontSize = 18.sp, modifier = Modifier.clip(RoundedCornerShape(12.dp)).background(LyanSurface).padding(8.dp))
                        }
                    }
                    Text("Reply", modifier = Modifier.fillMaxWidth().padding(12.dp).clickable { sheet = null })
                    Text("Start a thread", modifier = Modifier.fillMaxWidth().padding(12.dp).clickable { sheet = null })
                    Text("Mark as unread", modifier = Modifier.fillMaxWidth().padding(12.dp).clickable { sheet = null })
                    Text("Copy", modifier = Modifier.fillMaxWidth().padding(12.dp).clickable { sheet = null })
                }
            }
        }
    }
}
