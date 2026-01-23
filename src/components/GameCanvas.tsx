import React, { useMemo } from "react"
import { Canvas, Group, Path, Circle, Line, Text, Skia, vec, matchFont, Rect } from "@shopify/react-native-skia"
import { Platform } from "react-native"
import type { Asteroid, Enemy, Vec2, PowerUp, ActivePowerUp, ComboState, Boss, HomingMissile, EnemyType } from "../types/game"
import type { ThemeColors } from "../theme/types"
import { fromAngle } from "../utils/vectorMath"

interface GameCanvasProps {
  width: number
  height: number
  player: { pos: Vec2; ang: number; inv: number; hp: number; shipType: string; specialCooldown: number; specialReady: boolean }
  asteroids: Asteroid[]
  enemies: Enemy[]
  bullets: Array<{ pos: Vec2; vel: Vec2; friendly: boolean }>
  particles: Array<{ pos: Vec2; color: string; life: number }>
  powerUps: PowerUp[]
  activePowerUps: ActivePowerUp[]
  combo: ComboState
  time: number
  thrusting: boolean
  score: number
  credits?: number
  wave: number
  lives: number
  colors: ThemeColors
  shakeOffset?: Vec2
  hasShield?: boolean
  boss?: Boss | null
  bossWarning?: boolean
  homingMissiles?: HomingMissile[]
  showRadar?: boolean
  timeWarpActive?: boolean
}

// Helper to get power-up color from theme
const getPowerUpColor = (type: string, colors: ThemeColors): string => {
  switch (type) {
    case 'shield': return colors.powerUpShield
    case 'rapid_fire': return colors.powerUpRapidFire
    case 'spread_shot': return colors.powerUpSpreadShot
    case 'magnet': return colors.powerUpMagnet
    default: return colors.particle
  }
}

// Enemy colors by type
const getEnemyColor = (type: EnemyType, colors: ThemeColors): string => {
  switch (type) {
    case 'scout': return colors.enemyShip
    case 'tank': return '#ff6666'
    case 'sniper': return '#9966ff'
    case 'bomber': return '#ff9933'
    default: return colors.enemyShip
  }
}

const POWERUP_ICONS: Record<string, string> = {
  shield: '🛡',
  rapid_fire: '🔥',
  spread_shot: '💥',
  magnet: '🧲',
}

const GameCanvasComponent: React.FC<GameCanvasProps> = ({
  width,
  height,
  player,
  asteroids,
  enemies,
  bullets,
  particles,
  powerUps,
  activePowerUps,
  combo,
  time,
  thrusting,
  score,
  credits = 0,
  wave,
  lives,
  colors,
  shakeOffset = { x: 0, y: 0 },
  hasShield = false,
  boss = null,
  bossWarning = false,
  homingMissiles = [],
  showRadar = true,
  timeWarpActive = false,
}) => {
  // Background stars
  const stars = useMemo(() => {
    const starArray = []
    for (let i = 0; i < 40; i++) {
      starArray.push({
        x: (i * 97) % width,
        baseY: i * 57,
      })
    }
    return starArray
  }, [width, height])

  // Parallax Layer 1: Distant stars (slowest, 0.25x speed) - optimized
  const distantStars = React.useMemo(() => {
    const starArray = []
    for (let i = 0; i < 50; i++) {
      starArray.push({
        x: (i * 127) % width,
        baseY: i * 91,
        size: 0.3 + (i % 3) * 0.25, // Tiny, subtle stars: 0.3-0.8
      })
    }
    return starArray
  }, [width, height])

  // Parallax Layer 2: Nebula/dust particles (medium speed, 0.65x) - optimized
  const nebulaParticles = React.useMemo(() => {
    const particles = []
    for (let i = 0; i < 25; i++) {
      particles.push({
        x: (i * 163) % width,
        baseY: i * 107,
        size: 4 + (i % 5) * 2.5, // Wispy nebula clouds: 4-14.5
        opacity: 0.12 + (i % 5) * 0.04, // Very subtle, atmospheric: 0.12-0.28
      })
    }
    return particles
  }, [width, height])

  // Parallax Layer 3: Close debris (fastest, 1.3x speed) - optimized
  const closeDebris = React.useMemo(() => {
    const debris = []
    for (let i = 0; i < 15; i++) {
      debris.push({
        x: (i * 193) % width,
        baseY: i * 149,
        baseRotation: i * 41,
        size: 2.5 + (i % 5) * 1.8, // Prominent foreground debris: 2.5-9.7
      })
    }
    return debris
  }, [width, height])

  // Memoized ship path
  const shipPath = useMemo(() => {
    const path = Skia.Path.Make()
    path.moveTo(18, 0)
    path.lineTo(-14, 10)
    path.lineTo(-10, 4)
    path.lineTo(-18, 0)
    path.lineTo(-10, -4)
    path.lineTo(-14, -10)
    path.close()
    return path
  }, [])

  // Memoized tank path
  const tankPath = useMemo(() => {
    const path = Skia.Path.Make()
    path.moveTo(20, 0)
    path.lineTo(-8, 14)
    path.lineTo(-16, 8)
    path.lineTo(-20, 0)
    path.lineTo(-16, -8)
    path.lineTo(-8, -14)
    path.close()
    return path
  }, [])

  // Memoized sniper path
  const sniperPath = useMemo(() => {
    const path = Skia.Path.Make()
    path.moveTo(24, 0)
    path.lineTo(-12, 6)
    path.lineTo(-20, 0)
    path.lineTo(-12, -6)
    path.close()
    return path
  }, [])

  // Memoized bomber path
  const bomberPath = useMemo(() => {
    const path = Skia.Path.Make()
    path.moveTo(14, 0)
    path.lineTo(4, 12)
    path.lineTo(-10, 10)
    path.lineTo(-14, 0)
    path.lineTo(-10, -10)
    path.lineTo(4, -12)
    path.close()
    return path
  }, [])

  // Memoized boss paths
  const bossPaths = useMemo(() => ({
    destroyer: (() => {
      const path = Skia.Path.Make()
      path.moveTo(0, -50)
      path.lineTo(40, -20)
      path.lineTo(50, 30)
      path.lineTo(20, 50)
      path.lineTo(-20, 50)
      path.lineTo(-50, 30)
      path.lineTo(-40, -20)
      path.close()
      return path
    })(),
    carrier: (() => {
      const path = Skia.Path.Make()
      path.moveTo(0, -45)
      path.lineTo(60, -15)
      path.lineTo(55, 40)
      path.lineTo(0, 55)
      path.lineTo(-55, 40)
      path.lineTo(-60, -15)
      path.close()
      return path
    })(),
    dreadnought: (() => {
      const path = Skia.Path.Make()
      path.moveTo(0, -60)
      path.lineTo(50, -30)
      path.lineTo(70, 10)
      path.lineTo(45, 55)
      path.lineTo(0, 65)
      path.lineTo(-45, 55)
      path.lineTo(-70, 10)
      path.lineTo(-50, -30)
      path.close()
      return path
    })(),
    default: (() => {
      const path = Skia.Path.Make()
      path.addCircle(0, 0, 40)
      return path
    })(),
  }), [])

  // Memoized asteroid path templates (3 shape variants for variety)
  const asteroidPaths = useMemo(() => {
    const createAsteroidTemplate = (variant: number) => {
      const path = Skia.Path.Make()
      const baseRadius = 1 // Unit circle, will be scaled
      for (let i = 0; i < 10; i++) {
        const t = (i / 10) * Math.PI * 2
        // Use variant to create different shapes
        const rr = baseRadius * (0.75 + Math.sin(t * 3 + variant * 0.7) * 0.15)
        const p = fromAngle(t, rr)
        if (i === 0) {
          path.moveTo(p.x, p.y)
        } else {
          path.lineTo(p.x, p.y)
        }
      }
      path.close()
      return path
    }

    return [
      createAsteroidTemplate(0),
      createAsteroidTemplate(1),
      createAsteroidTemplate(2),
    ]
  }, [])

  // Get cached asteroid path by variant
  const getAsteroidPath = (asteroid: Asteroid) => {
    // Use asteroid angle to select a variant (0, 1, or 2)
    const variant = Math.floor(Math.abs(asteroid.ang * 10)) % 3
    return asteroidPaths[variant]
  }

  const getEnemyPath = (type: EnemyType) => {
    switch (type) {
      case 'tank': return tankPath
      case 'sniper': return sniperPath
      case 'bomber': return bomberPath
      default: return shipPath
    }
  }

  const getBossPath = (type: string) => {
    return bossPaths[type as keyof typeof bossPaths] || bossPaths.default
  }

  const blink = player.inv > 0 && Math.floor(time * 10) % 2 === 0

  // Memoized fonts for HUD text
  const hudFont = useMemo(() => matchFont({
    fontFamily: Platform.select({ ios: "Courier", android: "monospace", default: "monospace" }),
    fontSize: 14,
  }), [])

  const comboFont = useMemo(() => matchFont({
    fontFamily: Platform.select({ ios: "Courier", android: "monospace", default: "monospace" }),
    fontSize: 20,
  }), [])

  const smallFont = useMemo(() => matchFont({
    fontFamily: Platform.select({ ios: "Courier", android: "monospace", default: "monospace" }),
    fontSize: 10,
  }), [])

  const bossFont = useMemo(() => matchFont({
    fontFamily: Platform.select({ ios: "Courier", android: "monospace", default: "monospace" }),
    fontSize: 16,
  }), [])

  // Memoized color palette - prevents recreation of derived colors every render
  const colorPalette = useMemo(() => ({
    // Power-up colors
    powerUp: {
      shield: colors.powerUpShield,
      rapid_fire: colors.powerUpRapidFire,
      spread_shot: colors.powerUpSpreadShot,
      magnet: colors.powerUpMagnet,
    },
    // Enemy colors
    enemy: {
      scout: colors.enemyShip,
      tank: '#ff6666',
      sniper: '#9966ff',
      bomber: '#ff9933',
      default: colors.enemyShip,
    },
    // Enemy fill colors with transparency
    enemyFill: {
      scout: colors.enemyShip + '20',
      tank: '#ff666620',
      sniper: '#9966ff20',
      bomber: '#ff993320',
      default: colors.enemyShip + '20',
    },
    // Boss phase colors
    boss: {
      phase1: '#ff9900',
      phase2: '#ff6600',
      phase3: '#ff0000',
    },
  }), [colors])

  // Memoized radar dimensions
  const radarDimensions = useMemo(() => ({
    size: 80,
    x: width - 80 - 12,
    y: height - 80 - 60,
    scale: Math.min(width, height) / 80,
  }), [width, height])

  return (
    <Canvas style={{ width, height, backgroundColor: colors.background }}>
      <Group transform={[{ translateX: shakeOffset.x }, { translateY: shakeOffset.y }]}>
        {/* Time warp effect overlay */}
        {timeWarpActive && (
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            color="rgba(100, 150, 255, 0.1)"
          />
        )}

        {/* Parallax Layer 1: Distant stars (furthest back, slowest 0.25x) */}
        {distantStars.map((star, i) => (
          <Circle
            key={`distant-${i}`}
            cx={star.x}
            cy={(star.baseY + time * 2.0) % height}
            r={star.size}
            color={colors.parallaxDistantStars}
            opacity={0.25}
          />
        ))}

        {/* Parallax Layer 2: Nebula/dust particles (medium depth, 0.65x) */}
        {nebulaParticles.map((particle, i) => (
          <Circle
            key={`nebula-${i}`}
            cx={particle.x}
            cy={(particle.baseY + time * 5.2) % height}
            r={particle.size}
            color={colors.parallaxNebula}
            opacity={particle.opacity}
          />
        ))}

        {/* Background stars (standard speed) */}
        {stars.map((star, i) => (
          <Circle
            key={i}
            cx={star.x}
            cy={(star.baseY + time * 8) % height}
            r={1}
            color={colors.stars}
          />
        ))}

        {/* Parallax Layer 3: Close debris (closest to foreground, fastest 1.3x) */}
        {closeDebris.map((debris, i) => (
          <Group
            key={`debris-${i}`}
            transform={[
              { translateX: debris.x },
              { translateY: (debris.baseY + time * 10.4) % height },
              { rotate: ((debris.baseRotation + time * 0.5) % 360) * (Math.PI / 180) },
            ]}
          >
            <Circle
              cx={0}
              cy={0}
              r={debris.size}
              color={colors.parallaxDebris}
              opacity={0.4}
            />
          </Group>
        ))}

        {/* Particles */}
        {particles.map((p, i) => (
          <Circle
            key={`particle-${i}`}
            cx={p.pos.x}
            cy={p.pos.y}
            r={1}
            color={p.color}
            opacity={Math.max(0, Math.min(1, p.life))}
          />
        ))}

        {/* Power-ups */}
        {powerUps.map((p, i) => {
          const pulseScale = 1 + Math.sin(time * 5) * 0.15
          const powerUpColor = colorPalette.powerUp[p.type as keyof typeof colorPalette.powerUp] || colors.particle
          return (
            <Group key={`powerup-${i}`} transform={[{ translateX: p.pos.x }, { translateY: p.pos.y }]}>
              {/* Outer glow */}
              <Circle
                cx={0}
                cy={0}
                r={18 * pulseScale}
                color={powerUpColor}
                opacity={0.3}
              />
              {/* Inner circle */}
              <Circle
                cx={0}
                cy={0}
                r={12 * pulseScale}
                color={powerUpColor}
                style="stroke"
                strokeWidth={2}
              />
              <Circle
                cx={0}
                cy={0}
                r={8 * pulseScale}
                color={powerUpColor}
                opacity={0.6}
              />
            </Group>
          )
        })}

        {/* Asteroids */}
        {asteroids.map((a, i) => (
          <Group key={`asteroid-${i}`} transform={[{ translateX: a.pos.x }, { translateY: a.pos.y }, { rotate: a.ang }, { scale: a.radius }]}>
            <Path
              path={getAsteroidPath(a)}
              color={colors.asteroid}
              style="stroke"
              strokeWidth={2 / a.radius}
            />
          </Group>
        ))}

        {/* Enemies with type-specific rendering */}
        {enemies.map((e, i) => {
          const enemyColor = colorPalette.enemy[e.type] || colorPalette.enemy.default
          const enemyFillColor = colorPalette.enemyFill[e.type] || colorPalette.enemyFill.default
          const hpPercent = e.hp / e.maxHp
          const isStunned = (e.stunDuration ?? 0) > 0

          return (
            <Group
              key={`enemy-${i}`}
              transform={[{ translateX: e.pos.x }, { translateY: e.pos.y }, { rotate: e.ang }]}
            >
              {/* Stun effect */}
              {isStunned && (
                <>
                  <Circle
                    cx={0}
                    cy={0}
                    r={26 + Math.sin(time * 8) * 3}
                    color="#00d4ff"
                    style="stroke"
                    strokeWidth={2}
                    opacity={0.7 + Math.sin(time * 6) * 0.2}
                  />
                  <Circle
                    cx={0}
                    cy={0}
                    r={30 + Math.sin(time * 8) * 3}
                    color="#00d4ff"
                    opacity={0.15}
                  />
                </>
              )}

              {/* Enemy ship */}
              <Path
                path={getEnemyPath(e.type)}
                color={enemyFillColor}
                style="fill"
              />
              <Path
                path={getEnemyPath(e.type)}
                color={enemyColor}
                style="stroke"
                strokeWidth={2}
              />

              {/* Health bar for tanks and damaged enemies */}
              {(e.type === 'tank' || hpPercent < 1) && (
                <Group transform={[{ rotate: -e.ang }]}>
                  <Rect x={-15} y={-25} width={30} height={4} color={colors.panelBorder} />
                  <Rect x={-15} y={-25} width={30 * hpPercent} height={4} color={enemyColor} />
                </Group>
              )}
            </Group>
          )
        })}

        {/* Boss */}
        {boss && (
          <Group transform={[{ translateX: boss.pos.x }, { translateY: boss.pos.y }]}>
            {/* Stun effect - shown when boss is stunned */}
            {(boss.stunDuration ?? 0) > 0 && (
              <>
                <Circle
                  cx={0}
                  cy={0}
                  r={80 + Math.sin(time * 8) * 4}
                  color="#00d4ff"
                  style="stroke"
                  strokeWidth={3}
                  opacity={0.7 + Math.sin(time * 6) * 0.2}
                />
                <Circle
                  cx={0}
                  cy={0}
                  r={90 + Math.sin(time * 8) * 4}
                  color="#00d4ff"
                  opacity={0.15}
                />
              </>
            )}

            {/* Boss glow based on phase */}
            <Circle
              cx={0}
              cy={0}
              r={70 + Math.sin(time * 3) * 5}
              color={boss.phase === 3 ? colorPalette.boss.phase3 : boss.phase === 2 ? colorPalette.boss.phase2 : colorPalette.boss.phase1}
              opacity={0.2}
            />

            {/* Boss body */}
            <Path
              path={getBossPath(boss.type)}
              color={colors.enemyShipFill}
              style="fill"
            />
            <Path
              path={getBossPath(boss.type)}
              color={colors.enemyShip}
              style="stroke"
              strokeWidth={3}
            />

            {/* Boss core - intensifies when charging special */}
            <Circle
              cx={0}
              cy={10}
              r={15 + Math.sin(time * 5) * 2}
              color={boss.phase === 3 ? colorPalette.boss.phase3 : boss.phase === 2 ? colorPalette.boss.phase2 : colors.enemyShip}
              opacity={0.8}
            />

            {/* Boss health bar */}
            <Rect x={-60} y={-70} width={120} height={8} color={colors.panelBorder} />
            <Rect x={-60} y={-70} width={120 * (boss.hp / boss.maxHp)} height={8} color="#ff4444" />

            {/* Phase indicators */}
            {[1, 2, 3].map((phase) => (
              <Circle
                key={phase}
                cx={-20 + phase * 20}
                cy={-80}
                r={4}
                color={boss.phase >= phase ? '#ff4444' : colors.panelBorder}
              />
            ))}
          </Group>
        )}

        {/* Boss warning overlay */}
        {bossWarning && !boss && (
          <>
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              color="rgba(255, 0, 0, 0.1)"
            />
            <Text
              x={width / 2 - 80}
              y={height / 2 - 20}
              text="⚠️ BOSS INCOMING ⚠️"
              color="#ff4444"
              font={bossFont}
            />
          </>
        )}

        {/* Homing missiles */}
        {homingMissiles.map((m, i) => (
          <Group key={`missile-${i}`} transform={[{ translateX: m.pos.x }, { translateY: m.pos.y }]}>
            <Circle cx={0} cy={0} r={4} color="#ffaa00" />
            <Circle cx={0} cy={0} r={8} color="#ffaa00" opacity={0.3} />
          </Group>
        ))}

        {/* Player ship */}
        {!blink && (
          <Group
            transform={[
              { translateX: player.pos.x },
              { translateY: player.pos.y },
              { rotate: player.ang },
            ]}
          >
            {/* Shield effect */}
            {hasShield && (
              <Circle
                cx={0}
                cy={0}
                r={28 + Math.sin(time * 8) * 3}
                color={colors.powerUpShield}
                style="stroke"
                strokeWidth={2}
                opacity={0.6 + Math.sin(time * 4) * 0.2}
              />
            )}
            <Path
              path={shipPath}
              color={colors.playerShipFill}
              style="fill"
            />
            <Path
              path={shipPath}
              color={colors.playerShip}
              style="stroke"
              strokeWidth={2}
            />
            <Circle cx={2} cy={0} r={3.5} color={colors.playerShip} style="stroke" strokeWidth={2} />
            {/* Thruster flame */}
            {thrusting && (
              <Line
                p1={vec(-18, 0)}
                p2={vec(-28 - (Math.sin(time * 20) * 4 + 4), 0)}
                color={colors.thrusterFlame}
                strokeWidth={2}
              />
            )}
          </Group>
        )}

        {/* Bullets */}
        {bullets.map((b, i) => {
          const len = 6
          const dx = b.vel.x / Math.hypot(b.vel.x, b.vel.y) * len
          const dy = b.vel.y / Math.hypot(b.vel.x, b.vel.y) * len
          const bulletColor = b.friendly ? colors.playerBullet : colors.enemyBullet
          return (
            <Line
              key={`bullet-${i}`}
              p1={vec(b.pos.x, b.pos.y)}
              p2={vec(b.pos.x - dx, b.pos.y - dy)}
              color={bulletColor}
              strokeWidth={2}
            />
          )
        })}

        {/* HUD - Score and Credits */}
        <Text x={16} y={24} text={`Score: ${score}`} color={colors.hudText} font={hudFont} />
        <Text x={16} y={44} text={`Wave: ${wave}`} color={colors.hudText} font={hudFont} />
        <Text x={16} y={64} text={`Credits: ${credits}`} color={colors.comboText} font={hudFont} />

        {/* HUD - Combo counter */}
        {combo.count > 0 && (
          <>
            <Text
              x={width / 2 - 40}
              y={80}
              text={`${combo.count}x COMBO`}
              color={colors.comboText}
              font={comboFont}
            />
            {combo.multiplier > 1 && (
              <Text
                x={width / 2 - 30}
                y={100}
                text={`${combo.multiplier}x multiplier`}
                color={colors.comboText}
                font={hudFont}
              />
            )}
          </>
        )}

        {/* HUD - Active power-ups */}
        {activePowerUps.map((p, i) => {
          const activePowerUpColor = colorPalette.powerUp[p.type as keyof typeof colorPalette.powerUp] || colors.particle
          const barWidth = (p.duration / 8) * 60 // 8 seconds max duration
          return (
            <Group key={`active-powerup-${i}`} transform={[{ translateX: width - 80 }, { translateY: 60 + i * 24 }]}>
              {/* Power-up indicator */}
              <Circle cx={0} cy={0} r={8} color={activePowerUpColor} opacity={0.8} />
              {/* Duration bar background */}
              <Path
                path={Skia.Path.Make().addRect(Skia.XYWHRect(12, -4, 60, 8))}
                color={colors.panelBorder}
                style="fill"
              />
              {/* Duration bar fill */}
              <Path
                path={Skia.Path.Make().addRect(Skia.XYWHRect(12, -4, barWidth, 8))}
                color={activePowerUpColor}
                style="fill"
              />
            </Group>
          )
        })}

        {/* Special ability cooldown indicator */}
        <Group transform={[{ translateX: width - 50 }, { translateY: height - 100 }]}>
          <Circle
            cx={0}
            cy={0}
            r={20}
            color={player.specialReady ? colors.buttonPrimary : colors.panelBorder}
            style="stroke"
            strokeWidth={3}
          />
          {!player.specialReady && (
            <>
              {/* Cooldown arc */}
              <Circle
                cx={0}
                cy={0}
                r={16}
                color={colors.buttonPrimary}
                opacity={0.3}
              />
            </>
          )}
          <Text
            x={-4}
            y={4}
            text={player.specialReady ? "⚡" : `${Math.ceil(player.specialCooldown)}`}
            color={player.specialReady ? colors.buttonPrimary : colors.textMuted}
            font={hudFont}
          />
        </Group>

        {/* Mini-map / Radar */}
        {showRadar && (
          <Group transform={[{ translateX: radarDimensions.x }, { translateY: radarDimensions.y }]}>
            {/* Radar background */}
            <Rect x={0} y={0} width={radarDimensions.size} height={radarDimensions.size} color={colors.panelBg} opacity={0.7} />
            <Rect x={0} y={0} width={radarDimensions.size} height={radarDimensions.size} color={colors.panelBorder} style="stroke" strokeWidth={1} />

            {/* Player dot (center) */}
            <Circle
              cx={player.pos.x / radarDimensions.scale}
              cy={player.pos.y / radarDimensions.scale}
              r={3}
              color={colors.playerShip}
            />

            {/* Enemy dots */}
            {enemies.map((e, i) => (
              <Circle
                key={`radar-enemy-${i}`}
                cx={e.pos.x / radarDimensions.scale}
                cy={e.pos.y / radarDimensions.scale}
                r={2}
                color={colorPalette.enemy[e.type] || colorPalette.enemy.default}
              />
            ))}

            {/* Boss dot */}
            {boss && (
              <Circle
                cx={boss.pos.x / radarDimensions.scale}
                cy={boss.pos.y / radarDimensions.scale}
                r={4}
                color="#ff0000"
              />
            )}

            {/* Asteroid dots */}
            {asteroids.map((a, i) => (
              <Circle
                key={`radar-asteroid-${i}`}
                cx={a.pos.x / radarDimensions.scale}
                cy={a.pos.y / radarDimensions.scale}
                r={1}
                color={colors.asteroid}
                opacity={0.6}
              />
            ))}

            {/* Power-up dots */}
            {powerUps.map((p, i) => (
              <Circle
                key={`radar-powerup-${i}`}
                cx={p.pos.x / radarDimensions.scale}
                cy={p.pos.y / radarDimensions.scale}
                r={2}
                color={colorPalette.powerUp[p.type as keyof typeof colorPalette.powerUp] || colors.particle}
              />
            ))}
          </Group>
        )}

        {/* HUD - Hull bar */}
        <Text x={16} y={height - 36} text="Hull" color={colors.hudText} font={hudFont} />
        <Path
          path={Skia.Path.Make().addRect(Skia.XYWHRect(60, height - 48, 160, 12))}
          color={colors.hullBarBg}
          style="stroke"
          strokeWidth={2}
        />
        <Path
          path={Skia.Path.Make().addRect(Skia.XYWHRect(60, height - 48, 1.6 * Math.max(0, Math.min(100, player.hp)), 12))}
          color={colors.hullBar}
          style="fill"
        />

        {/* HUD - Lives (small ships) */}
        {Array.from({ length: lives }).map((_, i) => (
          <Group
            key={`life-${i}`}
            transform={[
              { translateX: width - 28 - i * 24 },
              { translateY: 34 },
              { rotate: -Math.PI / 2 },
            ]}
          >
            <Path
              path={shipPath}
              color={colors.playerShipFill}
              style="fill"
            />
            <Path
              path={shipPath}
              color={colors.playerShip}
              style="stroke"
              strokeWidth={2}
            />
          </Group>
        ))}
      </Group>
    </Canvas>
  )
}

// Memoize component to prevent unnecessary re-renders
export const GameCanvas = React.memo(GameCanvasComponent)
