/**
 * Ability Button Component Tests
 * Tests for the special ability button in VirtualControls
 */

import { useGameStore } from '../state/gameStore'
import { SHIP_STATS, ABILITY_STATS, ShipType, AbilityType } from '../types/game'

// Reset store before each test
beforeEach(() => {
  useGameStore.getState().resetGame()
  useGameStore.getState().setDimensions(800, 600)
})

// Helper function to map ship special ability name to ability type
const getAbilityTypeFromShip = (shipType: ShipType): AbilityType => {
  const specialName = SHIP_STATS[shipType].special
  const abilityMap: Record<string, AbilityType> = {
    'EMP Blast': 'emp_blast',
    'Missile Barrage': 'missile_barrage',
    'Time Warp': 'time_warp',
    'Shield Burst': 'shield_burst',
    'Repair Drone': 'repair_drone',
    'Phase Cloak': 'phase_cloak',
    'Gravity Cannon': 'gravity_cannon',
  }
  return abilityMap[specialName] || 'emp_blast'
}

describe('Ability Button', () => {
  // ------------------------------------------------------------------ //
  //                         Ship Ability Mapping
  // ------------------------------------------------------------------ //
  describe('ship ability mapping', () => {
    test('Fighter maps to Missile Barrage', () => {
      const abilityType = getAbilityTypeFromShip('fighter')
      expect(abilityType).toBe('missile_barrage')
      expect(SHIP_STATS.fighter.special).toBe('Missile Barrage')
    })

    test('Scout maps to Time Warp', () => {
      const abilityType = getAbilityTypeFromShip('scout')
      expect(abilityType).toBe('time_warp')
      expect(SHIP_STATS.scout.special).toBe('Time Warp')
    })

    test('Tank maps to Shield Burst', () => {
      const abilityType = getAbilityTypeFromShip('tank')
      expect(abilityType).toBe('shield_burst')
      expect(SHIP_STATS.tank.special).toBe('Shield Burst')
    })

    test('Interceptor maps to EMP Blast', () => {
      const abilityType = getAbilityTypeFromShip('interceptor')
      expect(abilityType).toBe('emp_blast')
      expect(SHIP_STATS.interceptor.special).toBe('EMP Blast')
    })

    test('all ship types have valid ability mappings', () => {
      const shipTypes: ShipType[] = ['fighter', 'scout', 'tank', 'interceptor', 'support', 'stealth', 'heavy']

      shipTypes.forEach(shipType => {
        const abilityType = getAbilityTypeFromShip(shipType)
        expect(ABILITY_STATS[abilityType]).toBeDefined()
      })
    })

    test('Support maps to Repair Drone', () => {
      const abilityType = getAbilityTypeFromShip('support')
      expect(abilityType).toBe('repair_drone')
      expect(SHIP_STATS.support.special).toBe('Repair Drone')
    })

    test('Stealth maps to Phase Cloak', () => {
      const abilityType = getAbilityTypeFromShip('stealth')
      expect(abilityType).toBe('phase_cloak')
      expect(SHIP_STATS.stealth.special).toBe('Phase Cloak')
    })

    test('Heavy maps to Gravity Cannon', () => {
      const abilityType = getAbilityTypeFromShip('heavy')
      expect(abilityType).toBe('gravity_cannon')
      expect(SHIP_STATS.heavy.special).toBe('Gravity Cannon')
    })
  })

  // ------------------------------------------------------------------ //
  //                         Ability Display
  // ------------------------------------------------------------------ //
  describe('ability display', () => {
    test('displays correct ability name for fighter', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ shipType: 'fighter' })

      const abilityName = SHIP_STATS[state.player.shipType].special
      expect(abilityName).toBe('Missile Barrage')
    })

    test('displays correct ability name for scout', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ shipType: 'scout' })

      const abilityName = SHIP_STATS[state.player.shipType].special
      expect(abilityName).toBe('Time Warp')
    })

    test('displays correct ability name for tank', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ shipType: 'tank' })

      const abilityName = SHIP_STATS[state.player.shipType].special
      expect(abilityName).toBe('Shield Burst')
    })

    test('displays correct ability name for interceptor', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ shipType: 'interceptor' })

      const abilityName = SHIP_STATS[state.player.shipType].special
      expect(abilityName).toBe('EMP Blast')
    })
  })

  // ------------------------------------------------------------------ //
  //                         Cooldown Progress
  // ------------------------------------------------------------------ //
  describe('cooldown progress calculation', () => {
    test('progress is 0 when ability is ready', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ specialReady: true, specialCooldown: 0 })

      const progress = state.player.specialReady ? 0 : 1
      expect(progress).toBe(0)
    })

    test('progress is non-zero when ability is on cooldown', () => {
      const state = useGameStore.getState()
      const abilityType = getAbilityTypeFromShip('fighter')
      const maxCooldown = ABILITY_STATS[abilityType].cooldown

      state.updatePlayer({ specialReady: false, specialCooldown: maxCooldown / 2 })

      const progress = state.player.specialCooldown / maxCooldown
      expect(progress).toBe(0.5)
    })

    test('progress calculates correctly for Missile Barrage (15s)', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ shipType: 'fighter', specialReady: false, specialCooldown: 7.5 })

      const abilityType = getAbilityTypeFromShip('fighter')
      const maxCooldown = ABILITY_STATS[abilityType].cooldown // 15s
      const progress = state.player.specialCooldown / maxCooldown

      expect(maxCooldown).toBe(15)
      expect(progress).toBe(0.5)
    })

    test('progress calculates correctly for Time Warp (25s)', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ shipType: 'scout', specialReady: false, specialCooldown: 12.5 })

      const abilityType = getAbilityTypeFromShip('scout')
      const maxCooldown = ABILITY_STATS[abilityType].cooldown // 25s
      const progress = state.player.specialCooldown / maxCooldown

      expect(maxCooldown).toBe(25)
      expect(progress).toBe(0.5)
    })

    test('progress calculates correctly for Shield Burst (30s)', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ shipType: 'tank', specialReady: false, specialCooldown: 15 })

      const abilityType = getAbilityTypeFromShip('tank')
      const maxCooldown = ABILITY_STATS[abilityType].cooldown // 30s
      const progress = state.player.specialCooldown / maxCooldown

      expect(maxCooldown).toBe(30)
      expect(progress).toBe(0.5)
    })

    test('progress calculates correctly for EMP Blast (20s)', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ shipType: 'interceptor', specialReady: false, specialCooldown: 10 })

      const abilityType = getAbilityTypeFromShip('interceptor')
      const maxCooldown = ABILITY_STATS[abilityType].cooldown // 20s
      const progress = state.player.specialCooldown / maxCooldown

      expect(maxCooldown).toBe(20)
      expect(progress).toBe(0.5)
    })

    test('progress is 1 at start of cooldown', () => {
      const state = useGameStore.getState()
      const abilityType = getAbilityTypeFromShip('fighter')
      const maxCooldown = ABILITY_STATS[abilityType].cooldown

      state.updatePlayer({ specialReady: false, specialCooldown: maxCooldown })

      const progress = state.player.specialCooldown / maxCooldown
      expect(progress).toBe(1)
    })

    test('progress approaches 0 as cooldown completes', () => {
      const state = useGameStore.getState()
      const abilityType = getAbilityTypeFromShip('fighter')
      const maxCooldown = ABILITY_STATS[abilityType].cooldown

      state.updatePlayer({ specialReady: false, specialCooldown: 0.1 })

      const progress = state.player.specialCooldown / maxCooldown
      expect(progress).toBeCloseTo(0.0067, 3)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Button Press Behavior
  // ------------------------------------------------------------------ //
  describe('button press behavior', () => {
    test('activating ability when ready sets cooldown', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ specialReady: true, specialCooldown: 0, shipType: 'fighter' })

      expect(state.player.specialReady).toBe(true)

      state.activateSpecialAbility()

      const newState = useGameStore.getState()
      expect(newState.player.specialReady).toBe(false)
      expect(newState.player.specialCooldown).toBe(15) // Fighter cooldown
    })

    test('activating ability when not ready does nothing', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ specialReady: false, specialCooldown: 10, shipType: 'fighter' })

      const beforeCooldown = state.player.specialCooldown
      state.activateSpecialAbility()

      const afterState = useGameStore.getState()
      expect(afterState.player.specialCooldown).toBe(beforeCooldown)
      expect(afterState.player.specialReady).toBe(false)
    })

    test('button spawns missiles for fighter', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ specialReady: true, shipType: 'fighter' })

      state.activateSpecialAbility()

      const newState = useGameStore.getState()
      expect(newState.homingMissiles.length).toBe(8)
    })

    test('button activates time warp for scout', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ specialReady: true, shipType: 'scout' })

      state.activateSpecialAbility()

      const newState = useGameStore.getState()
      expect(newState.timeWarp.isActive).toBe(true)
      expect(newState.timeWarp.duration).toBe(5)
    })

    test('button activates shield burst for tank', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ specialReady: true, shipType: 'tank' })

      state.activateSpecialAbility()

      const newState = useGameStore.getState()
      expect(newState.player.inv).toBe(8) // 8 second shield
    })

    test('button stuns enemies for interceptor', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ specialReady: true, shipType: 'interceptor' })
      state.spawnEnemy('scout')
      state.spawnEnemy('tank')

      state.activateSpecialAbility()

      const newState = useGameStore.getState()
      newState.enemies.forEach(enemy => {
        expect(enemy.stunDuration).toBe(3) // 3 second stun
      })
    })
  })

  // ------------------------------------------------------------------ //
  //                         Button State
  // ------------------------------------------------------------------ //
  describe('button state', () => {
    test('button should be enabled when ability is ready', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ specialReady: true, specialCooldown: 0 })

      const isEnabled = state.player.specialReady
      expect(isEnabled).toBe(true)
    })

    test('button should be disabled when on cooldown', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ specialReady: false, specialCooldown: 10 })

      const isEnabled = state.player.specialReady
      expect(isEnabled).toBe(false)
    })

    test('button becomes enabled after cooldown completes', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ shipType: 'fighter', specialReady: false, specialCooldown: 15 })

      // Simulate cooldown countdown
      state.updateSpecialAbility(15) // Full cooldown elapsed

      const newState = useGameStore.getState()
      expect(newState.player.specialReady).toBe(true)
      expect(newState.player.specialCooldown).toBe(0)
    })

    test('button remains disabled during cooldown', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ shipType: 'fighter', specialReady: false, specialCooldown: 15 })

      // Simulate partial cooldown
      state.updateSpecialAbility(7) // 7 seconds elapsed, 8 remaining

      const newState = useGameStore.getState()
      expect(newState.player.specialReady).toBe(false)
      expect(newState.player.specialCooldown).toBeGreaterThan(0)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Edge Cases
  // ------------------------------------------------------------------ //
  describe('edge cases', () => {
    test('changing ship type updates ability name', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ shipType: 'fighter' })

      let abilityName = SHIP_STATS[state.player.shipType].special
      expect(abilityName).toBe('Missile Barrage')

      state.updatePlayer({ shipType: 'scout' })
      abilityName = SHIP_STATS[useGameStore.getState().player.shipType].special
      expect(abilityName).toBe('Time Warp')
    })

    test('ability cooldown persists across ship changes', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ shipType: 'fighter', specialReady: false, specialCooldown: 10 })

      const cooldownBefore = state.player.specialCooldown
      state.updatePlayer({ shipType: 'scout' })

      const cooldownAfter = useGameStore.getState().player.specialCooldown
      expect(cooldownAfter).toBe(cooldownBefore)
    })

    test('rapid button presses only activate once', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ shipType: 'fighter', specialReady: true })

      state.activateSpecialAbility()
      state.activateSpecialAbility() // Second press should be ignored
      state.activateSpecialAbility() // Third press should be ignored

      const newState = useGameStore.getState()
      expect(newState.player.specialReady).toBe(false)
      expect(newState.homingMissiles.length).toBe(8) // Only 8 missiles, not 24
    })

    test('ability respects initial ready state on game reset', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ specialReady: false, specialCooldown: 10 })

      state.resetGame()

      const newState = useGameStore.getState()
      expect(newState.player.specialReady).toBe(true)
      expect(newState.player.specialCooldown).toBe(0)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Integration Tests
  // ------------------------------------------------------------------ //
  describe('integration with game state', () => {
    test('ability button works with game pause state', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ specialReady: true, shipType: 'fighter' })
      state.setPaused(true)

      // Ability should still activate (pause doesn't prevent activation)
      state.activateSpecialAbility()

      const newState = useGameStore.getState()
      expect(newState.homingMissiles.length).toBe(8)
    })

    test('cooldown updates during gameplay', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ shipType: 'fighter' })
      state.activateSpecialAbility()

      expect(useGameStore.getState().player.specialCooldown).toBe(15)

      // Simulate 1 second of gameplay
      state.updateSpecialAbility(1)

      expect(useGameStore.getState().player.specialCooldown).toBe(14)
    })

    test('ability works with different player positions', () => {
      const state = useGameStore.getState()
      state.updatePlayer({
        specialReady: true,
        shipType: 'fighter',
        pos: { x: 100, y: 200 }
      })

      state.activateSpecialAbility()

      const newState = useGameStore.getState()
      expect(newState.homingMissiles.length).toBe(8)
      // Missiles should spawn at player position
      newState.homingMissiles.forEach(missile => {
        expect(missile.pos.x).toBe(100)
        expect(missile.pos.y).toBe(200)
      })
    })

    test('ability interacts correctly with lives system', () => {
      const state = useGameStore.getState()
      state.updatePlayer({ specialReady: false, specialCooldown: 10, shipType: 'fighter' })

      // Losing a life should not reset cooldown
      const cooldownBefore = state.player.specialCooldown
      state.loseLife()

      const cooldownAfter = useGameStore.getState().player.specialCooldown
      expect(cooldownAfter).toBe(cooldownBefore)
    })
  })
})
