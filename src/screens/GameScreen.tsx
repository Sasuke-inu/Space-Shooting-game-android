import React, { useEffect, useState, useRef, useCallback } from "react"
import { View, Text, Pressable, Modal, useWindowDimensions, TextInput, Keyboard, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { Audio } from "expo-av"
import { GameCanvas } from "../components/GameCanvas"
import { VirtualControls } from "../components/VirtualControls"
import { Slider, Toggle, StatRow, ThemeSelector, ShipSelector, StatsDisplay, InstructionsModal } from "../components/game-ui"
import { useGameStore, MAX_DT, JOY_DEADZONE } from "../state/gameStore"
import { useHighScoresStore } from "../state/highScoresStore"
import { useSettingsStore, useThemeColors } from "../theme/themeStore"
import { useStatisticsStore, useAchievementStore, useUpgradesStore } from "../state/progressStore"
import { themeList } from "../theme/themes"
import type { ThemeId } from "../theme/types"
import type { ShipType } from "../types/game"
import { SHIP_STATS, ACHIEVEMENTS } from "../types/game"
import { useGameEngine } from "../utils/gameEngine"
import { len, angleOf, nor, mul, v } from "../utils/vectorMath"
import type { Vec2 } from "../types/game"

export default function GameScreen() {
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const { updateGame, fireOnce } = useGameEngine()

  // Theme
  const colors = useThemeColors()
  const themeId = useSettingsStore((s) => s.themeId)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const joystickSensitivity = useSettingsStore((s) => s.joystickSensitivity)
  const setJoystickSensitivity = useSettingsStore((s) => s.setJoystickSensitivity)
  const autoFire = useSettingsStore((s) => s.autoFire)
  const setAutoFire = useSettingsStore((s) => s.setAutoFire)
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled)
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled)
  const musicVolume = useSettingsStore((s) => s.musicVolume)
  const setMusicVolume = useSettingsStore((s) => s.setMusicVolume)
  const sfxVolume = useSettingsStore((s) => s.sfxVolume)
  const setSfxVolume = useSettingsStore((s) => s.setSfxVolume)

  // Game state
  const paused = useGameStore((s) => s.paused)
  const score = useGameStore((s) => s.score)
  const credits = useGameStore((s) => s.credits)
  const lives = useGameStore((s) => s.lives)
  const wave = useGameStore((s) => s.wave)
  const player = useGameStore((s) => s.player)
  const playerAng = useGameStore((s) => s.player.ang)
  const bullets = useGameStore((s) => s.bullets)
  const asteroids = useGameStore((s) => s.asteroids)
  const enemies = useGameStore((s) => s.enemies)
  const particles = useGameStore((s) => s.particles)
  const time = useGameStore((s) => s.time)
  const powerUps = useGameStore((s) => s.powerUps)
  const activePowerUps = useGameStore((s) => s.activePowerUps)
  const combo = useGameStore((s) => s.combo)
  const getShakeOffset = useGameStore((s) => s.getShakeOffset)
  const hasPowerUp = useGameStore((s) => s.hasPowerUp)
  const boss = useGameStore((s) => s.boss)
  const bossWarning = useGameStore((s) => s.bossWarning)
  const homingMissiles = useGameStore((s) => s.homingMissiles)
  const timeWarpActive = useGameStore((s) => s.timeWarpActive)
  const activateSpecialAbility = useGameStore((s) => s.activateSpecialAbility)
  const setShipType = useGameStore((s) => s.setShipType)
  const spawnHomingMissiles = useGameStore((s) => s.spawnHomingMissiles)
  const setTimeWarp = useGameStore((s) => s.setTimeWarp)
  const specialAbility = useGameStore((s) => s.specialAbility)
  const stunAllEnemies = useGameStore((s) => s.stunAllEnemies)

  // Progress stores
  const stats = useStatisticsStore((s) => s.stats)
  const recordGameEnd = useStatisticsStore((s) => s.recordGameEnd)
  const achievements = useAchievementStore((s) => s.achievements)
  const recentUnlock = useAchievementStore((s) => s.recentUnlock)
  const clearRecentUnlock = useAchievementStore((s) => s.clearRecentUnlock)
  const unlockedShips = useUpgradesStore((s) => s.unlockedShips)
  const upgradesCredits = useUpgradesStore((s) => s.credits)
  const addUpgradeCredits = useUpgradesStore((s) => s.addCredits)

  const [joystickValue, setJoystickValue] = useState<Vec2>({ x: 0, y: 0 })
  const [swipeImpulse, setSwipeImpulse] = useState<Vec2>({ x: 0, y: 0 })
  const [shakeOffset, setShakeOffset] = useState<Vec2>({ x: 0, y: 0 })
  const lastTimeRef = useRef(Date.now())
  const rafRef = useRef<number | null>(null)
  const initializedRef = useRef(false)
  const fireOnceRef = useRef(false)
  const fireOnceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const soundRef = useRef<Audio.Sound | null>(null)
  const swipeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastAbilityActivationRef = useRef<string | null>(null) // Track last activated ability
  const [showInstructions, setShowInstructions] = useState(true)
  const [showNameInput, setShowNameInput] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showShipSelect, setShowShipSelect] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [playerName, setPlayerName] = useState("")
  const [settingsTab, setSettingsTab] = useState<'general' | 'ship' | 'stats'>('general')

  const highScores = useHighScoresStore((s) => s.scores)
  const isTopFive = useHighScoresStore((s) => s.isTopFive)
  const addScore = useHighScoresStore((s) => s.addScore)

  // Handle special ability effects
  useEffect(() => {
    if (specialAbility?.isActive) {
      // Create unique key to prevent duplicate activations
      const abilityKey = `${specialAbility.type}-${specialAbility.maxCooldown}`

      // Only trigger if this is a new activation
      if (lastAbilityActivationRef.current !== abilityKey) {
        lastAbilityActivationRef.current = abilityKey

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
  }, [specialAbility?.isActive, specialAbility?.type, specialAbility?.maxCooldown])

  // Achievement notification timeout
  useEffect(() => {
    if (recentUnlock) {
      const timer = setTimeout(() => {
        clearRecentUnlock()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [recentUnlock])

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

  // Setup and play background music
  useEffect(() => {
    let isMounted = true

    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        })

        const { sound } = await Audio.Sound.createAsync(
          require("../../assets/music-1762534655955.mp3"),
          { isLooping: true, volume: musicVolume }
        )

        if (isMounted) {
          soundRef.current = sound
          await sound.playAsync()
        }
      } catch (error) {
        console.warn("Failed to load background music:", error)
      }
    }

    setupAudio()

    return () => {
      isMounted = false
      if (soundRef.current) {
        soundRef.current.unloadAsync()
      }
    }
  }, [])

  // Update music volume when changed
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.setVolumeAsync(musicVolume)
    }
  }, [musicVolume])

  // Double tap to activate special ability
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .runOnJS(true)
    .onStart(() => {
      if (paused) return
      if (player.specialReady) {
        activateSpecialAbility()
      }
    })

  // Tap gesture to fire
  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onStart(() => {
      if (paused) return
      if (!fireOnceRef.current && !autoFire) {
        fireOnce()
        fireOnceRef.current = true
        // Clear existing timeout to prevent memory leaks
        if (fireOnceTimeoutRef.current) {
          clearTimeout(fireOnceTimeoutRef.current)
        }
        fireOnceTimeoutRef.current = setTimeout(() => {
          fireOnceRef.current = false
        }, 200)
      }
    })

  // Swipe gesture for ship control
  const swipeGesture = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((event) => {
      if (paused) return

      const swipeX = event.velocityX / 1000
      const swipeY = event.velocityY / 1000
      const swipeMag = Math.sqrt(swipeX * swipeX + swipeY * swipeY)

      if (swipeMag > 0.3) {
        const normalized = nor(v(swipeX, swipeY))
        const impulse = mul(normalized, Math.min(swipeMag * 2, 3))
        setSwipeImpulse(impulse)
      }
    })
    .onEnd(() => {
      // Clear any existing timeout to prevent memory leaks
      if (swipeTimeoutRef.current) {
        clearTimeout(swipeTimeoutRef.current)
      }
      swipeTimeoutRef.current = setTimeout(() => setSwipeImpulse({ x: 0, y: 0 }), 100)
    })

  const combinedGesture = Gesture.Race(doubleTapGesture, Gesture.Simultaneous(tapGesture, swipeGesture))

  // Game loop
  useEffect(() => {
    if (paused) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const loop = () => {
      const now = Date.now()
      const dt = Math.min((now - lastTimeRef.current) / 1000, MAX_DT)
      lastTimeRef.current = now

      // Apply swipe impulse to player velocity
      if (swipeImpulse.x !== 0 || swipeImpulse.y !== 0) {
        const currentVel = player.vel
        const newVel = {
          x: currentVel.x + swipeImpulse.x * 150 * dt,
          y: currentVel.y + swipeImpulse.y * 150 * dt,
        }
        useGameStore.getState().updatePlayer({ vel: newVel })

        const swipeAngle = angleOf(swipeImpulse)
        useGameStore.getState().updatePlayer({ ang: swipeAngle })
      }

      // Calculate thrust and angle from joystick
      const joyMag = len(joystickValue)
      let thrusting = false
      let desiredAng = playerAng

      if (joyMag > JOY_DEADZONE) {
        desiredAng = angleOf(joystickValue)
        thrusting = true

        let da = ((desiredAng - playerAng + Math.PI * 3) % (Math.PI * 2)) - Math.PI
        const turnSpeed = 8
        const newAng = playerAng + Math.max(-1, Math.min(1, da)) * turnSpeed * dt
        useGameStore.getState().updatePlayer({ ang: newAng })
      }

      // Auto-fire support
      const shouldFire = autoFire && joyMag > JOY_DEADZONE

      updateGame(dt, joystickValue, shouldFire, thrusting, colors)

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      // Cleanup timeouts to prevent memory leaks
      if (fireOnceTimeoutRef.current) {
        clearTimeout(fireOnceTimeoutRef.current)
      }
      if (swipeTimeoutRef.current) {
        clearTimeout(swipeTimeoutRef.current)
      }
    }
  }, [paused, joystickValue, playerAng, swipeImpulse, player.vel, fireOnce, updateGame, autoFire, colors])

  const handleRestart = () => {
    const store = useGameStore.getState()
    store.resetGame()
    store.spawnAsteroids(5)
    store.spawnEnemy()
    store.setPaused(false)
  }

  const handleStartGame = () => {
    setShowInstructions(false)
    useGameStore.getState().setPaused(false)
  }

  const handleSubmitScore = () => {
    const name = playerName.trim() || "Anonymous"
    addScore(score, wave, name)

    // Record game end statistics
    const state = useGameStore.getState()
    recordGameEnd(score, wave, time, 0, state.sessionShotsFired, state.sessionShotsHit)

    // Add credits to upgrade store
    addUpgradeCredits(credits)

    setShowNameInput(false)
    setPlayerName("")
    Keyboard.dismiss()
  }

  // Check for game over and show name input if top 5
  useEffect(() => {
    if (paused && lives <= 0 && !showInstructions && !showNameInput) {
      if (isTopFive(score)) {
        const timer = setTimeout(() => {
          setShowNameInput(true)
        }, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [paused, lives, score, showInstructions, showNameInput, isTopFive])

  const handleShipSelect = (ship: ShipType) => {
    if (unlockedShips.includes(ship)) {
      setShipType(ship)
    }
  }

  const joyMag = len(joystickValue)
  const thrusting = joyMag > JOY_DEADZONE

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Achievement unlock notification */}
      {recentUnlock && (
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
          <Text style={{ fontSize: 32 }}>{ACHIEVEMENTS[recentUnlock].icon}</Text>
          <View>
            <Text style={{ color: colors.comboText, fontSize: 12, fontWeight: 'bold' }}>ACHIEVEMENT UNLOCKED</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' }}>{ACHIEVEMENTS[recentUnlock].name}</Text>
          </View>
        </View>
      )}

      {/* Top bar */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: insets.top + 12,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          gap: 8,
          zIndex: 10,
        }}
      >
        <Text style={{ color: colors.hudAccent, fontSize: 16, fontWeight: '600', letterSpacing: 0.5 }}>
          {themeList.find((t) => t.id === themeId)?.name || 'Neon Void'}
        </Text>
        <View style={{ flex: 1 }} />
        <Pressable
          style={{
            backgroundColor: colors.buttonSecondary,
            borderWidth: 1,
            borderColor: colors.panelBorder,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
          onPress={() => setShowSettings(true)}
        >
          <Text style={{ color: colors.hudText, fontSize: 14 }}>⚙️</Text>
        </Pressable>
        <Pressable
          style={{
            backgroundColor: colors.buttonSecondary,
            borderWidth: 1,
            borderColor: colors.panelBorder,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
          onPress={() => useGameStore.getState().setPaused(!paused)}
        >
          <Text style={{ color: colors.hudText, fontSize: 14 }}>{paused ? "Resume" : "Pause"}</Text>
        </Pressable>
        <Pressable
          style={{
            backgroundColor: colors.buttonSecondary,
            borderWidth: 1,
            borderColor: colors.panelBorder,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
          onPress={handleRestart}
        >
          <Text style={{ color: colors.hudText, fontSize: 14 }}>Restart</Text>
        </Pressable>
      </View>

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
          />
        </View>
      </GestureDetector>

      {/* Virtual controls */}
      <VirtualControls
        onJoystickMove={setJoystickValue}
        colors={colors}
        sensitivity={joystickSensitivity}
      />

      {/* Settings Modal */}
      {showSettings && (
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
              <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
                ⚙️ Settings
              </Text>

              {/* Tab buttons */}
              <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
                {(['general', 'ship', 'stats'] as const).map((tab) => (
                  <Pressable
                    key={tab}
                    onPress={() => setSettingsTab(tab)}
                    style={{
                      flex: 1,
                      padding: 8,
                      borderRadius: 8,
                      backgroundColor: settingsTab === tab ? colors.buttonPrimary : colors.buttonSecondary,
                    }}
                  >
                    <Text style={{
                      color: settingsTab === tab ? colors.buttonText : colors.textSecondary,
                      textAlign: 'center',
                      fontSize: 12,
                      fontWeight: 'bold',
                      textTransform: 'capitalize',
                    }}>
                      {tab}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                {settingsTab === 'general' && (
                  <>
                    {/* Theme Section */}
                    <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                      🎨 Theme
                    </Text>
                    <ThemeSelector themeList={themeList} currentThemeId={themeId} onThemeSelect={setTheme} colors={colors} />

                    {/* Audio Section */}
                    <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 12 }}>
                      🔊 Audio
                    </Text>
                    <Slider value={musicVolume} onValueChange={setMusicVolume} label="Music Volume" colors={colors} />
                    <Slider value={sfxVolume} onValueChange={setSfxVolume} label="SFX Volume" colors={colors} />

                    {/* Controls Section */}
                    <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 12 }}>
                      🎮 Controls
                    </Text>
                    <Slider value={joystickSensitivity} onValueChange={setJoystickSensitivity} label="Joystick Sensitivity" colors={colors} />
                    <Toggle value={autoFire} onValueChange={setAutoFire} label="Auto-Fire" colors={colors} />
                    <Toggle value={hapticsEnabled} onValueChange={setHapticsEnabled} label="Haptic Feedback" colors={colors} />
                  </>
                )}

                {settingsTab === 'ship' && (
                  <>
                    <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                      🚀 Select Ship
                    </Text>
                    <ShipSelector currentShip={player.shipType} unlockedShips={unlockedShips} onShipSelect={handleShipSelect} colors={colors} />
                  </>
                )}

                {settingsTab === 'stats' && (
                  <>
                    <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                      📊 Statistics
                    </Text>
                    <Text style={{ color: colors.comboText, fontSize: 14, marginBottom: 12 }}>
                      Total Credits: {upgradesCredits}
                    </Text>
                    <StatsDisplay stats={stats} colors={colors} />
                  </>
                )}
              </ScrollView>

              <Pressable
                style={{
                  backgroundColor: colors.buttonPrimary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  marginTop: 16,
                }}
                onPress={() => setShowSettings(false)}
              >
                <Text style={{ color: colors.buttonText, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                  DONE
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Welcome Instructions Modal */}
      <InstructionsModal visible={showInstructions} onStartGame={handleStartGame} colors={colors} />

      {/* Name Input Modal for Top 5 */}
      {showNameInput && (
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
                🏆 TOP 5 SCORE!
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 18, fontWeight: '600', marginBottom: 16, textAlign: 'center' }}>
                Score: {score}
              </Text>
              <Text style={{ color: colors.comboText, fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
                +{credits} Credits Earned!
              </Text>

              <TextInput
                style={{
                  backgroundColor: colors.buttonSecondary,
                  borderWidth: 1,
                  borderColor: colors.buttonPrimary,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: colors.textPrimary,
                  fontSize: 16,
                  marginBottom: 20,
                }}
                placeholder="Enter your name"
                placeholderTextColor={colors.textMuted}
                value={playerName}
                onChangeText={setPlayerName}
                maxLength={15}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSubmitScore}
              />

              <Pressable
                style={{
                  backgroundColor: colors.buttonPrimary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                }}
                onPress={handleSubmitScore}
              >
                <Text style={{ color: colors.buttonText, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                  SUBMIT
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Pause/Game Over modal */}
      {paused && !showInstructions && !showNameInput && !showSettings && (
        <Modal visible={true} transparent animationType="fade">
          <Pressable
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.modalOverlay,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onPress={lives > 0 ? () => useGameStore.getState().setPaused(false) : undefined}
          >
            <Pressable
              style={{
                backgroundColor: colors.panelBg,
                borderWidth: 2,
                borderColor: colors.panelBorder,
                borderRadius: 16,
                padding: 24,
                marginHorizontal: 24,
                width: 340,
              }}
              onPress={(e) => e.stopPropagation()}
            >
              {lives <= 0 ? (
                <>
                  <Text style={{ color: colors.enemyShip, fontSize: 28, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                    GAME OVER
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 20, fontWeight: '600', marginBottom: 16, textAlign: 'center' }}>
                    Final Score: {score}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
                    Wave {wave} reached
                  </Text>
                  <Text style={{ color: colors.comboText, fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
                    +{credits} Credits Earned!
                  </Text>

                  {/* High Scores Leaderboard */}
                  {highScores.length > 0 && (
                    <View style={{
                      backgroundColor: colors.buttonSecondary,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 20,
                    }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
                        🏆 TOP 5 HIGH SCORES
                      </Text>
                      {highScores.map((hs, index) => (
                        <View
                          key={index}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingVertical: 8,
                            borderBottomWidth: index < highScores.length - 1 ? 1 : 0,
                            borderBottomColor: colors.panelBorder,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: 'bold', width: 24 }}>
                              {index + 1}.
                            </Text>
                            <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                              {hs.name}
                            </Text>
                          </View>
                          <Text style={{ color: colors.comboText, fontSize: 14, fontWeight: '600' }}>
                            {hs.score}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <Pressable
                    style={{
                      backgroundColor: colors.buttonPrimary,
                      borderRadius: 12,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                    }}
                    onPress={handleRestart}
                  >
                    <Text style={{ color: colors.buttonText, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                      PLAY AGAIN
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={{ color: colors.textSecondary, fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
                    GAME PAUSED
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 16, marginBottom: 12, fontWeight: '600' }}>Controls:</Text>
                  <View style={{ marginBottom: 20, gap: 8 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
                      • <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>Joystick:</Text> Move and steer
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
                      • <Text style={{ fontWeight: 'bold', color: colors.textSecondary }}>Tap:</Text> Fire weapons
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
                      • <Text style={{ fontWeight: 'bold', color: colors.comboText }}>Double-Tap:</Text> Special ability
                    </Text>
                  </View>
                  <Pressable
                    style={{
                      backgroundColor: colors.buttonPrimary,
                      borderRadius: 12,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                    }}
                    onPress={() => useGameStore.getState().setPaused(false)}
                  >
                    <Text style={{ color: colors.buttonText, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                      CONTINUE
                    </Text>
                  </Pressable>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  )
}
