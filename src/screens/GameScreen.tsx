import React, { useEffect, useState, useRef, useCallback } from "react"
import { View, useWindowDimensions, Keyboard } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { GestureDetector } from "react-native-gesture-handler"
import { GameCanvas } from "../components/GameCanvas"
import { VirtualControls } from "../components/VirtualControls"
import {
  InstructionsModal,
  SettingsModal,
  NameInputModal,
  PauseGameOverModal,
  AchievementNotification,
  TopBar,
  useBackgroundMusic,
  useGameGestures,
  useGameLoop,
} from "../components/game-ui"
import { useGameStore, JOY_DEADZONE } from "../state/gameStore"
import { useHighScoresStore } from "../state/highScoresStore"
import { useSettingsStore, useThemeColors } from "../theme/themeStore"
import { useAppSettingsStore } from "../state/settingsStore"
import { useStatisticsStore, useAchievementStore, useUpgradesStore } from "../state/progressStore"
import { useTutorialStore } from "../state/tutorialStore"
import { themeList } from "../theme/themes"
import type { ShipType } from "../types/game"
import { ACHIEVEMENTS } from "../types/game"
import { useGameEngine } from "../utils/gameEngine"
import { len } from "../utils/vectorMath"
import type { Vec2 } from "../types/game"
// Android-specific features
import { useAndroidGameFeatures, sendAchievementNotification } from "../utils/androidFeatures"
import { hapticBossSpawn, hapticBossDefeat, hapticWaveComplete, hapticCombo, hapticSpecialAbility } from "../utils/haptics"

interface GameScreenProps {
  onBackToMenu?: () => void;
}

export default function GameScreen({ onBackToMenu }: GameScreenProps) {
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const { updateGame, fireOnce } = useGameEngine()

  // Theme
  const colors = useThemeColors()
  const themeId = useSettingsStore((s) => s.themeId)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const joystickSensitivity = useSettingsStore((s) => s.joystickSensitivity)
  const setJoystickSensitivity = useSettingsStore((s) => s.setJoystickSensitivity)
  const joystickSize = useSettingsStore((s) => s.joystickSize)
  const setJoystickSize = useSettingsStore((s) => s.setJoystickSize)
  const joystickPosition = useSettingsStore((s) => s.joystickPosition)
  const setJoystickPosition = useSettingsStore((s) => s.setJoystickPosition)
  const invertY = useSettingsStore((s) => s.invertY)
  const setInvertY = useSettingsStore((s) => s.setInvertY)
  const autoFire = useSettingsStore((s) => s.autoFire)
  const setAutoFire = useSettingsStore((s) => s.setAutoFire)
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled)
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled)
  const musicVolume = useSettingsStore((s) => s.musicVolume)
  const setMusicVolume = useSettingsStore((s) => s.setMusicVolume)
  const sfxVolume = useSettingsStore((s) => s.sfxVolume)
  const setSfxVolume = useSettingsStore((s) => s.setSfxVolume)
  const screenShakeEnabled = useSettingsStore((s) => s.screenShakeEnabled)
  const setScreenShakeEnabled = useSettingsStore((s) => s.setScreenShakeEnabled)
  const difficulty = useSettingsStore((s) => s.difficulty)
  const setDifficulty = useSettingsStore((s) => s.setDifficulty)
  const resetSettings = useSettingsStore((s) => s.resetSettings)

  // Game state - primitives (use default equality)
  const paused = useGameStore((s) => s.paused)
  const score = useGameStore((s) => s.score)
  const credits = useGameStore((s) => s.credits)
  const lives = useGameStore((s) => s.lives)
  const wave = useGameStore((s) => s.wave)
  const playerAng = useGameStore((s) => s.player.ang)
  const time = useGameStore((s) => s.time)
  const bossWarning = useGameStore((s) => s.bossWarning)
  const timeWarpActive = useGameStore((s) => s.timeWarpActive)

  // Game state - objects (use shallow equality)
  const player = useGameStore(useShallow((s) => s.player))
  const combo = useGameStore(useShallow((s) => s.combo))
  const boss = useGameStore(useShallow((s) => s.boss))
  const specialAbility = useGameStore(useShallow((s) => s.specialAbility))

  // Game state - arrays (use shallow equality)
  const bullets = useGameStore(useShallow((s) => s.bullets))
  const asteroids = useGameStore(useShallow((s) => s.asteroids))
  const enemies = useGameStore(useShallow((s) => s.enemies))
  const particles = useGameStore(useShallow((s) => s.particles))
  const powerUps = useGameStore(useShallow((s) => s.powerUps))
  const activePowerUps = useGameStore(useShallow((s) => s.activePowerUps))
  const homingMissiles = useGameStore(useShallow((s) => s.homingMissiles))

  // Game state - actions (stable function references)
  const getShakeOffset = useGameStore((s) => s.getShakeOffset)
  const hasPowerUp = useGameStore((s) => s.hasPowerUp)
  const activateSpecialAbility = useGameStore((s) => s.activateSpecialAbility)
  const setShipType = useGameStore((s) => s.setShipType)
  const spawnHomingMissiles = useGameStore((s) => s.spawnHomingMissiles)
  const setTimeWarp = useGameStore((s) => s.setTimeWarp)
  const stunAllEnemies = useGameStore((s) => s.stunAllEnemies)

  // Progress stores - objects and arrays (use shallow equality)
  const stats = useStatisticsStore(useShallow((s) => s.stats))
  const achievements = useAchievementStore(useShallow((s) => s.achievements))
  const unlockedShips = useUpgradesStore(useShallow((s) => s.unlockedShips))

  // Progress stores - primitives
  const recentUnlock = useAchievementStore((s) => s.recentUnlock)
  const upgradesCredits = useUpgradesStore((s) => s.credits)

  // Progress stores - actions
  const recordGameEnd = useStatisticsStore((s) => s.recordGameEnd)
  const clearRecentUnlock = useAchievementStore((s) => s.clearRecentUnlock)
  const addUpgradeCredits = useUpgradesStore((s) => s.addCredits)
  const unlockSkin = useUpgradesStore((s) => s.unlockSkin)
  const selectSkin = useUpgradesStore((s) => s.selectSkin)
  const isSkinUnlocked = useUpgradesStore((s) => s.isSkinUnlocked)
  const getSelectedSkin = useUpgradesStore((s) => s.getSelectedSkin)

  // Tutorial store
  const firstLaunch = useTutorialStore((s) => s.firstLaunch)
  const tutorialCompleted = useTutorialStore((s) => s.tutorialCompleted)
  const startTutorial = useTutorialStore((s) => s.startTutorial)
  const resetTutorial = useTutorialStore((s) => s.resetTutorial)
  const markFirstLaunchComplete = useTutorialStore((s) => s.markFirstLaunchComplete)

  // Tutorial store
  const hasCompletedTutorial = useTutorialStore((s) => s.hasCompletedTutorial)
  const tutorialStep = useTutorialStore((s) => s.currentStep)
  const completeStep = useTutorialStore((s) => s.completeStep)
  const skipTutorial = useTutorialStore((s) => s.skipTutorial)
  const completeTutorial = useTutorialStore((s) => s.completeTutorial)
  const resetTutorial = useTutorialStore((s) => s.resetTutorial)

  const [joystickValue, setJoystickValue] = useState<Vec2>({ x: 0, y: 0 })
  const [swipeImpulse, setSwipeImpulse] = useState<Vec2>({ x: 0, y: 0 })
  const initializedRef = useRef(false)
  const lastAbilityActivationRef = useRef<string | null>(null) // Track last activated ability
  const [showInstructions, setShowInstructions] = useState(true)
  const [showTutorial, setShowTutorial] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showShipSelect, setShowShipSelect] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [playerName, setPlayerName] = useState("")
  const [settingsTab, setSettingsTab] = useState<'general' | 'ship' | 'stats'>('general')
  const [purchaseFeedback, setPurchaseFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // High scores - arrays (use shallow equality)
  const highScores = useHighScoresStore(useShallow((s) => s.scores))

  // High scores - actions
  const isTopFive = useHighScoresStore((s) => s.isTopFive)
  const addScore = useHighScoresStore((s) => s.addScore)
  const highScores = getScores(gameMode)

  // Use custom hooks
  useBackgroundMusic(musicVolume)

  // Android-specific features (screen awake, immersive mode, back button)
  const handlePause = useCallback(() => {
    useGameStore.getState().setPaused(true)
  }, [])

  const handleResume = useCallback(() => {
    useGameStore.getState().setPaused(false)
  }, [])

  useAndroidGameFeatures(
    !paused && !showInstructions, // isPlaying
    paused,
    handlePause,
    handleResume,
    colors.background
  )

  // Handle special ability effects
  useEffect(() => {
    if (specialAbility?.isActive) {
      // Create unique key to prevent duplicate activations
      const abilityKey = `${specialAbility.type}-${specialAbility.maxCooldown}`

      // Only trigger if this is a new activation
      if (lastAbilityActivationRef.current !== abilityKey) {
        lastAbilityActivationRef.current = abilityKey

        // Trigger enhanced haptic for special ability (Android)
        hapticSpecialAbility()

        switch (specialAbility.type) {
          case 'missile_barrage':
            spawnHomingMissiles(8)
            break
          case 'time_warp':
            setTimeWarp(true, 0.5)
            break
          case 'shield_burst':
            // Shield is handled in game engine
            break
          case 'emp_blast':
            // Stun all enemies for 3 seconds
            stunAllEnemies(3)
            break
        }
      }
    } else {
      // Reset tracking when ability becomes inactive
      lastAbilityActivationRef.current = null

      if (specialAbility?.type === 'time_warp') {
        setTimeWarp(false)
      }
    }

    // Cleanup function to prevent memory leaks
    return () => {
      // Deactivate time warp if component unmounts
      if (specialAbility?.type === 'time_warp' && specialAbility?.isActive) {
        setTimeWarp(false)
      }
      // Reset tracking ref
      lastAbilityActivationRef.current = null
    }
  }, [specialAbility?.isActive, specialAbility?.type, specialAbility?.maxCooldown, setTimeWarp, spawnHomingMissiles, stunAllEnemies])

  // Achievement notification timeout + Android notification
  useEffect(() => {
    if (recentUnlock) {
      // Send Android notification for achievement
      const achievement = ACHIEVEMENTS[recentUnlock]
      if (achievement) {
        sendAchievementNotification(achievement.name)
      }

      const timer = setTimeout(() => {
        clearRecentUnlock()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [recentUnlock])

  // Enhanced haptics for boss events (Android)
  const prevBossRef = useRef(boss)
  useEffect(() => {
    if (boss && !prevBossRef.current) {
      // Boss just spawned
      hapticBossSpawn()
    } else if (!boss && prevBossRef.current) {
      // Boss just defeated
      hapticBossDefeat()
    }
    prevBossRef.current = boss
  }, [boss])

  // Enhanced haptics for wave completion (Android)
  const prevWaveRef = useRef(wave)
  useEffect(() => {
    if (wave > prevWaveRef.current && wave > 1) {
      hapticWaveComplete()
    }
    prevWaveRef.current = wave
  }, [wave])

  // Enhanced haptics for combos (Android)
  const prevComboRef = useRef(combo.count)
  useEffect(() => {
    if (combo.count > prevComboRef.current && combo.count >= 3) {
      hapticCombo(combo.count)
    }
    prevComboRef.current = combo.count
  }, [combo.count])

  // Initialize game on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      const store = useGameStore.getState()
      store.setDimensions(width, height)
      store.resetGame()
      store.spawnAsteroids(5)
      store.spawnEnemy()
      store.setPaused(true)
    }
  }, [width, height])

  // Setup gesture handlers
  const { combinedGesture } = useGameGestures(
    { paused, autoFire, specialReady: player.specialReady },
    {
      onFire: fireOnce,
      onSpecialAbility: activateSpecialAbility,
      onSwipeUpdate: setSwipeImpulse,
      onSwipeEnd: () => setSwipeImpulse({ x: 0, y: 0 }),
    }
  )

  // Setup game loop
  useGameLoop({
    paused,
    joystickValue,
    playerAng,
    playerVel: player.vel,
    swipeImpulse,
    autoFire,
    colors,
    updateGame,
    fireOnce,
  })

  const handleRestart = () => {
    hapticSelection()
    recordGameEndStats()
    setShowNameInput(false)
    const store = useGameStore.getState()
    store.resetGame()
    store.spawnAsteroids(5)
    store.spawnEnemy()
    store.setPaused(false)
  }

  const handleMainMenu = () => {
    recordGameEndStats()
    setShowNameInput(false)
    const store = useGameStore.getState()
    store.resetGame()
    store.spawnAsteroids(5)
    store.spawnEnemy()
    setShowInstructions(true)
    store.setPaused(true)
  }

  const handleStartGame = () => {
    setShowInstructions(false)
    useGameStore.getState().setPaused(false)
  }

  const recordGameEndStats = () => {
    // Record game end statistics
    const state = useGameStore.getState()
    recordGameEnd(score, wave, time, 0, state.sessionShotsFired, state.sessionShotsHit)

    // Add credits to upgrade store
    addUpgradeCredits(credits)
  }

  const handleSubmitScore = () => {
    const name = playerName.trim() || "Anonymous"
    addScore(score, wave, name)

    recordGameEndStats()

    setShowNameInput(false)
    setPlayerName("")
    Keyboard.dismiss()
  }

  // Check for game over and show name input if top 5
  useEffect(() => {
    if (paused && lives <= 0 && !showInstructions && !showNameInput) {
      if (isTopFive(score, gameMode)) {
        const timer = setTimeout(() => {
          setShowNameInput(true)
        }, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [paused, lives, score, showInstructions, showNameInput, isTopFive, gameMode])

  const handleShipSelect = (ship: ShipType) => {
    if (unlockedShips.includes(ship)) {
      setShipType(ship)
    }
  }

  const handleSkinPurchase = (ship: ShipType, skinId: SkinId) => {
    // If already unlocked, just select it
    if (isSkinUnlocked(ship, skinId)) {
      selectSkin(ship, skinId)
      return
    }

    // Check if this skin requires an achievement
    const skin = SHIP_SKINS[ship][skinId]
    if (skin.achievementRequired) {
      const achievementId = skin.achievementRequired as AchievementId
      const achievementName = ACHIEVEMENTS[achievementId]?.name || 'required achievement'
      setPurchaseFeedback({
        message: `🏆 Unlock "${achievementName}" achievement to get this skin!`,
        type: 'error',
      })
      return
    }

    // Get cost and check if user has enough credits
    const cost = SKIN_COSTS[skinId]
    if (cost === 0) {
      // Free skin, just unlock it
      unlockSkin(ship, skinId)
      selectSkin(ship, skinId)
      setPurchaseFeedback({
        message: `✓ ${skin.name} skin unlocked!`,
        type: 'success',
      })
      return
    }

    if (upgradesCredits < cost) {
      setPurchaseFeedback({
        message: `Not enough credits! Need ${cost}, have ${upgradesCredits}`,
        type: 'error',
      })
      return
    }

    // Attempt to purchase
    const success = unlockSkin(ship, skinId)
    if (success) {
      selectSkin(ship, skinId)
      setPurchaseFeedback({
        message: `✓ ${skin.name} skin purchased for ${cost} credits!`,
        type: 'success',
      })
    } else {
      setPurchaseFeedback({
        message: 'Purchase failed. Please try again.',
        type: 'error',
      })
    }
  }

  const joyMag = len(joystickValue)
  const thrusting = joyMag > 0

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Performance FPS Counter */}
      {performanceConfig.showFpsCounter && (
        <View style={{
          position: 'absolute',
          top: insets.top + 60,
          right: 12,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          borderWidth: 1,
          borderColor: colors.hudAccent,
          borderRadius: 6,
          padding: 8,
          zIndex: 100,
          minWidth: 80,
        }}>
          <Text style={{ color: colors.hudAccent, fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>
            FPS
          </Text>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
            {getMetrics().fps}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 9, textAlign: 'center' }}>
            avg: {getMetrics().avgFps}
          </Text>
        </View>
      )}

      {/* Achievement unlock notification */}
      <AchievementNotification
        achievement={recentUnlock ? ACHIEVEMENTS[recentUnlock] : null}
        topInset={insets.top}
        colors={colors}
      />

      {/* Purchase feedback notification */}
      {purchaseFeedback && (
        <View style={{
          position: 'absolute',
          top: insets.top + 60,
          left: 20,
          right: 20,
          backgroundColor: colors.panelBg,
          borderWidth: 2,
          borderColor: purchaseFeedback.type === 'success' ? colors.comboText : colors.enemyShip,
          borderRadius: 12,
          padding: 12,
          zIndex: 100,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
          <Text style={{ fontSize: 24 }}>{purchaseFeedback.type === 'success' ? '✓' : '⚠️'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: purchaseFeedback.type === 'success' ? colors.comboText : colors.enemyShip,
              fontSize: 12,
              fontWeight: 'bold'
            }}>
              {purchaseFeedback.type === 'success' ? 'SUCCESS' : 'ERROR'}
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 13 }}>
              {purchaseFeedback.message}
            </Text>
          </View>
        </View>
      )}

      {/* Top bar */}
      <TopBar
        topInset={insets.top}
        themeName={themeList.find((t) => t.id === themeId)?.name || 'Neon Void'}
        paused={paused}
        onSettingsPress={() => setShowSettings(true)}
        onPausePress={() => useGameStore.getState().setPaused(!paused)}
        onRestartPress={handleRestart}
        colors={colors}
      />

      {/* Game canvas with tap and swipe gestures */}
      <GestureDetector gesture={combinedGesture}>
        <View style={{ flex: 1 }} pointerEvents="box-none">
          <GameCanvas
            width={width}
            height={height}
            player={player}
            asteroids={asteroids}
            enemies={enemies}
            bullets={bullets}
            particles={particles}
            powerUps={powerUps}
            activePowerUps={activePowerUps}
            combo={combo}
            time={time}
            thrusting={thrusting}
            score={score}
            credits={credits}
            wave={wave}
            lives={lives}
            colors={colors}
            shakeOffset={getShakeOffset()}
            hasShield={hasPowerUp('shield') || (specialAbility?.type === 'shield_burst' && specialAbility?.isActive)}
            boss={boss}
            bossWarning={bossWarning}
            homingMissiles={homingMissiles}
            showRadar={true}
            timeWarpActive={timeWarpActive}
            abilityFlash={abilityFlash}
            abilityFlashOpacity={getAbilityFlashOpacity()}
          />
        </View>
      </GestureDetector>

      {/* Virtual controls */}
      <VirtualControls
        onJoystickMove={setJoystickValue}
        colors={colors}
        sensitivity={joystickSensitivity}
        size={joystickSize}
        position={joystickPosition}
        invertY={invertY}
      />

      {/* Tutorial Overlay */}
      <TutorialOverlay
        visible={showTutorial}
        currentStep={tutorialStep}
        onNextStep={handleTutorialNextStep}
        onSkip={handleTutorialSkip}
        onComplete={handleTutorialComplete}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        activeTab={settingsTab}
        onTabChange={setSettingsTab}
        onClose={() => setShowSettings(false)}
        colors={colors}
        themeList={themeList}
        currentThemeId={themeId}
        onThemeSelect={setTheme}
        musicVolume={musicVolume}
        setMusicVolume={setMusicVolume}
        sfxVolume={sfxVolume}
        setSfxVolume={setSfxVolume}
        joystickSensitivity={joystickSensitivity}
        setJoystickSensitivity={setJoystickSensitivity}
        autoFire={autoFire}
        setAutoFire={setAutoFire}
        hapticsEnabled={hapticsEnabled}
        setHapticsEnabled={setHapticsEnabled}
        currentShip={player.shipType}
        unlockedShips={unlockedShips}
        onShipSelect={handleShipSelect}
        stats={stats}
        upgradesCredits={upgradesCredits}
      />

      {/* Welcome Instructions Modal */}
      <InstructionsModal visible={showInstructions} onStartGame={handleStartGame} colors={colors} />

      {/* Name Input Modal for Top 5 */}
      <NameInputModal
        visible={showNameInput}
        score={score}
        credits={credits}
        playerName={playerName}
        onNameChange={setPlayerName}
        onSubmit={handleSubmitScore}
        colors={colors}
      />

      {/* Pause/Game Over modal */}
      <PauseGameOverModal
        visible={paused && !showInstructions && !showNameInput && !showSettings}
        lives={lives}
        score={score}
        wave={wave}
        credits={credits}
        highScores={highScores}
        onRestart={handleRestart}
        onContinue={() => useGameStore.getState().setPaused(false)}
        colors={colors}
      />
    </View>
  )
}
