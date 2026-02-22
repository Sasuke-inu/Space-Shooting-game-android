// ------------------------------------------------------------------ //
//                    Event Modifier Utilities
// ------------------------------------------------------------------ //

import type { EventModifierType, EventModifier } from "../types/weeklyEvents"
import { EVENT_MODIFIERS } from "../types/weeklyEvents"

/**
 * Game constants affected by event modifiers
 * These are the default values from gameStore.ts that can be modified by events
 */
export interface ModifiableGameConstants {
  // Enemy modifiers
  enemySpeedMultiplier: number
  enemyFireRateMultiplier: number

  // Asteroid modifiers
  asteroidSpeedMultiplier: number
  asteroidSizeMultiplier: number

  // Player modifiers
  playerMaxHp: number
  playerDamageMultiplier: number

  // Power-up modifiers
  powerUpDropRateMultiplier: number

  // Boss modifiers
  bossWaveInterval: number
}

/**
 * Default game constants (no modifiers applied)
 */
export const DEFAULT_GAME_CONSTANTS: ModifiableGameConstants = {
  enemySpeedMultiplier: 1.0,
  enemyFireRateMultiplier: 1.0,
  asteroidSpeedMultiplier: 1.0,
  asteroidSizeMultiplier: 1.0,
  playerMaxHp: 3,
  playerDamageMultiplier: 1.0,
  powerUpDropRateMultiplier: 1.0,
  bossWaveInterval: 5,
}

/**
 * Applies event modifiers to game constants
 * @param modifierTypes - Array of event modifier types to apply
 * @returns Modified game constants with all modifiers applied
 */
export const applyEventModifiers = (
  modifierTypes: EventModifierType[]
): ModifiableGameConstants => {
  // Start with default values
  const constants: ModifiableGameConstants = { ...DEFAULT_GAME_CONSTANTS }

  // Apply each modifier
  modifierTypes.forEach((type) => {
    const modifier = EVENT_MODIFIERS[type]
    if (!modifier) {
      console.warn(`Unknown event modifier type: ${type}`)
      return
    }

    // Apply each effect from the modifier
    const { effects } = modifier

    if (effects.enemySpeed !== undefined) {
      constants.enemySpeedMultiplier *= effects.enemySpeed
    }

    if (effects.asteroidSpeed !== undefined) {
      constants.asteroidSpeedMultiplier *= effects.asteroidSpeed
    }

    if (effects.enemyFireRate !== undefined) {
      constants.enemyFireRateMultiplier *= effects.enemyFireRate
    }

    if (effects.asteroidSize !== undefined) {
      constants.asteroidSizeMultiplier *= effects.asteroidSize
    }

    if (effects.playerMaxHp !== undefined) {
      constants.playerMaxHp = effects.playerMaxHp
    }

    if (effects.playerDamage !== undefined) {
      constants.playerDamageMultiplier *= effects.playerDamage
    }

    if (effects.powerUpDropRate !== undefined) {
      constants.powerUpDropRateMultiplier = effects.powerUpDropRate
    }

    if (effects.bossInterval !== undefined) {
      constants.bossWaveInterval = effects.bossInterval
    }
  })

  return constants
}

/**
 * Gets a specific modifier configuration
 * @param type - The modifier type to retrieve
 * @returns The modifier configuration or undefined if not found
 */
export const getModifier = (type: EventModifierType): EventModifier | undefined => {
  return EVENT_MODIFIERS[type]
}

/**
 * Gets all modifiers for display or selection
 * @returns Array of all available event modifiers
 */
export const getAllModifiers = (): EventModifier[] => {
  return Object.values(EVENT_MODIFIERS)
}

/**
 * Checks if a modifier affects a specific game mechanic
 * @param type - The modifier type to check
 * @param mechanic - The game mechanic to check for
 * @returns True if the modifier affects this mechanic
 */
export const modifierAffects = (
  type: EventModifierType,
  mechanic: keyof EventModifier['effects']
): boolean => {
  const modifier = EVENT_MODIFIERS[type]
  return modifier?.effects[mechanic] !== undefined
}

/**
 * Combines multiple modifiers and returns their cumulative effect description
 * @param modifierTypes - Array of modifier types to combine
 * @returns Human-readable description of combined effects
 */
export const getModifiersSummary = (modifierTypes: EventModifierType[]): string => {
  if (modifierTypes.length === 0) {
    return "No active modifiers"
  }

  const constants = applyEventModifiers(modifierTypes)
  const effects: string[] = []

  // Enemy effects
  if (constants.enemySpeedMultiplier !== 1.0) {
    effects.push(`Enemy speed ${constants.enemySpeedMultiplier}x`)
  }
  if (constants.enemyFireRateMultiplier !== 1.0) {
    effects.push(`Enemy fire rate ${constants.enemyFireRateMultiplier}x`)
  }

  // Asteroid effects
  if (constants.asteroidSpeedMultiplier !== 1.0) {
    effects.push(`Asteroid speed ${constants.asteroidSpeedMultiplier}x`)
  }
  if (constants.asteroidSizeMultiplier !== 1.0) {
    effects.push(`Asteroid size ${constants.asteroidSizeMultiplier}x`)
  }

  // Player effects
  if (constants.playerMaxHp !== DEFAULT_GAME_CONSTANTS.playerMaxHp) {
    effects.push(`Player HP: ${constants.playerMaxHp}`)
  }
  if (constants.playerDamageMultiplier !== 1.0) {
    effects.push(`Player damage ${constants.playerDamageMultiplier}x`)
  }

  // Power-up effects
  if (constants.powerUpDropRateMultiplier === 0) {
    effects.push("No power-ups")
  } else if (constants.powerUpDropRateMultiplier !== 1.0) {
    effects.push(`Power-up drops ${constants.powerUpDropRateMultiplier}x`)
  }

  // Boss effects
  if (constants.bossWaveInterval !== DEFAULT_GAME_CONSTANTS.bossWaveInterval) {
    effects.push(`Boss every ${constants.bossWaveInterval} waves`)
  }

  return effects.join(", ")
}

/**
 * Validates that modifier types are valid
 * @param modifierTypes - Array of modifier types to validate
 * @returns True if all modifiers are valid
 */
export const validateModifiers = (modifierTypes: EventModifierType[]): boolean => {
  return modifierTypes.every((type) => EVENT_MODIFIERS[type] !== undefined)
}
