package com.zyay.aeko.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val AekoBlack = Color(0xFFFAF9F6)
val AekoInk = Color(0xFF141414)
val AekoSurface = Color(0xFFF1EFE9)
val AekoComposer = Color(0xFFFFFFFF)
val AekoMuted = Color(0xFF8A8680)
val AekoText = Color(0xFF141414)
val AekoAccent = Color(0xFFFB923C)
val AekoCyan = Color(0xFF38BDF8)
val AekoChip = Color(0xFFF3F1EC)
val AekoLine = Color(0xFFECEAE6)

val BlobGreen = Color(0xFF22C55E)
val BlobPink = Color(0xFFFB7185)
val BlobPurple = Color(0xFFA78BFA)
val BlobOrange = Color(0xFFFB923C)
val BlobBlue = Color(0xFF38BDF8)
val BlobTeal = Color(0xFF2DD4BF)

val AekoTypography = Typography(
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 28.sp
    )
)
