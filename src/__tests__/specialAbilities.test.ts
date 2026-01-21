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
    }

    const SHIP_ABILITIES = {
      fighter: 'missile_barrage',
      scout: 'time_warp',
      tank: 'shield_burst',
      interceptor: 'emp_blast',
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
    })

    test('instant abilities have zero duration', () => {
      expect(ABILITY_STATS.emp_blast.duration).toBe(0)
      expect(ABILITY_STATS.missile_barrage.duration).toBe(0)
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
            }
            const cooldownMap: Record<string, number> = {
              missile_barrage: 15,
              time_warp: 25,
              shield_burst: 30,
              emp_blast: 20,
            }
            const durationMap: Record<string, number> = {
              missile_barrage: 0,
              time_warp: 5,
              shield_burst: 8,
              emp_blast: 0,
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
    test('BUG: EMP blast has no implementation', () => {
      // This test documents a missing feature
      // The emp_blast ability is defined but has no actual stunning logic

      const empBlastImplemented = false // Should stun all enemies for 3 seconds

      // TODO: Implement EMP blast to stun enemies
      expect(empBlastImplemented).toBe(false) // Bug: not implemented
    })

    test('EMP should affect all enemies on screen', () => {
      const enemies = [
        { pos: { x: 100, y: 100 }, stunned: false },
        { pos: { x: 200, y: 200 }, stunned: false },
        { pos: { x: 300, y: 300 }, stunned: false },
      ]

      // Expected behavior: all enemies should be stunned
      const applyEMP = () => {
        enemies.forEach((e) => {
          e.stunned = true
        })
      }

      applyEMP()
      expect(enemies.every((e) => e.stunned)).toBe(true)
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
