package com.zyay.aeko.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val AekoBlack = Color(0xFF050505)
val AekoInk = Color(0xFFF5F5F5)
val AekoOnInk = Color(0xFF050505)
val AekoSurface = Color(0xFF111111)
val AekoComposer = Color(0xFF111111)
val AekoMuted = Color(0xFF8E8E93)
val AekoText = Color(0xFFF5F5F5)
val AekoAccent = Color(0xFFF5F5F5)
val AekoCyan = Color(0xFF8E8E93)
val AekoChip = Color(0xFF1C1C1C)
val AekoLine = Color(0xFF2A2A2A)

val BlobGreen = Color(0xFF2A2A2A)
val BlobPink = Color(0xFF222222)
val BlobPurple = Color(0xFF2A2A2A)
val BlobOrange = Color(0xFF1C1C1C)
val BlobBlue = Color(0xFF2A2A2A)
val BlobTeal = Color(0xFF222222)

val AekoTypography = Typography(
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = (-0.2).sp
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 28.sp,
        letterSpacing = (-0.5).sp
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 13.sp,
        letterSpacing = 0.4.sp
    )
)
