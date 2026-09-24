package com.zyay.aeko.ui.models

import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zyay.aeko.models.HfModelStore
import com.zyay.aeko.ui.components.ScreenScaffold
import com.zyay.aeko.ui.components.SectionCard
import com.zyay.aeko.ui.theme.AekoInk
import com.zyay.aeko.ui.theme.AekoLine
import com.zyay.aeko.ui.theme.AekoMuted
import com.zyay.aeko.ui.theme.AekoText
import kotlinx.coroutines.launch

@Composable
fun ModelsScreen(store: HfModelStore, onBack: () -> Unit) {
    val status by store.status.collectAsState()
    var url by remember { mutableStateOf(store.url) }
    var token by remember { mutableStateOf(store.token) }
    val scope = rememberCoroutineScope()
    val colors = OutlinedTextFieldDefaults.colors(
        focusedTextColor = AekoText,
        unfocusedTextColor = AekoText,
        focusedBorderColor = AekoInk,
        unfocusedBorderColor = AekoLine
    )

    ScreenScaffold(
        title = "Models",
        subtitle = "Download GGUF from Hugging Face. Chat uses llama.cpp or llama-server — no fake replies.",
        onBack = onBack
    ) {
        SectionCard("Hugging Face") {
            OutlinedTextField(
                value = url,
                onValueChange = { url = it; store.url = it },
                label = { Text("Resolve URL") },
                colors = colors,
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = token,
                onValueChange = { token = it; store.token = it },
                label = { Text("Token (optional)") },
                colors = colors,
                modifier = Modifier.fillMaxWidth()
            )
        }

        SectionCard("Download") {
            if (status.downloading) {
                LinearProgressIndicator(
                    progress = status.progress,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(8.dp))
            }
            Text(status.message, color = AekoMuted, fontSize = 13.sp, lineHeight = 18.sp)
            Button(
                onClick = { scope.launch { store.download() } },
                enabled = !status.downloading,
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp).height(48.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AekoInk, contentColor = com.zyay.aeko.ui.theme.AekoOnInk)
            ) { Text("Download GGUF", fontWeight = FontWeight.SemiBold) }
            TextButton(onClick = { store.cancel() }, modifier = Modifier.padding(top = 4.dp)) {
                Text("Cancel", color = AekoText)
            }
        }
    }
}
