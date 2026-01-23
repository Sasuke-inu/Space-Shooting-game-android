package com.spaceshooter.domain.entity

import com.spaceshooter.core.constants.GameConstants
import com.spaceshooter.core.math.Vec2
import com.spaceshooter.domain.model.*

/**
 * Player entity.
 */
data class Player(
    val pos: Vec2 = Vec2.ZERO,
    val vel: Vec2 = Vec2.ZERO,
    val ang: Float = -Math.PI.toFloat() / 2, // Pointing up
    val hp: Int = 100,
    val maxHp: Int = 100,
    val radius: Float = GameConstants.PLAYER_RADIUS,
    val shipType: ShipType = ShipType.FIGHTER,
    val invincibility: Float = 0f,
    val fireCooldown: Float = 0f,
    val specialAbility: SpecialAbilityState = SpecialAbilityState(
        type = ShipType.FIGHTER.abilityType,
        maxCooldown = ShipType.FIGHTER.abilityCooldown
    )
) {
    val isInvincible: Boolean get() = invincibility > 0f
    val specialReady: Boolean get() = specialAbility.isReady
}

/**
 * Bullet entity.
 */
data class Bullet(
    val pos: Vec2,
    val vel: Vec2,
    val isPlayerBullet: Boolean,
    val damage: Int = 25,
    val radius: Float = 4f,
    val piercing: Boolean = false
)

/**
 * Particle for visual effects.
 */
data class Particle(
    val pos: Vec2,
    val vel: Vec2,
    val lifetime: Float,
    val maxLifetime: Float,
    val size: Float = 2f,
    val color: Int // ARGB color
)

/**
 * Asteroid entity.
 */
data class Asteroid(
    val pos: Vec2,
    val vel: Vec2,
    val radius: Float,
    val hp: Int = 1,
    val rotation: Float = 0f, // Current rotation angle
    val rotationSpeed: Float = 0f, // Rotation speed (rad/s)
    val tier: AsteroidTier
)

/**
 * Enemy entity.
 */
data class Enemy(
    val pos: Vec2,
    val vel: Vec2 = Vec2.ZERO,
    val ang: Float = 0f,
    val hp: Int,
    val maxHp: Int,
    val radius: Float = 15f,
    val type: EnemyType,
    val damage: Int = 10,
    val fireRate: Float = 1.5f,
    val fireCooldown: Float = 0f,
    val speed: Float = 80f,
    val accuracy: Float = 0.6f,
    val chargeTime: Float = 0f, // For Sniper
    val bombCooldown: Float = 0f, // For Bomber
    val stunTime: Float = 0f // For EMP stun
) {
    val isStunned: Boolean get() = stunTime > 0f
    val healthPercent: Float get() = hp.toFloat() / maxHp
}

/**
 * Boss entity.
 */
data class Boss(
    val pos: Vec2,
    val vel: Vec2 = Vec2.ZERO,
    val ang: Float = 0f,
    val hp: Int,
    val maxHp: Int,
    val radius: Float = 50f,
    val type: BossType,
    val phase: Int = 1,
    val maxPhase: Int = 2,
    val firePatternTimer: Float = 0f,
    val attackCooldown: Float = 0f,
    val specialCooldown: Float = 0f,
    val stunTime: Float = 0f,
    val score: Int = 1000
) {
    val currentPhase: Int
        get() {
            val healthPercent = hp.toFloat() / maxHp
            return when {
                healthPercent > 0.66f -> 1
                healthPercent > 0.33f -> 2
                else -> 3
            }
        }

    val isStunned: Boolean get() = stunTime > 0f
}

/**
 * Power-up entity.
 */
data class PowerUp(
    val pos: Vec2,
    val vel: Vec2 = Vec2.ZERO,
    val type: PowerUpType,
    val radius: Float = 12f,
    val lifetime: Float
)

/**
 * Homing missile entity.
 */
data class HomingMissile(
    val pos: Vec2,
    val vel: Vec2,
    val target: Vec2? = null,
    val lifetime: Float = 5f,
    val speed: Float = 300f,
    val turnRate: Float = 3f,
    val damage: Int = 40
)
