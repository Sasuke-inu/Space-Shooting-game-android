# Game Constants Analysis

## Overview

This document analyzes the duplication patterns and inconsistencies in game constants across the Android Kotlin codebase. The primary issues include:

1. **Duplicated constants** - Same values defined in multiple locations (top-level and nested objects)
2. **Three-way enemy stat conflicts** - Enemy stats defined in three different places with conflicting values
3. **Game balance relationships** - Complex cascading dependencies between constants that affect gameplay

These issues create confusion about which values are canonical and increase the risk of bugs when only one copy gets updated during balance tuning.

---

## Duplicated Constants

### Power-Up Constants

Power-up timing and drop rates are defined in TWO locations with identical values:

**Location 1: Top-level constants** (`GameConstants.kt` lines 98-102)
```kotlin
const val POWERUP_LIFETIME = 10f        // Time before disappearing (seconds)
const val POWERUP_DURATION = 8f         // Active duration (seconds)
const val POWERUP_DROP_ENEMY = 0.25f    // 25% drop from enemies
const val POWERUP_DROP_ASTEROID = 0.05f // 5% drop from large asteroids
```

**Location 2: PowerUp object** (`GameConstants.kt` lines 109-113)
```kotlin
object PowerUp {
    const val LIFETIME = 10f            // Time before disappearing (seconds)
    const val DURATION = 8f             // Active duration (seconds)
    const val DROP_CHANCE_ENEMY = 0.25f // 25% drop from enemies
    const val DROP_CHANCE_ASTEROID = 0.05f // 5% drop from large asteroids
    // ... other constants
}
```

**Current Values:**
- LIFETIME: `10f` (both locations agree)
- DURATION: `8f` (both locations agree)
- DROP_CHANCE_ENEMY: `0.25f` / `25%` (both locations agree)
- DROP_CHANCE_ASTEROID: `0.05f` / `5%` (both locations agree)

**Which is used?** The **top-level constants** (`POWERUP_LIFETIME`, `POWERUP_DURATION`, `POWERUP_DROP_ENEMY`) are used by the game engine:
- `SpawnSystem.kt` line 271: Uses `GameConstants.POWERUP_DROP_ENEMY` for drop rate check
- `SpawnSystem.kt` line 280: Uses `GameConstants.POWERUP_LIFETIME` for power-up lifetime
- `GameEngine.kt` lines 758, 762: Uses `GameConstants.POWERUP_DURATION` when creating `ActivePowerUp` instances

The `PowerUp` object constants are **unused** in the codebase.

### Combo System Constants

Combo timing and multipliers are defined in TWO locations with identical values:

**Location 1: Top-level constants** (`GameConstants.kt` lines 104-106)
```kotlin
const val COMBO_TIMEOUT = 2.0f          // Combo timeout (seconds)
val COMBO_MULTIPLIERS = floatArrayOf(1f, 1.5f, 2f, 2.5f, 3f)
```

**Location 2: Combo object** (`GameConstants.kt` lines 120-123)
```kotlin
object Combo {
    const val TIMEOUT = 2.0f            // Combo timeout (seconds)
    val MULTIPLIERS = floatArrayOf(1f, 1.5f, 2f, 2.5f, 3f)
    const val KILLS_PER_TIER = 3        // Kills to increase multiplier tier
}
```

**Current Values:**
- TIMEOUT: `2.0f` (both locations agree)
- MULTIPLIERS: `[1.0, 1.5, 2.0, 2.5, 3.0]` (both locations agree)

**Which is used?** The **top-level constant** (`COMBO_TIMEOUT`) is used by the game engine:
- `GameEngine.kt` line 715: Uses `GameConstants.COMBO_TIMEOUT` when resetting combo timer

The `Combo.TIMEOUT` constant is **unused** in the codebase.

**Note:** The `Combo.KILLS_PER_TIER` constant (value: 3) is unique to the Combo object and not duplicated elsewhere. However, the combo multiplier tier logic in `GameModels.kt` (lines 181-187) uses hardcoded thresholds instead of this constant.

---

## Enemy Stats Conflict: Three Sources of Truth

Enemy stats are defined in **THREE different locations** with **conflicting values**. This creates significant confusion about which values are actually used at runtime.

### Source 1: EnemyType Enum (`GameModels.kt` lines 71-111)

Defines stats as enum properties:

| Enemy Type | HP  | Speed | Damage | Fire Rate | Points |
|------------|-----|-------|--------|-----------|--------|
| SCOUT      | 30  | 180f  | 10     | 1.2f      | 75     |
| TANK       | 150 | 60f   | 25     | 2.0f      | 200    |
| SNIPER     | 50  | 40f   | 35     | 3.0f      | 150    |
| BOMBER     | 80  | 100f  | 15     | 1.5f      | 125    |

### Source 2: GameConstants.Enemy Object (`GameConstants.kt` lines 32-62)

Defines stats as nested constants:

| Enemy Type | HP  | Speed | Damage | Fire Rate | Points |
|------------|-----|-------|--------|-----------|--------|
| SCOUT      | 30  | 180f  | 10     | 1.2f      | 75     |
| TANK       | 150 | 60f   | 25     | 2.0f      | 200    |
| SNIPER     | 50  | 40f   | 35     | 3.0f      | 150    |
| BOMBER     | 80  | 100f  | 15     | 1.5f      | 125    |

**Agreement:** Sources 1 and 2 have identical values for all enemy types.

### Source 3: SpawnSystem.getEnemyStats() (`SpawnSystem.kt` lines 183-218)

Returns stats as data class:

| Enemy Type | HP  | Speed | Damage | Fire Rate | Accuracy |
|------------|-----|-------|--------|-----------|----------|
| SCOUT      | 30  | **80f** ⚠️ | 10 | 1.5f ⚠️ | 0.6f |
| TANK       | 150 | **40f** ⚠️ | 25 | 2.5f ⚠️ | 0.4f |
| SNIPER     | 50  | **20f** ⚠️ | 35 | 3.0f | 0.9f |
| BOMBER     | 80  | **50f** ⚠️ | **40** ⚠️ | 2.0f ⚠️ | 0.5f |

### Conflict Summary

**Speed values differ significantly:**
- **SCOUT**: 180f (enum/constants) vs **80f (SpawnSystem)** - 55% slower at runtime
- **TANK**: 60f (enum/constants) vs **40f (SpawnSystem)** - 33% slower at runtime
- **SNIPER**: 40f (enum/constants) vs **20f (SpawnSystem)** - 50% slower at runtime
- **BOMBER**: 100f (enum/constants) vs **50f (SpawnSystem)** - 50% slower at runtime

**Fire rate values also differ:**
- **SCOUT**: 1.2f (enum/constants) vs **1.5f (SpawnSystem)** - 25% slower fire rate
- **TANK**: 2.0f (enum/constants) vs **2.5f (SpawnSystem)** - 25% slower fire rate
- **BOMBER**: 1.5f (enum/constants) vs **2.0f (SpawnSystem)** - 33% slower fire rate

**Bomber damage differs:**
- **BOMBER**: 15 (enum/constants) vs **40 (SpawnSystem)** - 167% more damage at runtime

**Additional fields:**
- SpawnSystem includes `radius` and `accuracy` fields not present in the enum or constants
- SpawnSystem returns hardcoded radius values (15f/25f/18f/22f)
- SpawnSystem returns hardcoded accuracy values (0.6f/0.4f/0.9f/0.5f)

### Which Values Are Actually Used?

**At runtime, SpawnSystem.getEnemyStats() is the source of truth.**

Evidence from `SpawnSystem.kt` line 120:
```kotlin
fun spawnEnemy(...): Enemy {
    val type = chooseEnemyType(difficulty)
    val stats = getEnemyStats(type)  // ← Uses SpawnSystem values

    return Enemy(
        hp = stats.hp,           // From SpawnSystem
        speed = speed,           // Calculated from stats.speed
        damage = stats.damage,   // From SpawnSystem
        fireRate = stats.fireRate, // From SpawnSystem
        accuracy = stats.accuracy  // From SpawnSystem
    )
}
```

**Conclusion:** The `EnemyType` enum properties and `GameConstants.Enemy` object are **currently unused** at runtime. The actual enemy behavior is determined by `SpawnSystem.getEnemyStats()` with its significantly different (lower) speed and modified fire rate values.

**Impact:** Players encounter much slower enemies than the documented constants suggest, which significantly affects game balance and difficulty tuning.

---

## Game Balance Value Relationships

Game balance constants form complex dependency chains. Changing one constant can have cascading effects throughout the system.

### Difficulty Progression Flow

**Chain: RAMP_TIME → difficultyProgress → enemy scaling**

1. **RAMP_TIME Definition** (`GameConstants.kt` line 168)
   ```kotlin
   object Difficulty {
       const val RAMP_TIME = 240f  // 4 minutes to max difficulty
   }
   ```

2. **difficultyProgress Calculation** (`GameState.kt` line 76)
   ```kotlin
   val difficultyProgress: Float
       get() = (time / 240f).coerceIn(0f, 1f)
   ```

   ⚠️ **Issue:** This hardcodes `240f` instead of using `GameConstants.Difficulty.RAMP_TIME`!

3. **Enemy Speed Scaling** (`SpawnSystem.kt` line 124)
   ```kotlin
   val speed = stats.speed * (1f + difficulty * 0.3f)
   ```
   - At 0% difficulty: `speed = base_speed * 1.0` (no scaling)
   - At 50% difficulty: `speed = base_speed * 1.15` (+15% faster)
   - At 100% difficulty: `speed = base_speed * 1.3` (+30% faster)

4. **Enemy Accuracy Scaling** (`SpawnSystem.kt` line 138)
   ```kotlin
   accuracy = stats.accuracy + difficulty * 0.2f
   ```
   - At 0% difficulty: `accuracy = base_accuracy + 0.0`
   - At 50% difficulty: `accuracy = base_accuracy + 0.1`
   - At 100% difficulty: `accuracy = base_accuracy + 0.2`

5. **Enemy Type Selection** (`SpawnSystem.kt` lines 145-169)
   - At 0-25% difficulty: Only SCOUT enemies spawn
   - At 25-50% difficulty: SCOUT (70%) and TANK (30%) spawn
   - At 50-75% difficulty: SCOUT (40%), TANK (30%), SNIPER (30%) spawn
   - At 75-100% difficulty: All types spawn evenly (SCOUT 25%, TANK 25%, SNIPER 25%, BOMBER 25%)

**Cascading Effects of Changing RAMP_TIME:**
- Increasing RAMP_TIME (e.g., 240f → 360f) slows difficulty progression
  - Players face weaker enemies for longer
  - Takes 6 minutes instead of 4 to reach max difficulty
  - Easier early game, same late game
- Decreasing RAMP_TIME (e.g., 240f → 120f) accelerates difficulty progression
  - Players face stronger enemies sooner
  - Takes 2 minutes instead of 4 to reach max difficulty
  - Harder early game, same late game
- **Critical:** Must also update hardcoded `240f` in `GameState.kt` line 76!

### Combo System Flow

**Chain: COMBO_TIMEOUT → combo timer → score multiplier**

1. **COMBO_TIMEOUT Definition** (`GameConstants.kt` line 105)
   ```kotlin
   const val COMBO_TIMEOUT = 2.0f  // Combo timeout (seconds)
   ```

2. **Combo Timer Reset** (`GameEngine.kt` line 715)
   ```kotlin
   combo = state.combo.copy(
       count = newCount,
       timer = GameConstants.COMBO_TIMEOUT,  // Timer reset on kill
       multiplierTier = newTier
   )
   ```

3. **Combo Timer Decay** (`GameEngine.kt` lines 723-730)
   ```kotlin
   if (combo.timer > 0f) {
       combo = combo.copy(
           timer = (combo.timer - deltaTime).coerceAtLeast(0f)
       )

       if (combo.timer <= 0f) {
           combo = ComboState()  // Reset combo when timer expires
       }
   }
   ```

4. **Multiplier Tier Calculation** (Inferred from code patterns)
   - Every 3 kills increases multiplier tier (referenced in `Combo.KILLS_PER_TIER = 3`)
   - Tier 0: 1.0x multiplier (1-2 kills)
   - Tier 1: 1.5x multiplier (3-5 kills)
   - Tier 2: 2.0x multiplier (6-8 kills)
   - Tier 3: 2.5x multiplier (9-11 kills)
   - Tier 4+: 3.0x multiplier (12+ kills)

5. **Score Multiplier Application** (`ComboState.kt` lines 180-187)
   ```kotlin
   val multiplier: Float
       get() = when {
           multiplierTier >= 4 -> 3f
           multiplierTier >= 3 -> 2.5f
           multiplierTier >= 2 -> 2f
           multiplierTier >= 1 -> 1.5f
           else -> 1f
       }
   ```

**Cascading Effects of Changing COMBO_TIMEOUT:**
- Increasing COMBO_TIMEOUT (e.g., 2.0f → 3.0f) makes combos easier to maintain
  - Players have more time between kills to keep combo alive
  - Higher average combo multipliers
  - Increases score inflation
- Decreasing COMBO_TIMEOUT (e.g., 2.0f → 1.5f) makes combos harder to maintain
  - Players must kill faster to keep combo alive
  - Lower average combo multipliers
  - Reduces score inflation
  - Rewards skilled/aggressive play more

### Power-Up Duration Flow

**Chain: POWERUP_DURATION → ActivePowerUp → gameplay effects**

1. **POWERUP_DURATION Definition** (`GameConstants.kt` line 100)
   ```kotlin
   const val POWERUP_DURATION = 8f  // Active duration (seconds)
   ```

2. **ActivePowerUp Creation** (`GameEngine.kt` lines 758, 762)
   ```kotlin
   val updatedList = state.activePowerUps.map {
       if (it.type == type) it.copy(remainingDuration = GameConstants.POWERUP_DURATION)
       else it
   }

   state.activePowerUps + ActivePowerUp(type, GameConstants.POWERUP_DURATION)
   ```

3. **Duration Decay** (Pattern inferred from game loop)
   ```kotlin
   activePowerUps = activePowerUps.map {
       it.copy(remainingDuration = (it.remainingDuration - deltaTime).coerceAtLeast(0f))
   }.filter { it.remainingDuration > 0f }
   ```

4. **Gameplay Effects by Power-Up Type** (From `PowerUpType` enum lines 148-152)
   - **SHIELD**: 8 seconds of invincibility
   - **RAPID_FIRE**: 8 seconds of doubled fire rate
   - **SPREAD_SHOT**: 8 seconds of 3-bullet spread pattern
   - **MAGNET**: 8 seconds of automatic power-up attraction

5. **Fire Rate Impact** (Rapid Fire Power-Up)
   - Normal fire cooldown: `FIRE_COOLDOWN_PLAYER = 0.16f` (6.25 shots/second)
   - Rapid fire cooldown: `FIRE_COOLDOWN_RAPID = 0.08f` (12.5 shots/second)
   - **2x fire rate increase for 8 seconds**

**Cascading Effects of Changing POWERUP_DURATION:**
- Increasing POWERUP_DURATION (e.g., 8f → 12f) strengthens power-ups
  - 50% more time with enhanced abilities
  - Easier to chain power-ups together
  - Reduces game difficulty significantly
  - More forgiving for casual players
- Decreasing POWERUP_DURATION (e.g., 8f → 6f) weakens power-ups
  - 25% less time with enhanced abilities
  - Harder to chain power-ups together
  - Increases game difficulty
  - Rewards precise timing and skill
- **Relationship with POWERUP_LIFETIME:**
  - LIFETIME = 10f (how long power-up exists before despawning)
  - DURATION = 8f (how long effect lasts after collection)
  - Ratio: 10:8 means players have 2 seconds longer to collect than the benefit lasts
  - If DURATION > LIFETIME, collecting late power-ups is more valuable

### Additional Balance Relationships

**Fire Rate and DPS:**
- `FIRE_COOLDOWN_PLAYER = 0.16f` → 6.25 shots/second
- `BULLET_DAMAGE_PLAYER = 25` → 156.25 DPS base
- With `FIRE_RATE_BONUS_PER_LEVEL = 0.15f` (15% per upgrade)
  - Level 1: 0.136f cooldown → 7.35 shots/sec → 183.75 DPS (+17.6%)
  - Level 5: 0.064f cooldown → 15.6 shots/sec → 390 DPS (+149.6%)

**Difficulty and Enemy DPS:**
- Scout base speed: 80f (SpawnSystem value)
- At max difficulty: 80f * 1.3 = 104f
- Scout fire rate: 1.5f (1 shot every 1.5 seconds)
- Scout damage: 10
- Scout DPS: 10 / 1.5 = 6.67 DPS base → 6.67 DPS at all difficulties (damage doesn't scale)

**Screen Shake and Player Feedback:**
- Asteroid destruction: 3f intensity, 100ms
- Enemy destruction: 8f intensity, 200ms
- Player hit: 10-12f intensity, 150-200ms
- Boss defeat: 20f intensity, 500ms
- Increasing shake intensity makes impacts feel more powerful but can cause motion sickness
- Decreasing shake duration improves clarity but reduces impact feel

---

## Recommendations

### Immediate Actions

1. **Document Runtime Sources of Truth**
   - Add code comments indicating which constants are actually used
   - Mark unused constants with `@Deprecated` or `// UNUSED` comments
   - Consider removing unused constants in a future cleanup

2. **Fix Hardcoded Values**
   - Update `GameState.kt` line 76 to use `GameConstants.Difficulty.RAMP_TIME`
   - Search for other hardcoded magic numbers that should reference constants

3. **Consolidate Enemy Stats**
   - This is already a planned feature: "Eliminate duplicated enemy/boss stat definitions"
   - Priority: **HIGH** - This affects game balance significantly
   - Recommendation: Make `SpawnSystem.getEnemyStats()` the single source of truth
   - Update `EnemyType` enum to store only display metadata, not gameplay stats
   - Remove `GameConstants.Enemy` object or have it reference `SpawnSystem` values

### Future Improvements

4. **Consolidate Power-Up Constants**
   - Remove top-level `POWERUP_*` constants
   - Migrate all usage to `GameConstants.PowerUp.*` for consistency
   - OR remove `PowerUp` object and keep top-level constants (simpler)
   - **Current usage favors top-level constants** - easiest path is to remove `PowerUp` object

5. **Consolidate Combo Constants**
   - Remove top-level `COMBO_*` constants
   - Migrate all usage to `GameConstants.Combo.*` for consistency
   - Fix `ComboState.multiplier` to use `Combo.KILLS_PER_TIER` instead of hardcoded tier thresholds

6. **Add Balance Documentation**
   - Create balance tuning guide explaining constant relationships
   - Document expected DPS values at different upgrade levels
   - Document expected difficulty curve over time
   - Add formulas showing calculated values (e.g., "SCOUT DPS = DAMAGE / FIRE_RATE")

7. **Add Validation Tests**
   - Unit tests to ensure all three enemy stat sources agree (or document why they differ)
   - Integration tests to verify difficulty progression matches design intent
   - Tests to catch future constant duplication

8. **Consider Configuration System**
   - For advanced balance tuning, consider externalizing constants to JSON/config files
   - Would allow balance changes without code recompilation
   - Trade-off: Adds complexity but improves iteration speed

### Balance Tuning Guidelines

When tuning game balance, consider these dependencies:

**To make game easier:**
- Increase `POWERUP_DURATION` (longer power-up effects)
- Increase `POWERUP_DROP_ENEMY` (more frequent power-ups)
- Increase `COMBO_TIMEOUT` (easier to maintain combos)
- Increase `RAMP_TIME` (slower difficulty progression)
- Decrease enemy speed in `SpawnSystem.getEnemyStats()`

**To make game harder:**
- Decrease `POWERUP_DURATION` (shorter power-up effects)
- Decrease `POWERUP_DROP_ENEMY` (less frequent power-ups)
- Decrease `COMBO_TIMEOUT` (harder to maintain combos)
- Decrease `RAMP_TIME` (faster difficulty progression)
- Increase enemy speed in `SpawnSystem.getEnemyStats()`

**To increase score inflation:**
- Increase `COMBO_TIMEOUT` (easier high combos)
- Decrease `Combo.KILLS_PER_TIER` (faster multiplier progression)
- Increase base enemy point values

**To reduce score inflation:**
- Decrease `COMBO_TIMEOUT` (harder high combos)
- Increase `Combo.KILLS_PER_TIER` (slower multiplier progression)
- Decrease base enemy point values

### Critical Warnings

⚠️ **Before changing RAMP_TIME:** Update both `GameConstants.kt` line 168 AND `GameState.kt` line 76

⚠️ **Before changing enemy stats:** Update `SpawnSystem.getEnemyStats()` (the runtime source of truth)

⚠️ **Before changing power-up constants:** Update top-level constants, not `PowerUp` object

⚠️ **Before changing combo constants:** Update top-level constants, not `Combo` object

⚠️ **Test balance changes thoroughly:** Small constant changes can have exponential effects on gameplay

---

## File Reference Summary

### Primary Constant Definitions
- `android-kotlin/app/src/main/java/com/spaceshooter/core/constants/GameConstants.kt` (lines 1-221)
  - All game constants defined here
  - Lines 98-106: Top-level power-up and combo constants (USED)
  - Lines 109-117: PowerUp object constants (UNUSED)
  - Lines 120-124: Combo object constants (UNUSED)
  - Lines 32-62: Enemy object constants (UNUSED)
  - Line 168: RAMP_TIME constant (NOT USED - hardcoded instead)

### Runtime Usage
- `android-kotlin/app/src/main/java/com/spaceshooter/core/engine/SpawnSystem.kt`
  - Lines 183-218: `getEnemyStats()` - **Runtime source of truth for enemy stats**
  - Line 271: Uses `POWERUP_DROP_ENEMY`
  - Line 280: Uses `POWERUP_LIFETIME`
  - Line 124: Enemy speed scaling with difficulty
  - Line 138: Enemy accuracy scaling with difficulty

- `android-kotlin/app/src/main/java/com/spaceshooter/core/engine/GameEngine.kt`
  - Line 715: Uses `COMBO_TIMEOUT`
  - Lines 758, 762: Uses `POWERUP_DURATION`

- `android-kotlin/app/src/main/java/com/spaceshooter/core/engine/GameState.kt`
  - Line 76: Hardcodes `240f` instead of using `RAMP_TIME` ⚠️

- `android-kotlin/app/src/main/java/com/spaceshooter/domain/model/GameModels.kt`
  - Lines 71-111: EnemyType enum with stats (UNUSED at runtime)
  - Lines 181-187: ComboState multiplier calculation (hardcoded thresholds)

---

**Document Version:** 1.0
**Last Updated:** 2026-02-05
**Codebase Version:** Android Kotlin Port
