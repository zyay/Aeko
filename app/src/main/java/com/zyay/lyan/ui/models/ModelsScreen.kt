package com.zyay.lyan.ui.models

import androidx.compose.foundation.background
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zyay.lyan.models.HfModelStore
import com.zyay.lyan.ui.theme.LyanBlack
import com.zyay.lyan.ui.theme.LyanInk
import com.zyay.lyan.ui.theme.LyanLine
import com.zyay.lyan.ui.theme.LyanMuted
import com.zyay.lyan.ui.theme.LyanText
import kotlinx.coroutines.launch

@Composable
fun ModelsScreen(store: HfModelStore, onBack: () -> Unit) {
    val status by store.status.collectAsState()
    var url by remember { mutableStateOf(store.url) }
    var token by remember { mutableStateOf(store.token) }
    val scope = rememberCoroutineScope()
    val colors = OutlinedTextFieldDefaults.colors(
        focusedTextColor = LyanText,
        unfocusedTextColor = LyanText,
        focusedBorderColor = LyanInk,
        unfocusedBorderColor = LyanLine
    )
    Column(
        Modifier.fillMaxSize().background(LyanBlack).statusBarsPadding().padding(12.dp).verticalScroll(rememberScrollState())
    ) {
        IconButton(onClick = onBack) {
            Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back", tint = LyanText)
        }
        Text("Models", color = LyanText, fontSize = 24.sp, modifier = Modifier.padding(horizontal = 12.dp))
        Text(
            "Download a GGUF from Hugging Face onto this phone. llama.cpp inference is not in this APK yet — the file is stored locally.",
            color = LyanMuted,
            fontSize = 13.sp,
            modifier = Modifier.padding(12.dp)
        )
        OutlinedTextField(
            value = url,
            onValueChange = { url = it; store.url = it },
            label = { Text("Hugging Face resolve URL") },
            colors = colors,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp)
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = token,
            onValueChange = { token = it; store.token = it },
            label = { Text("HF token (optional)") },
            colors = colors,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp)
        )
        Spacer(Modifier.height(16.dp))
        if (status.downloading) {
            LinearProgressIndicator(
                progress = status.progress,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp)
            )
        }
        Text(status.message, color = LyanMuted, modifier = Modifier.padding(12.dp))
        Button(
            onClick = { scope.launch { store.download() } },
            enabled = !status.downloading,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp).height(48.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = LyanInk, contentColor = Color.White)
        ) { Text("Download GGUF") }
        TextButton(onClick = { store.cancel() }, modifier = Modifier.padding(horizontal = 8.dp)) {
            Text("Cancel", color = LyanText)
        }
    }
}
