package com.zyay.lyan.ui.onboarding

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zyay.lyan.brain.BrainStore
import com.zyay.lyan.engine.LlmClient
import com.zyay.lyan.ui.chat.ChatViewModel
import com.zyay.lyan.ui.components.BlobAvatar
import com.zyay.lyan.ui.theme.BlobBlue
import com.zyay.lyan.ui.theme.BlobGreen
import com.zyay.lyan.ui.theme.BlobOrange
import com.zyay.lyan.ui.theme.BlobPink
import com.zyay.lyan.ui.theme.BlobPurple
import com.zyay.lyan.ui.theme.BlobTeal
import com.zyay.lyan.ui.theme.LyanInk
import com.zyay.lyan.ui.theme.LyanMuted
import com.zyay.lyan.ui.theme.LyanText
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun OnboardingScreen(
    viewModel: ChatViewModel,
    onContinue: () -> Unit,
    onPrivacy: () -> Unit,
    onTerms: () -> Unit
) {
    val context = LocalContext.current
    val brain = remember { BrainStore(context) }
    val scope = rememberCoroutineScope()
    var step by remember { mutableIntStateOf(0) }
    var url by remember { mutableStateOf(brain.baseUrl) }
    var key by remember { mutableStateOf(brain.apiKey) }
    var model by remember { mutableStateOf(brain.model) }
    var status by remember { mutableStateOf("") }
    val notify = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { }

    Box(Modifier.fillMaxSize().background(Color.White).statusBarsPadding()) {
        if (step == 0) {
            FloatingBlobs()
            Column(Modifier.fillMaxSize().padding(28.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Highlight", color = LyanMuted, fontSize = 13.sp, modifier = Modifier.align(Alignment.Start))
                Spacer(Modifier.weight(1f))
                Text("Lyan", color = LyanInk, fontSize = 42.sp, fontWeight = FontWeight.SemiBold)
                Text("Your team of always-on agents that finish the work.", color = LyanMuted, textAlign = TextAlign.Center)
                Spacer(Modifier.weight(1f))
                Pill("Sign in") { viewModel.auth.signIn(context) }
                TextButton(onClick = { step = 1 }) { Text("Continue local-only", color = LyanMuted) }
            }
        } else if (step == 1) {
            Column(Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Highlight", color = LyanMuted, fontSize = 13.sp, modifier = Modifier.align(Alignment.Start))
                Spacer(Modifier.height(28.dp))
                Text("Meet Your First Bot", color = LyanInk, fontSize = 32.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
                Spacer(Modifier.weight(1f))
                BlobAvatar(BlobOrange, 168.dp)
                Spacer(Modifier.height(20.dp))
                Text("Signal Monitor", color = LyanInk, fontSize = 22.sp, fontWeight = FontWeight.SemiBold)
                Text("Watches sites, dashboards, and feeds for changes.", color = LyanMuted, textAlign = TextAlign.Center)
                Spacer(Modifier.weight(1f))
                Pill("Start Chat") {
                    brain.onboarded = true
                    viewModel.addTask("Signal Monitor")
                    onContinue()
                }
                TextButton(onClick = { step = 2 }) { Text("Create My Own", color = LyanMuted) }
            }
        } else {
            Column(Modifier.fillMaxSize().padding(24.dp).verticalScroll(rememberScrollState())) {
                Text("Create My Own", color = LyanInk, fontSize = 28.sp, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(12.dp))
                Pill("API key + URL") { brain.mode = "byok"; url = "https://api.openai.com/v1" }
                Pill("Own server") { brain.mode = "server"; url = "http://127.0.0.1:11434/v1" }
                Pill("Download GGUF") { brain.mode = "gguf" }
                if (brain.mode != "gguf") {
                    OutlinedTextField(url, { url = it }, label = { Text("Base URL") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(key, { key = it }, label = { Text("API key") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(model, { model = it }, label = { Text("Model") }, modifier = Modifier.fillMaxWidth())
                    Pill("Test") {
                        scope.launch {
                            status = "Testing…"
                            val ok = withContext(Dispatchers.IO) { runCatching { LlmClient().ping(url, key, model) }.getOrElse { false } }
                            brain.baseUrl = url; brain.apiKey = key; brain.model = model; brain.valid = ok
                            viewModel.applyBrain(ok)
                            status = if (ok) "Key valid." else "Check URL/key."
                        }
                    }
                }
                Text(status, color = LyanMuted, fontSize = 13.sp)
                Text("Keys stay on device. Vercel stores ciphertext only.", color = LyanMuted, fontSize = 13.sp)
                Pill("Enable notifications") {
                    if (Build.VERSION.SDK_INT >= 33) notify.launch(Manifest.permission.POST_NOTIFICATIONS)
                    brain.onboarded = true
                    onContinue()
                }
                TextButton(onClick = onPrivacy) { Text("Privacy", color = LyanText) }
                TextButton(onClick = onTerms) { Text("Terms", color = LyanText) }
            }
        }
    }
}

@Composable
private fun Pill(label: String, onClick: () -> Unit) {
    Spacer(Modifier.height(10.dp))
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(52.dp),
        shape = RoundedCornerShape(999.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Color.Black, contentColor = Color.White)
    ) { Text(label, fontWeight = FontWeight.SemiBold) }
}

@Composable
private fun FloatingBlobs() {
    BlobAvatar(BlobGreen, 72.dp, Modifier.offset(x = 48.dp, y = 72.dp))
    BlobAvatar(BlobPink, 86.dp, Modifier.offset(x = 220.dp, y = 64.dp))
    BlobAvatar(BlobPurple, 70.dp, Modifier.offset(x = 24.dp, y = 260.dp))
    BlobAvatar(BlobOrange, 92.dp, Modifier.offset(x = 36.dp, y = 430.dp))
    BlobAvatar(BlobBlue, 64.dp, Modifier.offset(x = 28.dp, y = 620.dp))
    BlobAvatar(BlobOrange, 78.dp, Modifier.offset(x = 210.dp, y = 580.dp))
    BlobAvatar(BlobTeal, 58.dp, Modifier.offset(x = 280.dp, y = 340.dp))
}
