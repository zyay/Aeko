package com.zyay.lyan.ui.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zyay.lyan.ui.components.OrbState
import com.zyay.lyan.ui.components.ThinkingOrb
import com.zyay.lyan.ui.theme.LyanBlack
import com.zyay.lyan.ui.theme.LyanMuted
import com.zyay.lyan.ui.theme.LyanText

@Composable
fun OnboardingScreen(onContinue: () -> Unit, onPrivacy: () -> Unit, onTerms: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LyanBlack)
            .padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        ThinkingOrb(size = 180.dp, state = OrbState.Idle)
        Spacer(Modifier.height(32.dp))
        Text("Lyan", color = LyanText, fontSize = 36.sp, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(12.dp))
        Text(
            "Intelligence without surveillance.\nPower without the cloud.",
            color = LyanMuted,
            fontSize = 16.sp,
            textAlign = TextAlign.Center,
            lineHeight = 24.sp
        )
        Spacer(Modifier.height(28.dp))
        Text(
            "Prompts, files, and memory stay on this phone. This build does not call a remote model. By continuing you agree to the Terms and acknowledge the Privacy Policy.",
            color = LyanMuted,
            fontSize = 13.sp,
            textAlign = TextAlign.Center,
            lineHeight = 20.sp
        )
        Spacer(Modifier.height(32.dp))
        Button(
            onClick = onContinue,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black)
        ) {
            Text("Enter Lyan", fontWeight = FontWeight.SemiBold)
        }
        TextButton(onClick = onPrivacy) { Text("Privacy Policy", color = LyanText) }
        TextButton(onClick = onTerms) { Text("Terms of Use", color = LyanText) }
    }
}
