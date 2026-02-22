package com.spaceshooter.presentation.game

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import com.spaceshooter.presentation.control.VirtualJoystick
import com.spaceshooter.theme.Themes

/**
 * Main game screen composable.
 */
@Composable
fun GameScreen(
    viewModel: GameViewModel = hiltViewModel()
) {
    val gameState by viewModel.gameState.collectAsState()
    val currentTheme by viewModel.currentTheme.collectAsState()
    val colors = currentTheme.colors
    val density = LocalDensity.current

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
            .onSizeChanged { size ->
                with(density) {
                    viewModel.setDimensions(
                        size.width.toFloat(),
                        size.height.toFloat()
                    )
                }
            }
    ) {
        // Haptic Feedback
        val view = androidx.compose.ui.platform.LocalView.current
        LaunchedEffect(gameState.hapticEvents) {
            gameState.hapticEvents.forEach { event ->
                val feedbackConstant = when (event) {
                    com.spaceshooter.domain.model.HapticEvent.PLAYER_FIRE -> android.view.HapticFeedbackConstants.TEXT_HANDLE_MOVE
                    com.spaceshooter.domain.model.HapticEvent.ENEMY_EXPLOSION -> android.view.HapticFeedbackConstants.KEYBOARD_TAP
                    com.spaceshooter.domain.model.HapticEvent.PLAYER_DAMAGE -> android.view.HapticFeedbackConstants.LONG_PRESS
                    com.spaceshooter.domain.model.HapticEvent.POWERUP_PICKUP -> android.view.HapticFeedbackConstants.VIRTUAL_KEY
                    com.spaceshooter.domain.model.HapticEvent.GAME_OVER -> android.view.HapticFeedbackConstants.LONG_PRESS
                }
                view.performHapticFeedback(feedbackConstant)
            }
        }

        // Game Canvas (SurfaceView)
        AndroidView(
            factory = { context ->
                GameCanvasView(context).apply {
                    setOnDimensionsCallback { width, height ->
                        viewModel.setDimensions(width, height)
                    }
                }
            },
            modifier = Modifier.fillMaxSize(),
            update = { view ->
                view.updateState(gameState, colors)
            }
        )

        // HUD Overlay
        GameHUD(
            score = gameState.score,
            wave = gameState.wave,
            credits = gameState.credits,
            hp = gameState.player.hp,
            maxHp = gameState.player.maxHp,
            lives = gameState.lives,
            combo = gameState.combo,
            specialAbility = gameState.player.specialAbility,
            paused = gameState.paused,
            onPause = { viewModel.pauseGame() },
            colors = colors,
            modifier = Modifier.fillMaxSize()
        )

        // Controls area at bottom
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Bottom
        ) {
            // Virtual Joystick (left side)
            VirtualJoystick(
                onJoystickMove = { viewModel.updateJoystick(it) },
                colors = colors,
                size = 140f
            )

            // Fire button (right side)
            FireButton(
                onFireStart = { viewModel.setFiring(true) },
                onFireEnd = { viewModel.setFiring(false) },
                colors = colors
            )
        }

        // Pause/Game Over overlay
        if (gameState.paused) {
            PauseOverlay(
                isGameOver = gameState.lives <= 0,
                score = gameState.score,
                wave = gameState.wave,
                onResume = { viewModel.resumeGame() },
                onRestart = { viewModel.restartGame() },
                colors = colors
            )
        }
    }
}

/**
 * Fire button composable.
 */
@Composable
private fun FireButton(
    onFireStart: () -> Unit,
    onFireEnd: () -> Unit,
    colors: com.spaceshooter.theme.ThemeColors,
    modifier: Modifier = Modifier
) {
    var isPressed by remember { mutableStateOf(false) }
    
    // Scale animation
    val scale by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (isPressed) 0.9f else 1.0f,
        label = "buttonScale"
    )

    Box(
        modifier = modifier
            .scale(scale)
            .size(80.dp)
            .background(
                color = if (isPressed) colors.buttonPrimary else colors.joystickPad,
                shape = androidx.compose.foundation.shape.CircleShape
            )
            .pointerInput(Unit) {
                detectTapGestures(
                    onPress = {
                        isPressed = true
                        onFireStart()
                        tryAwaitRelease()
                        isPressed = false
                        onFireEnd()
                    }
                )
            },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "FIRE",
            color = if (isPressed) colors.buttonText else colors.joystickStick,
            fontSize = 14.sp
        )
    }
}

/**
 * HUD overlay showing game information.
 */
@Composable
private fun GameHUD(
    score: Int,
    wave: Int,
    credits: Int,
    hp: Int,
    maxHp: Int,
    lives: Int,
    combo: com.spaceshooter.domain.model.ComboState,
    specialAbility: com.spaceshooter.domain.model.SpecialAbilityState,
    paused: Boolean,
    onPause: () -> Unit,
    colors: com.spaceshooter.theme.ThemeColors,
    modifier: Modifier = Modifier
) {
    Box(modifier = modifier.padding(16.dp)) {
        // Top-left: Score, Wave, Credits
        Column(
            modifier = Modifier.align(Alignment.TopStart)
        ) {
            Text(
                text = "Score: $score",
                color = colors.hudText,
                fontSize = 14.sp
            )
            Text(
                text = "Wave: $wave",
                color = colors.hudText,
                fontSize = 14.sp
            )
            Text(
                text = "Credits: $credits",
                color = colors.hudAccent,
                fontSize = 12.sp
            )
            Text(
                text = "Lives: $lives",
                color = colors.hudAccent,
                fontSize = 12.sp
            )

            
            // Active Power-ups
            if (gameState.activePowerUps.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                gameState.activePowerUps.forEach { powerUp ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = powerUp.type.displayName,
                            color = colors.hudAccent,
                            fontSize = 10.sp
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        // Tiny progress bar
                        val progress = (powerUp.remainingDuration / powerUp.type.duration).coerceIn(0f, 1f)
                        val barColor = when (powerUp.type) {
                            com.spaceshooter.domain.model.PowerUpType.SHIELD -> colors.powerUpShield
                            com.spaceshooter.domain.model.PowerUpType.RAPID_FIRE -> colors.powerUpRapidFire
                            com.spaceshooter.domain.model.PowerUpType.SPREAD_SHOT -> colors.powerUpSpreadShot
                            com.spaceshooter.domain.model.PowerUpType.MAGNET -> colors.powerUpMagnet
                        }
                        
                        Box(
                            modifier = Modifier
                                .width(30.dp)
                                .height(4.dp)
                                .background(colors.hullBarBg)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxHeight()
                                    .fillMaxWidth(progress)
                                    .background(barColor)
                            )
                        }
                    }
                }
            }
        }

        // Top-center: Combo
        if (combo.count > 0) {
            Column(
                modifier = Modifier.align(Alignment.TopCenter),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "${combo.count}x COMBO",
                    color = colors.comboText,
                    fontSize = 20.sp
                )
                if (combo.multiplier > 1f) {
                    Text(
                        text = "${combo.multiplier}x multiplier",
                        color = colors.comboGlow,
                        fontSize = 12.sp
                    )
                }
            }
        }

        // Bottom-left: Hull bar
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(bottom = 160.dp)
        ) {
            Text(
                text = "Hull: $hp/$maxHp",
                color = colors.hudText,
                fontSize = 10.sp
            )
            // Dynamic Hull Bar Color & Pulse
            val healthPercent = hp.toFloat() / maxHp
            val barColor = when {
                healthPercent > 0.5f -> colors.hullBar // Green
                healthPercent > 0.25f -> Color(0xFFFFD700) // Gold/Yellow
                else -> Color(0xFFFF4444) // Red
            }

            // Critical health pulse
            val alpha = if (healthPercent <= 0.25f) {
                0.6f + 0.4f * kotlin.math.sin(System.currentTimeMillis() / 100.0).toFloat()
            } else {
                1.0f
            }

            Box(
                modifier = Modifier
                    .width(120.dp)
                    .height(10.dp)
                    .background(colors.hullBarBg)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(healthPercent)
                        .background(barColor.copy(alpha = alpha.coerceIn(0.2f, 1.0f)))
                )
            }
        }

        // Top-right: Special ability cooldown and pause button
        Column(
            modifier = Modifier.align(Alignment.TopEnd),
            horizontalAlignment = Alignment.End,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = specialAbility.type.displayName,
                color = if (specialAbility.isReady) colors.hudAccent else colors.textMuted,
                fontSize = 10.sp
            )
            if (!specialAbility.isReady) {
                Text(
                    text = "${specialAbility.cooldown.toInt()}s",
                    color = colors.textMuted,
                    fontSize = 12.sp
                )
            } else {
                Text(
                    text = "READY",
                    color = colors.hudAccent,
                    fontSize = 12.sp
                )
            }

            // Pause button (only visible when not paused)
            if (!paused) {
                Box(
                    modifier = Modifier
                        .size(64.dp) // Increased size
                        .background(
                            color = colors.buttonPrimary.copy(alpha = 0.8f),
                            shape = androidx.compose.foundation.shape.CircleShape
                        )
                        .pointerInput(Unit) {
                            detectTapGestures(
                                onTap = { onPause() }
                            )
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "II", // Standard Pause Icon
                        color = colors.buttonText,
                        fontSize = 24.sp,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                    )
                }
            }
        }
    }
}

/**
 * Pause/Game Over overlay.
 */
@Composable
private fun PauseOverlay(
    isGameOver: Boolean,
    score: Int,
    wave: Int,
    onResume: () -> Unit,
    onRestart: () -> Unit,
    colors: com.spaceshooter.theme.ThemeColors
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.modalOverlay),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = if (isGameOver) "GAME OVER" else "PAUSED",
                color = colors.textPrimary,
                fontSize = 32.sp
            )

            if (isGameOver) {
                Text(
                    text = "Score: $score",
                    color = colors.hudAccent,
                    fontSize = 20.sp
                )
                Text(
                    text = "Wave: $wave",
                    color = colors.hudText,
                    fontSize = 16.sp
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (!isGameOver) {
                GameButton(
                    text = "Resume",
                    onClick = onResume,
                    colors = colors
                )
            }

            GameButton(
                text = if (isGameOver) "Play Again" else "Restart",
                onClick = onRestart,
                colors = colors
            )
        }
    }
}

/**
 * Styled game button.
 */
@Composable
private fun GameButton(
    text: String,
    onClick: () -> Unit,
    colors: com.spaceshooter.theme.ThemeColors
) {
    androidx.compose.material3.Button(
        onClick = onClick,
        colors = androidx.compose.material3.ButtonDefaults.buttonColors(
            containerColor = colors.buttonPrimary,
            contentColor = colors.buttonText
        )
    ) {
        Text(text = text, fontSize = 16.sp)
    }
}
