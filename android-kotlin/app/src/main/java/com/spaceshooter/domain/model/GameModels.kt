package com.spaceshooter.domain.model

/**
 * Ship types available in the game.
 */
enum class ShipType(
    val displayName: String,
    val cost: Int,
    val speedMultiplier: Float,
    val fireRateMultiplier: Float,
    val damageMultiplier: Float,
    val maxHp: Int,
    val abilityType: AbilityType,
    val abilityCooldown: Float
) {
    FIGHTER(
        displayName = "Fighter",
        cost = 0,
        speedMultiplier = 1.0f,
        fireRateMultiplier = 1.0f,
        damageMultiplier = 1.0f,
        maxHp = 100,
        abilityType = AbilityType.MISSILE_BARRAGE,
        abilityCooldown = 15f
    ),
    SCOUT(
        displayName = "Scout",
        cost = 500,
        speedMultiplier = 1.4f,
        fireRateMultiplier = 1.2f,
        damageMultiplier = 0.8f,
        maxHp = 70,
        abilityType = AbilityType.TIME_WARP,
        abilityCooldown = 25f
    ),
    TANK(
        displayName = "Tank",
        cost = 750,
        speedMultiplier = 0.7f,
        fireRateMultiplier = 0.8f,
        damageMultiplier = 1.5f,
        maxHp = 150,
        abilityType = AbilityType.SHIELD_BURST,
        abilityCooldown = 30f
    ),
    INTERCEPTOR(
        displayName = "Interceptor",
        cost = 1000,
        speedMultiplier = 1.2f,
        fireRateMultiplier = 1.5f,
        damageMultiplier = 0.9f,
        maxHp = 80,
        abilityType = AbilityType.EMP_BLAST,
        abilityCooldown = 20f
    )
}

/**
 * Special ability types.
 */
enum class AbilityType(val displayName: String, val duration: Float) {
    EMP_BLAST("EMP Blast", 3f),
    MISSILE_BARRAGE("Missile Barrage", 0f),
    TIME_WARP("Time Warp", 5f),
    SHIELD_BURST("Shield Burst", 8f)
}

/**
 * Enemy types with their stats.
 */
enum class EnemyType(
    val displayName: String,
    val hp: Int,
    val speed: Float,
    val damage: Int,
    val fireRate: Float,
    val points: Int
) {
    SCOUT(
        displayName = "Scout",
        hp = 30,
        speed = 180f,
        damage = 10,
        fireRate = 1.2f,
        points = 75
    ),
    TANK(
        displayName = "Tank",
        hp = 150,
        speed = 60f,
        damage = 25,
        fireRate = 2.0f,
        points = 200
    ),
    SNIPER(
        displayName = "Sniper",
        hp = 50,
        speed = 40f,
        damage = 35,
        fireRate = 3.0f,
        points = 150
    ),
    BOMBER(
        displayName = "Bomber",
        hp = 80,
        speed = 100f,
        damage = 15,
        fireRate = 1.5f,
        points = 125
    )
}

/**
 * Boss types with their stats.
 */
enum class BossType(
    val displayName: String,
    val hp: Int,
    val phases: Int,
    val points: Int
) {
    DESTROYER(
        displayName = "Destroyer",
        hp = 500,
        phases = 2,
        points = 1000
    ),
    CARRIER(
        displayName = "Carrier",
        hp = 750,
        phases = 3,
        points = 1500
    ),
    DREADNOUGHT(
        displayName = "Dreadnought",
        hp = 1000,
        phases = 3,
        points = 2500
    )
}

/**
 * Power-up types.
 */
enum class PowerUpType(
    val displayName: String,
    val duration: Float
) {
    SHIELD("Shield", 8f),
    RAPID_FIRE("Rapid Fire", 8f),
    SPREAD_SHOT("Spread Shot", 8f),
    MAGNET("Magnet", 8f)
}

/**
 * Asteroid tiers (size).
 */
enum class AsteroidTier(val radius: Float, val points: Int) {
    LARGE(40f, 20),
    MEDIUM(25f, 50),
    SMALL(15f, 100)
}

/**
 * Active power-up state.
 */
data class ActivePowerUp(
    val type: PowerUpType,
    val remainingDuration: Float
)

/**
 * Combo state.
 */
data class ComboState(
    val count: Int = 0,
    val timer: Float = 0f,
    val multiplierTier: Int = 0
) {
    val multiplier: Float
        get() = when {
            multiplierTier >= 4 -> 3f
            multiplierTier >= 3 -> 2.5f
            multiplierTier >= 2 -> 2f
            multiplierTier >= 1 -> 1.5f
            else -> 1f
        }
}

/**
 * Screen shake effect state.
 */
data class ScreenShake(
    val intensity: Float = 0f,
    val duration: Float = 0f
) {
    val isActive: Boolean get() = duration > 0f && intensity > 0f

    fun getOffset(): com.spaceshooter.core.math.Vec2 {
        if (!isActive) return com.spaceshooter.core.math.Vec2.ZERO
        val offsetX = (Math.random().toFloat() * 2f - 1f) * intensity
        val offsetY = (Math.random().toFloat() * 2f - 1f) * intensity
        return com.spaceshooter.core.math.Vec2(offsetX, offsetY)
    }
}

/**
 * Special ability state.
 */
data class SpecialAbilityState(
    val type: AbilityType,
    val isActive: Boolean = false,
    val cooldown: Float = 0f,
    val maxCooldown: Float,
    val duration: Float = 0f
) {
    val isReady: Boolean get() = cooldown <= 0f && !isActive
    val cooldownProgress: Float get() = if (maxCooldown > 0f) 1f - (cooldown / maxCooldown) else 1f
}
