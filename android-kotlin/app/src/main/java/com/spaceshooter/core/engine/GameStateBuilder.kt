package com.spaceshooter.core.engine

import com.spaceshooter.core.math.Vec2
import com.spaceshooter.domain.entity.*
import com.spaceshooter.domain.model.*

/**
 * Builder for GameState that enables efficient batched updates.
 *
 * This builder pattern reduces object allocations from 14+ per frame to just 1.
 * Instead of creating a new GameState for each field change via copy(), we modify
 * mutable properties and create a single immutable GameState at the end.
 *
 * Usage:
 * ```
 * val builder = state.toBuilder()
 * builder.score = 100
 * builder.lives = 2
 * val newState = builder.build()
 * ```
 *
 * @param state The initial GameState to copy values from
 */
class GameStateBuilder(state: GameState) {
    // Screen dimensions
    var width: Float = state.width
    var height: Float = state.height

    // Game time
    var time: Float = state.time
    var paused: Boolean = state.paused

    // Score and progress
    var score: Int = state.score
    var credits: Int = state.credits
    var lives: Int = state.lives
    var wave: Int = state.wave

    // Player
    var player: Player = state.player
    var thrusting: Boolean = state.thrusting

    // Entities
    var bullets: List<Bullet> = state.bullets
    var particles: List<Particle> = state.particles
    var asteroids: List<Asteroid> = state.asteroids
    var enemies: List<Enemy> = state.enemies

    // Boss
    var boss: Boss? = state.boss
    var bossWarning: Boolean = state.bossWarning
    var bossWarningTime: Float = state.bossWarningTime

    // Power-ups
    var powerUps: List<PowerUp> = state.powerUps
    var activePowerUps: List<ActivePowerUp> = state.activePowerUps

    // Special systems
    var combo: ComboState = state.combo
    var screenShake: ScreenShake? = state.screenShake
    var homingMissiles: List<HomingMissile> = state.homingMissiles

    // Time warp
    var timeWarpActive: Boolean = state.timeWarpActive
    var timeWarpMultiplier: Float = state.timeWarpMultiplier

    // Session stats (for achievements)
    var sessionStats: SessionStats = state.sessionStats

    /**
     * Build an immutable GameState from the current builder values.
     *
     * @return A new GameState with all current property values
     */
    fun build(): GameState = GameState(
        width = width,
        height = height,
        time = time,
        paused = paused,
        score = score,
        credits = credits,
        lives = lives,
        wave = wave,
        player = player,
        thrusting = thrusting,
        bullets = bullets,
        particles = particles,
        asteroids = asteroids,
        enemies = enemies,
        boss = boss,
        bossWarning = bossWarning,
        bossWarningTime = bossWarningTime,
        powerUps = powerUps,
        activePowerUps = activePowerUps,
        combo = combo,
        screenShake = screenShake,
        homingMissiles = homingMissiles,
        timeWarpActive = timeWarpActive,
        timeWarpMultiplier = timeWarpMultiplier,
        sessionStats = sessionStats
    )
}

/**
 * Extension function to convert GameState to GameStateBuilder.
 *
 * Enables convenient conversion for batched updates:
 * ```
 * val newState = state.toBuilder()
 *     .apply {
 *         score = 100
 *         lives = 2
 *     }
 *     .build()
 * ```
 *
 * @return A new GameStateBuilder initialized with this state's values
 */
fun GameState.toBuilder(): GameStateBuilder = GameStateBuilder(this)
