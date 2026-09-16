package com.zyay.lyan.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val LyanBlack = Color(0xFFFFFFFF)
val LyanInk = Color(0xFF111111)
val LyanSurface = Color(0xFFF7F7F8)
val LyanComposer = Color(0xFFFFFFFF)
val LyanMuted = Color(0xFF8B8B8B)
val LyanText = Color(0xFF111111)
val LyanAccent = Color(0xFFFB923C)
val LyanCyan = Color(0xFF38BDF8)
val LyanChip = Color(0xFFF4F4F5)
val LyanLine = Color(0xFFEFEFEF)

val BlobGreen = Color(0xFF22C55E)
val BlobPink = Color(0xFFFB7185)
val BlobPurple = Color(0xFFA78BFA)
val BlobOrange = Color(0xFFFB923C)
val BlobBlue = Color(0xFF38BDF8)
val BlobTeal = Color(0xFF2DD4BF)

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
