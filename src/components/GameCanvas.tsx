import React from "react"
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

export const GameCanvas: React.FC<GameCanvasProps> = ({
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
  const stars = React.useMemo(() => {
    const starArray = []
    for (let i = 0; i < 40; i++) {
      starArray.push({
        x: (i * 97) % width,
        y: ((i * 57 + time * 8) % height),
      })
    }
    return starArray
  }, [width, height, time])

  // Draw ship function
  const createShipPath = () => {
    const path = Skia.Path.Make()
    path.moveTo(18, 0)
    path.lineTo(-14, 10)
    path.lineTo(-10, 4)
    path.lineTo(-18, 0)
    path.lineTo(-10, -4)
    path.lineTo(-14, -10)
    path.close()
    return path
  }

  // Draw tank enemy (larger, bulkier)
  const createTankPath = () => {
    const path = Skia.Path.Make()
    path.moveTo(20, 0)
    path.lineTo(-8, 14)
    path.lineTo(-16, 8)
    path.lineTo(-20, 0)
    path.lineTo(-16, -8)
    path.lineTo(-8, -14)
    path.close()
    return path
  }

  // Draw sniper enemy (thin, elongated)
  const createSniperPath = () => {
    const path = Skia.Path.Make()
    path.moveTo(24, 0)
    path.lineTo(-12, 6)
    path.lineTo(-20, 0)
    path.lineTo(-12, -6)
    path.close()
    return path
  }

  // Draw bomber enemy (round with wings)
  const createBomberPath = () => {
    const path = Skia.Path.Make()
    path.moveTo(14, 0)
    path.lineTo(4, 12)
    path.lineTo(-10, 10)
    path.lineTo(-14, 0)
    path.lineTo(-10, -10)
    path.lineTo(4, -12)
    path.close()
    return path
  }

  // Draw boss path
  const createBossPath = (type: string) => {
    const path = Skia.Path.Make()
    switch (type) {
      case 'destroyer':
        path.moveTo(0, -50)
        path.lineTo(40, -20)
        path.lineTo(50, 30)
        path.lineTo(20, 50)
        path.lineTo(-20, 50)
        path.lineTo(-50, 30)
        path.lineTo(-40, -20)
        path.close()
        break
      case 'carrier':
        path.moveTo(0, -45)
        path.lineTo(60, -15)
        path.lineTo(55, 40)
        path.lineTo(0, 55)
        path.lineTo(-55, 40)
        path.lineTo(-60, -15)
        path.close()
        break
      case 'dreadnought':
        path.moveTo(0, -60)
        path.lineTo(50, -30)
        path.lineTo(70, 10)
        path.lineTo(45, 55)
        path.lineTo(0, 65)
        path.lineTo(-45, 55)
        path.lineTo(-70, 10)
        path.lineTo(-50, -30)
        path.close()
        break
      default:
        path.addCircle(0, 0, 40)
    }
    return path
  }

  // Draw asteroid
  const createAsteroidPath = (a: Asteroid) => {
    const path = Skia.Path.Make()
    const r = a.radius
    for (let i = 0; i < 10; i++) {
      const t = (i / 10) * Math.PI * 2
      const rr = r * (0.75 + Math.sin(t * 3 + a.ang) * 0.15)
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

  const getEnemyPath = (type: EnemyType) => {
    switch (type) {
      case 'tank': return createTankPath()
      case 'sniper': return createSniperPath()
      case 'bomber': return createBomberPath()
      default: return createShipPath()
    }
  }

  const blink = player.inv > 0 && Math.floor(time * 10) % 2 === 0

  // Create fonts for HUD text
  const hudFont = matchFont({
    fontFamily: Platform.select({ ios: "Courier", android: "monospace", default: "monospace" }),
    fontSize: 14,
  })

  const comboFont = matchFont({
    fontFamily: Platform.select({ ios: "Courier", android: "monospace", default: "monospace" }),
    fontSize: 20,
  })

  const smallFont = matchFont({
    fontFamily: Platform.select({ ios: "Courier", android: "monospace", default: "monospace" }),
    fontSize: 10,
  })

  const bossFont = matchFont({
    fontFamily: Platform.select({ ios: "Courier", android: "monospace", default: "monospace" }),
    fontSize: 16,
  })

  // Radar dimensions
  const radarSize = 80
  const radarX = width - radarSize - 12
  const radarY = height - radarSize - 60
  const radarScale = Math.min(width, height) / radarSize

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

        {/* Background stars */}
        {stars.map((star, i) => (
          <Circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={1}
            color={colors.stars}
          />
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
          const powerUpColor = getPowerUpColor(p.type, colors)
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
          <Group key={`asteroid-${i}`} transform={[{ translateX: a.pos.x }, { translateY: a.pos.y }, { rotate: a.ang }]}>
            <Path
              path={createAsteroidPath(a)}
              color={colors.asteroid}
              style="stroke"
              strokeWidth={2}
            />
          </Group>
        ))}

        {/* Enemies with type-specific rendering */}
        {enemies.map((e, i) => {
          const enemyColor = getEnemyColor(e.type, colors)
          const enemyFillColor = enemyColor + '20' // Add transparency
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

              {/* Sniper charge indicator */}
              {e.type === 'sniper' && e.chargeTime && e.chargeTime > 0 && (
                <Circle
                  cx={0}
                  cy={0}
                  r={10 + e.chargeTime * 5}
                  color="#9966ff"
                  style="stroke"
                  strokeWidth={1}
                  opacity={0.5}
                />
              )}

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
              color={boss.phase === 3 ? '#ff0000' : boss.phase === 2 ? '#ff6600' : '#ff9900'}
              opacity={0.2}
            />

            {/* Boss body */}
            <Path
              path={createBossPath(boss.type)}
              color={colors.enemyShipFill}
              style="fill"
            />
            <Path
              path={createBossPath(boss.type)}
              color={colors.enemyShip}
              style="stroke"
              strokeWidth={3}
            />

            {/* Boss core */}
            <Circle
              cx={0}
              cy={10}
              r={15 + Math.sin(time * 5) * 2}
              color={boss.phase === 3 ? '#ff0000' : boss.phase === 2 ? '#ff6600' : colors.enemyShip}
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
              path={createShipPath()}
              color={colors.playerShipFill}
              style="fill"
            />
            <Path
              path={createShipPath()}
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
          const activePowerUpColor = getPowerUpColor(p.type, colors)
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
          <Group transform={[{ translateX: radarX }, { translateY: radarY }]}>
            {/* Radar background */}
            <Rect x={0} y={0} width={radarSize} height={radarSize} color={colors.panelBg} opacity={0.7} />
            <Rect x={0} y={0} width={radarSize} height={radarSize} color={colors.panelBorder} style="stroke" strokeWidth={1} />

            {/* Player dot (center) */}
            <Circle
              cx={player.pos.x / radarScale}
              cy={player.pos.y / radarScale}
              r={3}
              color={colors.playerShip}
            />

            {/* Enemy dots */}
            {enemies.map((e, i) => (
              <Circle
                key={`radar-enemy-${i}`}
                cx={e.pos.x / radarScale}
                cy={e.pos.y / radarScale}
                r={2}
                color={getEnemyColor(e.type, colors)}
              />
            ))}

            {/* Boss dot */}
            {boss && (
              <Circle
                cx={boss.pos.x / radarScale}
                cy={boss.pos.y / radarScale}
                r={4}
                color="#ff0000"
              />
            )}

            {/* Asteroid dots */}
            {asteroids.map((a, i) => (
              <Circle
                key={`radar-asteroid-${i}`}
                cx={a.pos.x / radarScale}
                cy={a.pos.y / radarScale}
                r={1}
                color={colors.asteroid}
                opacity={0.6}
              />
            ))}

            {/* Power-up dots */}
            {powerUps.map((p, i) => (
              <Circle
                key={`radar-powerup-${i}`}
                cx={p.pos.x / radarScale}
                cy={p.pos.y / radarScale}
                r={2}
                color={getPowerUpColor(p.type, colors)}
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
              path={createShipPath()}
              color={colors.playerShipFill}
              style="fill"
            />
            <Path
              path={createShipPath()}
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
