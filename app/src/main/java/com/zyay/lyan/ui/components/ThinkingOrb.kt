package com.zyay.lyan.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlin.math.cos
import kotlin.math.sin

enum class OrbState { Idle, Thinking, Speaking }

@Composable
fun ThinkingOrb(
    modifier: Modifier = Modifier,
    size: Dp = 128.dp,
    state: OrbState = OrbState.Idle,
    light: Color = Color(0xFFFFD7A3),
    shadow: Color = Color(0xFF3A4A8C),
    wrapper: Boolean = true,
    paused: Boolean = false
) {
    val speed = when (state) {
        OrbState.Idle -> 9000
        OrbState.Thinking -> 4200
        OrbState.Speaking -> 2400
    }
    val volume = when (state) {
        OrbState.Idle -> 0.22f
        OrbState.Thinking -> 0.48f
        OrbState.Speaking -> 0.82f
    }
    val transition = rememberInfiniteTransition(label = "orb")
    val spin by transition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(if (paused) Int.MAX_VALUE / 4 else speed, easing = LinearEasing)
        ),
        label = "orb-spin"
    )
    val breathe by transition.animateFloat(
        initialValue = 0.88f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(if (paused) 8000 else 1600, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "orb-breathe"
    )

    Canvas(modifier = modifier.size(size)) {
        val cx = this.size.width / 2f
        val cy = this.size.height / 2f
        val radius = this.size.minDimension / 2.15f * (if (paused) 1f else breathe)
        val center = Offset(cx, cy)

        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(light.copy(alpha = 0.28f * volume), Color.Transparent),
                center = center,
                radius = radius * 1.55f
            ),
            radius = radius * 1.55f,
            center = center
        )

        rotate(if (paused) 12f else spin, pivot = center) {
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(light.copy(alpha = 0.95f), light.copy(alpha = 0.35f), shadow.copy(alpha = 0.9f)),
                    center = Offset(cx - radius * 0.22f, cy - radius * 0.28f),
                    radius = radius
                ),
                radius = radius,
                center = center
            )
            val blob = radius * (0.32f + 0.12f * volume)
            val angle = Math.toRadians(spin.toDouble())
            drawCircle(
                color = light.copy(alpha = 0.55f),
                radius = blob,
                center = Offset(
                    cx + (cos(angle) * radius * 0.28).toFloat(),
                    cy + (sin(angle * 1.3) * radius * 0.22).toFloat()
                )
            )
            drawCircle(
                color = shadow.copy(alpha = 0.45f),
                radius = blob * 0.7f,
                center = Offset(
                    cx - (cos(angle) * radius * 0.3).toFloat(),
                    cy + (sin(angle) * radius * 0.26).toFloat()
                )
            )
        }

        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(Color.White.copy(alpha = 0.35f), Color.Transparent),
                center = Offset(cx - radius * 0.28f, cy - radius * 0.34f),
                radius = radius * 0.55f
            ),
            radius = radius * 0.55f,
            center = Offset(cx - radius * 0.18f, cy - radius * 0.22f)
        )

        if (wrapper) {
            drawCircle(
                color = light.copy(alpha = 0.35f + 0.25f * volume),
                radius = radius * 1.08f,
                center = center,
                style = Stroke(width = 2.2f)
            )
            drawCircle(
                color = shadow.copy(alpha = 0.4f),
                radius = radius * 1.18f,
                center = center,
                style = Stroke(width = 1.2f)
            )
        }
    }
}
