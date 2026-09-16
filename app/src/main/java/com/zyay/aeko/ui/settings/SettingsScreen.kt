package com.zyay.aeko.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zyay.aeko.ui.chat.ChatViewModel
import com.zyay.aeko.ui.theme.AekoBlack
import com.zyay.aeko.ui.theme.AekoInk
import com.zyay.aeko.ui.theme.AekoMuted
import com.zyay.aeko.ui.theme.AekoText

@Composable
fun SettingsScreen(
    viewModel: ChatViewModel,
    onBack: () -> Unit,
    onModels: () -> Unit,
    onSignIn: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current
    Column(
        Modifier.fillMaxSize().background(AekoBlack).statusBarsPadding().verticalScroll(rememberScrollState()).padding(16.dp)
    ) {
        IconButton(onClick = onBack) {
            Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back", tint = AekoText)
        }
        Text("Settings", color = AekoText, fontSize = 24.sp)
        Text(state.account ?: "Not signed in", color = AekoMuted, modifier = Modifier.padding(vertical = 8.dp))
        Text("AUTH_URL ${state.authUrl}", color = AekoMuted, fontSize = 12.sp, modifier = Modifier.padding(bottom = 12.dp))
        if (state.account == null) {
            Button(
                onClick = { viewModel.auth.signIn(context); onSignIn() },
                colors = ButtonDefaults.buttonColors(containerColor = AekoInk, contentColor = Color.White)
            ) { Text("Sign in") }
        } else {
            Button(
                onClick = { viewModel.signOut() },
                colors = ButtonDefaults.buttonColors(containerColor = AekoInk, contentColor = Color.White)
            ) { Text("Sign out") }
        }
        Button(
            onClick = { viewModel.retestBrain() },
            modifier = Modifier.padding(top = 8.dp),
            colors = ButtonDefaults.buttonColors(containerColor = AekoInk, contentColor = Color.White)
        ) { Text("Re-test brain") }
        if (state.brainStatus.isNotBlank()) Text(state.brainStatus, color = AekoMuted, modifier = Modifier.padding(8.dp))
        ToggleRow("Agent", state.agentMode, viewModel::toggleAgent)
        ToggleRow("Auto tools", state.autoTools, viewModel::toggleAuto)
        ToggleRow("Online", state.onlineTools, viewModel::toggleOnline)
        ToggleRow("Code mode", state.codeMode, viewModel::toggleCode)
        Text("Brain mode: ${state.brainMode}", color = AekoMuted, modifier = Modifier.padding(top = 8.dp))
        Button(
            onClick = onModels,
            modifier = Modifier.padding(top = 12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = AekoInk, contentColor = Color.White)
        ) { Text("Models / GGUF") }
    }
}

@Composable
private fun ToggleRow(label: String, value: Boolean, onToggle: () -> Unit) {
    Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, color = AekoText, modifier = Modifier.weight(1f))
        Switch(checked = value, onCheckedChange = { onToggle() })
    }
}
