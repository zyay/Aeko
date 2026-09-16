package com.zyay.aeko.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.zyay.aeko.ui.theme.AekoAccent
import com.zyay.aeko.ui.theme.AekoCyan

@Composable
fun AekoHalo(
    modifier: Modifier = Modifier,
    active: Boolean = true,
    cornerRadius: Dp = 28.dp,
    content: @Composable BoxScope.() -> Unit
) {
    val transition = rememberInfiniteTransition(label = "aeko-halo")
    val pulse by transition.animateFloat(
        initialValue = 0.45f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(if (active) 2200 else 1, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "halo-pulse"
    )
    val shift by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(if (active) 9000 else 1, easing = LinearEasing)
        ),
        label = "halo-shift"
    )

    Box(
        modifier = modifier.drawBehind {
            val r = cornerRadius.toPx()
            val pad = 3.dp.toPx()
            val box = Size(size.width - pad * 2, size.height - pad * 2)
            val origin = Offset(pad, pad)
            val alpha = if (active) 0.22f + 0.28f * pulse else 0.18f
            val brush = Brush.linearGradient(
                colors = listOf(
                    AekoCyan.copy(alpha = alpha),
                    AekoAccent.copy(alpha = alpha * 0.85f),
                    Color(0xFF818CF8).copy(alpha = alpha * 0.7f),
                    AekoCyan.copy(alpha = alpha)
                ),
                start = Offset(box.width * shift, 0f),
                end = Offset(box.width * (1f - shift), box.height)
            )
            drawRoundRect(
                brush = brush,
                topLeft = origin,
                size = box,
                cornerRadius = CornerRadius(r, r),
                style = Stroke(width = 2.dp.toPx())
            )
            drawRoundRect(
                color = Color.White.copy(alpha = 0.06f * pulse),
                topLeft = origin,
                size = box,
                cornerRadius = CornerRadius(r, r),
                style = Stroke(width = 8.dp.toPx())
            )
        },
        content = content
    )
}
