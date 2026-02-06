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
  const gameMode = useGameStore((s) => s.gameMode)
  const setGameMode = useGameStore((s) => s.setGameMode)
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

  // Challenges
  const challenges = useChallengesStore((s) => s.challenges)
  const activeChallengesCount = challenges.filter((c) => !c.completed).length
  const recentChallengeCompletion = useChallengesStore((s) => s.recentCompletion)
  const clearRecentChallengeCompletion = useChallengesStore((s) => s.clearRecentCompletion)
  const checkAndRefreshChallenges = useChallengesStore((s) => s.checkAndRefreshChallenges)
  const recordKillChallenge = useChallengesStore((s) => s.recordKill)
  const recordComboChallenge = useChallengesStore((s) => s.recordCombo)
  const recordBossDefeatChallenge = useChallengesStore((s) => s.recordBossDefeat)
  const recordPowerUpCollectedChallenge = useChallengesStore((s) => s.recordPowerUpCollected)
  const recordWaveChallenge = useChallengesStore((s) => s.recordWave)
  const recordAccuracyChallenge = useChallengesStore((s) => s.recordAccuracy)
  const recordNoDamageWaveChallenge = useChallengesStore((s) => s.recordNoDamageWave)

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
    recordGameEnd(score, wave, time, 0, state.sessionShotsFired, state.sessionShotsHit, state.player.shipType)

    // Add credits to upgrade store
    addUpgradeCredits(credits)
  }

  const handleSubmitScore = () => {
    const name = playerName.trim() || "Anonymous"
    addScore(score, wave, name, gameMode, gameMode === 'endless' ? time : undefined)

    recordGameEndStats()

    setShowNameInput(false)
    setPlayerName("")
    setShowLeaderboard(true)
    Keyboard.dismiss()
  }

  // Check for game over and show name input if top 10
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

      {/* Ship purchase notification */}
      {recentShipPurchase && (
        <View style={{
          position: 'absolute',
          top: insets.top + 60,
          left: 20,
          right: 20,
          backgroundColor: colors.panelBg,
          borderWidth: 2,
          borderColor: colors.comboText,
          borderRadius: 12,
          padding: 12,
          zIndex: 100,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
          <Text style={{ fontSize: 32 }}>🚀</Text>
          <View>
            <Text style={{ color: colors.comboText, fontSize: 12, fontWeight: 'bold' }}>SHIP PURCHASED</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' }}>{recentShipPurchase.charAt(0).toUpperCase() + recentShipPurchase.slice(1)}</Text>
          </View>
        </View>
      )}

      {/* Challenge completion notification */}
      {recentChallengeCompletion && (() => {
        const completedChallenge = challenges.find((c) => c.id === recentChallengeCompletion)
        return completedChallenge ? (
          <View style={{
            position: 'absolute',
            top: insets.top + 140,
            left: 20,
            right: 20,
            backgroundColor: colors.panelBg,
            borderWidth: 2,
            borderColor: colors.buttonPrimary,
            borderRadius: 12,
            padding: 12,
            zIndex: 100,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}>
            <Text style={{ fontSize: 32 }}>{completedChallenge.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.buttonPrimary, fontSize: 12, fontWeight: 'bold' }}>CHALLENGE COMPLETE</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' }}>{completedChallenge.name}</Text>
              <Text style={{ color: colors.comboText, fontSize: 12, marginTop: 2 }}>+{completedChallenge.reward} Credits</Text>
            </View>
          </View>
        ) : null
      })()}

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
            specialAbility={specialAbility}
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

      {/* Shop Modal */}
      {showShop && (
        <Modal visible={true} transparent animationType="fade">
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.modalOverlay }}>
            <View style={{
              backgroundColor: colors.panelBg,
              borderWidth: 2,
              borderColor: colors.panelBorder,
              borderRadius: 16,
              padding: 20,
              marginHorizontal: 24,
              width: 340,
              maxHeight: '85%',
            }}>
              <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                🛒 Ship Shop
              </Text>

              {/* Credit Balance */}
              <View style={{
                backgroundColor: colors.buttonSecondary,
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                alignItems: 'center',
              }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Your Credits</Text>
                <Text style={{ color: colors.comboText, fontSize: 24, fontWeight: 'bold' }}>
                  {upgradesCredits}
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                <View style={{ gap: 12 }}>
                  {(['fighter', 'scout', 'tank', 'interceptor'] as ShipType[]).map((ship) => {
                    const shipStats = SHIP_STATS[ship]
                    const isUnlocked = unlockedShips.includes(ship)
                    const cost = SHIP_COSTS[ship]

                    return (
                      <View
                        key={ship}
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: isUnlocked ? colors.comboText : colors.panelBorder,
                          backgroundColor: isUnlocked ? colors.buttonSecondary : 'transparent',
                        }}
                      >
                        {/* Ship Header */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', textTransform: 'capitalize' }}>
                            {ship}
                          </Text>
                          {isUnlocked && (
                            <Text style={{ color: colors.comboText, fontSize: 14, fontWeight: 'bold' }}>✓ OWNED</Text>
                          )}
                        </View>

                        {/* Ship Stats */}
                        <View style={{ marginBottom: 12, gap: 4 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Speed</Text>
                            <Text style={{ color: colors.textPrimary, fontSize: 12 }}>{(shipStats.speed * 100).toFixed(0)}%</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Fire Rate</Text>
                            <Text style={{ color: colors.textPrimary, fontSize: 12 }}>{(shipStats.fireRate * 100).toFixed(0)}%</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Damage</Text>
                            <Text style={{ color: colors.textPrimary, fontSize: 12 }}>{(shipStats.damage * 100).toFixed(0)}%</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Hull</Text>
                            <Text style={{ color: colors.textPrimary, fontSize: 12 }}>{shipStats.hull}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Special</Text>
                            <Text style={{ color: colors.comboText, fontSize: 12 }}>{shipStats.special}</Text>
                          </View>
                        </View>

                        {/* Price and Purchase Button */}
                        {!isUnlocked && (
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>
                              💰 {cost} Credits
                            </Text>
                            <Pressable
                              style={{
                                backgroundColor: colors.buttonPrimary,
                                borderRadius: 8,
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                              }}
                              onPress={() => {
                                setSelectedShipForPurchase(ship)
                                setShowPurchaseConfirm(true)
                              }}
                            >
                              <Text style={{ color: colors.buttonText, fontSize: 14, fontWeight: 'bold' }}>
                                PURCHASE
                              </Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    )
                  })}
                </View>
              </ScrollView>

              <Pressable
                style={{
                  backgroundColor: colors.buttonPrimary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  marginTop: 16,
                }}
                onPress={() => setShowShop(false)}
              >
                <Text style={{ color: colors.buttonText, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                  CLOSE
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Purchase Confirmation Modal */}
      {showPurchaseConfirm && selectedShipForPurchase && (
        <Modal visible={true} transparent animationType="fade">
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.modalOverlay }}>
            <View style={{
              backgroundColor: colors.panelBg,
              borderWidth: 2,
              borderColor: colors.buttonPrimary,
              borderRadius: 16,
              padding: 24,
              marginHorizontal: 24,
              width: 340,
            }}>
              <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                Confirm Purchase
              </Text>

              <Text style={{ color: colors.textSecondary, fontSize: 16, marginBottom: 16, textAlign: 'center', textTransform: 'capitalize' }}>
                {selectedShipForPurchase}
              </Text>

              {/* Ship Stats */}
              <View style={{
                backgroundColor: colors.buttonSecondary,
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                gap: 4,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Speed</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 12 }}>{(SHIP_STATS[selectedShipForPurchase].speed * 100).toFixed(0)}%</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Fire Rate</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 12 }}>{(SHIP_STATS[selectedShipForPurchase].fireRate * 100).toFixed(0)}%</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Damage</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 12 }}>{(SHIP_STATS[selectedShipForPurchase].damage * 100).toFixed(0)}%</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Hull</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 12 }}>{SHIP_STATS[selectedShipForPurchase].hull}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Special</Text>
                  <Text style={{ color: colors.comboText, fontSize: 12 }}>{SHIP_STATS[selectedShipForPurchase].special}</Text>
                </View>
              </View>

              {/* Price Display */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 16,
                paddingHorizontal: 8,
              }}>
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Your Credits:</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' }}>{upgradesCredits}</Text>
              </View>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 20,
                paddingHorizontal: 8,
              }}>
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Cost:</Text>
                <Text style={{ color: colors.comboText, fontSize: 14, fontWeight: 'bold' }}>💰 {SHIP_COSTS[selectedShipForPurchase]}</Text>
              </View>

              {/* Insufficient credits warning */}
              {upgradesCredits < SHIP_COSTS[selectedShipForPurchase] && (
                <Text style={{ color: colors.enemyShip, fontSize: 14, marginBottom: 16, textAlign: 'center', fontWeight: 'bold' }}>
                  ⚠️ Insufficient Credits
                </Text>
              )}

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  style={{
                    flex: 1,
                    backgroundColor: colors.buttonSecondary,
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                  }}
                  onPress={handleCancelPurchase}
                >
                  <Text style={{ color: colors.textPrimary, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                    CANCEL
                  </Text>
                </Pressable>
                <Pressable
                  style={{
                    flex: 1,
                    backgroundColor: upgradesCredits >= SHIP_COSTS[selectedShipForPurchase] ? colors.buttonPrimary : colors.panelBorder,
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    opacity: upgradesCredits >= SHIP_COSTS[selectedShipForPurchase] ? 1 : 0.5,
                  }}
                  onPress={handleConfirmPurchase}
                  disabled={upgradesCredits < SHIP_COSTS[selectedShipForPurchase]}
                >
                  <Text style={{ color: colors.buttonText, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                    CONFIRM
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

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
