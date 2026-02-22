package com.spaceshooter.domain.model

import com.spaceshooter.core.math.Vec2
import kotlin.math.PI

/**
 * Boss fire patterns for different attack strategies.
 * Each pattern generates bullet spawn data based on boss position and game state.
 */
sealed class FirePattern {

    /**
     * Execute the fire pattern and return bullet spawn data.
     *
     * @param bossPos Current boss position
     * @param bossRadius Boss collision radius
     * @param time Current game time (for animated patterns)
     * @param playerPos Optional player position (for aimed patterns)
     * @return List of bullet spawn data (position and velocity)
     */
    abstract fun execute(
        bossPos: Vec2,
        bossRadius: Float,
        time: Float,
        playerPos: Vec2? = null
    ): List<BulletSpawn>

    /**
     * Rotating spiral pattern - bullets fire in a circle that rotates over time.
     * This creates a spiral effect as the pattern continuously rotates.
     *
     * @param bulletCount Number of bullets in the spiral
     * @param bulletSpeed Speed of fired bullets
     */
    data class Spiral(
        val bulletCount: Int,
        val bulletSpeed: Float
    ) : FirePattern() {
        override fun execute(
            bossPos: Vec2,
            bossRadius: Float,
            time: Float,
            playerPos: Vec2?
        ): List<BulletSpawn> {
            return List(bulletCount) { i ->
                val angle = (i.toFloat() / bulletCount) * 2f * PI.toFloat() + time
                val spawnPos = bossPos + Vec2.fromAngle(angle, bossRadius)
                val velocity = Vec2.fromAngle(angle, bulletSpeed)
                BulletSpawn(spawnPos, velocity)
            }
        }
    }

    /**
     * Circular burst pattern - bullets fire in all directions simultaneously.
     * Unlike Spiral, this pattern does not rotate with time.
     *
     * @param bulletCount Number of bullets in the ring
     * @param bulletSpeed Speed of fired bullets
     */
    data class Ring(
        val bulletCount: Int,
        val bulletSpeed: Float
    ) : FirePattern() {
        override fun execute(
            bossPos: Vec2,
            bossRadius: Float,
            time: Float,
            playerPos: Vec2?
        ): List<BulletSpawn> {
            return List(bulletCount) { i ->
                val angle = (i.toFloat() / bulletCount) * 2f * PI.toFloat()
                val spawnPos = bossPos + Vec2.fromAngle(angle, bossRadius)
                val velocity = Vec2.fromAngle(angle, bulletSpeed)
                BulletSpawn(spawnPos, velocity)
            }
        }
    }

    /**
     * Aimed pattern - bullets fire toward the player's position.
     * Can fire a single bullet or a spread of bullets converging on the player.
     *
     * @param bulletCount Number of bullets to fire
     * @param bulletSpeed Speed of fired bullets
     * @param spread Angle spread in radians (0 = all bullets same direction)
     */
    data class Aimed(
        val bulletCount: Int,
        val bulletSpeed: Float,
        val spread: Float
    ) : FirePattern() {
        override fun execute(
            bossPos: Vec2,
            bossRadius: Float,
            time: Float,
            playerPos: Vec2?
        ): List<BulletSpawn> {
            val targetPos = playerPos ?: Vec2(bossPos.x, bossPos.y + 100f) // Default to downward
            val baseAngle = (targetPos - bossPos).angle()

            return List(bulletCount) { i ->
                val offset = if (bulletCount > 1) {
                    (i.toFloat() / (bulletCount - 1) - 0.5f) * spread
                } else {
                    0f
                }
                val angle = baseAngle + offset
                val spawnPos = bossPos + Vec2.fromAngle(angle, bossRadius)
                val velocity = Vec2.fromAngle(angle, bulletSpeed)
                BulletSpawn(spawnPos, velocity)
            }
        }
    }

    /**
     * Rapid directional burst pattern - fires multiple waves in specific directions.
     * Creates a burst effect with bullets at varying speeds.
     *
     * @param bulletCount Number of bullets per direction
     * @param bulletSpeed Base speed of fired bullets
     * @param directions Number of firing directions
     */
    data class Burst(
        val bulletCount: Int,
        val bulletSpeed: Float,
        val directions: Int
    ) : FirePattern() {
        override fun execute(
            bossPos: Vec2,
            bossRadius: Float,
            time: Float,
            playerPos: Vec2?
        ): List<BulletSpawn> {
            val spawns = mutableListOf<BulletSpawn>()

            for (dir in 0 until directions) {
                val baseAngle = (dir.toFloat() / directions) * 2f * PI.toFloat() + time * 0.5f

                for (i in 0 until bulletCount) {
                    val speedVariation = 1f + (i * 0.15f)
                    val angle = baseAngle
                    val spawnPos = bossPos + Vec2.fromAngle(angle, bossRadius)
                    val velocity = Vec2.fromAngle(angle, bulletSpeed * speedVariation)
                    spawns.add(BulletSpawn(spawnPos, velocity))
                }
            }

            return spawns
        }
    }

    /**
     * Data class representing a single bullet spawn.
     *
     * @param position Where the bullet should spawn
     * @param velocity The bullet's velocity vector
     */
    data class BulletSpawn(
        val position: Vec2,
        val velocity: Vec2
    )
}
