package com.spaceshooter.presentation.game

import android.content.Context
import android.graphics.*
import android.os.Process
import android.util.Log
import android.view.SurfaceHolder
import android.view.SurfaceView
import com.spaceshooter.BuildConfig
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

        // Target 60fps = 16.67ms per frame
        private val targetFrameTimeNanos = 16_666_667L // 16.67ms in nanoseconds
        private val targetFrameTimeMs = 16.67f

        // Debug logging
        private val debugLogging = BuildConfig.DEBUG
        private val logTag = "RenderThread"
        private val logInterval = 60 // Log stats every 60 frames (1 second at 60fps)

        // Frame time tracking
        private var frameCount = 0
        private var totalFrameTime = 0L
        private var minFrameTime = Long.MAX_VALUE
        private var maxFrameTime = 0L
        private var droppedFrames = 0

        override fun run() {
            // Set thread priority to THREAD_PRIORITY_DISPLAY for smooth rendering
            Process.setThreadPriority(Process.THREAD_PRIORITY_DISPLAY)

            var lastFrameTime = System.nanoTime()

            while (running) {
                val frameStartTime = System.nanoTime()

                val canvas = holder.lockCanvas()
                if (canvas != null) {
                    try {
                        renderer.draw(canvas)
                    } finally {
                        holder.unlockCanvasAndPost(canvas)
                    }
                }

                // Calculate frame time and sleep to maintain 60fps
                val frameEndTime = System.nanoTime()
                val frameDuration = frameEndTime - frameStartTime
                val sleepTime = targetFrameTimeNanos - frameDuration

                if (sleepTime > 0) {
                    try {
                        Thread.sleep(sleepTime / 1_000_000, (sleepTime % 1_000_000).toInt())
                    } catch (e: InterruptedException) {
                        // Thread interrupted, exit gracefully
                        running = false
                    }
                }

                // Performance logging
                if (debugLogging) {
                    logFrameTime(frameDuration)
                }
            }
        }

        private fun logFrameTime(frameDuration: Long) {
            val frameTimeMs = frameDuration / 1_000_000f

            // Track stats
            totalFrameTime += frameDuration
            minFrameTime = minOf(minFrameTime, frameDuration)
            maxFrameTime = maxOf(maxFrameTime, frameDuration)
            frameCount++

            // Log immediately if frame time exceeds target (dropped frame)
            if (frameTimeMs > targetFrameTimeMs) {
                droppedFrames++
                Log.w(logTag, "Dropped frame: ${String.format("%.2f", frameTimeMs)}ms (target: ${String.format("%.2f", targetFrameTimeMs)}ms)")
            }

            // Log statistics every N frames
            if (frameCount >= logInterval) {
                val avgFrameTimeMs = (totalFrameTime / frameCount) / 1_000_000f
                val minFrameTimeMs = minFrameTime / 1_000_000f
                val maxFrameTimeMs = maxFrameTime / 1_000_000f
                val droppedPercent = (droppedFrames.toFloat() / frameCount) * 100f

                Log.d(logTag, String.format(
                    "Frame stats (%d frames): avg=%.2fms, min=%.2fms, max=%.2fms, dropped=%d (%.1f%%)",
                    frameCount, avgFrameTimeMs, minFrameTimeMs, maxFrameTimeMs, droppedFrames, droppedPercent
                ))

                // Reset stats
                frameCount = 0
                totalFrameTime = 0
                minFrameTime = Long.MAX_VALUE
                maxFrameTime = 0
                droppedFrames = 0
            }
        }
    }
}

/**
 * Game renderer handling all drawing operations.
 */
class GameRenderer {
    @Volatile
    private var state: GameState? = null
    @Volatile
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
    private val scoutPath = Path()
    private val tankPath = Path()
    private val sniperPath = Path()

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

        // Draw floating texts
        drawFloatingTexts(canvas, state)

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

        // Draw screen flash
        state.screenFlash?.let { flash ->
            drawScreenFlash(canvas, flash)
        }

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

    private fun createScoutPath() {
        scoutPath.reset()
        scoutPath.moveTo(0f, -12f)
        scoutPath.lineTo(8f, 10f)
        scoutPath.lineTo(0f, 6f)
        scoutPath.lineTo(-8f, 10f)
        scoutPath.close()
    }

    private fun createTankPath() {
        tankPath.reset()
        tankPath.moveTo(0f, -14f)
        tankPath.lineTo(10f, 10f)
        tankPath.lineTo(-10f, 10f)
        tankPath.close()
    }

    private fun createSniperPath() {
        sniperPath.reset()
        sniperPath.moveTo(0f, -16f)
        sniperPath.lineTo(6f, 12f)
        sniperPath.lineTo(-6f, 12f)
        sniperPath.close()
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

            // Hit flash
            val finalColor = if (enemy.hitFlashTimer > 0f) {
                 if ((state.time * 20).toInt() % 2 == 0) Color.WHITE else Color.RED
            } else {
                 color
            }

            // Draw based on type
            when (enemy.type) {
                EnemyType.SCOUT -> drawScoutEnemy(canvas, finalColor, healthPercent)
                EnemyType.TANK -> drawTankEnemy(canvas, finalColor, healthPercent)
                EnemyType.SNIPER -> drawSniperEnemy(canvas, finalColor, 0f, state.time, healthPercent)
                EnemyType.BOMBER -> drawBomberEnemy(canvas, finalColor, healthPercent)
            }

            canvas.restore()
        }
    }

    private fun drawScoutEnemy(canvas: Canvas, color: Int, healthPercent: Float) {
        paint.color = color
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 2f

        createScoutPath()
        canvas.drawPath(scoutPath, paint)

        // Health bar for scouts
        if (healthPercent < 1f) {
            paint.style = Paint.Style.FILL
            paint.color = Color.DKGRAY
            canvas.drawRect(-15f, 15f, 15f, 18f, paint)
            paint.color = Color.GREEN
            canvas.drawRect(-15f, 15f, -15f + 30f * healthPercent, 18f, paint)
        }
    }

    private fun drawTankEnemy(canvas: Canvas, color: Int, healthPercent: Float) {
        paint.color = color
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 3f

        createTankPath()
        canvas.drawPath(tankPath, paint)

        // Health bar for tanks
        if (healthPercent < 1f) {
            paint.style = Paint.Style.FILL
            paint.color = Color.DKGRAY
            canvas.drawRect(-15f, 15f, 15f, 18f, paint)
            paint.color = Color.GREEN
            canvas.drawRect(-15f, 15f, -15f + 30f * healthPercent, 18f, paint)
        }
    }

    private fun drawSniperEnemy(canvas: Canvas, color: Int, chargeTime: Float, time: Float, healthPercent: Float) {
        paint.color = color
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 2f

        createSniperPath()
        canvas.drawPath(sniperPath, paint)

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

        // Health bar for snipers
        if (healthPercent < 1f) {
            paint.style = Paint.Style.FILL
            paint.color = Color.DKGRAY
            canvas.drawRect(-15f, 15f, 15f, 18f, paint)
            paint.color = Color.GREEN
            canvas.drawRect(-15f, 15f, -15f + 30f * healthPercent, 18f, paint)
        }
    }

    private fun drawBomberEnemy(canvas: Canvas, color: Int, healthPercent: Float) {
        paint.color = color
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 2f
        canvas.drawCircle(0f, 0f, 12f, paint)

        // Wings
        canvas.drawLine(-15f, 0f, -8f, 0f, paint)
        canvas.drawLine(8f, 0f, 15f, 0f, paint)

        // Health bar for bombers
        if (healthPercent < 1f) {
            paint.style = Paint.Style.FILL
            paint.color = Color.DKGRAY
            canvas.drawRect(-15f, 15f, 15f, 18f, paint)
            paint.color = Color.GREEN
            canvas.drawRect(-15f, 15f, -15f + 30f * healthPercent, 18f, paint)
        }
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
        val isFlashing = boss.hitFlashTimer > 0f
        val flashColor = if (isFlashing && (state.time * 20).toInt() % 2 == 0) Color.WHITE else Color.RED
        
        paint.color = if (isFlashing) flashColor else Color.DKGRAY
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

    private fun drawFloatingTexts(canvas: Canvas, state: GameState) {
        textPaint.textAlign = Paint.Align.CENTER
        
        for (text in state.floatingTexts) {
            val alpha = (text.lifetime / text.maxLifetime * 255).toInt().coerceIn(0, 255)
            textPaint.color = (text.color and 0x00FFFFFF) or (alpha shl 24)
            textPaint.textSize = 24f * text.scale
            
            canvas.drawText(text.text, text.pos.x, text.pos.y, textPaint)
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

    private fun drawScreenFlash(canvas: Canvas, flash: ScreenFlash) {
        val baseAlpha = Color.alpha(flash.color)
        val finalAlpha = (baseAlpha * flash.alpha).toInt().coerceIn(0, 255)

        paint.color = (flash.color and 0x00FFFFFF) or (finalAlpha shl 24)
        paint.style = Paint.Style.FILL

        // Draw with margin to cover screen shake
        canvas.drawRect(-100f, -100f, width + 100f, height + 100f, paint)
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
