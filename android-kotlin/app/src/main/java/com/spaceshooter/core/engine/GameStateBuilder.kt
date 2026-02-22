package com.spaceshooter.core.engine

import com.spaceshooter.core.math.Vec2
import com.spaceshooter.domain.entity.*
import com.spaceshooter.domain.model.*

/**
 * Builder for GameState that enables efficient batched updates through structural sharing.
 *
 * ## Problem
 * GameState is an immutable data class. Each modification requires creating a new instance
 * via copy(). In a typical game update cycle, we make 14+ modifications (update player,
 * bullets, asteroids, enemies, collisions, etc.), creating 14+ GameState objects per frame.
 * At 60 FPS, this creates 840+ objects per second, causing significant GC pressure.
 *
 * ## Solution
 * This builder pattern uses structural sharing to batch all modifications into a single
 * allocation. Instead of creating a new GameState for each field change, we:
 * 1. Convert GameState to mutable GameStateBuilder
 * 2. Modify builder properties directly (no allocations)
 * 3. Build a single immutable GameState at the end
 *
 * ## Performance Benefit
 * - **Before**: 14+ GameState allocations per frame (840+/sec at 60 FPS)
 * - **After**: 1 GameState allocation per frame (60/sec at 60 FPS)
 * - **Reduction**: 93% fewer allocations, significantly reduced GC pressure
 *
 * ## Usage Examples
 *
 * ### Simple single-field update:
 * ```
 * val newState = state.toBuilder()
 *     .apply { score = 100 }
 *     .build()
 * ```
 *
 * ### Complex multi-field update:
 * ```
 * val newState = state.toBuilder().apply {
 *     score += 50
 *     credits += 10
 *     player = player.copy(health = player.health - 10)
 *     enemies = enemies.filter { it.health > 0 }
 *     particles = particles + createExplosion(position)
 * }.build()
 * ```
 *
 * ### GameEngine update pattern (see GameEngine.update()):
 * ```
 * fun update(state: GameState, delta: Float): GameState {
 *     val builder = state.toBuilder()
 *     builder.time = state.time + delta
 *
 *     updatePlayer(builder, delta)
 *     updateBullets(builder, delta)
 *     updateAsteroids(builder, delta)
 *     // ... 11 more update functions
 *
 *     return builder.build()  // Single allocation for all 14+ modifications
 * }
 * ```
 *
 * ## When to Use
 * - **Use Builder**: Multiple field updates in same function/scope (GameEngine.update)
 * - **Use copy()**: Single field update in isolation (e.g., simple UI state changes)
 *
 * ## Implementation Note
 * All properties are mutable (var) to enable zero-allocation modifications during the
 * build phase. Immutability is enforced by the GameState class itself - once build()
 * is called, the resulting GameState is immutable and thread-safe.
 *
 * @param state The initial GameState to copy values from
 */
class GameStateBuilder(state: GameState) {
    // ========================================
    // Screen & Viewport
    // ========================================
    /** Canvas width in pixels */
    var width: Float = state.width
    /** Canvas height in pixels */
    var height: Float = state.height

    // ========================================
    // Game Clock & State
    // ========================================
    /** Total elapsed game time in seconds */
    var time: Float = state.time
    /** Whether the game is currently paused */
    var paused: Boolean = state.paused

    // ========================================
    // Score & Progression
    // ========================================
    /** Current player score */
    var score: Int = state.score
    /** Currency for purchasing upgrades */
    var credits: Int = state.credits
    /** Remaining player lives */
    var lives: Int = state.lives
    /** Current wave number */
    var wave: Int = state.wave

    // ========================================
    // Player State
    // ========================================
    /** Player ship entity (position, velocity, health, etc.) */
    var player: Player = state.player
    /** Whether player is currently thrusting (for visual effects) */
    var thrusting: Boolean = state.thrusting

    // ========================================
    // Game Entities
    // ========================================
    /** All active player/enemy bullets */
    var bullets: List<Bullet> = state.bullets
    /** Visual particle effects (explosions, trails) */
    var particles: List<Particle> = state.particles
    /** Destructible asteroids */
    var asteroids: List<Asteroid> = state.asteroids
    /** Enemy ships */
    var enemies: List<Enemy> = state.enemies

    // ========================================
    // Boss System
    // ========================================
    /** Current active boss (null if no boss) */
    var boss: Boss? = state.boss
    /** Whether boss warning is being displayed */
    var bossWarning: Boolean = state.bossWarning
    /** Time remaining for boss warning display */
    var bossWarningTime: Float = state.bossWarningTime

    // ========================================
    // Power-Up System
    // ========================================
    /** Collectible power-ups floating in space */
    var powerUps: List<PowerUp> = state.powerUps
    /** Currently active power-up effects on player */
    var activePowerUps: List<ActivePowerUp> = state.activePowerUps

    // ========================================
    // Special Game Systems
    // ========================================
    /** Kill combo state (multiplier, timer) */
    var combo: ComboState = state.combo
    /** Screen shake effect state (null if no shake) */
    var screenShake: ScreenShake? = state.screenShake
    /** Player's homing missiles */
    var homingMissiles: List<HomingMissile> = state.homingMissiles

    // ========================================
    // Time Warp Ability
    // ========================================
    /** Whether time warp ability is currently active */
    var timeWarpActive: Boolean = state.timeWarpActive
    /** Time scaling multiplier (0.5 = half speed) */
    var timeWarpMultiplier: Float = state.timeWarpMultiplier

    // ========================================
    // Session Statistics
    // ========================================
    /** Session-level stats for achievement tracking */
    var sessionStats: SessionStats = state.sessionStats

    /**
     * Build an immutable GameState from the current builder values.
     *
     * This is the only allocation point in the builder pattern. All previous
     * modifications to builder properties were zero-allocation operations.
     *
     * This method creates a new immutable GameState instance with all the
     * current builder property values. After calling build(), the builder
     * can be safely discarded or reused for another build cycle.
     *
     * @return A new immutable GameState with all current property values
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
 * This is the entry point for the builder pattern optimization. Use this when
 * you need to make multiple modifications to GameState in a single operation.
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
 * ## Performance Tip
 * This creates one GameStateBuilder allocation (lightweight). All subsequent
 * property modifications on the builder are zero-allocation. The final build()
 * creates one GameState allocation. Total: 2 allocations instead of N allocations
 * for N field updates via copy().
 *
 * @receiver The GameState to convert to a builder
 * @return A new GameStateBuilder initialized with this state's values
 */
fun GameState.toBuilder(): GameStateBuilder = GameStateBuilder(this)
