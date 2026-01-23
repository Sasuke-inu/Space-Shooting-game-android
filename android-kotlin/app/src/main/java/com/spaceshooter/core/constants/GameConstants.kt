package com.spaceshooter.core.constants

/**
 * Game constants matching the React Native version.
 * All values are tuned for balanced gameplay.
 */
object GameConstants {

    // ============== Player Physics ==============
    const val PLAYER_ACCEL = 180f           // Acceleration force
    const val PLAYER_TURN_SPEED = 5.5f      // Rotation speed (rad/s)
    const val PLAYER_FRICTION = 0.996f      // Velocity damping per frame
    const val PLAYER_MAX_SPEED = 300f       // Maximum velocity
    const val PLAYER_INV_TIME_HIT = 1.0f    // Invincibility after hit (seconds)
    const val PLAYER_INV_TIME_SPAWN = 1.2f  // Invincibility on spawn (seconds)
    const val PLAYER_RADIUS = 32f           // Collision radius
    const val PLAYER_MAX_HP = 100           // Default max health

    // ============== Weapons ==============
    const val BULLET_SPEED_PLAYER = 420f    // Player bullet speed
    const val BULLET_SPEED_ENEMY = 360f     // Enemy bullet speed
    const val BULLET_LIFE_PLAYER = 0.8f     // Player bullet lifetime (seconds)
    const val BULLET_LIFE_ENEMY = 1.0f      // Enemy bullet lifetime (seconds)
    const val FIRE_COOLDOWN_PLAYER = 0.16f  // Normal fire cooldown (seconds)
    const val FIRE_COOLDOWN_RAPID = 0.08f   // Rapid fire cooldown (seconds)
    const val BULLET_DAMAGE_PLAYER = 25     // Player bullet damage
    const val BULLET_DAMAGE_BASE = 25       // Base bullet damage
    const val BULLET_RADIUS_PLAYER = 4f     // Player bullet radius
    const val BULLET_RADIUS_ENEMY = 5f      // Enemy bullet radius

    // ============== Enemies ==============
    object Enemy {
        // Scout
        const val SCOUT_HP = 30
        const val SCOUT_SPEED = 180f
        const val SCOUT_DAMAGE = 10
        const val SCOUT_FIRE_RATE = 1.2f
        const val SCOUT_POINTS = 75

        // Tank
        const val TANK_HP = 150
        const val TANK_SPEED = 60f
        const val TANK_DAMAGE = 25
        const val TANK_FIRE_RATE = 2.0f
        const val TANK_POINTS = 200

        // Sniper
        const val SNIPER_HP = 50
        const val SNIPER_SPEED = 40f
        const val SNIPER_DAMAGE = 35
        const val SNIPER_FIRE_RATE = 3.0f
        const val SNIPER_POINTS = 150
        const val SNIPER_CHARGE_TIME = 2.0f

        // Bomber
        const val BOMBER_HP = 80
        const val BOMBER_SPEED = 100f
        const val BOMBER_DAMAGE = 15
        const val BOMBER_FIRE_RATE = 1.5f
        const val BOMBER_POINTS = 125
        const val BOMBER_BOMB_COOLDOWN = 4.0f
    }

    // ============== Boss ==============
    object Boss {
        const val WAVE_INTERVAL = 5         // Boss spawns every 5 waves
        const val WARNING_TIME = 3.0f       // Warning display duration (seconds)

        // Destroyer
        const val DESTROYER_HP = 500
        const val DESTROYER_PHASES = 2
        const val DESTROYER_POINTS = 1000

        // Carrier
        const val CARRIER_HP = 750
        const val CARRIER_PHASES = 3
        const val CARRIER_POINTS = 1500
        const val CARRIER_MAX_SPAWNS = 12   // Max enemies on screen

        // Dreadnought
        const val DREADNOUGHT_HP = 1000
        const val DREADNOUGHT_PHASES = 3
        const val DREADNOUGHT_POINTS = 2500
    }

    // ============== Asteroids ==============
    object Asteroid {
        const val LARGE_RADIUS = 80f
        const val MEDIUM_RADIUS = 50f
        const val SMALL_RADIUS = 30f
        const val BASE_SPEED = 50f
        const val MAX_SPEED = 150f
        const val POINTS_LARGE = 20
        const val POINTS_MEDIUM = 50
        const val POINTS_SMALL = 100
    }

    // ============== Power-ups (top-level for easy access) ==============
    const val POWERUP_LIFETIME = 10f        // Time before disappearing (seconds)
    const val POWERUP_DURATION = 8f         // Active duration (seconds)
    const val POWERUP_DROP_ENEMY = 0.25f    // 25% drop from enemies
    const val POWERUP_DROP_ASTEROID = 0.05f // 5% drop from large asteroids

    // ============== Combo (top-level) ==============
    const val COMBO_TIMEOUT = 2.0f          // Combo timeout (seconds)
    val COMBO_MULTIPLIERS = floatArrayOf(1f, 1.5f, 2f, 2.5f, 3f)

    // ============== Power-ups ==============
    object PowerUp {
        const val LIFETIME = 10f            // Time before disappearing (seconds)
        const val DURATION = 8f             // Active duration (seconds)
        const val DROP_CHANCE_ENEMY = 0.25f // 25% drop from enemies
        const val DROP_CHANCE_ASTEROID = 0.05f // 5% drop from large asteroids
        const val COLLECT_RADIUS = 30f      // Collection distance
        const val MAGNET_RADIUS = 200f      // Magnet attraction range
        const val MAGNET_FORCE = 300f       // Magnet pull strength
    }

    // ============== Combo System ==============
    object Combo {
        const val TIMEOUT = 2.0f            // Combo timeout (seconds)
        val MULTIPLIERS = floatArrayOf(1f, 1.5f, 2f, 2.5f, 3f)
        const val KILLS_PER_TIER = 3        // Kills to increase multiplier tier
    }

    // ============== Special Abilities ==============
    object Ability {
        // EMP Blast (Interceptor)
        const val EMP_COOLDOWN = 20f
        const val EMP_STUN_DURATION = 3f

        // Missile Barrage (Fighter)
        const val MISSILE_COOLDOWN = 15f
        const val MISSILE_COUNT = 8
        const val MISSILE_DAMAGE = 40
        const val MISSILE_SPEED = 300f

        // Time Warp (Scout)
        const val TIME_WARP_COOLDOWN = 25f
        const val TIME_WARP_DURATION = 5f
        const val TIME_WARP_MULTIPLIER = 0.5f

        // Shield Burst (Tank)
        const val SHIELD_COOLDOWN = 30f
        const val SHIELD_DURATION = 8f
    }

    // ============== Screen Shake ==============
    object Shake {
        const val ASTEROID_INTENSITY = 3f
        const val ASTEROID_DURATION = 100L

        const val ENEMY_INTENSITY = 8f
        const val ENEMY_DURATION = 200L

        const val PLAYER_HIT_INTENSITY = 10f
        const val PLAYER_HIT_DURATION = 150L

        const val PLAYER_DEATH_INTENSITY = 15f
        const val PLAYER_DEATH_DURATION = 400L

        const val BOSS_DEFEAT_INTENSITY = 20f
        const val BOSS_DEFEAT_DURATION = 500L
    }

    // ============== Difficulty ==============
    object Difficulty {
        const val RAMP_TIME = 240f          // 4 minutes to max difficulty
        const val MAX_SPEED_MULTIPLIER = 2.5f
        const val MIN_ACCURACY_ERROR = 0.05f
        const val MAX_ACCURACY_ERROR = 0.5f
    }

    // ============== Controls ==============
    object Controls {
        const val JOY_DEADZONE = 0.1f
        const val JOY_MAX_RADIUS = 60f
    }

    // ============== Collision Radii ==============
    object Collision {
        const val PLAYER_VS_BULLET = 32f
        const val PLAYER_VS_ENEMY = 44f
        const val PLAYER_VS_BOSS = 60f
        const val BULLET_VS_ENEMY = 18f
        const val BULLET_VS_BOSS = 50f
        const val MISSILE_VS_ENEMY = 20f
        const val MISSILE_VS_BOSS = 50f
    }

    // ============== Damage Values ==============
    object Damage {
        const val ENEMY_BULLET = 18
        const val ASTEROID_SMALL = 10
        const val ASTEROID_MEDIUM = 18
        const val ASTEROID_LARGE = 28
        const val ENEMY_COLLISION = 20
        const val BOSS_COLLISION = 40
    }

    // ============== Ships ==============
    object Ship {
        const val FIGHTER_COST = 0
        const val SCOUT_COST = 500
        const val TANK_COST = 750
        const val INTERCEPTOR_COST = 1000
    }

    // ============== Upgrades ==============
    object Upgrade {
        val DAMAGE_COSTS = intArrayOf(100, 250, 500, 1000, 2000)
        val FIRE_RATE_COSTS = intArrayOf(150, 350, 700, 1400, 2800)
        val BULLET_SIZE_COSTS = intArrayOf(200, 500, 1000)
        val MULTI_SHOT_COSTS = intArrayOf(500, 1500)
        const val PIERCING_COST = 3000

        const val DAMAGE_BONUS_PER_LEVEL = 0.1f    // +10% per level
        const val FIRE_RATE_BONUS_PER_LEVEL = 0.15f // +15% per level
        const val BULLET_SIZE_BONUS_PER_LEVEL = 0.2f // +20% per level
    }
}
