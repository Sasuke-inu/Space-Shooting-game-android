package com.spaceshooter.core.engine

import com.spaceshooter.core.math.Vec2
import com.spaceshooter.domain.entity.*
import com.spaceshooter.domain.model.*

/**
 * Complete game state.
 * Immutable data class for predictable state management.
 */
/**
 * Session statistics for tracking player performance.
 */
data class SessionStats(
    val shotsFired: Int = 0,
    val shotsHit: Int = 0,
    val asteroidsDestroyed: Int = 0,
    val enemiesKilled: Int = 0,
    val bossesKilled: Int = 0,
    val powerUpsCollected: Int = 0,
    val damageTaken: Int = 0,
    val killsRecent: Int = 0,
    val timeSinceLastShot: Float = 0f
)

data class GameState(
    // Screen dimensions
    val width: Float = 0f,
    val height: Float = 0f,

    // Game time
    val time: Float = 0f,
    val paused: Boolean = true,

    // Score and progress
    val score: Int = 0,
    val credits: Int = 0,
    val lives: Int = 3,
    val wave: Int = 1,

    // Player
    val player: Player = Player(),
    val thrusting: Boolean = false,

    // Entities
    val bullets: List<Bullet> = emptyList(),
    val particles: List<Particle> = emptyList(),
    val floatingTexts: List<FloatingText> = emptyList(),
    val asteroids: List<Asteroid> = emptyList(),
    val enemies: List<Enemy> = emptyList(),

    // Boss
    val boss: Boss? = null,
    val bossWarning: Boolean = false,
    val bossWarningTime: Float = 0f,

    // Power-ups
    val powerUps: List<PowerUp> = emptyList(),
    val activePowerUps: List<ActivePowerUp> = emptyList(),

    // Special systems
    val combo: ComboState = ComboState(),
    val screenShake: ScreenShake? = null,
    val screenFlash: ScreenFlash? = null,
    val homingMissiles: List<HomingMissile> = emptyList(),
    val hapticEvents: List<HapticEvent> = emptyList(),

    // Time warp
    val timeWarpActive: Boolean = false,
    val timeWarpMultiplier: Float = 1f,

    // Session stats (for achievements)
    val sessionStats: SessionStats = SessionStats()
) {
    /**
     * Calculate current difficulty (0 to 1) based on time.
     */
    val difficultyProgress: Float
        get() = (time / 240f).coerceIn(0f, 1f)

    /**
     * Get animation speed multiplier based on difficulty.
     */
    val animationSpeedMultiplier: Float
        get() = 1f + difficultyProgress * 1.5f

    /**
     * Check if player has a specific power-up active.
     */
    fun hasPowerUp(type: PowerUpType): Boolean =
        activePowerUps.any { it.type == type }

    /**
     * Check if shield is active (either power-up or ability).
     */
    fun hasShieldActive(): Boolean =
        hasPowerUp(PowerUpType.SHIELD) ||
                (player.specialAbility.type == AbilityType.SHIELD_BURST &&
                        player.specialAbility.isActive)

    /**
     * Check if rapid fire power-up is active.
     */
    fun hasRapidFireActive(): Boolean = hasPowerUp(PowerUpType.RAPID_FIRE)

    /**
     * Check if spread shot power-up is active.
     */
    fun hasSpreadShotActive(): Boolean = hasPowerUp(PowerUpType.SPREAD_SHOT)

    /**
     * Check if magnet power-up is active.
     */
    fun hasMagnetActive(): Boolean = hasPowerUp(PowerUpType.MAGNET)

    /**
     * Check if it's time for a boss wave.
     */
    fun isBossWave(): Boolean = wave % 5 == 0 && wave > 0

    /**
     * Get the boss type for current wave.
     */
    fun getBossTypeForWave(): BossType = when {
        wave <= 10 -> BossType.DESTROYER
        wave <= 20 -> BossType.CARRIER
        else -> BossType.DREADNOUGHT
    }
}

/**
 * Input state from player controls.
 */
data class GameInput(
    val joystick: Vec2 = Vec2.ZERO,
    val firing: Boolean = false,
    val useAbility: Boolean = false
)
