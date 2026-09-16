package com.zyay.aeko.ui.devices

import android.annotation.SuppressLint
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.zyay.aeko.remote.DeviceStore
import com.zyay.aeko.ui.theme.AekoBlack
import com.zyay.aeko.ui.theme.AekoMuted
import com.zyay.aeko.ui.theme.AekoText

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun VncScreen(store: DeviceStore, onBack: () -> Unit) {
    Column(Modifier.fillMaxSize().background(AekoBlack).statusBarsPadding()) {
        IconButton(onClick = onBack) {
            Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back", tint = AekoText)
        }
        Text("PC screen", color = AekoText, fontSize = 22.sp, modifier = Modifier.padding(horizontal = 16.dp))
        Text(
            "noVNC in-app. Start a VNC server + websockify on the PC (e.g. http://PC:6080/vnc.html).",
            color = AekoMuted,
            fontSize = 12.sp,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
        AndroidView(
            factory = { context ->
                WebView(context).apply {
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    webViewClient = WebViewClient()
                    webChromeClient = WebChromeClient()
                    loadUrl(store.vncUrl.ifBlank { "about:blank" })
                }
            },
            modifier = Modifier.fillMaxSize().padding(top = 8.dp)
        )
    }
}
