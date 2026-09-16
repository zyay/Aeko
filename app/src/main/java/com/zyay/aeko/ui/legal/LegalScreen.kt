package com.zyay.aeko.ui.legal

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.Column
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zyay.aeko.ui.theme.AekoBlack
import com.zyay.aeko.ui.theme.AekoMuted
import com.zyay.aeko.ui.theme.AekoText

@Composable
fun LegalScreen(title: String, body: String, onBack: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AekoBlack)
            .statusBarsPadding()
            .padding(horizontal = 8.dp)
    ) {
        IconButton(onClick = onBack) {
            Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back", tint = AekoText)
        }
        Text(title, color = AekoText, fontSize = 22.sp, modifier = Modifier.padding(horizontal = 16.dp))
        Text(
            body.trim(),
            color = AekoMuted,
            fontSize = 14.sp,
            lineHeight = 22.sp,
            modifier = Modifier
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        )
    }
}
