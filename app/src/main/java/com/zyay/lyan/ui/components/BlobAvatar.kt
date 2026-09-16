package com.zyay.lyan.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

@Composable
fun BlobAvatar(color: Color, size: Dp, modifier: Modifier = Modifier) {
    Box(modifier.size(size), contentAlignment = Alignment.Center) {
        Box(
            Modifier
                .matchParentSize()
                .clip(RoundedCornerShape(40.dp))
                .background(color)
        )
        Row {
            Box(
                Modifier
                    .width(size * 0.12f)
                    .height(size * 0.28f)
                    .clip(RoundedCornerShape(50))
                    .background(Color.White)
            )
            Box(Modifier.width(size * 0.08f))
            Box(
                Modifier
                    .width(size * 0.12f)
                    .height(size * 0.28f)
                    .clip(RoundedCornerShape(50))
                    .background(Color.White)
            )
        }
    }
}
