package com.spaceshooter.core.engine

import com.spaceshooter.core.math.Vec2
import com.spaceshooter.domain.entity.*
import com.spaceshooter.domain.model.AsteroidTier

/**
 * Collision detection system using distance-squared checks.
 */
object CollisionSystem {

    /**
     * Check if two circles collide.
     */
    fun circlesCollide(pos1: Vec2, radius1: Float, pos2: Vec2, radius2: Float): Boolean {
        val dx = pos1.x - pos2.x
        val dy = pos1.y - pos2.y
        val distSq = dx * dx + dy * dy
        val radiusSum = radius1 + radius2
        return distSq < radiusSum * radiusSum
    }

    /**
     * Check collision between player and asteroid.
     */
    fun playerAsteroidCollision(player: Player, asteroid: Asteroid): Boolean {
        return circlesCollide(player.pos, player.radius, asteroid.pos, asteroid.radius)
    }

    /**
     * Check collision between player and enemy.
     */
    fun playerEnemyCollision(player: Player, enemy: Enemy): Boolean {
        return circlesCollide(player.pos, player.radius, enemy.pos, enemy.radius)
    }

    /**
     * Check collision between player and enemy bullet.
     */
    fun playerBulletCollision(player: Player, bullet: Bullet): Boolean {
        return circlesCollide(player.pos, player.radius, bullet.pos, bullet.radius)
    }

    /**
     * Check collision between player bullet and asteroid.
     */
    fun bulletAsteroidCollision(bullet: Bullet, asteroid: Asteroid): Boolean {
        return circlesCollide(bullet.pos, bullet.radius, asteroid.pos, asteroid.radius)
    }

    /**
     * Check collision between player bullet and enemy.
     */
    fun bulletEnemyCollision(bullet: Bullet, enemy: Enemy): Boolean {
        return circlesCollide(bullet.pos, bullet.radius, enemy.pos, enemy.radius)
    }

    /**
     * Check collision between player bullet and boss.
     */
    fun bulletBossCollision(bullet: Bullet, boss: Boss): Boolean {
        return circlesCollide(bullet.pos, bullet.radius, boss.pos, boss.radius)
    }

    /**
     * Check collision between player and power-up.
     */
    fun playerPowerUpCollision(player: Player, powerUp: PowerUp): Boolean {
        // Use larger radius for easier collection
        val collectRadius = player.radius * 1.5f
        return circlesCollide(player.pos, collectRadius, powerUp.pos, powerUp.radius)
    }

    /**
     * Check collision between player and boss.
     */
    fun playerBossCollision(player: Player, boss: Boss): Boolean {
        return circlesCollide(player.pos, player.radius, boss.pos, boss.radius)
    }

    /**
     * Get asteroid radius by tier.
     */
    fun getAsteroidRadius(tier: AsteroidTier): Float {
        return when (tier) {
            AsteroidTier.LARGE -> 40f
            AsteroidTier.MEDIUM -> 25f
            AsteroidTier.SMALL -> 15f
        }
    }

    /**
     * Get asteroid HP by tier.
     */
    fun getAsteroidHp(tier: AsteroidTier): Int {
        return when (tier) {
            AsteroidTier.LARGE -> 3
            AsteroidTier.MEDIUM -> 2
            AsteroidTier.SMALL -> 1
        }
    }

    /**
     * Get asteroid score by tier.
     */
    fun getAsteroidScore(tier: AsteroidTier): Int {
        return when (tier) {
            AsteroidTier.LARGE -> 20
            AsteroidTier.MEDIUM -> 50
            AsteroidTier.SMALL -> 100
        }
    }
}
