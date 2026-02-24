/**
 * Game Store Unit Tests
 * Tests game state management and actions
 */

import { useGameStore, COMBO_MULTIPLIERS, COMBO_TIMEOUT } from '../state/gameStore'

// Reset store before each test
beforeEach(() => {
  useGameStore.getState().resetGame()
  useGameStore.getState().setDimensions(800, 600)
  // Ensure credits are reset
  useGameStore.setState({ credits: 0 })
})

describe('gameStore', () => {
  // ------------------------------------------------------------------ //
  //                         Initial State
  // ------------------------------------------------------------------ //
  describe('initial state', () => {
    test('has correct initial values', () => {
      const state = useGameStore.getState()
      expect(state.score).toBe(0)
      expect(state.lives).toBe(3)
      expect(state.wave).toBe(1)
      expect(state.time).toBe(0)
      expect(state.paused).toBe(false)
    })

    test('player spawns at center', () => {
      const state = useGameStore.getState()
      expect(state.player.pos.x).toBe(400)
      expect(state.player.pos.y).toBe(300)
    })

    test('starts with empty arrays', () => {
      const state = useGameStore.getState()
      expect(state.bullets).toHaveLength(0)
      expect(state.asteroids).toHaveLength(0)
      expect(state.enemies).toHaveLength(0)
      expect(state.particles).toHaveLength(0)
      expect(state.powerUps).toHaveLength(0)
    })

    test('combo starts at 0', () => {
      const state = useGameStore.getState()
      expect(state.combo.count).toBe(0)
      expect(state.combo.multiplier).toBe(1)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Score Actions
  // ------------------------------------------------------------------ //
  describe('score actions', () => {
    test('addScore increases score', () => {
      useGameStore.getState().addScore(100)
      expect(useGameStore.getState().score).toBe(100)
    })

    test('addScore accumulates', () => {
      useGameStore.getState().addScore(50)
      useGameStore.getState().addScore(30)
      expect(useGameStore.getState().score).toBe(80)
    })

    test('score is multiplied by combo', () => {
      // Build up combo
      for (let i = 0; i < 6; i++) {
        useGameStore.getState().incrementCombo()
      }
      const multiplier = useGameStore.getState().combo.multiplier
      useGameStore.getState().addScore(100)
      expect(useGameStore.getState().score).toBe(Math.floor(100 * multiplier))
    })
  })

  // ------------------------------------------------------------------ //
  //                         Credits Actions
  // ------------------------------------------------------------------ //
  describe('credits actions', () => {
    test('addCredits increases credits', () => {
      useGameStore.getState().addCredits(50)
      expect(useGameStore.getState().credits).toBe(50)
    })

    test('credits accumulate', () => {
      useGameStore.getState().addCredits(25)
      useGameStore.getState().addCredits(25)
      expect(useGameStore.getState().credits).toBe(50)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Wave Actions
  // ------------------------------------------------------------------ //
  describe('wave actions', () => {
    test('nextWave increments wave', () => {
      useGameStore.getState().nextWave()
      expect(useGameStore.getState().wave).toBe(2)
    })

    test('boss warning triggers on wave 5', () => {
      for (let i = 0; i < 4; i++) {
        useGameStore.getState().nextWave()
      }
      expect(useGameStore.getState().wave).toBe(5)
      expect(useGameStore.getState().bossWarning).toBe(true)
    })

    test('boss warning triggers on wave 10', () => {
      useGameStore.setState({ wave: 9 })
      useGameStore.getState().nextWave()
      expect(useGameStore.getState().wave).toBe(10)
      expect(useGameStore.getState().bossWarning).toBe(true)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Life Actions
  // ------------------------------------------------------------------ //
  describe('life actions', () => {
    test('loseLife decrements lives', () => {
      useGameStore.getState().loseLife()
      expect(useGameStore.getState().lives).toBe(2)
    })

    test('loseLife pauses game at 0 lives', () => {
      useGameStore.setState({ lives: 1 })
      useGameStore.getState().loseLife()
      expect(useGameStore.getState().lives).toBe(0)
      expect(useGameStore.getState().paused).toBe(true)
    })

    test('loseLife resets player position', () => {
      useGameStore.getState().updatePlayer({ pos: { x: 100, y: 100 } })
      useGameStore.getState().loseLife()
      expect(useGameStore.getState().player.pos.x).toBe(400)
      expect(useGameStore.getState().player.pos.y).toBe(300)
    })

    test('loseLife clears active power-ups', () => {
      useGameStore.setState({ activePowerUps: [{ type: 'shield', duration: 5 }] })
      useGameStore.getState().loseLife()
      expect(useGameStore.getState().activePowerUps).toHaveLength(0)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Asteroid Actions
  // ------------------------------------------------------------------ //
  describe('asteroid actions', () => {
    test('spawnAsteroids creates asteroids', () => {
      useGameStore.getState().spawnAsteroids(5)
      expect(useGameStore.getState().asteroids).toHaveLength(5)
    })

    test('asteroids have correct tier', () => {
      useGameStore.getState().spawnAsteroids(1)
      expect(useGameStore.getState().asteroids[0].tier).toBe(3)
    })

    test('splitAsteroid creates smaller asteroids', () => {
      useGameStore.getState().spawnAsteroids(1)
      const asteroid = useGameStore.getState().asteroids[0]
      useGameStore.getState().splitAsteroid(asteroid)
      // Should have 2 tier-2 asteroids added
      const asteroids = useGameStore.getState().asteroids
      expect(asteroids.filter(a => a.tier === 2)).toHaveLength(2)
    })

    test('tier-1 asteroid does not split', () => {
      const tier1 = { pos: { x: 100, y: 100 }, vel: { x: 0, y: 0 }, radius: 15, spin: 0, ang: 0, tier: 1 as const, hp: 1 }
      useGameStore.setState({ asteroids: [tier1] })
      useGameStore.getState().splitAsteroid(tier1)
      // No new asteroids added
      expect(useGameStore.getState().asteroids).toHaveLength(1)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Enemy Actions
  // ------------------------------------------------------------------ //
  describe('enemy actions', () => {
    test('spawnEnemy creates enemy', () => {
      useGameStore.getState().spawnEnemy('scout')
      expect(useGameStore.getState().enemies).toHaveLength(1)
      expect(useGameStore.getState().enemies[0].type).toBe('scout')
    })

    test('spawnEnemyWave creates multiple enemies', () => {
      useGameStore.getState().spawnEnemyWave()
      expect(useGameStore.getState().enemies.length).toBeGreaterThan(0)
    })

    test('enemy types spawn based on wave', () => {
      // Early wave - only scouts
      useGameStore.setState({ wave: 1 })
      for (let i = 0; i < 10; i++) {
        useGameStore.getState().spawnEnemy()
      }
      const enemies = useGameStore.getState().enemies
      expect(enemies.every(e => e.type === 'scout')).toBe(true)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Bullet Actions
  // ------------------------------------------------------------------ //
  describe('bullet actions', () => {
    test('addBullet adds bullet', () => {
      useGameStore.getState().addBullet({
        pos: { x: 100, y: 100 },
        vel: { x: 10, y: 0 },
        life: 1,
        friendly: true,
      })
      expect(useGameStore.getState().bullets).toHaveLength(1)
    })

    test('friendly bullet tracks shots fired', () => {
      const before = useGameStore.getState().sessionShotsFired
      useGameStore.getState().addBullet({
        pos: { x: 100, y: 100 },
        vel: { x: 10, y: 0 },
        life: 1,
        friendly: true,
      })
      expect(useGameStore.getState().sessionShotsFired).toBe(before + 1)
    })

    test('enemy bullet does not track shots', () => {
      const before = useGameStore.getState().sessionShotsFired
      useGameStore.getState().addBullet({
        pos: { x: 100, y: 100 },
        vel: { x: 10, y: 0 },
        life: 1,
        friendly: false,
      })
      expect(useGameStore.getState().sessionShotsFired).toBe(before)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Combo Actions
  // ------------------------------------------------------------------ //
  describe('combo actions', () => {
    test('incrementCombo increases count', () => {
      useGameStore.getState().incrementCombo()
      expect(useGameStore.getState().combo.count).toBe(1)
    })

    test('combo multiplier increases at thresholds', () => {
      // 3 kills = 1.5x
      for (let i = 0; i < 3; i++) {
        useGameStore.getState().incrementCombo()
      }
      expect(useGameStore.getState().combo.multiplier).toBe(COMBO_MULTIPLIERS[1])
    })

    test('combo timer is set on increment', () => {
      useGameStore.getState().incrementCombo()
      expect(useGameStore.getState().combo.timer).toBe(COMBO_TIMEOUT)
    })

    test('updateCombo decreases timer', () => {
      useGameStore.getState().incrementCombo()
      useGameStore.getState().updateCombo(0.5)
      expect(useGameStore.getState().combo.timer).toBe(COMBO_TIMEOUT - 0.5)
    })

    test('combo resets when timer expires', () => {
      useGameStore.getState().incrementCombo()
      useGameStore.getState().updateCombo(COMBO_TIMEOUT + 0.1)
      expect(useGameStore.getState().combo.count).toBe(0)
      expect(useGameStore.getState().combo.multiplier).toBe(1)
    })

    test('resetCombo clears combo', () => {
      useGameStore.getState().incrementCombo()
      useGameStore.getState().resetCombo()
      expect(useGameStore.getState().combo.count).toBe(0)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Power-up Actions
  // ------------------------------------------------------------------ //
  describe('power-up actions', () => {
    test('spawnPowerUp creates power-up', () => {
      useGameStore.getState().spawnPowerUp({ x: 100, y: 100 }, 'shield')
      expect(useGameStore.getState().powerUps).toHaveLength(1)
      expect(useGameStore.getState().powerUps[0].type).toBe('shield')
    })

    test('collectPowerUp activates power-up', () => {
      useGameStore.getState().spawnPowerUp({ x: 100, y: 100 }, 'rapid_fire')
      useGameStore.getState().collectPowerUp(0)
      expect(useGameStore.getState().powerUps).toHaveLength(0)
      expect(useGameStore.getState().activePowerUps).toHaveLength(1)
      expect(useGameStore.getState().activePowerUps[0].type).toBe('rapid_fire')
    })

    test('hasPowerUp returns true when active', () => {
      useGameStore.getState().spawnPowerUp({ x: 100, y: 100 }, 'shield')
      useGameStore.getState().collectPowerUp(0)
      expect(useGameStore.getState().hasPowerUp('shield')).toBe(true)
    })

    test('hasPowerUp returns false when not active', () => {
      expect(useGameStore.getState().hasPowerUp('shield')).toBe(false)
    })

    test('updateActivePowerUps decreases duration', () => {
      useGameStore.setState({ activePowerUps: [{ type: 'shield', duration: 5 }] })
      useGameStore.getState().updateActivePowerUps(1)
      expect(useGameStore.getState().activePowerUps[0].duration).toBe(4)
    })

    test('power-up removed when duration expires', () => {
      useGameStore.setState({ activePowerUps: [{ type: 'shield', duration: 0.5 }] })
      useGameStore.getState().updateActivePowerUps(1)
      expect(useGameStore.getState().activePowerUps).toHaveLength(0)
    })

    test('collecting same power-up refreshes duration', () => {
      useGameStore.getState().spawnPowerUp({ x: 100, y: 100 }, 'shield')
      useGameStore.getState().collectPowerUp(0)
      useGameStore.getState().updateActivePowerUps(5) // 3 seconds left
      useGameStore.getState().spawnPowerUp({ x: 200, y: 200 }, 'shield')
      useGameStore.getState().collectPowerUp(0)
      // Should refresh to 8 seconds, not stack
      expect(useGameStore.getState().activePowerUps).toHaveLength(1)
      expect(useGameStore.getState().activePowerUps[0].duration).toBe(8)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Screen Shake Actions
  // ------------------------------------------------------------------ //
  describe('screen shake actions', () => {
    test('triggerShake sets shake state', () => {
      useGameStore.getState().triggerShake(10, 500)
      const shake = useGameStore.getState().screenShake
      expect(shake).not.toBeNull()
      expect(shake!.intensity).toBe(10)
      expect(shake!.duration).toBe(500)
    })

    test('updateShake increases elapsed', () => {
      useGameStore.getState().triggerShake(10, 500)
      useGameStore.getState().updateShake(100)
      expect(useGameStore.getState().screenShake!.elapsed).toBe(100)
    })

    test('shake clears when duration exceeded', () => {
      useGameStore.getState().triggerShake(10, 500)
      useGameStore.getState().updateShake(600)
      expect(useGameStore.getState().screenShake).toBeNull()
    })

    test('getShakeOffset returns offset during shake', () => {
      useGameStore.getState().triggerShake(10, 500)
      const offset = useGameStore.getState().getShakeOffset()
      // Should have some non-zero offset (random)
      expect(typeof offset.x).toBe('number')
      expect(typeof offset.y).toBe('number')
    })

    test('getShakeOffset returns zero when no shake', () => {
      const offset = useGameStore.getState().getShakeOffset()
      expect(offset.x).toBe(0)
      expect(offset.y).toBe(0)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Boss Actions
  // ------------------------------------------------------------------ //
  describe('boss actions', () => {
    test('spawnBoss creates boss', () => {
      useGameStore.getState().spawnBoss('destroyer')
      expect(useGameStore.getState().boss).not.toBeNull()
      expect(useGameStore.getState().boss!.type).toBe('destroyer')
    })

    test('spawnBoss clears warning', () => {
      useGameStore.setState({ bossWarning: true })
      useGameStore.getState().spawnBoss()
      expect(useGameStore.getState().bossWarning).toBe(false)
    })

    test('damageBoss reduces HP', () => {
      useGameStore.getState().spawnBoss('destroyer')
      const initialHp = useGameStore.getState().boss!.hp
      useGameStore.getState().damageBoss(100)
      expect(useGameStore.getState().boss!.hp).toBe(initialHp - 100)
    })

    test('damageBoss triggers phase transition', () => {
      useGameStore.getState().spawnBoss('destroyer')
      const boss = useGameStore.getState().boss!
      // Damage to below 66% HP
      const damageForPhase2 = boss.maxHp * 0.35
      useGameStore.getState().damageBoss(damageForPhase2)
      expect(useGameStore.getState().boss!.phase).toBe(2)
    })

    test('defeatBoss clears boss and adds score', () => {
      useGameStore.getState().spawnBoss('destroyer')
      const scoreBefore = useGameStore.getState().score
      useGameStore.getState().defeatBoss()
      expect(useGameStore.getState().boss).toBeNull()
      expect(useGameStore.getState().score).toBeGreaterThan(scoreBefore)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Ship Selection
  // ------------------------------------------------------------------ //
  describe('ship selection', () => {
    test('setShipType changes ship', () => {
      useGameStore.getState().setShipType('scout')
      expect(useGameStore.getState().player.shipType).toBe('scout')
    })

    test('setShipType updates HP', () => {
      useGameStore.getState().setShipType('tank')
      // Tank has more HP than fighter
      expect(useGameStore.getState().player.hp).toBeGreaterThan(100)
    })

    test('ghost ship type can be selected', () => {
      useGameStore.getState().setShipType('ghost')
      expect(useGameStore.getState().player.shipType).toBe('ghost')
    })
  })

  // ------------------------------------------------------------------ //
  //                         Special Abilities
  // ------------------------------------------------------------------ //
  describe('special abilities', () => {
    test('activateSpecialAbility sets ability', () => {
      useGameStore.getState().activateSpecialAbility()
      expect(useGameStore.getState().specialAbility).not.toBeNull()
    })

    test('activateSpecialAbility puts ability on cooldown', () => {
      useGameStore.getState().activateSpecialAbility()
      expect(useGameStore.getState().player.specialReady).toBe(false)
    })

    test('cannot activate ability while on cooldown', () => {
      useGameStore.getState().activateSpecialAbility()
      const ability = useGameStore.getState().specialAbility
      useGameStore.getState().activateSpecialAbility() // Try again
      // Should be same ability, not new activation
      expect(useGameStore.getState().specialAbility).toEqual(ability)
    })

    test('updateSpecialAbility reduces cooldown', () => {
      useGameStore.getState().activateSpecialAbility()
      const cooldownBefore = useGameStore.getState().player.specialCooldown
      useGameStore.getState().updateSpecialAbility(1)
      expect(useGameStore.getState().player.specialCooldown).toBe(cooldownBefore - 1)
    })

    test('ability becomes ready when cooldown reaches 0', () => {
      useGameStore.getState().activateSpecialAbility()
      const cooldown = useGameStore.getState().player.specialCooldown
      useGameStore.getState().updateSpecialAbility(cooldown + 1)
      expect(useGameStore.getState().player.specialReady).toBe(true)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Reset Game
  // ------------------------------------------------------------------ //
  describe('resetGame', () => {
    test('resets all state', () => {
      // Modify state
      useGameStore.getState().addScore(1000)
      useGameStore.getState().nextWave()
      useGameStore.getState().spawnAsteroids(5)
      useGameStore.getState().spawnEnemy()
      useGameStore.getState().incrementCombo()

      // Reset
      useGameStore.getState().resetGame()

      const state = useGameStore.getState()
      expect(state.score).toBe(0)
      expect(state.wave).toBe(1)
      expect(state.asteroids).toHaveLength(0)
      expect(state.enemies).toHaveLength(0)
      expect(state.combo.count).toBe(0)
    })

    test('preserves ship selection', () => {
      useGameStore.getState().setShipType('scout')
      useGameStore.getState().resetGame()
      expect(useGameStore.getState().player.shipType).toBe('scout')
    })
  })
})
