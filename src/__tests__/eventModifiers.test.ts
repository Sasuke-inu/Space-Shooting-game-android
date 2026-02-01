/**
 * Event Modifiers Unit Tests
 * Tests for event modifier utilities and application logic
 */

import {
  applyEventModifiers,
  getModifier,
  getAllModifiers,
  modifierAffects,
  getModifiersSummary,
  validateModifiers,
  DEFAULT_GAME_CONSTANTS,
  type ModifiableGameConstants,
} from '../utils/eventModifiers'
import type { EventModifierType } from '../types/weeklyEvents'

describe('eventModifiers', () => {
  // ------------------------------------------------------------------ //
  //                    Single Modifiers Tests
  // ------------------------------------------------------------------ //
  describe('Single Modifiers', () => {
    test('applyEventModifiers with double_speed sets 2x enemy/asteroid speed', () => {
      const result = applyEventModifiers(['double_speed'])

      expect(result.enemySpeedMultiplier).toBe(2.0)
      expect(result.asteroidSpeedMultiplier).toBe(2.0)
      // Other values should remain default
      expect(result.enemyFireRateMultiplier).toBe(1.0)
      expect(result.powerUpDropRateMultiplier).toBe(1.0)
    })

    test('applyEventModifiers with no_powerups sets 0 drop rate', () => {
      const result = applyEventModifiers(['no_powerups'])

      expect(result.powerUpDropRateMultiplier).toBe(0)
      // Other values should remain default
      expect(result.enemySpeedMultiplier).toBe(1.0)
      expect(result.asteroidSpeedMultiplier).toBe(1.0)
    })

    test('applyEventModifiers with rapid_bosses sets boss interval to 3', () => {
      const result = applyEventModifiers(['rapid_bosses'])

      expect(result.bossWaveInterval).toBe(3)
      // Default is 5
      expect(DEFAULT_GAME_CONSTANTS.bossWaveInterval).toBe(5)
    })

    test('applyEventModifiers with bullet_hell sets 3x enemy fire rate', () => {
      const result = applyEventModifiers(['bullet_hell'])

      expect(result.enemyFireRateMultiplier).toBe(3.0)
      // Other values should remain default
      expect(result.enemySpeedMultiplier).toBe(1.0)
    })

    test('applyEventModifiers with glass_cannon sets 1 HP and 2x damage', () => {
      const result = applyEventModifiers(['glass_cannon'])

      expect(result.playerMaxHp).toBe(1)
      expect(result.playerDamageMultiplier).toBe(2.0)
      // Default is 3 HP
      expect(DEFAULT_GAME_CONSTANTS.playerMaxHp).toBe(3)
    })

    test('applyEventModifiers with big_asteroids sets 1.5x size', () => {
      const result = applyEventModifiers(['big_asteroids'])

      expect(result.asteroidSizeMultiplier).toBe(1.5)
      // Other values should remain default
      expect(result.asteroidSpeedMultiplier).toBe(1.0)
    })
  })

  // ------------------------------------------------------------------ //
  //                    Multiple Modifiers (Stacking) Tests
  // ------------------------------------------------------------------ //
  describe('Multiple Modifiers (Stacking)', () => {
    test('applyEventModifiers stacks speed multipliers correctly', () => {
      // double_speed applies 2x to both enemy and asteroid speed
      // If we apply it twice, it should stack multiplicatively
      const result = applyEventModifiers(['double_speed', 'double_speed'])

      expect(result.enemySpeedMultiplier).toBe(4.0)  // 2.0 * 2.0
      expect(result.asteroidSpeedMultiplier).toBe(4.0)
    })

    test('applyEventModifiers with [double_speed, bullet_hell] = 2x speed + 3x fire', () => {
      const result = applyEventModifiers(['double_speed', 'bullet_hell'])

      expect(result.enemySpeedMultiplier).toBe(2.0)
      expect(result.asteroidSpeedMultiplier).toBe(2.0)
      expect(result.enemyFireRateMultiplier).toBe(3.0)
    })

    test('applyEventModifiers with [glass_cannon, bullet_hell] = 1 HP + 2x dmg + 3x fire', () => {
      const result = applyEventModifiers(['glass_cannon', 'bullet_hell'])

      expect(result.playerMaxHp).toBe(1)
      expect(result.playerDamageMultiplier).toBe(2.0)
      expect(result.enemyFireRateMultiplier).toBe(3.0)
    })

    test('applyEventModifiers with all 3 chaos mode modifiers', () => {
      const result = applyEventModifiers(['double_speed', 'big_asteroids', 'bullet_hell'])

      expect(result.enemySpeedMultiplier).toBe(2.0)
      expect(result.asteroidSpeedMultiplier).toBe(2.0)
      expect(result.asteroidSizeMultiplier).toBe(1.5)
      expect(result.enemyFireRateMultiplier).toBe(3.0)
    })
  })

  // ------------------------------------------------------------------ //
  //                    Edge Cases Tests
  // ------------------------------------------------------------------ //
  describe('Edge Cases', () => {
    test('applyEventModifiers with empty array returns defaults', () => {
      const result = applyEventModifiers([])

      expect(result).toEqual(DEFAULT_GAME_CONSTANTS)
    })

    test('applyEventModifiers with unknown modifier logs warning and continues', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const result = applyEventModifiers(['unknown_modifier' as EventModifierType])

      expect(consoleSpy).toHaveBeenCalledWith('Unknown event modifier type: unknown_modifier')
      // Should still return default constants
      expect(result).toEqual(DEFAULT_GAME_CONSTANTS)

      consoleSpy.mockRestore()
    })
  })

  // ------------------------------------------------------------------ //
  //                    Helper Functions Tests
  // ------------------------------------------------------------------ //
  describe('Helper Functions', () => {
    test('getModifier returns correct modifier config', () => {
      const modifier = getModifier('double_speed')

      expect(modifier).toBeDefined()
      expect(modifier?.type).toBe('double_speed')
      expect(modifier?.name).toBe('Double Speed')
      expect(modifier?.effects.enemySpeed).toBe(2.0)
      expect(modifier?.effects.asteroidSpeed).toBe(2.0)
    })

    test('getModifier returns undefined for unknown type', () => {
      const modifier = getModifier('unknown' as EventModifierType)

      expect(modifier).toBeUndefined()
    })

    test('getAllModifiers returns all 6 modifiers', () => {
      const modifiers = getAllModifiers()

      expect(modifiers).toHaveLength(6)
      expect(modifiers.map(m => m.type)).toEqual(
        expect.arrayContaining([
          'double_speed',
          'no_powerups',
          'rapid_bosses',
          'bullet_hell',
          'glass_cannon',
          'big_asteroids',
        ])
      )
    })

    test('modifierAffects returns true if modifier affects mechanic', () => {
      expect(modifierAffects('double_speed', 'enemySpeed')).toBe(true)
      expect(modifierAffects('double_speed', 'asteroidSpeed')).toBe(true)
      expect(modifierAffects('bullet_hell', 'enemyFireRate')).toBe(true)
      expect(modifierAffects('glass_cannon', 'playerMaxHp')).toBe(true)
      expect(modifierAffects('glass_cannon', 'playerDamage')).toBe(true)
    })

    test('modifierAffects returns false if modifier does not affect mechanic', () => {
      expect(modifierAffects('double_speed', 'playerMaxHp')).toBe(false)
      expect(modifierAffects('no_powerups', 'enemySpeed')).toBe(false)
      expect(modifierAffects('bullet_hell', 'asteroidSize')).toBe(false)
    })

    test('getModifiersSummary returns readable description', () => {
      const summary = getModifiersSummary(['double_speed', 'bullet_hell'])

      expect(summary).toContain('Enemy speed 2x')
      expect(summary).toContain('Enemy fire rate 3x')
      expect(summary).toContain('Asteroid speed 2x')
    })

    test('getModifiersSummary with no modifiers returns "No active modifiers"', () => {
      const summary = getModifiersSummary([])

      expect(summary).toBe('No active modifiers')
    })

    test('getModifiersSummary with no_powerups shows "No power-ups"', () => {
      const summary = getModifiersSummary(['no_powerups'])

      expect(summary).toBe('No power-ups')
    })

    test('getModifiersSummary with glass_cannon shows HP and damage', () => {
      const summary = getModifiersSummary(['glass_cannon'])

      expect(summary).toContain('Player HP: 1')
      expect(summary).toContain('Player damage 2x')
    })

    test('validateModifiers returns true for valid modifiers', () => {
      expect(validateModifiers(['double_speed'])).toBe(true)
      expect(validateModifiers(['double_speed', 'bullet_hell'])).toBe(true)
      expect(validateModifiers(['glass_cannon', 'no_powerups', 'rapid_bosses'])).toBe(true)
    })

    test('validateModifiers returns false for invalid modifiers', () => {
      expect(validateModifiers(['unknown' as EventModifierType])).toBe(false)
      expect(validateModifiers(['double_speed', 'invalid' as EventModifierType])).toBe(false)
    })
  })
})
