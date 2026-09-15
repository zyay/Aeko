package com.zyay.lyan

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.zyay.lyan.legal.LegalCopy
import com.zyay.lyan.ui.chat.ChatScreen
import com.zyay.lyan.ui.chat.ChatViewModel
import com.zyay.lyan.ui.legal.LegalScreen
import com.zyay.lyan.ui.onboarding.OnboardingScreen
import com.zyay.lyan.ui.theme.LyanBlack
import com.zyay.lyan.ui.theme.LyanTypography

class MainActivity : ComponentActivity() {
    private val chatViewModel: ChatViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        ingestShare(intent)
        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(background = LyanBlack, surface = LyanBlack),
                typography = LyanTypography
            ) {
                Surface(modifier = Modifier.fillMaxSize(), color = LyanBlack) {
                    LyanRoot(chatViewModel)
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        ingestShare(intent)
    }

    private fun ingestShare(intent: Intent?) {
        val text = intent?.getStringExtra(Intent.EXTRA_TEXT)
        if (!text.isNullOrBlank()) chatViewModel.ingestShared(text)
    }
}

private enum class LyanRoute { Onboarding, Chat, Privacy, Terms }

@Composable
private fun LyanRoot(viewModel: ChatViewModel) {
    var route by remember { mutableStateOf(LyanRoute.Onboarding) }
    var from by remember { mutableStateOf(LyanRoute.Onboarding) }

    BackHandler(enabled = route != LyanRoute.Chat && route != LyanRoute.Onboarding) {
        route = from
    }

    when (route) {
        LyanRoute.Onboarding -> OnboardingScreen(
            onContinue = { route = LyanRoute.Chat },
            onPrivacy = { from = LyanRoute.Onboarding; route = LyanRoute.Privacy },
            onTerms = { from = LyanRoute.Onboarding; route = LyanRoute.Terms }
        )
        LyanRoute.Chat -> ChatScreen(
            viewModel = viewModel,
            onPrivacy = { from = LyanRoute.Chat; route = LyanRoute.Privacy },
            onTerms = { from = LyanRoute.Chat; route = LyanRoute.Terms }
        )
        LyanRoute.Privacy -> LegalScreen("Privacy Policy", LegalCopy.privacy) { route = from }
        LyanRoute.Terms -> LegalScreen("Terms of Use", LegalCopy.terms) { route = from }
    }
}
