package com.zyay.aeko.ui.devices

import android.content.Intent
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.net.toUri
import com.zyay.aeko.remote.DeviceStore
import com.zyay.aeko.remote.SshClient
import com.zyay.aeko.ui.components.ScreenScaffold
import com.zyay.aeko.ui.components.SectionCard
import com.zyay.aeko.ui.theme.AekoInk
import com.zyay.aeko.ui.theme.AekoLine
import com.zyay.aeko.ui.theme.AekoMuted
import com.zyay.aeko.ui.theme.AekoText
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun DevicesScreen(store: DeviceStore, ssh: SshClient, onBack: () -> Unit, onVnc: () -> Unit) {
    val connected by ssh.connected.collectAsState()
    val log by ssh.log.collectAsState()
    var host by remember { mutableStateOf(store.host) }
    var port by remember { mutableStateOf(store.port.toString()) }
    var user by remember { mutableStateOf(store.user) }
    var password by remember { mutableStateOf(store.password) }
    var keyPath by remember { mutableStateOf(store.keyPath) }
    var vnc by remember { mutableStateOf(store.vncUrl) }
    var command by remember { mutableStateOf("uname -a") }
    var output by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val colors = OutlinedTextFieldDefaults.colors(
        focusedTextColor = AekoText,
        unfocusedTextColor = AekoText,
        focusedBorderColor = AekoInk,
        unfocusedBorderColor = AekoLine
    )

    ScreenScaffold(
        title = "Devices",
        subtitle = "SSH into your PC with TOFU host-key trust. noVNC for remote screen.",
        onBack = onBack
    ) {
        SectionCard("Connection") {
            DeviceField(host, "Host", colors) { host = it; store.host = it }
            DeviceField(port, "Port", colors) { port = it; store.port = it.toIntOrNull() ?: 22 }
            DeviceField(user, "User", colors) { user = it; store.user = it }
            DeviceField(password, "Password", colors) { password = it; store.password = it }
            DeviceField(keyPath, "Private key path (optional)", colors) { keyPath = it; store.keyPath = it }
            if (store.hostFingerprint.isNotBlank()) {
                Text("Trusted fingerprint: ${store.hostFingerprint}", color = AekoMuted, fontSize = 12.sp, lineHeight = 16.sp)
            }
            Button(
                onClick = {
                    scope.launch {
                        ssh.connect(host, port.toIntOrNull() ?: 22, user, password, keyPath, store.hostFingerprint) { fp ->
                            store.hostFingerprint = fp
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp).height(48.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AekoInk, contentColor = Color.White)
            ) { Text(if (connected) "Reconnect SSH" else "Connect SSH", fontWeight = FontWeight.SemiBold) }
            TextButton(onClick = { ssh.disconnect() }) { Text("Disconnect", color = AekoText) }
            if (log.isNotBlank()) Text(log, color = AekoMuted, fontSize = 12.sp, lineHeight = 16.sp)
        }

        SectionCard("Remote shell") {
            DeviceField(command, "Command", colors) { command = it }
            Button(
                onClick = { scope.launch { output = withContext(Dispatchers.IO) { ssh.exec(command) } } },
                enabled = connected,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = AekoInk, contentColor = Color.White)
            ) { Text("Run on PC") }
            if (output.isNotBlank()) Text(output, color = AekoText, fontSize = 13.sp, lineHeight = 18.sp)
        }

        SectionCard("Screen") {
            DeviceField(vnc, "noVNC URL", colors) { vnc = it; store.vncUrl = it }
            Button(
                onClick = onVnc,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = AekoInk, contentColor = Color.White)
            ) { Text("Open in-app viewer") }
            TextButton(onClick = {
                context.startActivity(Intent(Intent.ACTION_VIEW, vnc.toUri()).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            }) { Text("Open in browser", color = AekoText) }
        }
    }
}

@Composable
private fun DeviceField(
    value: String,
    label: String,
    colors: androidx.compose.material3.TextFieldColors,
    onChange: (String) -> Unit
) {
    OutlinedTextField(
        value = value,
        onValueChange = onChange,
        label = { Text(label) },
        colors = colors,
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
    )
}
