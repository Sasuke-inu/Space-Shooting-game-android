package com.spaceshooter.presentation.game

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.spaceshooter.core.engine.GameEngine
import com.spaceshooter.core.engine.GameInput
import com.spaceshooter.core.engine.GameState
import com.spaceshooter.core.engine.SpawnSystem
import com.spaceshooter.core.math.Vec2
import com.spaceshooter.domain.entity.Player
import com.spaceshooter.domain.model.ShipType
import com.spaceshooter.theme.GameTheme
import com.spaceshooter.theme.Themes
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class GameViewModel @Inject constructor() : ViewModel() {

    // Game engine
    private val gameEngine = GameEngine()

    // Game state
    private val _gameState = MutableStateFlow(GameState())
    val gameState: StateFlow<GameState> = _gameState.asStateFlow()

    // Theme
    private val _currentTheme = MutableStateFlow(Themes.NeonVoid)
    val currentTheme: StateFlow<GameTheme> = _currentTheme.asStateFlow()

    // Input
    private var joystickInput = Vec2.ZERO
    private var firing = false
    private var useAbility = false

    // Game loop
    private var gameLoopJob: Job? = null
    private var lastFrameTime = System.nanoTime()

    // Dimensions tracking
    private var dimensionsSet = false

    init {
        initializeGame()
    }

    private fun initializeGame() {
        _gameState.value = GameState(
            player = Player(shipType = ShipType.FIGHTER),
            paused = true
        )
    }

    fun updateJoystick(value: Vec2) {
        joystickInput = value
    }

    fun setFiring(firing: Boolean) {
        this.firing = firing
    }

    fun activateAbility() {
        useAbility = true
    }

    fun resumeGame() {
        if (!dimensionsSet) return

        val currentState = _gameState.value

        // If first time resuming, spawn initial asteroids
        if (currentState.asteroids.isEmpty() && currentState.wave == 1) {
            val asteroids = SpawnSystem.spawnAsteroids(
                count = 4,
                width = currentState.width,
                height = currentState.height,
                playerPos = currentState.player.pos
            )
            _gameState.value = currentState.copy(
                asteroids = asteroids,
                paused = false
            )
        } else {
            _gameState.value = currentState.copy(paused = false)
        }

        startGameLoop()
    }

    fun pauseGame() {
        _gameState.value = _gameState.value.copy(paused = true)
        gameLoopJob?.cancel()
    }

    fun restartGame() {
        val width = _gameState.value.width
        val height = _gameState.value.height

        val asteroids = SpawnSystem.spawnAsteroids(
            count = 4,
            width = width,
            height = height,
            playerPos = Vec2(width / 2f, height / 2f)
        )

        _gameState.value = GameState(
            width = width,
            height = height,
            player = Player(
                pos = Vec2(width / 2f, height / 2f),
                shipType = ShipType.FIGHTER
            ),
            asteroids = asteroids,
            paused = false
        )

        startGameLoop()
    }

    fun setDimensions(width: Float, height: Float) {
        if (width <= 0f || height <= 0f) return

        val isFirstSet = !dimensionsSet
        dimensionsSet = true

        _gameState.value = _gameState.value.copy(
            width = width,
            height = height,
            player = _gameState.value.player.copy(
                pos = if (isFirstSet) Vec2(width / 2f, height / 2f) else _gameState.value.player.pos
            )
        )
    }

    private fun startGameLoop() {
        gameLoopJob?.cancel()
        gameLoopJob = viewModelScope.launch {
            lastFrameTime = System.nanoTime()

            while (isActive && !_gameState.value.paused) {
                val currentTime = System.nanoTime()
                val deltaTime = (currentTime - lastFrameTime) / 1_000_000_000f
                lastFrameTime = currentTime

                // Cap delta time to avoid physics issues
                val cappedDt = deltaTime.coerceAtMost(0.05f)

                updateGame(cappedDt)

                // Target ~60 FPS
                delay(16)
            }
        }
    }

    private fun updateGame(deltaTime: Float) {
        val input = GameInput(
            joystick = joystickInput,
            firing = firing,
            useAbility = useAbility
        )

        // Reset one-shot inputs
        useAbility = false

        // Use game engine to update state
        _gameState.value = gameEngine.update(_gameState.value, input, deltaTime)
    }

    fun setTheme(theme: GameTheme) {
        _currentTheme.value = theme
    }

    override fun onCleared() {
        super.onCleared()
        gameLoopJob?.cancel()
    }
}
