package com.zyay.aeko.ui.settings

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zyay.aeko.ui.chat.ChatViewModel
import com.zyay.aeko.ui.components.ScreenScaffold
import com.zyay.aeko.ui.components.SectionCard
import com.zyay.aeko.ui.theme.AekoInk
import com.zyay.aeko.ui.theme.AekoMuted

@Composable
fun SettingsScreen(
    viewModel: ChatViewModel,
    onBack: () -> Unit,
    onModels: () -> Unit,
    onSignIn: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current

    ScreenScaffold(
        title = "Settings",
        subtitle = "Brain, tools, and account — keys stay on this device.",
        onBack = onBack
    ) {
        SectionCard("Account") {
            Text(state.account ?: "Not signed in", color = AekoMuted, fontSize = 14.sp)
            if (state.account == null) {
                PillButton("Sign in") { viewModel.auth.signIn(context); onSignIn() }
            } else {
                PillButton("Sign out") { viewModel.signOut() }
            }
        }

        SectionCard("Brain") {
            Text("Mode: ${state.brainMode}", color = AekoMuted, fontSize = 14.sp)
            if (state.brainStatus.isNotBlank()) Text(state.brainStatus, color = AekoMuted, fontSize = 13.sp)
            PillButton("Re-test connection") { viewModel.retestBrain() }
            PillButton("Models / GGUF") { onModels() }
        }

        SectionCard("Modes") {
            ToggleRow("Agent mode", state.agentMode, viewModel::toggleAgent)
            ToggleRow("Auto tools", state.autoTools, viewModel::toggleAuto)
            ToggleRow("Online tools", state.onlineTools, viewModel::toggleOnline)
            ToggleRow("Code mode", state.codeMode, viewModel::toggleCode)
        }

        Text("Server: ${state.authUrl}", color = AekoMuted, fontSize = 11.sp, modifier = Modifier.padding(top = 4.dp))
    }
}

@Composable
private fun PillButton(label: String, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
        shape = RoundedCornerShape(999.dp),
        colors = ButtonDefaults.buttonColors(containerColor = AekoInk, contentColor = Color.White)
    ) { Text(label, fontWeight = FontWeight.SemiBold) }
}

@Composable
private fun ToggleRow(label: String, value: Boolean, onToggle: () -> Unit) {
    androidx.compose.foundation.layout.Row(
        Modifier.fillMaxWidth().padding(vertical = 4.dp),
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
    ) {
        Text(label, color = AekoInk, modifier = Modifier.weight(1f), fontSize = 15.sp)
        Switch(checked = value, onCheckedChange = { onToggle() })
    }
}
