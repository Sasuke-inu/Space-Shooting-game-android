package com.spaceshooter.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb

/**
 * Complete theme color scheme (65 colors).
 * Matches the React Native theme system.
 */
data class ThemeColors(
    // Canvas
    val background: Color,
    val stars: Color,

    // Player
    val playerShip: Color,
    val playerShipFill: Color,
    val playerBullet: Color,
    val thrusterFlame: Color,

    // Enemies
    val enemyShip: Color,
    val enemyShipFill: Color,
    val enemyBullet: Color,

    // Objects
    val asteroid: Color,
    val particle: Color,
    val particleHit: Color,
    val particleExplosion: Color,
    val particleDamage: Color,
    val particleCollision: Color,

    // HUD
    val hudText: Color,
    val hudAccent: Color,
    val hullBar: Color,
    val hullBarBg: Color,

    // UI
    val panelBg: Color,
    val panelBorder: Color,
    val buttonPrimary: Color,
    val buttonSecondary: Color,
    val buttonText: Color,
    val modalOverlay: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val textMuted: Color,

    // Controls
    val joystickPad: Color,
    val joystickStick: Color,
    val joystickBorder: Color,
    val joystickGlow: Color,
    val fireButtonPad: Color,
    val fireButtonBorder: Color,
    val fireButtonGlow: Color,

    // Power-ups
    val powerUpShield: Color,
    val powerUpRapidFire: Color,
    val powerUpSpreadShot: Color,
    val powerUpMagnet: Color,

    // Combo
    val comboText: Color,
    val comboGlow: Color
) {
    // Helper to get ARGB int for Canvas drawing
    val backgroundArgb: Int get() = background.toArgb()
    val starsArgb: Int get() = stars.toArgb()
    val playerShipArgb: Int get() = playerShip.toArgb()
    val playerShipFillArgb: Int get() = playerShipFill.toArgb()
    val playerBulletArgb: Int get() = playerBullet.toArgb()
    val thrusterFlameArgb: Int get() = thrusterFlame.toArgb()
    val enemyShipArgb: Int get() = enemyShip.toArgb()
    val enemyBulletArgb: Int get() = enemyBullet.toArgb()
    val asteroidArgb: Int get() = asteroid.toArgb()
    val particleArgb: Int get() = particle.toArgb()
    val hullBarArgb: Int get() = hullBar.toArgb()
    val hullBarBgArgb: Int get() = hullBarBg.toArgb()
    val hudTextArgb: Int get() = hudText.toArgb()
    val fireButtonPadArgb: Int get() = fireButtonPad.toArgb()
    val fireButtonBorderArgb: Int get() = fireButtonBorder.toArgb()
    val fireButtonGlowArgb: Int get() = fireButtonGlow.toArgb()
}

/**
 * Game theme definition.
 */
data class GameTheme(
    val id: String,
    val name: String,
    val colors: ThemeColors
)

/**
 * All available themes.
 */
object Themes {
    val NeonVoid = GameTheme(
        id = "neon-void",
        name = "Neon Void",
        colors = ThemeColors(
            // Canvas
            background = Color(0xFF0a121c),
            stars = Color(0xFF4a5a6a),
            // Player
            playerShip = Color(0xFF88ffff),
            playerShipFill = Color(0x4488ffff),
            playerBullet = Color(0xFFffffff),
            thrusterFlame = Color(0xFFffff99),
            // Enemies
            enemyShip = Color(0xFFff99aa),
            enemyShipFill = Color(0x44ff99aa),
            enemyBullet = Color(0xFFff6688),
            // Objects
            asteroid = Color(0xFF7799bb),
            particle = Color(0xFF88ffff),
            particleHit = Color(0xFFffff88),
            particleExplosion = Color(0xFFff8844),
            particleDamage = Color(0xFFff4444),
            particleCollision = Color(0xFFaaaaaa),
            // HUD
            hudText = Color(0xFF88ffff),
            hudAccent = Color(0xFF99ddff),
            hullBar = Color(0xFF44ff88),
            hullBarBg = Color(0xFF223344),
            // UI
            panelBg = Color(0xB30a121c),
            panelBorder = Color(0xFF88ffff),
            buttonPrimary = Color(0xFF2aefc9),
            buttonSecondary = Color(0xFF334455),
            buttonText = Color(0xFF000000),
            modalOverlay = Color(0xCC000000),
            textPrimary = Color(0xFFffffff),
            textSecondary = Color(0xFFaabbcc),
            textMuted = Color(0xFF667788),
            // Controls
            joystickPad = Color(0x3388ffff),
            joystickStick = Color(0xFF88ffff),
            joystickBorder = Color(0x8888ffff),
            joystickGlow = Color(0x4488ffff),
            fireButtonPad = Color(0x33ff6666),
            fireButtonBorder = Color(0x88ff6666),
            fireButtonGlow = Color(0x44ff6666),
            // Power-ups
            powerUpShield = Color(0xFF4da6ff),
            powerUpRapidFire = Color(0xFFff4d4d),
            powerUpSpreadShot = Color(0xFFffdd4d),
            powerUpMagnet = Color(0xFFd94dff),
            // Combo
            comboText = Color(0xFFffdd4d),
            comboGlow = Color(0x88ffdd4d)
        )
    )

    val Nomad = GameTheme(
        id = "nomad",
        name = "Nomad",
        colors = ThemeColors(
            background = Color(0xFF1a1510),
            stars = Color(0xFF5a4a3a),
            playerShip = Color(0xFFf0c070),
            playerShipFill = Color(0x44f0c070),
            playerBullet = Color(0xFFffe4b5),
            thrusterFlame = Color(0xFFff8c00),
            enemyShip = Color(0xFFc45c3e),
            enemyShipFill = Color(0x44c45c3e),
            enemyBullet = Color(0xFFff6633),
            asteroid = Color(0xFF8b7355),
            particle = Color(0xFFf0c070),
            particleHit = Color(0xFFffcc66),
            particleExplosion = Color(0xFFff8844),
            particleDamage = Color(0xFFcc4422),
            particleCollision = Color(0xFF999988),
            hudText = Color(0xFFf0c070),
            hudAccent = Color(0xFFdda855),
            hullBar = Color(0xFFcc9944),
            hullBarBg = Color(0xFF332211),
            panelBg = Color(0xB31a1510),
            panelBorder = Color(0xFFf0c070),
            buttonPrimary = Color(0xFFe8a54b),
            buttonSecondary = Color(0xFF443322),
            buttonText = Color(0xFF000000),
            modalOverlay = Color(0xCC000000),
            textPrimary = Color(0xFFffffff),
            textSecondary = Color(0xFFccbb99),
            textMuted = Color(0xFF887766),
            joystickPad = Color(0x33f0c070),
            joystickStick = Color(0xFFf0c070),
            joystickBorder = Color(0x88f0c070),
            joystickGlow = Color(0x44f0c070),
            fireButtonPad = Color(0x33ff6633),
            fireButtonBorder = Color(0x88ff6633),
            fireButtonGlow = Color(0x44ff6633),
            powerUpShield = Color(0xFF4da6ff),
            powerUpRapidFire = Color(0xFFff4d4d),
            powerUpSpreadShot = Color(0xFFffdd4d),
            powerUpMagnet = Color(0xFFd94dff),
            comboText = Color(0xFFffcc44),
            comboGlow = Color(0x88ffcc44)
        )
    )

    val Sakura = GameTheme(
        id = "sakura",
        name = "Sakura",
        colors = ThemeColors(
            background = Color(0xFF1a0f18),
            stars = Color(0xFF6a4a5a),
            playerShip = Color(0xFFa2d2ff),
            playerShipFill = Color(0x44a2d2ff),
            playerBullet = Color(0xFFe0ffff),
            thrusterFlame = Color(0xFFffb7c5),
            enemyShip = Color(0xFFff5c8a),
            enemyShipFill = Color(0x44ff5c8a),
            enemyBullet = Color(0xFFff4477),
            asteroid = Color(0xFF9977aa),
            particle = Color(0xFFffb7c5),
            particleHit = Color(0xFFffffff),
            particleExplosion = Color(0xFFff8899),
            particleDamage = Color(0xFFff4466),
            particleCollision = Color(0xFFaa99aa),
            hudText = Color(0xFFffb7c5),
            hudAccent = Color(0xFFffa0b4),
            hullBar = Color(0xFFff8fab),
            hullBarBg = Color(0xFF331122),
            panelBg = Color(0xB31a0f18),
            panelBorder = Color(0xFFffb7c5),
            buttonPrimary = Color(0xFFff8fab),
            buttonSecondary = Color(0xFF442233),
            buttonText = Color(0xFF000000),
            modalOverlay = Color(0xCC000000),
            textPrimary = Color(0xFFffffff),
            textSecondary = Color(0xFFddbbcc),
            textMuted = Color(0xFF997788),
            joystickPad = Color(0x33ffb7c5),
            joystickStick = Color(0xFFffb7c5),
            joystickBorder = Color(0x88ffb7c5),
            joystickGlow = Color(0x44ffb7c5),
            fireButtonPad = Color(0x33ff5577),
            fireButtonBorder = Color(0x88ff5577),
            fireButtonGlow = Color(0x44ff5577),
            powerUpShield = Color(0xFF4da6ff),
            powerUpRapidFire = Color(0xFFff4d4d),
            powerUpSpreadShot = Color(0xFFffdd4d),
            powerUpMagnet = Color(0xFFd94dff),
            comboText = Color(0xFFff99bb),
            comboGlow = Color(0x88ff99bb)
        )
    )

    val ForestMatrix = GameTheme(
        id = "forest-matrix",
        name = "Forest Matrix",
        colors = ThemeColors(
            background = Color(0xFF0a140a),
            stars = Color(0xFF3a5a3a),
            playerShip = Color(0xFF00ff7f),
            playerShipFill = Color(0x4400ff7f),
            playerBullet = Color(0xFFadff2f),
            thrusterFlame = Color(0xFF7fff00),
            enemyShip = Color(0xFFff4500),
            enemyShipFill = Color(0x44ff4500),
            enemyBullet = Color(0xFFff3300),
            asteroid = Color(0xFF558855),
            particle = Color(0xFF00ff7f),
            particleHit = Color(0xFFccff00),
            particleExplosion = Color(0xFFff6600),
            particleDamage = Color(0xFFff2200),
            particleCollision = Color(0xFF88aa88),
            hudText = Color(0xFF00ff7f),
            hudAccent = Color(0xFF66ff99),
            hullBar = Color(0xFF00dd55),
            hullBarBg = Color(0xFF112211),
            panelBg = Color(0xB30a140a),
            panelBorder = Color(0xFF00ff7f),
            buttonPrimary = Color(0xFF39ff14),
            buttonSecondary = Color(0xFF224422),
            buttonText = Color(0xFF000000),
            modalOverlay = Color(0xCC000000),
            textPrimary = Color(0xFFffffff),
            textSecondary = Color(0xFF99cc99),
            textMuted = Color(0xFF668866),
            joystickPad = Color(0x3300ff7f),
            joystickStick = Color(0xFF00ff7f),
            joystickBorder = Color(0x8800ff7f),
            joystickGlow = Color(0x4400ff7f),
            fireButtonPad = Color(0x33ff4400),
            fireButtonBorder = Color(0x88ff4400),
            fireButtonGlow = Color(0x44ff4400),
            powerUpShield = Color(0xFF4da6ff),
            powerUpRapidFire = Color(0xFFff4d4d),
            powerUpSpreadShot = Color(0xFFffdd4d),
            powerUpMagnet = Color(0xFFd94dff),
            comboText = Color(0xFF88ff44),
            comboGlow = Color(0x8888ff44)
        )
    )

    val Inferno = GameTheme(
        id = "inferno",
        name = "Inferno",
        colors = ThemeColors(
            background = Color(0xFF140a0a),
            stars = Color(0xFF5a3a3a),
            playerShip = Color(0xFFffd700),
            playerShipFill = Color(0x44ffd700),
            playerBullet = Color(0xFFffff00),
            thrusterFlame = Color(0xFFff4500),
            enemyShip = Color(0xFF8b0000),
            enemyShipFill = Color(0x448b0000),
            enemyBullet = Color(0xFFcc0000),
            asteroid = Color(0xFF885544),
            particle = Color(0xFFffd700),
            particleHit = Color(0xFFffff00),
            particleExplosion = Color(0xFFff6600),
            particleDamage = Color(0xFFff0000),
            particleCollision = Color(0xFFaa8877),
            hudText = Color(0xFFffd700),
            hudAccent = Color(0xFFff9900),
            hullBar = Color(0xFFff6600),
            hullBarBg = Color(0xFF331111),
            panelBg = Color(0xB3140a0a),
            panelBorder = Color(0xFFffd700),
            buttonPrimary = Color(0xFFff4500),
            buttonSecondary = Color(0xFF442222),
            buttonText = Color(0xFF000000),
            modalOverlay = Color(0xCC000000),
            textPrimary = Color(0xFFffffff),
            textSecondary = Color(0xFFcc9999),
            textMuted = Color(0xFF886666),
            joystickPad = Color(0x33ffd700),
            joystickStick = Color(0xFFffd700),
            joystickBorder = Color(0x88ffd700),
            joystickGlow = Color(0x44ffd700),
            fireButtonPad = Color(0x33ff4500),
            fireButtonBorder = Color(0x88ff4500),
            fireButtonGlow = Color(0x44ff4500),
            powerUpShield = Color(0xFF4da6ff),
            powerUpRapidFire = Color(0xFFff4d4d),
            powerUpSpreadShot = Color(0xFFffdd4d),
            powerUpMagnet = Color(0xFFd94dff),
            comboText = Color(0xFFff9944),
            comboGlow = Color(0x88ff9944)
        )
    )

    val Arctic = GameTheme(
        id = "arctic",
        name = "Arctic",
        colors = ThemeColors(
            background = Color(0xFF0a1014),
            stars = Color(0xFF4a5a6a),
            playerShip = Color(0xFFffffff),
            playerShipFill = Color(0x44ffffff),
            playerBullet = Color(0xFFf0ffff),
            thrusterFlame = Color(0xFF87ceeb),
            enemyShip = Color(0xFF4169e1),
            enemyShipFill = Color(0x444169e1),
            enemyBullet = Color(0xFF3355cc),
            asteroid = Color(0xFF778899),
            particle = Color(0xFFe0ffff),
            particleHit = Color(0xFFffffff),
            particleExplosion = Color(0xFF88ccff),
            particleDamage = Color(0xFF4488ff),
            particleCollision = Color(0xFFaabbcc),
            hudText = Color(0xFFe0ffff),
            hudAccent = Color(0xFF87ceeb),
            hullBar = Color(0xFF5599dd),
            hullBarBg = Color(0xFF112233),
            panelBg = Color(0xB30a1014),
            panelBorder = Color(0xFFe0ffff),
            buttonPrimary = Color(0xFF87ceeb),
            buttonSecondary = Color(0xFF223344),
            buttonText = Color(0xFF000000),
            modalOverlay = Color(0xCC000000),
            textPrimary = Color(0xFFffffff),
            textSecondary = Color(0xFFaabbcc),
            textMuted = Color(0xFF667788),
            joystickPad = Color(0x33e0ffff),
            joystickStick = Color(0xFFe0ffff),
            joystickBorder = Color(0x88e0ffff),
            joystickGlow = Color(0x44e0ffff),
            fireButtonPad = Color(0x33ff6644),
            fireButtonBorder = Color(0x88ff6644),
            fireButtonGlow = Color(0x44ff6644),
            powerUpShield = Color(0xFF4da6ff),
            powerUpRapidFire = Color(0xFFff4d4d),
            powerUpSpreadShot = Color(0xFFffdd4d),
            powerUpMagnet = Color(0xFFd94dff),
            comboText = Color(0xFF88ddff),
            comboGlow = Color(0x8888ddff)
        )
    )

    val all = listOf(NeonVoid, Nomad, Sakura, ForestMatrix, Inferno, Arctic)

    fun getById(id: String): GameTheme = all.find { it.id == id } ?: NeonVoid
}
