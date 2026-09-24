package com.zyay.aeko.ui.settings

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.res.painterResource
import com.zyay.aeko.R
import com.zyay.aeko.brain.BotRoster
import com.zyay.aeko.brain.ENDPOINT_PRESETS
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
import com.zyay.aeko.ui.theme.AekoOnInk

@Composable
fun SettingsScreen(
    viewModel: ChatViewModel,
    onBack: () -> Unit,
    onModels: () -> Unit,
    onSignIn: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current
    val brain = viewModel.brain
    var url by remember { mutableStateOf(brain.baseUrl) }
    var key by remember { mutableStateOf(brain.apiKey) }
    var model by remember { mutableStateOf(brain.model) }
    var botId by remember { mutableStateOf(BotRoster.selectedId(context)) }
    val fieldColors = OutlinedTextFieldDefaults.colors(
        focusedTextColor = AekoInk,
        unfocusedTextColor = AekoInk,
        focusedBorderColor = AekoInk,
        unfocusedBorderColor = com.zyay.aeko.ui.theme.AekoLine
    )

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
            Image(painterResource(R.drawable.ic_mascot), contentDescription = "Aeko", modifier = Modifier.padding(bottom = 8.dp))
            ENDPOINT_PRESETS.forEach { preset ->
                TextButton(onClick = {
                    url = preset.baseUrl
                    model = preset.model
                    brain.mode = preset.mode
                    brain.baseUrl = preset.baseUrl
                    brain.model = preset.model
                }) { Text("${preset.label} · ${preset.provider}", color = AekoInk) }
            }
            OutlinedTextField(url, { url = it }, label = { Text("Base URL") }, colors = fieldColors, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(key, { key = it }, label = { Text("API key") }, colors = fieldColors, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(model, { model = it }, label = { Text("Model") }, colors = fieldColors, modifier = Modifier.fillMaxWidth())
            if (state.brainStatus.isNotBlank()) Text(state.brainStatus, color = AekoMuted, fontSize = 13.sp)
            PillButton("Save and test") {
                brain.baseUrl = url
                brain.apiKey = key
                brain.model = model
                viewModel.retestBrain()
            }
            PillButton("Models / GGUF") { onModels() }
        }

        SectionCard("Bot") {
            BotRoster.all.forEach { bot ->
                TextButton(onClick = {
                    BotRoster.select(context, bot.id)
                    botId = bot.id
                }) {
                    Text(
                        if (botId == bot.id) "${bot.name} · ${bot.tagline}" else bot.name,
                        color = AekoInk,
                        fontWeight = if (botId == bot.id) FontWeight.SemiBold else FontWeight.Normal
                    )
                }
            }
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
        colors = ButtonDefaults.buttonColors(containerColor = AekoInk, contentColor = AekoOnInk)
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
