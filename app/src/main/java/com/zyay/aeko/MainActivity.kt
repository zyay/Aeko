package com.zyay.aeko

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
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.zyay.aeko.legal.LegalCopy
import com.zyay.aeko.ui.chat.ChatScreen
import com.zyay.aeko.ui.chat.ChatViewModel
import com.zyay.aeko.ui.chat.InboxScreen
import com.zyay.aeko.ui.devices.DevicesScreen
import com.zyay.aeko.ui.devices.VncScreen
import com.zyay.aeko.ui.legal.LegalScreen
import com.zyay.aeko.ui.models.ModelsScreen
import com.zyay.aeko.ui.onboarding.OnboardingScreen
import com.zyay.aeko.ui.settings.SettingsScreen
import com.zyay.aeko.ui.theme.AekoBlack
import com.zyay.aeko.ui.theme.AekoInk
import com.zyay.aeko.ui.theme.AekoTypography

class MainActivity : ComponentActivity() {
    private val chatViewModel: ChatViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        ingestShare(intent)
        ingestAuth(intent)
        setContent {
            MaterialTheme(
                colorScheme = lightColorScheme(background = AekoBlack, surface = AekoBlack, onBackground = AekoInk),
                typography = AekoTypography
            ) {
                Surface(modifier = Modifier.fillMaxSize(), color = AekoBlack) {
                    AekoRoot(chatViewModel)
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        ingestShare(intent)
        ingestAuth(intent)
    }

    private fun ingestShare(intent: Intent?) {
        val text = intent?.getStringExtra(Intent.EXTRA_TEXT)
        if (!text.isNullOrBlank()) chatViewModel.ingestShared(text)
    }

    private fun ingestAuth(intent: Intent?) {
        chatViewModel.auth.capture(intent?.data)
    }
}

private enum class AekoRoute { Onboarding, Inbox, Chat, Privacy, Terms, Models, Devices, Vnc, Settings }

@Composable
private fun AekoRoot(viewModel: ChatViewModel) {
    var route by remember {
        mutableStateOf(if (viewModel.brain.onboarded) AekoRoute.Inbox else AekoRoute.Onboarding)
    }
    var from by remember { mutableStateOf(AekoRoute.Onboarding) }

    BackHandler(enabled = route != AekoRoute.Inbox && route != AekoRoute.Onboarding) {
        route = if (route == AekoRoute.Chat) AekoRoute.Inbox else from
    }

    when (route) {
        AekoRoute.Onboarding -> OnboardingScreen(
            viewModel = viewModel,
            onContinue = { route = AekoRoute.Inbox },
            onPrivacy = { from = AekoRoute.Onboarding; route = AekoRoute.Privacy },
            onTerms = { from = AekoRoute.Onboarding; route = AekoRoute.Terms }
        )
        AekoRoute.Inbox -> InboxScreen(
            viewModel = viewModel,
            onOpen = { route = AekoRoute.Chat },
            onSettings = { from = AekoRoute.Inbox; route = AekoRoute.Settings },
            onDevices = { from = AekoRoute.Inbox; route = AekoRoute.Devices }
        )
        AekoRoute.Chat -> ChatScreen(
            viewModel = viewModel,
            onBack = { route = AekoRoute.Inbox },
            onModels = { from = AekoRoute.Chat; route = AekoRoute.Models }
        )
        AekoRoute.Privacy -> LegalScreen("Privacy Policy", LegalCopy.privacy) { route = from }
        AekoRoute.Terms -> LegalScreen("Terms of Use", LegalCopy.terms) { route = from }
        AekoRoute.Settings -> SettingsScreen(
            viewModel = viewModel,
            onBack = { route = from },
            onModels = { from = AekoRoute.Settings; route = AekoRoute.Models },
            onSignIn = { route = AekoRoute.Inbox }
        )
        AekoRoute.Models -> ModelsScreen(viewModel.models) { route = from }
        AekoRoute.Devices -> DevicesScreen(
            store = viewModel.devices,
            ssh = viewModel.ssh,
            onBack = { route = AekoRoute.Inbox },
            onVnc = { from = AekoRoute.Devices; route = AekoRoute.Vnc }
        )
        AekoRoute.Vnc -> VncScreen(viewModel.devices) { route = from }
    }
}
