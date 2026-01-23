# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A React Native mobile space shooting game built with Expo and React Native Skia.

## Tech Stack

- **Framework**: Expo SDK 53 (React Native 0.79)
- **Rendering**: React Native Skia for canvas-based game graphics
- **Styling**: NativeWind (TailwindCSS for React Native)
- **State Management**: Zustand (with encrypted persistence via Expo SecureStore)
- **Language**: TypeScript (strict mode)
- **Testing**: Jest with jest-expo

## Project Structure

```
src/
├── __tests__/     # Test suite (Jest)
├── api/           # External API integrations (OpenAI, Grok, image generation)
├── components/    # React components (GameCanvas, VirtualControls)
├── i18n/          # Internationalization (5 languages)
├── screens/       # Screen components (GameScreen, SettingsScreen)
├── state/         # Zustand stores (gameStore, progressStore, highScoresStore, settingsStore)
├── theme/         # Theme system (types, themes, themeStore, typography, spacing)
├── types/         # TypeScript type definitions (game.ts, ai.ts)
└── utils/         # Utility functions (gameEngine, vectorMath, haptics, audioManager, cn)
```

## Key Files

- `src/state/gameStore.ts` - Main game state, power-ups, combo, screen shake
- `src/state/progressStore.ts` - Achievements, statistics, weapon upgrades, ship unlocks
- `src/state/settingsStore.ts` - User preferences persistence
- `src/state/highScoresStore.ts` - Top 10 high scores tracking
- `src/theme/themeStore.ts` - Theme and settings persistence
- `src/theme/themes.ts` - 6 theme color schemes
- `src/utils/gameEngine.ts` - Core game loop, collisions, power-up logic
- `src/utils/haptics.ts` - Haptic feedback integration
- `src/utils/backupManager.ts` - Backup/restore system with auto-recovery
- `src/utils/storageHealth.ts` - Data validation and corruption detection
- `src/utils/dataVersioning.ts` - Version tracking and migration system
- `src/types/game.ts` - Game entity types (Player, Enemy, Boss, Asteroid, PowerUp, Achievements)
- `src/components/GameCanvas.tsx` - Skia canvas rendering with theme support
- `src/components/VirtualControls.tsx` - Touch input controls
- `src/i18n/store.ts` - Language state management

## Commands

```bash
# Start development server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web

# Type checking
npm run typecheck

# Linting
npm run lint

# Testing
npm test              # Run all tests
npm test -- gameStore # Run single test file (by name pattern)
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Path Aliases

The codebase uses `@/` as a path alias to `src/`:
```typescript
import { useGameStore } from '@/state/gameStore';
import { normalize } from '@/utils/vectorMath';
```

## Game Features

### Core Gameplay
- **Entities**: Player, Enemies, Asteroids, Bullets, Particles, Power-ups, Bosses
- **Game Loop**: Uses `useGameEngine` hook with delta-time based updates
- **Collisions**: Distance-squared checks between entities
- **Difficulty**: Progressive scaling over 4 minutes (speed, accuracy, fire rate)
- **Wave System**: New asteroids spawn when all destroyed, enemies every 2 waves

### Enemy Types
Four enemy variants with unique behaviors:
- **Scout** - Fast, low HP (30), frequent fire
- **Tank** - Slow, high HP (150), heavy damage
- **Sniper** - Stationary, charged shots, high damage (35)
- **Bomber** - Medium speed, drops bombs

### Boss System
Three boss types that spawn periodically:
- **Destroyer** (500 HP, 2 phases) - 1000 points
- **Carrier** (750 HP, 3 phases) - 1500 points
- **Dreadnought** (1000 HP, 3 phases) - 2500 points

### Ship Types
Four playable ships with unique stats:
- **Fighter** (default) - Balanced stats, "Missile Barrage" ability
- **Scout** (500 credits) - Fast, high fire rate, "Time Warp" ability
- **Tank** (750 credits) - Slow, high damage/HP, "Shield Burst" ability
- **Interceptor** (1000 credits) - Fast fire rate, "EMP Blast" ability

### Special Abilities
Ship-specific abilities on cooldown:
- **EMP Blast** (20s) - Stuns all enemies for 3 seconds
- **Missile Barrage** (15s) - Fires 8 homing missiles
- **Time Warp** (25s) - Slows time by 50% for 5 seconds
- **Shield Burst** (30s) - Invincibility for 8 seconds

### Power-Up System
Four collectible power-ups that drop from enemies (25%) and large asteroids (5%):
- **Shield** (blue) - Temporary invincibility
- **Rapid Fire** (red) - 2x fire rate
- **Spread Shot** (yellow) - Fire 3 bullets in spread pattern
- **Magnet** (purple) - Attract nearby power-ups

### Weapon Upgrades (purchasable with credits)
- **Damage** (5 levels) - +10% per level
- **Fire Rate** (5 levels) - +15% per level
- **Bullet Size** (3 levels) - +20% per level
- **Multi-Shot** (2 levels) - 1/2/3 bullets
- **Piercing** (1 level) - Bullets pass through enemies

### Achievement System
12 achievements tracking player milestones:
- First Blood, Combo Master, Survivor (waves 10/20)
- Untouchable, Boss Slayer, Power Collector
- Sharpshooter, Speed Demon, Pacifist
- Millionaire, Fully Loaded

### Combo System
- Kills within 2 seconds chain together
- Multipliers: 1x → 1.5x → 2x → 2.5x → 3x (every 3 kills)
- Visual combo counter displayed on screen
- Combo resets on timer expiry or player death

### Screen Shake
- Asteroid destruction: light shake (3px, 100ms)
- Enemy destruction: medium shake (8px, 200ms)
- Player damage: heavy shake (10-12px, 150-200ms)
- Player death: intense shake (15px, 400ms)

### Theme System
6 built-in themes with full UI customization:
- **Neon Void** (default) - Cyberpunk cyan/pink
- **Nomad** - Desert gold/amber
- **Sakura** - Japanese cherry blossom pink
- **Forest Matrix** - Hacker green
- **Inferno** - Volcanic red/orange
- **Arctic** - Icy blue/white

### Internationalization (i18n)
5 supported languages:
- English (en)
- Spanish (es)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)

### Settings (Persisted)
- Theme selection
- Language selection
- Music volume (0-100%)
- SFX volume (0-100%)
- Joystick sensitivity (0.5x-2x)
- Joystick size (small/medium/large)
- Auto-fire toggle
- Haptic feedback toggle
- Invert Y-axis toggle

### Data Persistence & Backup System
All player progress and settings are persisted to AsyncStorage with automatic backup and corruption protection:

**Persisted Stores** (5 stores):
- **Achievements** (`space-shooter-achievements`) - Achievement progress and completion
- **Statistics** (`space-shooter-statistics`) - Lifetime stats (games played, kills, accuracy, etc.)
- **Upgrades** (`space-shooter-upgrades`) - Weapon upgrades, credits, ship unlocks
- **Settings** (`app-settings-storage`) - User preferences and theme
- **High Scores** (`high-scores-storage`) - Top 10 high scores

**Backup System** (`src/utils/backupManager.ts`):
- **Automatic Snapshots** - Creates backup copies with metadata tracking
- **Manual Backup** - Call `backup()` method on any store to snapshot current state
- **Backup Keys** - Prefixed with `backup-` (e.g., `backup-space-shooter-achievements`)
- **Metadata Tracking** - Stores timestamp, version (1.0.0), and backed-up stores list
- **Restore Operations** - Restore individual stores or all stores from backups

**Corruption Detection** (`src/utils/storageHealth.ts`):
- **Health Checks** - Validates JSON structure, required fields, data types, value ranges
- **Store Validators** - Each store has custom validation logic:
  - **Achievements** - Validates achievement IDs, progress, unlocked status
  - **Statistics** - Validates numeric stats, enemy/boss kill counts
  - **Upgrades** - Validates weapon levels, credits, unlocked ships
  - **Settings** - Validates theme, language, volumes, control preferences
  - **High Scores** - Validates score entries, timestamps, wave numbers
- **Health Reports** - Overall status: `healthy`, `degraded`, or `critical`
- **Corruption Identification** - Lists corrupted and recoverable stores

**Auto-Recovery System**:
Recovery flow when corruption is detected:
1. **Health Check** - Validates store structure and data integrity
2. **Backup Restore** - If backup exists, restores from backup automatically
3. **Reset to Defaults** - If no backup exists, removes corrupted data for fresh start
4. **Recovery Tracking** - Returns results for each store (recovered, method used, errors)

**Data Versioning** (`src/utils/dataVersioning.ts`):
- **Version Tracking** - Each store has version metadata for schema changes
- **Migration System** - Extensible migration registry for future schema updates
- **Migration Paths** - Automatically resolves and applies sequential migrations
- **Backward Compatibility** - Ensures old data migrates to new schemas safely

**Manual Backup/Restore API**:
```typescript
// Individual store operations
const achievementStore = useAchievementStore.getState()
await achievementStore.backup()    // Snapshot current state
await achievementStore.restore()   // Restore from backup

// Using backupManager utility
import { backupManager } from '@/utils/backupManager'

// Backup operations
await backupManager.backupStore('achievements')
await backupManager.backupAllStores()

// Restore operations
await backupManager.restoreStore('achievements')
await backupManager.restoreAllStores()

// Recovery operations
const result = await backupManager.autoRecoverFromCorruption()
// Returns: { hadCorruption: boolean, recovered: string[], failed: string[] }

const storeResult = await backupManager.recoverStore('achievements')
// Returns: { storeKey, recovered: boolean, method: 'backup'|'reset'|'none', error? }

// Health checks
import { checkStoreHealth, checkStorageHealth, getCorruptedStores } from '@/utils/storageHealth'

const health = await checkStoreHealth('achievements')
// Returns: { storeKey, isValid, issues, canRecover }

const report = await checkStorageHealth()
// Returns: { overallHealth, timestamp, stores, corruptedStores, recoverableStores }

const corrupted = await getCorruptedStores()
// Returns: string[] of corrupted store keys
```

**Store Integration**:
All persisted stores include `backup()` and `restore()` methods:
- `useAchievementStore` - `backup()`, `restore()`
- `useStatisticsStore` - `backup()`, `restore()`
- `useUpgradesStore` - `backup()`, `restore()`
- `useSettingsStore` - `backup()`, `restore()`
- `useHighScoresStore` - `backup()`, `restore()`

## State Management

Game state via Zustand store (`useGameStore`):
- Player: position, velocity, health, invincibility, ship type, special ability
- Entities: bullets, asteroids, enemies, particles, powerUps, homingMissiles
- Boss: current boss state, warning display
- Active effects: activePowerUps[], combo state, timeWarp
- Screen shake state
- Score, credits, lives, wave, time tracking
- Session stats for achievements

Progress stores (`progressStore.ts`):
- `useAchievementStore` - Achievement tracking and progress (with backup/restore)
- `useStatisticsStore` - Lifetime stats (games, kills, accuracy, etc.) (with backup/restore)
- `useUpgradesStore` - Weapon upgrades, credits, ship unlocks (with backup/restore)

Settings via Zustand store (`useSettingsStore`):
- Theme ID
- Language code
- Audio volumes
- Control preferences
- All persisted to SecureStore (encrypted)

## Security & Storage

All sensitive game data is encrypted and persisted using **Expo SecureStore**:
- **Credits & Ship Unlocks** (`progressStore.ts`) - Virtual currency and purchases
- **Achievements & Statistics** (`progressStore.ts`) - Player progression data
- **High Scores** (`highScoresStore.ts`) - Leaderboard entries with player names
- **Settings** (`settingsStore.ts`) - User preferences
- **Theme Settings** (`themeStore.ts`) - Theme and audio preferences
- **Language** (`i18n/store.ts`) - Internationalization preferences

SecureStore uses hardware-backed encryption (Keychain on iOS, Keystore on Android) to protect data from unauthorized access on rooted/jailbroken devices or device backups. A custom storage adapter (`src/utils/secureStorage.ts`) wraps expo-secure-store to provide compatibility with Zustand's persist middleware.

**Migration**: Existing AsyncStorage data is automatically migrated to SecureStore on first launch after upgrade via `src/utils/migrateStorage.ts`.

## Constants (gameStore.ts)

Key tunable values:
```typescript
// Player
PLAYER_ACCEL, PLAYER_FRICTION, PLAYER_TURN_SPEED

// Weapons
BULLET_SPEED_PLAYER, BULLET_SPEED_ENEMY
FIRE_COOLDOWN_PLAYER (0.16s), FIRE_COOLDOWN_RAPID (0.08s)

// Power-ups
POWERUP_LIFETIME (10s), POWERUP_DURATION (8s)
POWERUP_DROP_ENEMY (25%), POWERUP_DROP_ASTEROID (5%)

// Combo
COMBO_TIMEOUT (2s), COMBO_MULTIPLIERS [1, 1.5, 2, 2.5, 3]

// Controls
JOY_DEADZONE, JOY_MAX_RADIUS
```

## Theme Colors Reference

Each theme defines colors for:
- Canvas: background, stars
- Player: ship, fill, bullet, thruster
- Enemy: ship, fill, bullet
- Objects: asteroid, particles
- HUD: text, accent, hull bar
- UI: panels, buttons, modals
- Controls: joystick pad, stick, glow
- Power-ups: shield, rapid_fire, spread_shot, magnet
- Combo: text, glow

## Test Coverage

Tests located in `src/__tests__/`:
- `gameStore.test.ts` - Core game state
- `progressStore.test.ts` - Achievements and upgrades
- `vectorMath.test.ts` - Math utilities
- `collisionDetection.test.ts` - Hit detection
- `powerUpSystem.test.ts` - Power-up mechanics
- `enemySpawning.test.ts` - Enemy wave generation
- `bossSystem.test.ts` - Boss behavior
- `specialAbilities.test.ts` - Ship abilities
- `backupManager.test.ts` - Backup/restore operations
- `storageHealth.test.ts` - Data validation and corruption detection
- `dataRecovery.test.ts` - Integration tests for full backup/restore cycle

## Notes

- Uses React 19 with new architecture enabled
- Patched dependencies (via `patch-package`): `react-native@0.79.2`, `expo-asset@11.1.5`
- Portrait orientation only
- Haptic feedback on iOS/Android only
- Theme, settings, and progress persist across app restarts with encryption
- Credits earned from gameplay for purchasing upgrades and ships
- Automatic migration from AsyncStorage to SecureStore on first launch after upgrade
- All sensitive data protected by hardware-backed encryption
