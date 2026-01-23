package com.spaceshooter.presentation.control

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import com.spaceshooter.core.math.Vec2
import com.spaceshooter.theme.ThemeColors
import kotlin.math.sqrt

/**
 * Virtual joystick for game controls.
 */
@Composable
fun VirtualJoystick(
    onJoystickMove: (Vec2) -> Unit,
    colors: ThemeColors,
    modifier: Modifier = Modifier,
    size: Float = 140f,
    deadzone: Float = 0.1f
) {
    val maxRadius = size / 2f
    val stickRadius = size / 5f

    var stickOffset by remember { mutableStateOf(Offset.Zero) }

    Box(
        modifier = modifier.size(size.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(
            modifier = Modifier
                .size(size.dp)
                .pointerInput(Unit) {
                    detectDragGestures(
                        onDragStart = { offset ->
                            val center = Offset(size / 2f, size / 2f)
                            val delta = offset - center
                            stickOffset = constrainToCircle(delta, maxRadius - stickRadius)
                            emitJoystickValue(stickOffset, maxRadius - stickRadius, deadzone, onJoystickMove)
                        },
                        onDrag = { change, dragAmount ->
                            change.consume()
                            val newOffset = stickOffset + dragAmount
                            stickOffset = constrainToCircle(newOffset, maxRadius - stickRadius)
                            emitJoystickValue(stickOffset, maxRadius - stickRadius, deadzone, onJoystickMove)
                        },
                        onDragEnd = {
                            stickOffset = Offset.Zero
                            onJoystickMove(Vec2.ZERO)
                        },
                        onDragCancel = {
                            stickOffset = Offset.Zero
                            onJoystickMove(Vec2.ZERO)
                        }
                    )
                }
        ) {
            val center = Offset(size.dp.toPx() / 2f, size.dp.toPx() / 2f)
            val scale = size.dp.toPx() / size

            // Outer pad (background circle)
            drawCircle(
                color = colors.joystickPad,
                radius = maxRadius * scale,
                center = center
            )

            // Border
            drawCircle(
                color = colors.joystickBorder,
                radius = maxRadius * scale,
                center = center,
                style = Stroke(width = 2f)
            )

            // Glow effect (subtle inner ring)
            drawCircle(
                color = colors.joystickGlow,
                radius = (maxRadius - 10f) * scale,
                center = center,
                style = Stroke(width = 4f)
            )

            // Stick position
            val stickCenter = Offset(
                center.x + stickOffset.x * scale,
                center.y + stickOffset.y * scale
            )

            // Stick glow
            drawCircle(
                color = colors.joystickGlow,
                radius = (stickRadius + 5f) * scale,
                center = stickCenter
            )

            // Stick
            drawCircle(
                color = colors.joystickStick,
                radius = stickRadius * scale,
                center = stickCenter
            )
        }
    }
}

private fun constrainToCircle(offset: Offset, maxRadius: Float): Offset {
    val distance = sqrt(offset.x * offset.x + offset.y * offset.y)
    return if (distance > maxRadius) {
        val scale = maxRadius / distance
        Offset(offset.x * scale, offset.y * scale)
    } else {
        offset
    }
}

private fun emitJoystickValue(
    offset: Offset,
    maxRadius: Float,
    deadzone: Float,
    onJoystickMove: (Vec2) -> Unit
) {
    val normalizedX = offset.x / maxRadius
    val normalizedY = offset.y / maxRadius
    val magnitude = sqrt(normalizedX * normalizedX + normalizedY * normalizedY)

    if (magnitude < deadzone) {
        onJoystickMove(Vec2.ZERO)
    } else {
        // Apply deadzone compensation
        val adjustedMagnitude = (magnitude - deadzone) / (1f - deadzone)
        val scale = adjustedMagnitude / magnitude
        onJoystickMove(Vec2(normalizedX * scale, normalizedY * scale))
    }
}
