package com.zyay.lyan.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val LyanBlack = Color(0xFF0A0A0A)
val LyanSurface = Color(0xFF141414)
val LyanComposer = Color(0xFF1A1A1A)
val LyanMuted = Color(0xFF8A8A8A)
val LyanText = Color(0xFFF4F4F5)
val LyanAccent = Color(0xFFC4B5FD)
val LyanCyan = Color(0xFF67E8F9)
val LyanChip = Color(0xFF222222)

val LyanTypography = Typography(
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
