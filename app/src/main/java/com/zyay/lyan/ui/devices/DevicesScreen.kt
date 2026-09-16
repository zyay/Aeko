package com.zyay.lyan.ui.devices

import android.content.Intent
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.net.toUri
import com.zyay.lyan.remote.DeviceStore
import com.zyay.lyan.remote.SshClient
import com.zyay.lyan.ui.theme.LyanBlack
import com.zyay.lyan.ui.theme.LyanInk
import com.zyay.lyan.ui.theme.LyanLine
import com.zyay.lyan.ui.theme.LyanMuted
import com.zyay.lyan.ui.theme.LyanText
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
    var vnc by remember { mutableStateOf(store.vncUrl) }
    var command by remember { mutableStateOf("uname -a") }
    var output by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val colors = OutlinedTextFieldDefaults.colors(
        focusedTextColor = LyanText,
        unfocusedTextColor = LyanText,
        focusedBorderColor = LyanInk,
        unfocusedBorderColor = LyanLine
    )
    Column(
        Modifier.fillMaxSize().background(LyanBlack).statusBarsPadding().verticalScroll(rememberScrollState()).padding(12.dp)
    ) {
        IconButton(onClick = onBack) {
            Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back", tint = LyanText)
        }
        Text("Devices · SSH", color = LyanText, fontSize = 24.sp, modifier = Modifier.padding(horizontal = 12.dp))
        Text(
            "Enable OpenSSH on the PC. Lyan runs commands over SSH. For the live desktop, start noVNC and open PC screen.",
            color = LyanMuted,
            fontSize = 13.sp,
            modifier = Modifier.padding(12.dp)
        )
        DeviceField(host, "Host", colors) { host = it; store.host = it }
        DeviceField(port, "Port", colors) { port = it; store.port = it.toIntOrNull() ?: 22 }
        DeviceField(user, "User", colors) { user = it; store.user = it }
        DeviceField(password, "Password", colors) { password = it; store.password = it }
        DeviceField(vnc, "noVNC URL", colors) { vnc = it; store.vncUrl = it }
        Spacer(Modifier.height(8.dp))
        Button(
            onClick = {
                scope.launch { ssh.connect(host, port.toIntOrNull() ?: 22, user, password) }
            },
            modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp).height(48.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = LyanInk, contentColor = Color.White)
        ) { Text(if (connected) "Reconnect SSH" else "Connect SSH") }
        TextButton(onClick = { ssh.disconnect() }) { Text("Disconnect", color = LyanText) }
        Text(log, color = LyanMuted, modifier = Modifier.padding(12.dp))
        DeviceField(command, "Remote command", colors) { command = it }
        Button(
            onClick = { scope.launch { output = withContext(Dispatchers.IO) { ssh.exec(command) } } },
            enabled = connected,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = LyanInk, contentColor = Color.White)
        ) { Text("Run on PC") }
        Text(output, color = LyanText, fontSize = 13.sp, modifier = Modifier.padding(12.dp))
        Button(
            onClick = onVnc,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = LyanInk, contentColor = Color.White)
        ) { Text("Open PC screen (noVNC)") }
        TextButton(onClick = {
            context.startActivity(Intent(Intent.ACTION_VIEW, vnc.toUri()).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        }) { Text("Open in external VNC / browser", color = LyanText) }
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
        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp)
    )
}
