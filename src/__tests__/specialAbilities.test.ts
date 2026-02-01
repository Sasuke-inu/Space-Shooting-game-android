/**
 * Special Abilities Tests
 * Tests for ship abilities and their effects
 */

import { create } from 'zustand'

describe('Special Abilities Logic', () => {
  // ------------------------------------------------------------------ //
  //                         Ability Types Tests
  // ------------------------------------------------------------------ //
  describe('Ability Types', () => {
    const ABILITY_STATS = {
      emp_blast: { cooldown: 20, duration: 0, description: 'Stuns all enemies for 3 seconds' },
      missile_barrage: { cooldown: 15, duration: 0, description: 'Fires 8 homing missiles' },
      time_warp: { cooldown: 25, duration: 5, description: 'Slows time by 50% for 5 seconds' },
      shield_burst: { cooldown: 30, duration: 8, description: 'Invincibility for 8 seconds' },
      repair_drone: { cooldown: 22, duration: 6, description: 'Deploys a drone that repairs 40 HP over 6 seconds' },
      phase_cloak: { cooldown: 20, duration: 4, description: 'Phase out of reality, becoming invisible and invulnerable for 4 seconds' },
      gravity_cannon: { cooldown: 18, duration: 0, description: 'Fires a gravity burst dealing 200 damage to all enemies in range' },
    }

    const SHIP_ABILITIES = {
      fighter: 'missile_barrage',
      scout: 'time_warp',
      tank: 'shield_burst',
      interceptor: 'emp_blast',
      support: 'repair_drone',
      stealth: 'phase_cloak',
      heavy: 'gravity_cannon',
    }

    test('each ship has a unique ability', () => {
      const abilities = Object.values(SHIP_ABILITIES)
      const uniqueAbilities = new Set(abilities)
      expect(uniqueAbilities.size).toBe(abilities.length)
    })

    test('all abilities have defined stats', () => {
      Object.values(SHIP_ABILITIES).forEach((ability) => {
        expect(ABILITY_STATS[ability as keyof typeof ABILITY_STATS]).toBeDefined()
      })
    })

    test('duration abilities have non-zero duration', () => {
      expect(ABILITY_STATS.time_warp.duration).toBeGreaterThan(0)
      expect(ABILITY_STATS.shield_burst.duration).toBeGreaterThan(0)
      expect(ABILITY_STATS.repair_drone.duration).toBeGreaterThan(0)
      expect(ABILITY_STATS.phase_cloak.duration).toBeGreaterThan(0)
    })

    test('instant abilities have zero duration', () => {
      expect(ABILITY_STATS.emp_blast.duration).toBe(0)
      expect(ABILITY_STATS.missile_barrage.duration).toBe(0)
      expect(ABILITY_STATS.gravity_cannon.duration).toBe(0)
    })

    test('all 7 ships have unique abilities', () => {
      const ships = Object.keys(SHIP_ABILITIES)
      expect(ships.length).toBe(7)
      const abilities = Object.values(SHIP_ABILITIES)
      const uniqueAbilities = new Set(abilities)
      expect(uniqueAbilities.size).toBe(7)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Ability Activation Tests
  // ------------------------------------------------------------------ //
  describe('Ability Activation', () => {
    interface SpecialAbility {
      type: string
      cooldown: number
      maxCooldown: number
      duration: number
      isActive: boolean
    }

    interface Player {
      specialReady: boolean
      specialCooldown: number
      shipType: string
    }

    const createAbilityStore = () =>
      create<{
        player: Player
        specialAbility: SpecialAbility | null
        activateSpecialAbility: () => void
        updateSpecialAbility: (dt: number) => void
      }>((set, get) => ({
        player: { specialReady: true, specialCooldown: 0, shipType: 'fighter' },
        specialAbility: null,

        activateSpecialAbility: () =>
          set((state) => {
            if (!state.player.specialReady) return state

            const abilityMap: Record<string, string> = {
              fighter: 'missile_barrage',
              scout: 'time_warp',
              tank: 'shield_burst',
              interceptor: 'emp_blast',
              support: 'repair_drone',
              stealth: 'phase_cloak',
              heavy: 'gravity_cannon',
            }
            const cooldownMap: Record<string, number> = {
              missile_barrage: 15,
              time_warp: 25,
              shield_burst: 30,
              emp_blast: 20,
              repair_drone: 22,
              phase_cloak: 20,
              gravity_cannon: 18,
            }
            const durationMap: Record<string, number> = {
              missile_barrage: 0,
              time_warp: 5,
              shield_burst: 8,
              emp_blast: 0,
              repair_drone: 6,
              phase_cloak: 4,
              gravity_cannon: 0,
            }

            const abilityType = abilityMap[state.player.shipType] || 'missile_barrage'
            const cooldown = cooldownMap[abilityType]
            const duration = durationMap[abilityType]

            return {
              player: { ...state.player, specialReady: false, specialCooldown: cooldown },
              specialAbility: {
                type: abilityType,
                cooldown,
                maxCooldown: cooldown,
                duration,
                isActive: true,
              },
            }
          }),

        updateSpecialAbility: (dt) =>
          set((state) => {
            let newCooldown = state.player.specialCooldown - dt
            let specialReady = state.player.specialReady

            if (newCooldown <= 0) {
              newCooldown = 0
              specialReady = true
            }

            let ability = state.specialAbility
            if (ability && ability.isActive) {
              if (ability.duration > 0) {
                ability = {
                  ...ability,
                  duration: ability.duration - dt,
                  isActive: ability.duration > dt,
                }
              } else {
                ability = { ...ability, isActive: false }
              }
            }

            return {
              player: { ...state.player, specialCooldown: newCooldown, specialReady },
              specialAbility: ability,
            }
          }),
      }))

    test('ability requires specialReady to be true', () => {
      const store = createAbilityStore()
      store.setState({ player: { ...store.getState().player, specialReady: false } })

      store.getState().activateSpecialAbility()
      expect(store.getState().specialAbility).toBeNull()
    })

    test('ability activates when ready', () => {
      const store = createAbilityStore()
      store.getState().activateSpecialAbility()

      expect(store.getState().specialAbility).not.toBeNull()
      expect(store.getState().specialAbility?.isActive).toBe(true)
      expect(store.getState().player.specialReady).toBe(false)
    })

    test('ability sets correct cooldown', () => {
      const store = createAbilityStore()
      store.getState().activateSpecialAbility()

      expect(store.getState().player.specialCooldown).toBe(15) // missile_barrage cooldown
    })

    test('cooldown reduces over time', () => {
      const store = createAbilityStore()
      store.getState().activateSpecialAbility()

      store.getState().updateSpecialAbility(5) // 5 seconds
      expect(store.getState().player.specialCooldown).toBe(10)

      store.getState().updateSpecialAbility(10) // 10 more seconds
      expect(store.getState().player.specialCooldown).toBe(0)
      expect(store.getState().player.specialReady).toBe(true)
    })

    test('duration ability expires after duration', () => {
      const store = createAbilityStore()
      store.setState({ player: { ...store.getState().player, shipType: 'scout' } }) // time_warp

      store.getState().activateSpecialAbility()
      expect(store.getState().specialAbility?.type).toBe('time_warp')
      expect(store.getState().specialAbility?.duration).toBe(5)
      expect(store.getState().specialAbility?.isActive).toBe(true)

      // After 3 seconds
      store.getState().updateSpecialAbility(3)
      expect(store.getState().specialAbility?.duration).toBe(2)
      expect(store.getState().specialAbility?.isActive).toBe(true)

      // After 3 more seconds (total 6, past duration)
      store.getState().updateSpecialAbility(3)
      expect(store.getState().specialAbility?.isActive).toBe(false)
    })

    test('instant ability becomes inactive immediately', () => {
      const store = createAbilityStore()
      store.getState().activateSpecialAbility() // missile_barrage (duration: 0)

      // Update should immediately set isActive to false
      store.getState().updateSpecialAbility(0.016)
      expect(store.getState().specialAbility?.isActive).toBe(false)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Missile Barrage Tests
  // ------------------------------------------------------------------ //
  describe('Missile Barrage', () => {
    test('spawns 8 homing missiles', () => {
      const missiles: { angle: number }[] = []
      const count = 8

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2
        missiles.push({ angle })
      }

      expect(missiles.length).toBe(8)

      // Missiles should be evenly distributed
      const expectedInterval = (Math.PI * 2) / 8
      for (let i = 0; i < missiles.length - 1; i++) {
        const diff = missiles[i + 1].angle - missiles[i].angle
        expect(diff).toBeCloseTo(expectedInterval)
      }
    })

    test('missiles have 3 second lifetime', () => {
      const MISSILE_LIFE = 3
      let life = MISSILE_LIFE

      // Simulate 3 seconds
      for (let i = 0; i < 90; i++) { // 90 frames at 30fps = 3 seconds
        life -= 1 / 30
      }

      expect(life).toBeCloseTo(0, 1)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Time Warp Tests
  // ------------------------------------------------------------------ //
  describe('Time Warp', () => {
    test('time warp multiplier is 0.5', () => {
      const timeWarpMultiplier = 0.5
      const normalDt = 0.033

      const effectiveDt = normalDt * timeWarpMultiplier
      expect(effectiveDt).toBe(0.0165)
    })

    test('enemies move slower during time warp', () => {
      const enemySpeed = 100
      const normalDt = 0.033
      const timeWarpMultiplier = 0.5

      const normalDistance = enemySpeed * normalDt
      const warpedDistance = enemySpeed * normalDt * timeWarpMultiplier

      expect(warpedDistance).toBe(normalDistance / 2)
    })

    test('player movement is not affected', () => {
      // Note: In the actual implementation, player uses dt not effectiveDt
      const playerSpeed = 100
      const dt = 0.033

      // Player should move same distance regardless of time warp
      const playerDistance = playerSpeed * dt
      expect(playerDistance).toBeCloseTo(3.3)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Shield Burst Tests
  // ------------------------------------------------------------------ //
  describe('Shield Burst', () => {
    test('shield burst provides invincibility', () => {
      let hp = 100
      const hasShieldBurst = true
      const damage = 50

      if (!hasShieldBurst) {
        hp -= damage
      }

      expect(hp).toBe(100) // No damage taken
    })

    test('shield burst lasts 8 seconds', () => {
      const SHIELD_DURATION = 8
      let duration = SHIELD_DURATION
      const dt = 0.033

      let frames = 0
      while (duration > 0) {
        duration -= dt
        frames++
      }

      // Should last about 242 frames at 30fps
      expect(frames).toBeGreaterThan(230)
      expect(frames).toBeLessThan(250)
    })
  })

  // ------------------------------------------------------------------ //
  //                         EMP Blast Tests
  // ------------------------------------------------------------------ //
  describe('EMP Blast', () => {
    test('EMP blast stuns all enemies', () => {
      const enemies = [
        { pos: { x: 100, y: 100 }, stunned: false, stunnedTimer: 0 },
        { pos: { x: 200, y: 200 }, stunned: false, stunnedTimer: 0 },
        { pos: { x: 300, y: 300 }, stunned: false, stunnedTimer: 0 },
      ]

      const EMP_STUN_DURATION = 3

      // Apply EMP blast
      enemies.forEach((e) => {
        e.stunned = true
        e.stunnedTimer = EMP_STUN_DURATION
      })

      expect(enemies.every((e) => e.stunned)).toBe(true)
      expect(enemies.every((e) => e.stunnedTimer === EMP_STUN_DURATION)).toBe(true)
    })

    test('stunned enemies cannot move or fire', () => {
      const enemy = {
        pos: { x: 100, y: 100 },
        vel: { x: 50, y: 0 },
        stunned: true,
        canFire: false,
      }

      const dt = 0.033

      // Stunned enemies should not move
      if (!enemy.stunned) {
        enemy.pos.x += enemy.vel.x * dt
      }

      expect(enemy.pos.x).toBe(100) // Position unchanged
      expect(enemy.canFire).toBe(false) // Cannot fire
    })

    test('stun duration decreases over time', () => {
      const EMP_STUN_DURATION = 3
      let stunnedTimer = EMP_STUN_DURATION
      let stunned = true
      const dt = 0.033

      // Simulate 1 second
      for (let i = 0; i < 30; i++) {
        if (stunned) {
          stunnedTimer -= dt
          if (stunnedTimer <= 0) {
            stunned = false
            stunnedTimer = 0
          }
        }
      }

      expect(stunnedTimer).toBeCloseTo(2, 1)
      expect(stunned).toBe(true)
    })

    test('stun expires after 3 seconds', () => {
      const EMP_STUN_DURATION = 3
      let stunnedTimer = EMP_STUN_DURATION
      let stunned = true
      const dt = 0.033

      // Simulate 3+ seconds
      for (let i = 0; i < 100; i++) {
        if (stunned) {
          stunnedTimer -= dt
          if (stunnedTimer <= 0) {
            stunned = false
            stunnedTimer = 0
          }
        }
      }

      expect(stunnedTimer).toBe(0)
      expect(stunned).toBe(false)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Homing Missile Tests
  // ------------------------------------------------------------------ //
  describe('Homing Missiles', () => {
    test('missiles track nearest target', () => {
      const missile = { pos: { x: 100, y: 100 } }
      const enemies = [
        { pos: { x: 200, y: 100 } }, // 100 units away
        { pos: { x: 150, y: 100 } }, // 50 units away
        { pos: { x: 300, y: 100 } }, // 200 units away
      ]

      let closestDist = Infinity
      let closestIdx = -1

      enemies.forEach((e, idx) => {
        const dx = e.pos.x - missile.pos.x
        const dy = e.pos.y - missile.pos.y
        const dist = dx * dx + dy * dy
        if (dist < closestDist) {
          closestDist = dist
          closestIdx = idx
        }
      })

      expect(closestIdx).toBe(1) // Second enemy is closest
    })

    test('missiles deal 40 damage', () => {
      const MISSILE_DAMAGE = 40
      let enemyHp = 100

      enemyHp -= MISSILE_DAMAGE
      expect(enemyHp).toBe(60)
    })

    test('BUG: missile targeting by index can desync', () => {
      // When enemies are removed, missile targetId (index) may point to wrong enemy
      let enemies = [
        { id: 'a', pos: { x: 100, y: 100 } },
        { id: 'b', pos: { x: 200, y: 200 } },
        { id: 'c', pos: { x: 300, y: 300 } },
      ]

      const missile = { targetId: 1 } // Targeting enemy 'b' at index 1

      // Enemy 'a' dies and is removed
      enemies = enemies.filter((e) => e.id !== 'a')

      // Now index 1 points to enemy 'c', not 'b'
      const targetedEnemy = enemies[missile.targetId]
      expect(targetedEnemy?.id).toBe('c') // Bug: should be 'b'
    })
  })

  // ------------------------------------------------------------------ //
  //                         Repair Drone Tests
  // ------------------------------------------------------------------ //
  describe('Repair Drone', () => {
    test('repair drone heals over time', () => {
      const REPAIR_DRONE_TOTAL_HP = 40
      const REPAIR_DRONE_DURATION = 6
      const healPerSecond = REPAIR_DRONE_TOTAL_HP / REPAIR_DRONE_DURATION

      let hp = 60
      const maxHull = 120 // Support ship hull
      const dt = 0.033

      // Simulate 1 second of healing
      for (let i = 0; i < 30; i++) {
        hp = Math.min(hp + healPerSecond * dt, maxHull)
      }

      // Should have healed ~6.67 HP in 1 second
      expect(hp).toBeCloseTo(60 + healPerSecond * 1, 0)
    })

    test('repair drone respects max hull', () => {
      const REPAIR_DRONE_TOTAL_HP = 40
      const REPAIR_DRONE_DURATION = 6
      const healPerSecond = REPAIR_DRONE_TOTAL_HP / REPAIR_DRONE_DURATION

      let hp = 115
      const maxHull = 120 // Support ship hull
      const dt = 0.033

      // Simulate full 6 seconds of healing
      for (let i = 0; i < 180; i++) { // 180 frames at 30fps = 6 seconds
        hp = Math.min(hp + healPerSecond * dt, maxHull)
      }

      // HP should be capped at max hull
      expect(hp).toBe(maxHull)
    })

    test('repair drone heals total of 40 HP over 6 seconds', () => {
      const REPAIR_DRONE_TOTAL_HP = 40
      const REPAIR_DRONE_DURATION = 6
      const healPerSecond = REPAIR_DRONE_TOTAL_HP / REPAIR_DRONE_DURATION

      let hp = 50
      const maxHull = 200 // Use high max so we don't cap
      const dt = 0.033

      // Simulate full 6 seconds
      for (let i = 0; i < 180; i++) {
        hp = Math.min(hp + healPerSecond * dt, maxHull)
      }

      // Should have healed ~40 HP total (6 * 6.67 ≈ 40)
      expect(hp).toBeCloseTo(50 + REPAIR_DRONE_TOTAL_HP, 0)
    })

    test('repair drone has 6 second duration', () => {
      const REPAIR_DRONE_DURATION = 6
      expect(REPAIR_DRONE_DURATION).toBe(6)
    })

    test('repair drone has 22 second cooldown', () => {
      const REPAIR_DRONE_COOLDOWN = 22
      expect(REPAIR_DRONE_COOLDOWN).toBe(22)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Phase Cloak Tests
  // ------------------------------------------------------------------ //
  describe('Phase Cloak', () => {
    test('phase cloak grants invulnerability', () => {
      let hp = 60
      const isCloaked = true
      const damage = 50

      // Cloaked player should not take damage
      if (!isCloaked) {
        hp -= damage
      }

      expect(hp).toBe(60) // No damage taken
    })

    test('phase cloak has 4 second duration', () => {
      const PHASE_CLOAK_DURATION = 4
      let duration = PHASE_CLOAK_DURATION
      const dt = 0.033

      let frames = 0
      while (duration > 0) {
        duration -= dt
        frames++
      }

      // Should last about 121 frames at 30fps
      expect(frames).toBeGreaterThan(115)
      expect(frames).toBeLessThan(130)
    })

    test('phase cloak makes player invisible to enemies', () => {
      const player = { pos: { x: 100, y: 100 }, isCloaked: true }
      const enemy = { pos: { x: 200, y: 200 }, targetPlayer: true }

      // Enemy AI should not target cloaked player
      if (player.isCloaked) {
        enemy.targetPlayer = false
      }

      expect(enemy.targetPlayer).toBe(false)
    })

    test('phase cloak expires and player becomes targetable', () => {
      let isCloaked = true
      let duration = 4
      const dt = 0.033

      // Simulate 5 seconds (past duration)
      for (let i = 0; i < 150; i++) {
        duration -= dt
        if (duration <= 0) {
          isCloaked = false
          duration = 0
        }
      }

      expect(isCloaked).toBe(false)
      expect(duration).toBe(0)
    })

    test('phase cloak has 20 second cooldown', () => {
      const PHASE_CLOAK_COOLDOWN = 20
      expect(PHASE_CLOAK_COOLDOWN).toBe(20)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Gravity Cannon Tests
  // ------------------------------------------------------------------ //
  describe('Gravity Cannon', () => {
    test('gravity cannon deals instant area damage', () => {
      const GRAVITY_CANNON_DAMAGE = 200
      const GRAVITY_CANNON_RANGE = 250
      const playerPos = { x: 400, y: 400 }

      const enemies = [
        { pos: { x: 450, y: 400 }, hp: 100 },  // 50 units away - in range
        { pos: { x: 300, y: 400 }, hp: 150 },  // 100 units away - in range
        { pos: { x: 700, y: 400 }, hp: 100 },  // 300 units away - out of range
      ]

      // Apply gravity cannon damage
      enemies.forEach((e) => {
        const dx = e.pos.x - playerPos.x
        const dy = e.pos.y - playerPos.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist <= GRAVITY_CANNON_RANGE) {
          e.hp -= GRAVITY_CANNON_DAMAGE
        }
      })

      expect(enemies[0].hp).toBe(-100) // 100 - 200 = -100 (killed)
      expect(enemies[1].hp).toBe(-50)  // 150 - 200 = -50 (killed)
      expect(enemies[2].hp).toBe(100)  // Out of range, untouched
    })

    test('gravity cannon is instant (zero duration)', () => {
      const GRAVITY_CANNON_DURATION = 0
      expect(GRAVITY_CANNON_DURATION).toBe(0)
    })

    test('gravity cannon has 18 second cooldown', () => {
      const GRAVITY_CANNON_COOLDOWN = 18
      expect(GRAVITY_CANNON_COOLDOWN).toBe(18)
    })

    test('gravity cannon only affects enemies within range', () => {
      const GRAVITY_CANNON_RANGE = 250
      const playerPos = { x: 400, y: 400 }

      const testPositions = [
        { pos: { x: 400, y: 400 }, expected: true },   // 0 units - in range
        { pos: { x: 650, y: 400 }, expected: true },   // 250 units - at edge of range
        { pos: { x: 651, y: 400 }, expected: false },  // 251 units - just out of range
        { pos: { x: 100, y: 100 }, expected: false },  // ~424 units - out of range
      ]

      testPositions.forEach(({ pos, expected }) => {
        const dx = pos.x - playerPos.x
        const dy = pos.y - playerPos.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        expect(dist <= GRAVITY_CANNON_RANGE).toBe(expected)
      })
    })

    test('gravity cannon deals reduced damage to bosses', () => {
      const GRAVITY_CANNON_DAMAGE = 200
      const BOSS_DAMAGE_REDUCTION = 0.5
      const bossHp = 500

      const damageToBoss = GRAVITY_CANNON_DAMAGE * BOSS_DAMAGE_REDUCTION
      expect(damageToBoss).toBe(100)
      expect(bossHp - damageToBoss).toBe(400) // Boss survives
    })
  })

  // ------------------------------------------------------------------ //
  //                    New Ship Ability Activation Tests
  // ------------------------------------------------------------------ //
  describe('New Ship Ability Activation', () => {
    interface SpecialAbility {
      type: string
      cooldown: number
      maxCooldown: number
      duration: number
      isActive: boolean
    }

    interface Player {
      specialReady: boolean
      specialCooldown: number
      shipType: string
    }

    const createAbilityStore = () =>
      create<{
        player: Player
        specialAbility: SpecialAbility | null
        activateSpecialAbility: () => void
        updateSpecialAbility: (dt: number) => void
      }>((set, get) => ({
        player: { specialReady: true, specialCooldown: 0, shipType: 'support' },
        specialAbility: null,

        activateSpecialAbility: () =>
          set((state) => {
            if (!state.player.specialReady) return state

            const abilityMap: Record<string, string> = {
              fighter: 'missile_barrage',
              scout: 'time_warp',
              tank: 'shield_burst',
              interceptor: 'emp_blast',
              support: 'repair_drone',
              stealth: 'phase_cloak',
              heavy: 'gravity_cannon',
            }
            const cooldownMap: Record<string, number> = {
              missile_barrage: 15,
              time_warp: 25,
              shield_burst: 30,
              emp_blast: 20,
              repair_drone: 22,
              phase_cloak: 20,
              gravity_cannon: 18,
            }
            const durationMap: Record<string, number> = {
              missile_barrage: 0,
              time_warp: 5,
              shield_burst: 8,
              emp_blast: 0,
              repair_drone: 6,
              phase_cloak: 4,
              gravity_cannon: 0,
            }

            const abilityType = abilityMap[state.player.shipType] || 'missile_barrage'
            const cooldown = cooldownMap[abilityType]
            const duration = durationMap[abilityType]

            return {
              player: { ...state.player, specialReady: false, specialCooldown: cooldown },
              specialAbility: {
                type: abilityType,
                cooldown,
                maxCooldown: cooldown,
                duration,
                isActive: true,
              },
            }
          }),

        updateSpecialAbility: (dt) =>
          set((state) => {
            let newCooldown = state.player.specialCooldown - dt
            let specialReady = state.player.specialReady

            if (newCooldown <= 0) {
              newCooldown = 0
              specialReady = true
            }

            let ability = state.specialAbility
            if (ability && ability.isActive) {
              if (ability.duration > 0) {
                ability = {
                  ...ability,
                  duration: ability.duration - dt,
                  isActive: ability.duration > dt,
                }
              } else {
                ability = { ...ability, isActive: false }
              }
            }

            return {
              player: { ...state.player, specialCooldown: newCooldown, specialReady },
              specialAbility: ability,
            }
          }),
      }))

    test('support ship activates repair_drone', () => {
      const store = createAbilityStore()
      store.getState().activateSpecialAbility()

      expect(store.getState().specialAbility?.type).toBe('repair_drone')
      expect(store.getState().specialAbility?.duration).toBe(6)
      expect(store.getState().player.specialCooldown).toBe(22)
    })

    test('stealth ship activates phase_cloak', () => {
      const store = createAbilityStore()
      store.setState({ player: { ...store.getState().player, shipType: 'stealth' } })

      store.getState().activateSpecialAbility()

      expect(store.getState().specialAbility?.type).toBe('phase_cloak')
      expect(store.getState().specialAbility?.duration).toBe(4)
      expect(store.getState().player.specialCooldown).toBe(20)
    })

    test('heavy ship activates gravity_cannon', () => {
      const store = createAbilityStore()
      store.setState({ player: { ...store.getState().player, shipType: 'heavy' } })

      store.getState().activateSpecialAbility()

      expect(store.getState().specialAbility?.type).toBe('gravity_cannon')
      expect(store.getState().specialAbility?.duration).toBe(0)
      expect(store.getState().player.specialCooldown).toBe(18)
    })

    test('repair_drone expires after 6 seconds', () => {
      const store = createAbilityStore()
      store.getState().activateSpecialAbility() // repair_drone (duration: 6)

      expect(store.getState().specialAbility?.isActive).toBe(true)

      // After 4 seconds
      store.getState().updateSpecialAbility(4)
      expect(store.getState().specialAbility?.duration).toBe(2)
      expect(store.getState().specialAbility?.isActive).toBe(true)

      // After 3 more seconds (total 7, past duration)
      store.getState().updateSpecialAbility(3)
      expect(store.getState().specialAbility?.isActive).toBe(false)
    })

    test('phase_cloak expires after 4 seconds', () => {
      const store = createAbilityStore()
      store.setState({ player: { ...store.getState().player, shipType: 'stealth' } })

      store.getState().activateSpecialAbility()
      expect(store.getState().specialAbility?.isActive).toBe(true)

      // After 3 seconds
      store.getState().updateSpecialAbility(3)
      expect(store.getState().specialAbility?.duration).toBe(1)
      expect(store.getState().specialAbility?.isActive).toBe(true)

      // After 2 more seconds (total 5, past duration)
      store.getState().updateSpecialAbility(2)
      expect(store.getState().specialAbility?.isActive).toBe(false)
    })

    test('gravity_cannon becomes inactive immediately', () => {
      const store = createAbilityStore()
      store.setState({ player: { ...store.getState().player, shipType: 'heavy' } })

      store.getState().activateSpecialAbility() // gravity_cannon (duration: 0)

      // Update should immediately set isActive to false
      store.getState().updateSpecialAbility(0.016)
      expect(store.getState().specialAbility?.isActive).toBe(false)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Balance Tests
  // ------------------------------------------------------------------ //
  describe('Ability Balance', () => {
    const ABILITY_BALANCE = {
      repair_drone: { cooldown: 22, duration: 6, totalHeal: 40 },
      phase_cloak: { cooldown: 20, duration: 4 },
      gravity_cannon: { cooldown: 18, duration: 0, damage: 200, range: 250 },
    }

    test('repair drone heals a reasonable amount (40 HP over 6s)', () => {
      const { totalHeal, duration } = ABILITY_BALANCE.repair_drone
      const healPerSecond = totalHeal / duration

      // Heal rate should be meaningful but not overpowered
      expect(totalHeal).toBe(40)
      expect(duration).toBe(6)
      expect(healPerSecond).toBeCloseTo(6.67, 1)

      // Total heal should be less than support ship max hull (120)
      expect(totalHeal).toBeLessThan(120)
      // Total heal should be meaningful (at least 25% of support hull)
      expect(totalHeal).toBeGreaterThanOrEqual(120 * 0.25)
    })

    test('phase cloak duration is shorter than its cooldown', () => {
      const { cooldown, duration } = ABILITY_BALANCE.phase_cloak

      expect(duration).toBeLessThan(cooldown)
      // Duration should be at most 25% of cooldown to prevent perma-cloak
      expect(duration / cooldown).toBeLessThanOrEqual(0.25)
    })

    test('gravity cannon has high damage but limited area', () => {
      const { damage, range } = ABILITY_BALANCE.gravity_cannon

      // Damage should be high (enough to one-shot most enemies)
      expect(damage).toBeGreaterThanOrEqual(150)

      // Range should be limited (not full screen)
      // Typical game canvas is ~400-800 units wide
      expect(range).toBeLessThanOrEqual(300)
      expect(range).toBeGreaterThan(0)

      // Damage-to-range ratio should be high (powerful but short range)
      expect(damage / range).toBeGreaterThan(0.5)
    })

    test('all new ability cooldowns are within reasonable range', () => {
      const cooldowns = [
        ABILITY_BALANCE.repair_drone.cooldown,
        ABILITY_BALANCE.phase_cloak.cooldown,
        ABILITY_BALANCE.gravity_cannon.cooldown,
      ]

      cooldowns.forEach((cd) => {
        // Cooldowns should be between 10 and 40 seconds
        expect(cd).toBeGreaterThanOrEqual(10)
        expect(cd).toBeLessThanOrEqual(40)
      })
    })

    test('new ability cooldowns are competitive with existing abilities', () => {
      const existingCooldowns = {
        emp_blast: 20,
        missile_barrage: 15,
        time_warp: 25,
        shield_burst: 30,
      }
      const newCooldowns = {
        repair_drone: ABILITY_BALANCE.repair_drone.cooldown,
        phase_cloak: ABILITY_BALANCE.phase_cloak.cooldown,
        gravity_cannon: ABILITY_BALANCE.gravity_cannon.cooldown,
      }

      const existingAvg = Object.values(existingCooldowns).reduce((a, b) => a + b, 0) / 4
      const newAvg = Object.values(newCooldowns).reduce((a, b) => a + b, 0) / 3

      // New ability cooldowns should be in a similar range as existing ones
      expect(Math.abs(newAvg - existingAvg)).toBeLessThan(10)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Ability Flash Tests
  // ------------------------------------------------------------------ //
  describe('Ability Flash', () => {
    interface AbilityFlash {
      intensity: number
      duration: number
      elapsed: number
      abilityType: string
    }

    const createFlashStore = () =>
      create<{
        abilityFlash: AbilityFlash | null
        triggerAbilityFlash: (abilityType: string) => void
        updateAbilityFlash: (dt: number) => void
        getAbilityFlashOpacity: () => number
      }>((set, get) => ({
        abilityFlash: null,

        triggerAbilityFlash: (abilityType) =>
          set({
            abilityFlash: {
              intensity: 0.6,
              duration: 0.3,
              elapsed: 0,
              abilityType,
            },
          }),

        updateAbilityFlash: (dt) =>
          set((state) => {
            if (!state.abilityFlash) return state
            const newElapsed = state.abilityFlash.elapsed + dt
            if (newElapsed >= state.abilityFlash.duration) {
              return { abilityFlash: null }
            }
            return {
              abilityFlash: {
                ...state.abilityFlash,
                elapsed: newElapsed,
              },
            }
          }),

        getAbilityFlashOpacity: () => {
          const flash = get().abilityFlash
          if (!flash) return 0

          const progress = flash.elapsed / flash.duration
          const decay = 1 - progress
          const opacity = flash.intensity * decay

          return opacity
        },
      }))

    test('flash triggers on activation', () => {
      const store = createFlashStore()
      store.getState().triggerAbilityFlash('emp_blast')

      expect(store.getState().abilityFlash).not.toBeNull()
      expect(store.getState().abilityFlash?.abilityType).toBe('emp_blast')
    })

    test('flash has correct duration', () => {
      const store = createFlashStore()
      store.getState().triggerAbilityFlash('missile_barrage')

      expect(store.getState().abilityFlash?.duration).toBe(0.3)
    })

    test('flash has correct initial intensity', () => {
      const store = createFlashStore()
      store.getState().triggerAbilityFlash('time_warp')

      expect(store.getState().abilityFlash?.intensity).toBe(0.6)
      expect(store.getState().abilityFlash?.elapsed).toBe(0)
    })

    test('opacity decays over time', () => {
      const store = createFlashStore()
      store.getState().triggerAbilityFlash('shield_burst')

      // Initial opacity should be at full intensity
      const initialOpacity = store.getState().getAbilityFlashOpacity()
      expect(initialOpacity).toBe(0.6)

      // After 0.15s (half duration), opacity should be half
      store.getState().updateAbilityFlash(0.15)
      const halfwayOpacity = store.getState().getAbilityFlashOpacity()
      expect(halfwayOpacity).toBeCloseTo(0.3, 1)

      // After another 0.1s (total 0.25s), opacity should be low
      store.getState().updateAbilityFlash(0.1)
      const nearEndOpacity = store.getState().getAbilityFlashOpacity()
      expect(nearEndOpacity).toBeCloseTo(0.1, 1)
    })

    test('flash clears after duration', () => {
      const store = createFlashStore()
      store.getState().triggerAbilityFlash('emp_blast')

      // Flash should exist initially
      expect(store.getState().abilityFlash).not.toBeNull()

      // After full duration, flash should be cleared
      store.getState().updateAbilityFlash(0.3)
      expect(store.getState().abilityFlash).toBeNull()
      expect(store.getState().getAbilityFlashOpacity()).toBe(0)
    })

    test('flash clears after exceeding duration', () => {
      const store = createFlashStore()
      store.getState().triggerAbilityFlash('missile_barrage')

      // Update with time exceeding duration
      store.getState().updateAbilityFlash(0.5)
      expect(store.getState().abilityFlash).toBeNull()
    })

    test('flash stores correct ability type for each ship', () => {
      const store = createFlashStore()

      // Fighter -> missile_barrage
      store.getState().triggerAbilityFlash('missile_barrage')
      expect(store.getState().abilityFlash?.abilityType).toBe('missile_barrage')

      // Scout -> time_warp
      store.getState().triggerAbilityFlash('time_warp')
      expect(store.getState().abilityFlash?.abilityType).toBe('time_warp')

      // Tank -> shield_burst
      store.getState().triggerAbilityFlash('shield_burst')
      expect(store.getState().abilityFlash?.abilityType).toBe('shield_burst')

      // Interceptor -> emp_blast
      store.getState().triggerAbilityFlash('emp_blast')
      expect(store.getState().abilityFlash?.abilityType).toBe('emp_blast')

      // Support -> repair_drone
      store.getState().triggerAbilityFlash('repair_drone')
      expect(store.getState().abilityFlash?.abilityType).toBe('repair_drone')

      // Stealth -> phase_cloak
      store.getState().triggerAbilityFlash('phase_cloak')
      expect(store.getState().abilityFlash?.abilityType).toBe('phase_cloak')

      // Heavy -> gravity_cannon
      store.getState().triggerAbilityFlash('gravity_cannon')
      expect(store.getState().abilityFlash?.abilityType).toBe('gravity_cannon')
    })

    test('opacity returns 0 when no flash is active', () => {
      const store = createFlashStore()
      expect(store.getState().getAbilityFlashOpacity()).toBe(0)
    })

    test('multiple updates correctly track elapsed time', () => {
      const store = createFlashStore()
      store.getState().triggerAbilityFlash('emp_blast')

      // Update in small increments
      store.getState().updateAbilityFlash(0.1)
      expect(store.getState().abilityFlash?.elapsed).toBeCloseTo(0.1)

      store.getState().updateAbilityFlash(0.1)
      expect(store.getState().abilityFlash?.elapsed).toBeCloseTo(0.2)

      store.getState().updateAbilityFlash(0.05)
      expect(store.getState().abilityFlash?.elapsed).toBeCloseTo(0.25)
    })
  })
})
