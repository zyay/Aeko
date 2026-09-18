package com.zyay.aeko.ui.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zyay.aeko.ui.components.ThinkingOrb
import com.zyay.aeko.ui.components.OrbState
import com.zyay.aeko.ui.theme.AekoBlack
import com.zyay.aeko.ui.theme.AekoComposer
import com.zyay.aeko.ui.theme.AekoInk
import com.zyay.aeko.ui.theme.AekoMuted
import com.zyay.aeko.ui.theme.AekoSurface
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

private val orbStates = listOf(OrbState.Idle, OrbState.Thinking, OrbState.Speaking, OrbState.Idle, OrbState.Thinking)

private fun formatTime(ts: Long): String {
    if (ts <= 0L) return ""
    val now = Calendar.getInstance()
    val then = Calendar.getInstance().apply { timeInMillis = ts }
    return when {
        now.get(Calendar.YEAR) == then.get(Calendar.YEAR) &&
            now.get(Calendar.DAY_OF_YEAR) == then.get(Calendar.DAY_OF_YEAR) ->
            SimpleDateFormat("h:mm a", Locale.getDefault()).format(Date(ts))
        now.get(Calendar.YEAR) == then.get(Calendar.YEAR) &&
            now.get(Calendar.WEEK_OF_YEAR) == then.get(Calendar.WEEK_OF_YEAR) ->
            SimpleDateFormat("EEE", Locale.getDefault()).format(Date(ts))
        else -> SimpleDateFormat("MMM d", Locale.getDefault()).format(Date(ts))
    }
}

@Composable
fun InboxScreen(
    viewModel: ChatViewModel,
    onOpen: () -> Unit,
    onSettings: () -> Unit,
    onDevices: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    var newTitle by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().background(AekoBlack).statusBarsPadding()) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(Modifier.clip(RoundedCornerShape(12.dp)).background(AekoSurface).padding(10.dp)) {
                Text((state.account ?: "A").take(1).uppercase(), fontWeight = FontWeight.Bold, color = AekoInk)
            }
            Spacer(Modifier.width(10.dp))
            Text("Aeko", color = AekoInk, fontSize = 20.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
            IconButton(onClick = onSettings) { Icon(Icons.Outlined.Settings, contentDescription = "Settings", tint = AekoInk) }
            IconButton(onClick = onDevices) { Icon(Icons.Outlined.Computer, contentDescription = "Devices", tint = AekoInk) }
            IconButton(onClick = {
                val name = newTitle.ifBlank { "Task ${state.tasks.size + 1}" }
                viewModel.addTask(name)
                newTitle = ""
                onOpen()
            }) {
                Icon(Icons.Outlined.Add, contentDescription = "New task", tint = AekoInk)
            }
        }

        if (state.durable == false) {
            Text(
                "Rooms are local-only until Neon DATABASE_URL is attached.",
                color = AekoMuted,
                fontSize = 12.sp,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
            )
        }
        if (state.account == null) {
            Text(
                "Sign in from Settings to sync tasks across devices.",
                color = AekoMuted,
                fontSize = 12.sp,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
            )
        }
        if (state.inviteHint.isNotBlank()) {
            Text(state.inviteHint, color = AekoMuted, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 16.dp))
        }

        Row(
            Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            androidx.compose.foundation.text.BasicTextField(
                value = newTitle,
                onValueChange = { newTitle = it },
                textStyle = androidx.compose.ui.text.TextStyle(color = AekoInk, fontSize = 14.sp),
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(14.dp))
                    .background(AekoComposer)
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                decorationBox = { inner ->
                    Box(contentAlignment = Alignment.CenterStart) {
                        if (newTitle.isEmpty()) Text("New task name", color = AekoMuted, fontSize = 14.sp)
                        inner()
                    }
                }
            )
        }

        if (state.tasks.isEmpty()) {
            Text(
                "No tasks yet. Name one above and tap +.",
                color = AekoMuted,
                fontSize = 14.sp,
                modifier = Modifier.padding(32.dp)
            )
        } else {
            LazyColumn {
                itemsIndexed(state.tasks) { i, task ->
                    val on = task.title == state.currentTask
                    val preview = when {
                        task.preview.isNotBlank() -> task.preview
                        on && state.messages.isNotEmpty() -> state.messages.last().text.take(80)
                        else -> "Tap to open"
                    }
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .background(if (on) AekoComposer else Color.Transparent)
                            .clickable {
                                viewModel.selectTask(task.title)
                                onOpen()
                            }
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        ThinkingOrb(size = 44.dp, state = orbStates[i % orbStates.size], wrapper = false)
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Row {
                                Text(task.title, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, color = AekoInk)
                                Spacer(Modifier.width(6.dp))
                                Text("Task", color = AekoMuted, fontSize = 12.sp)
                            }
                            Text(preview, color = AekoMuted, fontSize = 13.sp, maxLines = 2)
                        }
                        Text(formatTime(task.updatedAt), color = AekoMuted, fontSize = 11.sp)
                    }
                }
            }
        }
    }
}
