package com.zyay.lyan.ui.onboarding

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
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
import com.zyay.lyan.ui.components.OrbState
import com.zyay.lyan.ui.components.ThinkingOrb
import com.zyay.lyan.ui.theme.LyanBlack
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

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LyanBlack)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        ThinkingOrb(size = 140.dp, state = OrbState.Idle)
        Spacer(Modifier.height(20.dp))
        when (step) {
            0 -> {
                Text("Lyan", color = LyanText, fontSize = 36.sp, fontWeight = FontWeight.SemiBold)
                Text("Your brain. Encrypted tasks.", color = LyanMuted, textAlign = TextAlign.Center)
                Spacer(Modifier.height(16.dp))
                Text(viewModel.state.value.account ?: "Continue local-only, or sign in for shared tasks.", color = LyanMuted, textAlign = TextAlign.Center)
                WhiteBtn("Sign in") { viewModel.auth.signIn(context) }
                WhiteBtn("Continue") { step = 1 }
            }
            1 -> {
                Text("Choose a brain", color = LyanText, fontSize = 28.sp, fontWeight = FontWeight.SemiBold)
                WhiteBtn("API key + URL") { brain.mode = "byok"; url = "https://api.openai.com/v1"; step = 2 }
                WhiteBtn("Own server") { brain.mode = "server"; url = "http://127.0.0.1:11434/v1"; step = 2 }
                WhiteBtn("Download GGUF") { brain.mode = "gguf"; step = 3 }
            }
            2 -> {
                Text(if (brain.mode == "byok") "Bring your key" else "Own server", color = LyanText, fontSize = 24.sp)
                OutlinedTextField(url, { url = it }, label = { Text("Base URL") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(key, { key = it }, label = { Text("API key") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(model, { model = it }, label = { Text("Model") }, modifier = Modifier.fillMaxWidth())
                Text(status, color = LyanMuted, fontSize = 13.sp)
                WhiteBtn("Test") {
                    scope.launch {
                        status = "Testing…"
                        val ok = withContext(Dispatchers.IO) {
                            runCatching { LlmClient().ping(url, key, model) }.getOrElse { false }
                        }
                        brain.baseUrl = url
                        brain.apiKey = key
                        brain.model = model
                        brain.valid = ok
                        viewModel.applyBrain(ok)
                        status = if (ok) "Key valid. Online tools on." else "Failed. Check URL/CORS/key."
                    }
                }
                WhiteBtn("Continue") { step = 3 }
            }
            3 -> {
                Text("Security", color = LyanText, fontSize = 28.sp, fontWeight = FontWeight.SemiBold)
                Text(
                    "Keys stay in EncryptedSharedPreferences. Vercel stores ciphertext rooms and member emails, not your LLM prompt. Notifications say new activity, never the message body.",
                    color = LyanMuted,
                    textAlign = TextAlign.Center
                )
                WhiteBtn("Notifications") {
                    if (Build.VERSION.SDK_INT >= 33) notify.launch(Manifest.permission.POST_NOTIFICATIONS)
                    step = 4
                }
            }
            else -> {
                Text("You're in", color = LyanText, fontSize = 28.sp, fontWeight = FontWeight.SemiBold)
                Text("Tasks in the menu. Same brain on web.", color = LyanMuted, textAlign = TextAlign.Center)
                WhiteBtn("Open workspace") {
                    brain.onboarded = true
                    onContinue()
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        TextButton(onClick = onPrivacy) { Text("Privacy Policy", color = LyanText) }
        TextButton(onClick = onTerms) { Text("Terms of Use", color = LyanText) }
    }
}

@Composable
private fun WhiteBtn(label: String, onClick: () -> Unit) {
    Spacer(Modifier.height(10.dp))
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(50.dp),
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black)
    ) { Text(label, fontWeight = FontWeight.SemiBold) }
}
