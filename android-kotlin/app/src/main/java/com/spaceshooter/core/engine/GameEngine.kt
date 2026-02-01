package com.spaceshooter.core.engine

import com.spaceshooter.core.constants.GameConstants
import com.spaceshooter.core.math.Vec2
import com.spaceshooter.domain.entity.*
import com.spaceshooter.domain.model.*
import kotlin.math.PI
import kotlin.math.abs
import kotlin.random.Random

/**
 * Core game engine handling all game logic.
 */
class GameEngine {

    /**
     * Update the entire game state for one frame.
     */
    fun update(state: GameState, input: GameInput, deltaTime: Float): GameState {
        if (state.paused) return state

        // Apply time warp
        val effectiveDt = deltaTime * state.timeWarpMultiplier

        var newState = state.copy(time = state.time + deltaTime)

        // Update player
        newState = updatePlayer(newState, input, effectiveDt)

        // Update bullets
        newState = updateBullets(newState, effectiveDt)

        // Update asteroids
        newState = updateAsteroids(newState, effectiveDt)

        // Update enemies
        newState = updateEnemies(newState, effectiveDt)

        // Update boss
        newState = updateBoss(newState, effectiveDt)

        // Update particles
        newState = updateParticles(newState, effectiveDt)

        // Update power-ups
        newState = updatePowerUps(newState, effectiveDt)

        // Update homing missiles
        newState = updateHomingMissiles(newState, effectiveDt)

        // Check collisions
        newState = checkCollisions(newState)

        // Update combo timer
        newState = updateCombo(newState, deltaTime)

        // Update screen shake
        newState = updateScreenShake(newState, deltaTime)

        // Update power-up durations
        newState = updateActivePowerUps(newState, deltaTime)

        // Check wave completion
        newState = checkWaveCompletion(newState)

        // Spawn enemies if needed
        newState = spawnEnemiesIfNeeded(newState, deltaTime)

        return newState
    }

    private fun updatePlayer(state: GameState, input: GameInput, dt: Float): GameState {
        var player = state.player
        var newBullets = state.bullets.toMutableList()

        // Rotation based on joystick
        if (input.joystick.lengthSquared() > 0.01f) {
            val targetAng = input.joystick.angle()
            val angDiff = normalizeAngle(targetAng - player.ang)
            player = player.copy(ang = player.ang + angDiff * GameConstants.PLAYER_TURN_SPEED * dt)
        }

        // Acceleration
        var newVel = player.vel
        if (input.joystick.lengthSquared() > 0.01f) {
            val accel = Vec2.fromAngle(player.ang, GameConstants.PLAYER_ACCEL * dt)
            newVel = newVel + accel
        }

        // Friction
        newVel = newVel * GameConstants.PLAYER_FRICTION

        // Speed cap
        if (newVel.length() > GameConstants.PLAYER_MAX_SPEED) {
            newVel = newVel.normalized() * GameConstants.PLAYER_MAX_SPEED
        }

        // Position update
        var newPos = player.pos + newVel * dt

        // Screen wrapping
        newPos = Vec2.wrap(newPos, state.width, state.height)

        // Update invincibility
        val newInv = (player.invincibility - dt).coerceAtLeast(0f)

        // Update fire cooldown and shoot
        var newFireCooldown = (player.fireCooldown - dt).coerceAtLeast(0f)
        var shotsFired = state.sessionStats.shotsFired

        if (input.firing && newFireCooldown <= 0f) {
            val cooldown = if (state.hasRapidFireActive()) {
                GameConstants.FIRE_COOLDOWN_RAPID
            } else {
                GameConstants.FIRE_COOLDOWN_PLAYER
            }
            newFireCooldown = cooldown

            // Spawn bullet(s)
            val bulletCount = if (state.hasSpreadShotActive()) 3 else 1
            val spreadAngle = PI.toFloat() / 12f

            for (i in 0 until bulletCount) {
                val angleOffset = when {
                    bulletCount == 1 -> 0f
                    i == 0 -> 0f
                    i == 1 -> -spreadAngle
                    else -> spreadAngle
                }

                val bulletAngle = player.ang + angleOffset
                val bulletPos = newPos + Vec2.fromAngle(bulletAngle, player.radius + 5f)
                val bulletVel = Vec2.fromAngle(bulletAngle, GameConstants.BULLET_SPEED_PLAYER)

                newBullets.add(
                    Bullet(
                        pos = bulletPos,
                        vel = bulletVel,
                        isPlayerBullet = true,
                        damage = GameConstants.BULLET_DAMAGE_PLAYER,
                        radius = GameConstants.BULLET_RADIUS_PLAYER
                    )
                )
                shotsFired++
            }
        }

        // Update special ability
        var newAbility = player.specialAbility.copy(
            cooldown = (player.specialAbility.cooldown - dt).coerceAtLeast(0f)
        )

        player = player.copy(
            pos = newPos,
            vel = newVel,
            invincibility = newInv,
            fireCooldown = newFireCooldown,
            specialAbility = newAbility
        )

        return state.copy(
            player = player,
            bullets = newBullets,
            thrusting = input.joystick.lengthSquared() > 0.01f,
            sessionStats = state.sessionStats.copy(shotsFired = shotsFired)
        )
    }

    private fun updateBullets(state: GameState, dt: Float): GameState {
        val updatedBullets = state.bullets.mapNotNull { bullet ->
            val newPos = bullet.pos + bullet.vel * dt

            // Remove if out of bounds (with padding)
            if (newPos.x < -50f || newPos.x > state.width + 50f ||
                newPos.y < -50f || newPos.y > state.height + 50f) {
                null
            } else {
                bullet.copy(pos = newPos)
            }
        }

        return state.copy(bullets = updatedBullets)
    }

    private fun updateAsteroids(state: GameState, dt: Float): GameState {
        val updatedAsteroids = state.asteroids.map { asteroid ->
            var newPos = asteroid.pos + asteroid.vel * dt
            newPos = Vec2.wrap(newPos, state.width, state.height)

            asteroid.copy(
                pos = newPos,
                rotation = asteroid.rotation + asteroid.rotationSpeed * dt
            )
        }

        return state.copy(asteroids = updatedAsteroids)
    }

    private fun updateEnemies(state: GameState, dt: Float): GameState {
        val updatedEnemies = state.enemies.map { enemy ->
            updateEnemy(enemy, state, dt)
        }

        // Check for enemy bullets
        var newBullets = state.bullets.toMutableList()
        updatedEnemies.forEach { enemy ->
            if (enemy.fireCooldown <= 0f && isOnScreen(enemy.pos, state.width, state.height)) {
                val bullet = createEnemyBullet(enemy, state.player.pos)
                if (bullet != null) {
                    newBullets.add(bullet)
                }
            }
        }

        // Reset fire cooldowns
        val enemiesWithResetCooldown = updatedEnemies.map { enemy ->
            if (enemy.fireCooldown <= 0f && isOnScreen(enemy.pos, state.width, state.height)) {
                enemy.copy(fireCooldown = enemy.fireRate)
            } else {
                enemy
            }
        }

        return state.copy(
            enemies = enemiesWithResetCooldown,
            bullets = newBullets
        )
    }

    private fun updateEnemy(enemy: Enemy, state: GameState, dt: Float): Enemy {
        val toPlayer = state.player.pos - enemy.pos
        val targetAngle = toPlayer.angle()

        // Rotate toward player
        val angDiff = normalizeAngle(targetAngle - enemy.ang)
        val newAng = enemy.ang + angDiff * 3f * dt

        // Move based on type
        val newVel = when (enemy.type) {
            EnemyType.SCOUT -> {
                // Fast, direct pursuit
                Vec2.fromAngle(newAng, enemy.speed)
            }
            EnemyType.TANK -> {
                // Slow, steady advance
                Vec2.fromAngle(newAng, enemy.speed)
            }
            EnemyType.SNIPER -> {
                // Stay at distance, strafe
                val distance = toPlayer.length()
                if (distance < 200f) {
                    Vec2.fromAngle(newAng + PI.toFloat(), enemy.speed) // Back away
                } else if (distance > 350f) {
                    Vec2.fromAngle(newAng, enemy.speed) // Approach
                } else {
                    // Strafe
                    Vec2.fromAngle(newAng + PI.toFloat() / 2f, enemy.speed * 0.5f)
                }
            }
            EnemyType.BOMBER -> {
                // Circle around player
                val perpAngle = newAng + PI.toFloat() / 2f
                Vec2.fromAngle(perpAngle, enemy.speed)
            }
        }

        var newPos = enemy.pos + newVel * dt

        // Wrap or clamp based on type
        if (enemy.type == EnemyType.SNIPER) {
            // Snipers stay on screen
            newPos = Vec2(
                newPos.x.coerceIn(50f, state.width - 50f),
                newPos.y.coerceIn(50f, state.height - 50f)
            )
        } else {
            newPos = Vec2.wrap(newPos, state.width, state.height)
        }

        return enemy.copy(
            pos = newPos,
            vel = newVel,
            ang = newAng,
            fireCooldown = enemy.fireCooldown - dt
        )
    }

    private fun createEnemyBullet(enemy: Enemy, playerPos: Vec2): Bullet? {
        // Apply accuracy
        val toPlayer = (playerPos - enemy.pos).normalized()
        val accuracyOffset = (Random.nextFloat() - 0.5f) * (1f - enemy.accuracy) * PI.toFloat() / 4f
        val bulletAngle = toPlayer.angle() + accuracyOffset

        val bulletVel = Vec2.fromAngle(bulletAngle, GameConstants.BULLET_SPEED_ENEMY)

        return Bullet(
            pos = enemy.pos + Vec2.fromAngle(bulletAngle, enemy.radius + 5f),
            vel = bulletVel,
            isPlayerBullet = false,
            damage = enemy.damage,
            radius = GameConstants.BULLET_RADIUS_ENEMY
        )
    }

    private fun updateBoss(state: GameState, dt: Float): GameState {
        val boss = state.boss ?: return state

        // Move boss to center top if spawning
        var newPos = boss.pos
        var newVel = boss.vel

        if (boss.pos.y < 100f) {
            newVel = Vec2(0f, 30f)
            newPos = boss.pos + newVel * dt
        } else {
            // Oscillate horizontally
            val centerX = state.width / 2f
            val oscillateSpeed = 50f * (1f + (boss.maxPhase - boss.phase) * 0.3f)
            newVel = Vec2(
                if (boss.pos.x < centerX - 100f) oscillateSpeed
                else if (boss.pos.x > centerX + 100f) -oscillateSpeed
                else boss.vel.x,
                0f
            )
            newPos = boss.pos + newVel * dt
        }

        // Boss firing pattern
        var newBullets = state.bullets.toMutableList()
        var newTimer = boss.firePatternTimer + dt

        if (newTimer >= 1f && boss.pos.y >= 100f) {
            newTimer = 0f

            // Execute fire pattern from BossStats
            val bossStats = SpawnSystem.getBossStats(boss.type)
            val pattern = bossStats.firePatterns[boss.phase]

            pattern?.let { firePattern ->
                val bulletSpawns = firePattern.execute(
                    bossPos = boss.pos,
                    bossRadius = boss.radius,
                    time = state.time,
                    playerPos = state.player.pos
                )

                bulletSpawns.forEach { spawn ->
                    newBullets.add(
                        Bullet(
                            pos = spawn.position,
                            vel = spawn.velocity,
                            isPlayerBullet = false,
                            damage = 20,
                            radius = 6f
                        )
                    )
                }
            }
        }

        return state.copy(
            boss = boss.copy(
                pos = newPos,
                vel = newVel,
                firePatternTimer = newTimer
            ),
            bullets = newBullets
        )
    }

    private fun updateParticles(state: GameState, dt: Float): GameState {
        val updatedParticles = state.particles.mapNotNull { particle ->
            val newLifetime = particle.lifetime - dt
            if (newLifetime <= 0f) {
                null
            } else {
                particle.copy(
                    pos = particle.pos + particle.vel * dt,
                    vel = particle.vel * 0.95f,
                    lifetime = newLifetime
                )
            }
        }

        return state.copy(particles = updatedParticles)
    }

    private fun updatePowerUps(state: GameState, dt: Float): GameState {
        val updatedPowerUps = state.powerUps.mapNotNull { powerUp ->
            val newLifetime = powerUp.lifetime - dt
            if (newLifetime <= 0f) {
                null
            } else {
                var newPos = powerUp.pos + powerUp.vel * dt

                // Magnet effect
                if (state.hasMagnetActive()) {
                    val toPlayer = state.player.pos - powerUp.pos
                    if (toPlayer.length() < 200f) {
                        val magnetForce = toPlayer.normalized() * 150f * dt
                        newPos = powerUp.pos + magnetForce
                    }
                }

                powerUp.copy(
                    pos = newPos,
                    lifetime = newLifetime
                )
            }
        }

        return state.copy(powerUps = updatedPowerUps)
    }

    private fun updateHomingMissiles(state: GameState, dt: Float): GameState {
        val updatedMissiles = state.homingMissiles.mapNotNull { missile ->
            val newLifetime = missile.lifetime - dt
            if (newLifetime <= 0f) {
                null
            } else {
                // Find nearest target
                val target = findNearestTarget(missile.pos, state.enemies, state.boss)

                var newVel = missile.vel
                if (target != null) {
                    val toTarget = (target - missile.pos).normalized()
                    val currentDir = missile.vel.normalized()
                    val newDir = (currentDir + toTarget * missile.turnRate * dt).normalized()
                    newVel = newDir * missile.speed
                }

                missile.copy(
                    pos = missile.pos + newVel * dt,
                    vel = newVel,
                    lifetime = newLifetime
                )
            }
        }

        return state.copy(homingMissiles = updatedMissiles)
    }

    private fun findNearestTarget(pos: Vec2, enemies: List<Enemy>, boss: Boss?): Vec2? {
        var nearest: Vec2? = null
        var nearestDist = Float.MAX_VALUE

        enemies.forEach { enemy ->
            val dist = (enemy.pos - pos).length()
            if (dist < nearestDist) {
                nearestDist = dist
                nearest = enemy.pos
            }
        }

        boss?.let {
            val dist = (it.pos - pos).length()
            if (dist < nearestDist) {
                nearest = it.pos
            }
        }

        return nearest
    }

    private fun checkCollisions(state: GameState): GameState {
        var newState = state
        val bulletsToRemove = mutableSetOf<Int>()
        val asteroidsToRemove = mutableSetOf<Int>()
        val enemiesToRemove = mutableSetOf<Int>()
        val powerUpsToRemove = mutableSetOf<Int>()
        val newAsteroids = mutableListOf<Asteroid>()
        val newParticles = mutableListOf<Particle>()
        val newPowerUps = mutableListOf<PowerUp>()

        var score = state.score
        var credits = state.credits
        var combo = state.combo
        var sessionStats = state.sessionStats
        var player = state.player
        var boss = state.boss
        var screenShake = state.screenShake

        // Player bullets vs asteroids
        state.bullets.forEachIndexed { bulletIdx, bullet ->
            if (!bullet.isPlayerBullet) return@forEachIndexed

            state.asteroids.forEachIndexed { asteroidIdx, asteroid ->
                if (asteroidIdx in asteroidsToRemove) return@forEachIndexed

                if (CollisionSystem.bulletAsteroidCollision(bullet, asteroid)) {
                    bulletsToRemove.add(bulletIdx)

                    val newHp = asteroid.hp - bullet.damage
                    if (newHp <= 0) {
                        asteroidsToRemove.add(asteroidIdx)

                        // Spawn children
                        newAsteroids.addAll(SpawnSystem.spawnChildAsteroids(asteroid))

                        // Spawn particles
                        newParticles.addAll(
                            SpawnSystem.spawnExplosionParticles(asteroid.pos, 8, 0xFF7799BB.toInt())
                        )

                        // Power-up drop from large asteroids
                        if (asteroid.tier == AsteroidTier.LARGE && Random.nextFloat() < GameConstants.POWERUP_DROP_ASTEROID) {
                            SpawnSystem.spawnPowerUp(asteroid.pos)?.let { newPowerUps.add(it) }
                        }

                        // Score and combo
                        val baseScore = CollisionSystem.getAsteroidScore(asteroid.tier)
                        score += (baseScore * combo.multiplier).toInt()
                        combo = incrementCombo(combo)
                        sessionStats = sessionStats.copy(
                            asteroidsDestroyed = sessionStats.asteroidsDestroyed + 1,
                            shotsHit = sessionStats.shotsHit + 1
                        )

                        // Screen shake
                        screenShake = ScreenShake(intensity = 3f, duration = 0.1f)
                    } else {
                        // Update asteroid HP
                        newState = newState.copy(
                            asteroids = newState.asteroids.mapIndexed { idx, a ->
                                if (idx == asteroidIdx) a.copy(hp = newHp) else a
                            }
                        )
                        sessionStats = sessionStats.copy(shotsHit = sessionStats.shotsHit + 1)
                    }
                    return@forEachIndexed
                }
            }
        }

        // Player bullets vs enemies
        state.bullets.forEachIndexed { bulletIdx, bullet ->
            if (!bullet.isPlayerBullet || bulletIdx in bulletsToRemove) return@forEachIndexed

            state.enemies.forEachIndexed { enemyIdx, enemy ->
                if (enemyIdx in enemiesToRemove) return@forEachIndexed

                if (CollisionSystem.bulletEnemyCollision(bullet, enemy)) {
                    bulletsToRemove.add(bulletIdx)

                    val newHp = enemy.hp - bullet.damage
                    if (newHp <= 0) {
                        enemiesToRemove.add(enemyIdx)

                        // Spawn particles
                        newParticles.addAll(
                            SpawnSystem.spawnExplosionParticles(enemy.pos, 12, 0xFFFF99AA.toInt())
                        )

                        // Power-up drop
                        SpawnSystem.spawnPowerUp(enemy.pos)?.let { newPowerUps.add(it) }

                        // Score and combo
                        val baseScore = getEnemyScore(enemy.type)
                        score += (baseScore * combo.multiplier).toInt()
                        credits += getEnemyCredits(enemy.type)
                        combo = incrementCombo(combo)
                        sessionStats = sessionStats.copy(
                            enemiesKilled = sessionStats.enemiesKilled + 1,
                            shotsHit = sessionStats.shotsHit + 1
                        )

                        // Screen shake
                        screenShake = ScreenShake(intensity = 8f, duration = 0.2f)
                    } else {
                        newState = newState.copy(
                            enemies = newState.enemies.mapIndexed { idx, e ->
                                if (idx == enemyIdx) e.copy(hp = newHp) else e
                            }
                        )
                        sessionStats = sessionStats.copy(shotsHit = sessionStats.shotsHit + 1)
                    }
                    return@forEachIndexed
                }
            }
        }

        // Player bullets vs boss
        boss?.let { currentBoss ->
            state.bullets.forEachIndexed { bulletIdx, bullet ->
                if (!bullet.isPlayerBullet || bulletIdx in bulletsToRemove) return@forEachIndexed
                if (boss == null) return@forEachIndexed // Boss may have been destroyed

                if (CollisionSystem.bulletBossCollision(bullet, currentBoss)) {
                    bulletsToRemove.add(bulletIdx)

                    val newHp = currentBoss.hp - bullet.damage
                    if (newHp <= 0) {
                        // Boss destroyed
                        newParticles.addAll(
                            SpawnSystem.spawnExplosionParticles(currentBoss.pos, 30, 0xFFFF4444.toInt(), 200f)
                        )
                        score += currentBoss.score
                        credits += currentBoss.score / 10
                        boss = null
                        screenShake = ScreenShake(intensity = 15f, duration = 0.5f)
                        sessionStats = sessionStats.copy(bossesKilled = sessionStats.bossesKilled + 1)
                    } else {
                        // Check phase transition
                        val hpPercent = newHp.toFloat() / currentBoss.maxHp
                        val newPhase = when {
                            hpPercent < 0.33f && currentBoss.maxPhase >= 3 -> 3
                            hpPercent < 0.66f && currentBoss.maxPhase >= 2 -> 2
                            else -> currentBoss.phase
                        }
                        boss = currentBoss.copy(hp = newHp, phase = newPhase)
                    }
                    sessionStats = sessionStats.copy(shotsHit = sessionStats.shotsHit + 1)
                }
            }
        }

        // Enemy bullets vs player
        if (player.invincibility <= 0f && !state.hasShieldActive()) {
            state.bullets.forEachIndexed { bulletIdx, bullet ->
                if (bullet.isPlayerBullet || bulletIdx in bulletsToRemove) return@forEachIndexed

                if (CollisionSystem.playerBulletCollision(player, bullet)) {
                    bulletsToRemove.add(bulletIdx)
                    player = damagePlayer(player, bullet.damage, state)
                    screenShake = ScreenShake(intensity = 10f, duration = 0.15f)
                    newParticles.addAll(
                        SpawnSystem.spawnExplosionParticles(player.pos, 5, 0xFFFF4444.toInt())
                    )
                }
            }
        }

        // Player vs asteroids
        if (player.invincibility <= 0f && !state.hasShieldActive()) {
            state.asteroids.forEachIndexed { asteroidIdx, asteroid ->
                if (asteroidIdx in asteroidsToRemove) return@forEachIndexed

                if (CollisionSystem.playerAsteroidCollision(player, asteroid)) {
                    player = damagePlayer(player, 20, state)
                    screenShake = ScreenShake(intensity = 12f, duration = 0.2f)
                    newParticles.addAll(
                        SpawnSystem.spawnExplosionParticles(player.pos, 8, 0xFFAAAACC.toInt())
                    )
                }
            }
        }

        // Player vs enemies
        if (player.invincibility <= 0f && !state.hasShieldActive()) {
            state.enemies.forEachIndexed { enemyIdx, enemy ->
                if (enemyIdx in enemiesToRemove) return@forEachIndexed

                if (CollisionSystem.playerEnemyCollision(player, enemy)) {
                    player = damagePlayer(player, enemy.damage, state)
                    screenShake = ScreenShake(intensity = 12f, duration = 0.2f)
                }
            }
        }

        // Player vs power-ups
        state.powerUps.forEachIndexed { powerUpIdx, powerUp ->
            if (CollisionSystem.playerPowerUpCollision(player, powerUp)) {
                powerUpsToRemove.add(powerUpIdx)
                newState = activatePowerUp(newState, powerUp.type)
                sessionStats = sessionStats.copy(powerUpsCollected = sessionStats.powerUpsCollected + 1)
            }
        }

        // Apply removals
        val finalBullets = state.bullets.filterIndexed { idx, _ -> idx !in bulletsToRemove }
        val finalAsteroids = state.asteroids.filterIndexed { idx, _ -> idx !in asteroidsToRemove } + newAsteroids
        val finalEnemies = state.enemies.filterIndexed { idx, _ -> idx !in enemiesToRemove }
        val finalPowerUps = state.powerUps.filterIndexed { idx, _ -> idx !in powerUpsToRemove } + newPowerUps
        val finalParticles = state.particles + newParticles

        // Check game over
        var lives = state.lives
        var paused = state.paused
        if (player.hp <= 0) {
            lives--
            if (lives <= 0) {
                paused = true
            } else {
                player = player.copy(
                    hp = player.maxHp,
                    invincibility = 3f,
                    pos = Vec2(state.width / 2f, state.height / 2f)
                )
            }
        }

        return newState.copy(
            player = player,
            bullets = finalBullets,
            asteroids = finalAsteroids,
            enemies = finalEnemies,
            powerUps = finalPowerUps,
            particles = finalParticles,
            boss = boss,
            score = score,
            credits = credits,
            combo = combo,
            lives = lives,
            paused = paused,
            screenShake = screenShake,
            sessionStats = sessionStats
        )
    }

    private fun damagePlayer(player: Player, damage: Int, state: GameState): Player {
        val newHp = player.hp - damage
        return player.copy(
            hp = newHp.coerceAtLeast(0),
            invincibility = if (newHp > 0) 1f else 0f
        )
    }

    private fun incrementCombo(combo: ComboState): ComboState {
        val newCount = combo.count + 1
        val tier = (newCount / 3).coerceAtMost(GameConstants.COMBO_MULTIPLIERS.size - 1)
        return ComboState(
            count = newCount,
            timer = GameConstants.COMBO_TIMEOUT,
            multiplierTier = tier
        )
    }

    private fun updateCombo(state: GameState, dt: Float): GameState {
        val combo = state.combo
        if (combo.count == 0) return state

        val newTimer = combo.timer - dt
        return if (newTimer <= 0f) {
            state.copy(combo = ComboState())
        } else {
            state.copy(combo = combo.copy(timer = newTimer))
        }
    }

    private fun updateScreenShake(state: GameState, dt: Float): GameState {
        val shake = state.screenShake ?: return state
        if (shake.duration <= 0f) return state

        val newDuration = shake.duration - dt
        return state.copy(
            screenShake = if (newDuration <= 0f) {
                null
            } else {
                shake.copy(duration = newDuration)
            }
        )
    }

    private fun updateActivePowerUps(state: GameState, dt: Float): GameState {
        val updatedPowerUps = state.activePowerUps.mapNotNull { active ->
            val newDuration = active.remainingDuration - dt
            if (newDuration <= 0f) null else active.copy(remainingDuration = newDuration)
        }
        return state.copy(activePowerUps = updatedPowerUps)
    }

    private fun activatePowerUp(state: GameState, type: PowerUpType): GameState {
        val existing = state.activePowerUps.find { it.type == type }
        val newActive = if (existing != null) {
            state.activePowerUps.map {
                if (it.type == type) it.copy(remainingDuration = GameConstants.POWERUP_DURATION)
                else it
            }
        } else {
            state.activePowerUps + ActivePowerUp(type, GameConstants.POWERUP_DURATION)
        }
        return state.copy(activePowerUps = newActive)
    }

    private fun checkWaveCompletion(state: GameState): GameState {
        if (state.asteroids.isEmpty() && state.enemies.isEmpty() && state.boss == null) {
            val newWave = state.wave + 1
            val asteroidCount = 3 + newWave / 2

            val newAsteroids = SpawnSystem.spawnAsteroids(
                count = asteroidCount.coerceAtMost(10),
                width = state.width,
                height = state.height,
                playerPos = state.player.pos
            )

            // Spawn boss every 5 waves
            val newBoss = if (newWave % 5 == 0) {
                SpawnSystem.spawnBoss(state.width, state.height, newWave)
            } else {
                null
            }

            return state.copy(
                wave = newWave,
                asteroids = newAsteroids,
                boss = newBoss,
                bossWarning = newBoss != null
            )
        }
        return state
    }

    private fun spawnEnemiesIfNeeded(state: GameState, dt: Float): GameState {
        // Spawn enemies every 2 waves after wave 2
        if (state.wave < 2) return state

        val maxEnemies = 2 + state.wave / 3
        if (state.enemies.size >= maxEnemies) return state

        // Random spawn chance
        if (Random.nextFloat() > 0.01f) return state

        val newEnemy = SpawnSystem.spawnEnemy(
            width = state.width,
            height = state.height,
            playerPos = state.player.pos,
            difficulty = state.difficultyProgress
        )

        return state.copy(enemies = state.enemies + newEnemy)
    }

    private fun getEnemyScore(type: EnemyType): Int {
        return when (type) {
            EnemyType.SCOUT -> 100
            EnemyType.TANK -> 250
            EnemyType.SNIPER -> 200
            EnemyType.BOMBER -> 300
        }
    }

    private fun getEnemyCredits(type: EnemyType): Int {
        return when (type) {
            EnemyType.SCOUT -> 10
            EnemyType.TANK -> 25
            EnemyType.SNIPER -> 20
            EnemyType.BOMBER -> 30
        }
    }

    private fun isOnScreen(pos: Vec2, width: Float, height: Float): Boolean {
        return pos.x >= -50f && pos.x <= width + 50f && pos.y >= -50f && pos.y <= height + 50f
    }

    private fun normalizeAngle(angle: Float): Float {
        var a = angle
        while (a > PI) a -= (2 * PI).toFloat()
        while (a < -PI) a += (2 * PI).toFloat()
        return a
    }
}
