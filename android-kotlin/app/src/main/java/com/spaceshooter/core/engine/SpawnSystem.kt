package com.spaceshooter.core.engine

import com.spaceshooter.core.constants.GameConstants
import com.spaceshooter.core.math.Vec2
import com.spaceshooter.domain.entity.*
import com.spaceshooter.domain.model.*
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

/**
 * System for spawning game entities.
 */
object SpawnSystem {

    /**
     * Spawn initial asteroids for a wave.
     */
    fun spawnAsteroids(
        count: Int,
        width: Float,
        height: Float,
        playerPos: Vec2,
        minDistance: Float = 150f
    ): List<Asteroid> {
        val asteroids = mutableListOf<Asteroid>()

        repeat(count) {
            var pos: Vec2
            var attempts = 0

            // Find position away from player
            do {
                pos = Vec2(
                    Random.nextFloat() * width,
                    Random.nextFloat() * height
                )
                attempts++
            } while ((pos - playerPos).length() < minDistance && attempts < 50)

            // Random velocity
            val speed = Random.nextFloat() * 30f + 20f
            val angle = Random.nextFloat() * 2f * PI.toFloat()
            val vel = Vec2.fromAngle(angle, speed)

            // Random rotation
            val rotationSpeed = (Random.nextFloat() - 0.5f) * 2f

            asteroids.add(
                Asteroid(
                    pos = pos,
                    vel = vel,
                    tier = AsteroidTier.LARGE,
                    radius = CollisionSystem.getAsteroidRadius(AsteroidTier.LARGE),
                    hp = CollisionSystem.getAsteroidHp(AsteroidTier.LARGE),
                    rotation = Random.nextFloat() * 2f * PI.toFloat(),
                    rotationSpeed = rotationSpeed
                )
            )
        }

        return asteroids
    }

    /**
     * Spawn child asteroids when a larger one is destroyed.
     */
    fun spawnChildAsteroids(parent: Asteroid): List<Asteroid> {
        val childTier = when (parent.tier) {
            AsteroidTier.LARGE -> AsteroidTier.MEDIUM
            AsteroidTier.MEDIUM -> AsteroidTier.SMALL
            AsteroidTier.SMALL -> return emptyList()
        }

        val childCount = 2
        val children = mutableListOf<Asteroid>()

        repeat(childCount) { i ->
            val angleOffset = (i.toFloat() / childCount) * 2f * PI.toFloat()
            val baseAngle = parent.vel.angle() + angleOffset + (Random.nextFloat() - 0.5f) * 0.5f
            val speed = parent.vel.length() * 1.2f + Random.nextFloat() * 20f

            children.add(
                Asteroid(
                    pos = parent.pos + Vec2.fromAngle(baseAngle, parent.radius * 0.5f),
                    vel = Vec2.fromAngle(baseAngle, speed),
                    tier = childTier,
                    radius = CollisionSystem.getAsteroidRadius(childTier),
                    hp = CollisionSystem.getAsteroidHp(childTier),
                    rotation = Random.nextFloat() * 2f * PI.toFloat(),
                    rotationSpeed = (Random.nextFloat() - 0.5f) * 3f
                )
            )
        }

        return children
    }

    /**
     * Spawn an enemy at edge of screen.
     */
    fun spawnEnemy(
        width: Float,
        height: Float,
        playerPos: Vec2,
        difficulty: Float
    ): Enemy {
        // Choose spawn edge
        val edge = Random.nextInt(4)
        val pos = when (edge) {
            0 -> Vec2(Random.nextFloat() * width, -30f) // Top
            1 -> Vec2(Random.nextFloat() * width, height + 30f) // Bottom
            2 -> Vec2(-30f, Random.nextFloat() * height) // Left
            else -> Vec2(width + 30f, Random.nextFloat() * height) // Right
        }

        // Choose enemy type based on difficulty
        val type = chooseEnemyType(difficulty)

        // Initial velocity toward player
        val toPlayer = (playerPos - pos).normalized()
        val speed = type.speed * (1f + difficulty * 0.3f)

        return Enemy(
            pos = pos,
            vel = toPlayer * speed,
            ang = toPlayer.angle(),
            type = type,
            hp = type.hp,
            maxHp = type.hp,
            radius = type.radius,
            damage = type.damage,
            fireRate = type.fireRate,
            fireCooldown = Random.nextFloat() * type.fireRate,
            speed = speed,
            accuracy = type.accuracy + difficulty * 0.2f
        )
    }

    /**
     * Choose enemy type based on difficulty progression.
     */
    private fun chooseEnemyType(difficulty: Float): EnemyType {
        val roll = Random.nextFloat()

        return when {
            difficulty < 0.25f -> EnemyType.SCOUT
            difficulty < 0.5f -> {
                if (roll < 0.7f) EnemyType.SCOUT else EnemyType.TANK
            }
            difficulty < 0.75f -> {
                when {
                    roll < 0.4f -> EnemyType.SCOUT
                    roll < 0.7f -> EnemyType.TANK
                    else -> EnemyType.SNIPER
                }
            }
            else -> {
                when {
                    roll < 0.25f -> EnemyType.SCOUT
                    roll < 0.5f -> EnemyType.TANK
                    roll < 0.75f -> EnemyType.SNIPER
                    else -> EnemyType.BOMBER
                }
            }
        }
    }

    /**
     * Get enemy stats by type.
     */
    data class EnemyStats(
        val hp: Int,
        val radius: Float,
        val damage: Int,
        val fireRate: Float,
        val speed: Float,
        val accuracy: Float
    )

    fun getEnemyStats(type: EnemyType): EnemyStats {
        return when (type) {
            EnemyType.SCOUT -> EnemyStats(
                hp = 30,
                radius = 15f,
                damage = 10,
                fireRate = 1.5f,
                speed = 80f,
                accuracy = 0.6f
            )
            EnemyType.TANK -> EnemyStats(
                hp = 150,
                radius = 25f,
                damage = 25,
                fireRate = 2.5f,
                speed = 40f,
                accuracy = 0.4f
            )
            EnemyType.SNIPER -> EnemyStats(
                hp = 50,
                radius = 18f,
                damage = 35,
                fireRate = 3f,
                speed = 20f,
                accuracy = 0.9f
            )
            EnemyType.BOMBER -> EnemyStats(
                hp = 80,
                radius = 22f,
                damage = 40,
                fireRate = 2f,
                speed = 50f,
                accuracy = 0.5f
            )
        }
    }

    /**
     * Spawn a boss.
     */
    fun spawnBoss(
        width: Float,
        height: Float,
        wave: Int
    ): Boss {
        val type = when {
            wave < 10 -> BossType.DESTROYER
            wave < 20 -> BossType.CARRIER
            else -> BossType.DREADNOUGHT
        }

        val stats = getBossStats(type)

        return Boss(
            pos = Vec2(width / 2f, -100f),
            vel = Vec2(0f, 30f),
            ang = PI.toFloat() / 2f,
            type = type,
            hp = stats.hp,
            maxHp = stats.hp,
            radius = stats.radius,
            phase = 1,
            maxPhase = stats.maxPhase,
            firePatternTimer = 0f,
            score = stats.score
        )
    }

    data class BossStats(
        val hp: Int,
        val radius: Float,
        val maxPhase: Int,
        val score: Int
    )

    fun getBossStats(type: BossType): BossStats {
        return when (type) {
            BossType.DESTROYER -> BossStats(hp = 500, radius = 50f, maxPhase = 2, score = 1000)
            BossType.CARRIER -> BossStats(hp = 750, radius = 60f, maxPhase = 3, score = 1500)
            BossType.DREADNOUGHT -> BossStats(hp = 1000, radius = 70f, maxPhase = 3, score = 2500)
        }
    }

    /**
     * Spawn a power-up at position.
     */
    fun spawnPowerUp(pos: Vec2): PowerUp? {
        val roll = Random.nextFloat()
        if (roll > GameConstants.POWERUP_DROP_ENEMY) return null

        val type = PowerUpType.entries[Random.nextInt(PowerUpType.entries.size)]

        return PowerUp(
            pos = pos,
            vel = Vec2(0f, 20f),
            type = type,
            radius = 12f,
            lifetime = GameConstants.POWERUP_LIFETIME
        )
    }

    /**
     * Spawn explosion particles.
     */
    fun spawnExplosionParticles(
        pos: Vec2,
        count: Int,
        baseColor: Int,
        speed: Float = 100f
    ): List<Particle> {
        return List(count) {
            val angle = Random.nextFloat() * 2f * PI.toFloat()
            val particleSpeed = speed * (0.5f + Random.nextFloat() * 0.5f)

            Particle(
                pos = pos,
                vel = Vec2.fromAngle(angle, particleSpeed),
                lifetime = 0.3f + Random.nextFloat() * 0.4f,
                maxLifetime = 0.5f,
                size = 2f + Random.nextFloat() * 4f,
                color = baseColor
            )
        }
    }
}
