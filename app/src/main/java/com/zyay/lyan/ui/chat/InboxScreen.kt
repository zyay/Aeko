package com.zyay.lyan.ui.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Computer
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zyay.lyan.ui.components.BlobAvatar
import com.zyay.lyan.ui.theme.BlobGreen
import com.zyay.lyan.ui.theme.BlobOrange
import com.zyay.lyan.ui.theme.BlobPink
import com.zyay.lyan.ui.theme.BlobPurple
import com.zyay.lyan.ui.theme.LyanBlack
import com.zyay.lyan.ui.theme.LyanComposer
import com.zyay.lyan.ui.theme.LyanInk
import com.zyay.lyan.ui.theme.LyanMuted
import com.zyay.lyan.ui.theme.LyanSurface

private val hues = listOf(BlobGreen, BlobOrange, Color(0xFF111111), Color(0xFFA3A3A3), BlobPink, BlobPurple)

@Composable
fun InboxScreen(
    viewModel: ChatViewModel,
    onOpen: () -> Unit,
    onSettings: () -> Unit,
    onDevices: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    Column(Modifier.fillMaxSize().background(LyanBlack).statusBarsPadding()) {
        Text("Highlight", color = LyanMuted, fontSize = 13.sp, modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp))
        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.clip(RoundedCornerShape(12.dp)).background(LyanSurface).padding(10.dp)) {
                Text((state.account ?: "L").take(2).uppercase(), fontWeight = FontWeight.Bold, color = LyanInk)
            }
            Spacer(Modifier.width(10.dp))
            Text("Lyan", color = LyanInk, fontSize = 22.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
            IconButton(onClick = onSettings) { Icon(Icons.Outlined.Settings, null, tint = LyanInk) }
            IconButton(onClick = onDevices) { Icon(Icons.Outlined.Computer, null, tint = LyanInk) }
            IconButton(onClick = { viewModel.addTask("Task ${state.tasks.size + 1}"); onOpen() }) {
                Icon(Icons.Outlined.Add, null, tint = LyanInk)
            }
        }
        LazyColumn {
            itemsIndexed(state.tasks) { i, task ->
                val on = task == state.currentTask
                Row(
                    Modifier
                        .fillMaxWidth()
                        .background(if (on) LyanComposer else Color.Transparent)
                        .clickable {
                            viewModel.selectTask(task)
                            onOpen()
                        }
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    BlobAvatar(hues[i % hues.size], 44.dp)
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Row {
                            Text(task, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, color = LyanInk)
                            Spacer(Modifier.width(8.dp))
                            Text("Task", color = LyanMuted, fontSize = 13.sp)
                        }
                        Text(
                            if (on && state.messages.isNotEmpty()) state.messages.last().text.take(80)
                            else "Tap to open the thread",
                            color = LyanMuted,
                            fontSize = 14.sp,
                            maxLines = 2
                        )
                    }
                    Text("now", color = LyanMuted, fontSize = 12.sp)
                }
            }
        }
    }
}
