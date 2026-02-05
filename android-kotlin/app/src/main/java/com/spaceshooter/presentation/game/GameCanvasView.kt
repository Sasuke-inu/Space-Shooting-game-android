package com.spaceshooter.presentation.game

import android.content.Context
import android.graphics.*
import android.view.SurfaceHolder
import android.view.SurfaceView
import com.spaceshooter.core.engine.GameState
import com.spaceshooter.core.math.Vec2
import com.spaceshooter.domain.entity.*
import com.spaceshooter.domain.model.*
import com.spaceshooter.theme.ThemeColors
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

/**
 * Custom SurfaceView for rendering the game at 60fps.
 */
class GameCanvasView(context: Context) : SurfaceView(context), SurfaceHolder.Callback {

    private var renderThread: RenderThread? = null
    private val renderer = GameRenderer()
    private var onDimensionsCallback: ((Float, Float) -> Unit)? = null

    init {
        holder.addCallback(this)
        isFocusable = true
    }

    fun setOnDimensionsCallback(callback: (Float, Float) -> Unit) {
        onDimensionsCallback = callback
    }

    override fun surfaceCreated(holder: SurfaceHolder) {
        renderThread = RenderThread(holder, renderer).apply {
            running = true
            start()
        }
    }

    override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
        renderer.setDimensions(width.toFloat(), height.toFloat())
        onDimensionsCallback?.invoke(width.toFloat(), height.toFloat())
    }

    override fun surfaceDestroyed(holder: SurfaceHolder) {
        renderThread?.running = false
        renderThread?.join()
        renderThread = null
    }

    fun updateState(state: GameState, colors: ThemeColors) {
        renderer.setState(state, colors)
    }

    /**
     * Render thread for smooth 60fps rendering.
     */
    private class RenderThread(
        private val holder: SurfaceHolder,
        private val renderer: GameRenderer
    ) : Thread() {
        @Volatile
        var running = false

        // Frame timing
        private val targetFrameTimeNanos = 16_666_666L // 60 FPS (16.67ms)
        private var frameStartTime = 0L
        private var frameEndTime = 0L

        override fun run() {
            while (running) {
                frameStartTime = System.nanoTime()

                val canvas = holder.lockCanvas() ?: continue
                try {
                    renderer.draw(canvas)
                } finally {
                    holder.unlockCanvasAndPost(canvas)
                }

                frameEndTime = System.nanoTime()
                val elapsedNanos = frameEndTime - frameStartTime
                val sleepNanos = targetFrameTimeNanos - elapsedNanos

                if (sleepNanos > 0) {
                    Thread.sleep(sleepNanos / 1_000_000, (sleepNanos % 1_000_000).toInt())
                }
            }
        }
    }
}

/**
 * Game renderer handling all drawing operations.
 */
class GameRenderer {
    private var state: GameState? = null
    private var colors: ThemeColors? = null
    private var width = 0f
    private var height = 0f

    // Cached paints
    private val paint = Paint().apply { isAntiAlias = true }
    private val textPaint = Paint().apply {
        isAntiAlias = true
        typeface = Typeface.MONOSPACE
    }

    // Cached paths
    private val shipPath = Path()
    private val asteroidPath = Path()

    // Stars (generated once)
    private var stars: List<Vec2>? = null

    fun setDimensions(width: Float, height: Float) {
        this.width = width
        this.height = height
        generateStars()
    }

    fun setState(state: GameState, colors: ThemeColors) {
        this.state = state
        this.colors = colors
    }

    private fun generateStars() {
        stars = List(40) {
            Vec2(
                Random.nextFloat() * width,
                Random.nextFloat() * height
            )
        }
    }

    fun draw(canvas: Canvas) {
        val state = this.state ?: return
        val colors = this.colors ?: return

        // Clear background
        canvas.drawColor(colors.backgroundArgb)

        // Apply screen shake
        canvas.save()
        state.screenShake?.getOffset()?.let {
            canvas.translate(it.x, it.y)
        }

        // Time warp effect
        if (state.timeWarpActive) {
            paint.color = Color.argb(25, 100, 150, 255)
            canvas.drawRect(0f, 0f, width, height, paint)
        }

        // Draw stars
        drawStars(canvas, state, colors)

        // Draw particles
        drawParticles(canvas, state)

        // Draw power-ups
        drawPowerUps(canvas, state, colors)

        // Draw asteroids
        drawAsteroids(canvas, state, colors)

        // Draw enemies
        drawEnemies(canvas, state, colors)

        // Draw boss
        state.boss?.let { drawBoss(canvas, it, state, colors) }

        // Draw homing missiles
        drawHomingMissiles(canvas, state, colors)

        // Draw player
        drawPlayer(canvas, state, colors)

        // Draw bullets
        drawBullets(canvas, state, colors)

        // Boss warning
        if (state.bossWarning) {
            drawBossWarning(canvas, colors)
        }

        canvas.restore()
    }

    private fun drawStars(canvas: Canvas, state: GameState, colors: ThemeColors) {
        val stars = this.stars ?: return
        paint.color = colors.starsArgb

        for (star in stars) {
            val y = (star.y + state.time * 20) % height
            paint.alpha = (128 + (sin(state.time * 2 + star.x) * 64).toInt()).coerceIn(64, 200)
            canvas.drawCircle(star.x, y, 1f, paint)
        }
        paint.alpha = 255
    }

    private fun drawPlayer(canvas: Canvas, state: GameState, colors: ThemeColors) {
        val player = state.player

        // Blink when invincible
        if (player.invincibility > 0 && (state.time * 10).toInt() % 2 == 0) {
            return
        }

        canvas.save()
        canvas.translate(player.pos.x, player.pos.y)
        canvas.rotate(Math.toDegrees(player.ang.toDouble()).toFloat() + 90f)

        // Shield effect
        if (state.hasShieldActive()) {
            val pulseRadius = 56 + sin(state.time * 8) * 6
            paint.color = colors.powerUpShield.copy(alpha = 0.6f + sin(state.time * 4) * 0.2f).toArgb()
            paint.style = Paint.Style.STROKE
            paint.strokeWidth = 2f
            canvas.drawCircle(0f, 0f, pulseRadius, paint)
        }

        // Ship body
        createShipPath()
        paint.color = colors.playerShipFillArgb
        paint.style = Paint.Style.FILL
        canvas.drawPath(shipPath, paint)

        paint.color = colors.playerShipArgb
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 2f
        canvas.drawPath(shipPath, paint)

        // Thruster flame
        if (state.thrusting) {
            val flameLength = 56 + sin(state.time * 20) * 8 + 8
            paint.color = colors.thrusterFlameArgb
            paint.strokeWidth = 6f
            canvas.drawLine(0f, 36f, 0f, flameLength, paint)
        }

        // Cockpit
        paint.color = Color.WHITE
        paint.style = Paint.Style.FILL
        canvas.drawCircle(0f, -12f, 6f, paint)

        canvas.restore()
    }

    private fun createShipPath() {
        shipPath.reset()
        shipPath.moveTo(0f, -36f) // Nose
        shipPath.lineTo(20f, 28f)  // Right wing
        shipPath.lineTo(8f, 20f)
        shipPath.lineTo(0f, 36f)  // Tail
        shipPath.lineTo(-8f, 20f)
        shipPath.lineTo(-20f, 28f) // Left wing
        shipPath.close()
    }

    private fun drawBullets(canvas: Canvas, state: GameState, colors: ThemeColors) {
        paint.strokeWidth = 2f

        for (bullet in state.bullets) {
            paint.color = if (bullet.isPlayerBullet) colors.playerBulletArgb else colors.enemyBulletArgb
            paint.style = Paint.Style.STROKE

            val endX = bullet.pos.x - bullet.vel.normalized().x * 6
            val endY = bullet.pos.y - bullet.vel.normalized().y * 6
            canvas.drawLine(bullet.pos.x, bullet.pos.y, endX, endY, paint)
        }
    }

    private fun drawParticles(canvas: Canvas, state: GameState) {
        paint.style = Paint.Style.FILL

        for (particle in state.particles) {
            val alpha = (particle.lifetime / particle.maxLifetime * 255).toInt().coerceIn(0, 255)
            paint.color = (particle.color and 0x00FFFFFF) or (alpha shl 24)
            canvas.drawCircle(particle.pos.x, particle.pos.y, particle.size, paint)
        }
    }

    private fun drawAsteroids(canvas: Canvas, state: GameState, colors: ThemeColors) {
        paint.color = colors.asteroidArgb
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 2f

        for (asteroid in state.asteroids) {
            canvas.save()
            canvas.translate(asteroid.pos.x, asteroid.pos.y)
            canvas.rotate(Math.toDegrees(asteroid.rotation.toDouble()).toFloat())

            createAsteroidPath(asteroid.radius)
            canvas.drawPath(asteroidPath, paint)

            canvas.restore()
        }
    }

    private fun createAsteroidPath(radius: Float) {
        asteroidPath.reset()
        val vertices = 10
        for (i in 0 until vertices) {
            val angle = (i.toFloat() / vertices) * 2 * Math.PI.toFloat()
            val r = radius * (0.75f + sin(angle * 3) * 0.15f)
            val x = cos(angle) * r
            val y = sin(angle) * r
            if (i == 0) {
                asteroidPath.moveTo(x, y)
            } else {
                asteroidPath.lineTo(x, y)
            }
        }
        asteroidPath.close()
    }

    private fun drawEnemies(canvas: Canvas, state: GameState, colors: ThemeColors) {
        for (enemy in state.enemies) {
            canvas.save()
            canvas.translate(enemy.pos.x, enemy.pos.y)
            canvas.rotate(Math.toDegrees(enemy.ang.toDouble()).toFloat() + 90f)

            // Enemy-type specific color
            val color = when (enemy.type) {
                EnemyType.SCOUT -> colors.enemyShipArgb
                EnemyType.TANK -> Color.rgb(255, 102, 102)
                EnemyType.SNIPER -> Color.rgb(153, 102, 255)
                EnemyType.BOMBER -> Color.rgb(255, 153, 51)
            }

            // Health percent for tank health bar
            val healthPercent = enemy.hp.toFloat() / enemy.maxHp

            // Draw based on type
            when (enemy.type) {
                EnemyType.SCOUT -> drawScoutEnemy(canvas, color)
                EnemyType.TANK -> drawTankEnemy(canvas, color, healthPercent)
                EnemyType.SNIPER -> drawSniperEnemy(canvas, color, 0f, state.time)
                EnemyType.BOMBER -> drawBomberEnemy(canvas, color)
            }

            canvas.restore()
        }
    }

    private fun drawScoutEnemy(canvas: Canvas, color: Int) {
        paint.color = color
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 2f

        val path = Path().apply {
            moveTo(0f, -12f)
            lineTo(8f, 10f)
            lineTo(0f, 6f)
            lineTo(-8f, 10f)
            close()
        }
        canvas.drawPath(path, paint)
    }

    private fun drawTankEnemy(canvas: Canvas, color: Int, healthPercent: Float) {
        paint.color = color
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 3f

        val path = Path().apply {
            moveTo(0f, -14f)
            lineTo(10f, 10f)
            lineTo(-10f, 10f)
            close()
        }
        canvas.drawPath(path, paint)

        // Health bar for tanks
        if (healthPercent < 1f) {
            paint.style = Paint.Style.FILL
            paint.color = Color.DKGRAY
            canvas.drawRect(-15f, 15f, 15f, 18f, paint)
            paint.color = Color.GREEN
            canvas.drawRect(-15f, 15f, -15f + 30f * healthPercent, 18f, paint)
        }
    }

    private fun drawSniperEnemy(canvas: Canvas, color: Int, chargeTime: Float, time: Float) {
        paint.color = color
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 2f

        val path = Path().apply {
            moveTo(0f, -16f)
            lineTo(6f, 12f)
            lineTo(-6f, 12f)
            close()
        }
        canvas.drawPath(path, paint)

        // Charge indicator
        if (chargeTime > 0f) {
            val chargeRadius = 12f + sin(time * 10) * 2f
            paint.color = Color.argb(
                (chargeTime / 2f * 255).toInt().coerceIn(0, 255),
                153, 102, 255
            )
            paint.style = Paint.Style.STROKE
            paint.strokeWidth = 2f
            canvas.drawCircle(0f, 0f, chargeRadius, paint)
        }
    }

    private fun drawBomberEnemy(canvas: Canvas, color: Int) {
        paint.color = color
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 2f
        canvas.drawCircle(0f, 0f, 12f, paint)

        // Wings
        canvas.drawLine(-15f, 0f, -8f, 0f, paint)
        canvas.drawLine(8f, 0f, 15f, 0f, paint)
    }

    private fun drawBoss(canvas: Canvas, boss: Boss, state: GameState, colors: ThemeColors) {
        canvas.save()
        canvas.translate(boss.pos.x, boss.pos.y)

        // Boss size varies by type
        val radius = boss.radius

        // Phase-based core color
        val coreColor = when (boss.phase) {
            1 -> Color.rgb(255, 153, 0)
            2 -> Color.rgb(255, 102, 0)
            else -> Color.rgb(255, 0, 0)
        }

        // Outer glow
        paint.color = Color.argb(50, Color.red(coreColor), Color.green(coreColor), Color.blue(coreColor))
        paint.style = Paint.Style.FILL
        canvas.drawCircle(0f, 0f, radius + 20f, paint)

        // Main body
        paint.color = Color.DKGRAY
        canvas.drawCircle(0f, 0f, radius, paint)

        // Core
        val pulseRadius = 15 + sin(state.time * 5) * 2
        paint.color = coreColor
        canvas.drawCircle(0f, 0f, pulseRadius, paint)

        // Phase indicators
        for (i in 0 until boss.maxPhase) {
            val indicatorX = -20f + i * 20f
            paint.color = if (i < boss.phase) Color.WHITE else Color.DKGRAY
            paint.style = Paint.Style.FILL
            canvas.drawCircle(indicatorX, -radius - 10f, 4f, paint)
        }

        // Health bar
        val healthPercent = boss.hp.toFloat() / boss.maxHp
        paint.color = Color.DKGRAY
        paint.style = Paint.Style.FILL
        canvas.drawRect(-60f, -radius - 25f, 60f, -radius - 20f, paint)
        paint.color = when {
            healthPercent > 0.5f -> Color.GREEN
            healthPercent > 0.25f -> Color.YELLOW
            else -> Color.RED
        }
        canvas.drawRect(-60f, -radius - 25f, -60f + 120f * healthPercent, -radius - 20f, paint)

        canvas.restore()
    }

    private fun drawPowerUps(canvas: Canvas, state: GameState, colors: ThemeColors) {
        for (powerUp in state.powerUps) {
            val color = when (powerUp.type) {
                PowerUpType.SHIELD -> colors.powerUpShield
                PowerUpType.RAPID_FIRE -> colors.powerUpRapidFire
                PowerUpType.SPREAD_SHOT -> colors.powerUpSpreadShot
                PowerUpType.MAGNET -> colors.powerUpMagnet
            }

            // Outer glow
            val pulseRadius = 18 * (1 + sin(state.time * 5) * 0.15f)
            paint.color = color.copy(alpha = 0.3f).toArgb()
            paint.style = Paint.Style.FILL
            canvas.drawCircle(powerUp.pos.x, powerUp.pos.y, pulseRadius, paint)

            // Ring
            paint.color = color.toArgb()
            paint.style = Paint.Style.STROKE
            paint.strokeWidth = 2f
            canvas.drawCircle(powerUp.pos.x, powerUp.pos.y, 12f, paint)

            // Core
            paint.color = color.copy(alpha = 0.6f).toArgb()
            paint.style = Paint.Style.FILL
            canvas.drawCircle(powerUp.pos.x, powerUp.pos.y, 8f, paint)
        }
    }

    private fun drawHomingMissiles(canvas: Canvas, state: GameState, colors: ThemeColors) {
        paint.color = Color.rgb(255, 150, 50)
        paint.style = Paint.Style.FILL

        for (missile in state.homingMissiles) {
            canvas.drawCircle(missile.pos.x, missile.pos.y, 5f, paint)
        }
    }

    private fun drawBossWarning(canvas: Canvas, colors: ThemeColors) {
        // Red overlay
        paint.color = Color.argb(25, 255, 0, 0)
        canvas.drawRect(0f, 0f, width, height, paint)

        // Warning text
        textPaint.color = Color.RED
        textPaint.textSize = 32f
        textPaint.textAlign = Paint.Align.CENTER
        canvas.drawText("⚠️ BOSS INCOMING ⚠️", width / 2, height / 2, textPaint)
    }

    private fun androidx.compose.ui.graphics.Color.toArgb(): Int {
        return android.graphics.Color.argb(
            (alpha * 255).toInt(),
            (red * 255).toInt(),
            (green * 255).toInt(),
            (blue * 255).toInt()
        )
    }
}
