# Bug Log - Pixel 9 Pro Fold (Android)

**Device:** Pixel 9 Pro Fold (48151FDKD001WX)
**Build:** Debug APK (Expo SDK 53, React Native 0.79.6)
**Date:** 2026-02-25
**Metro Bundler:** 2013 modules bundled successfully

---

## BUG-1: Unknown module "2014" error (CRITICAL)

**Severity:** HIGH
**Status:** FIXED
**Fix:** Renamed `music-1762534655955.mp3` to `background-music.mp3` and updated all require() paths.
**Root Cause:** Timestamped filename caused Metro module resolution failure.

---

## BUG-2: Background music fails to load (HIGH)

**Severity:** HIGH
**Status:** FIXED
**Fix:** Same as BUG-1 — renamed music asset file and updated require() references.

---

## BUG-3: expo-av deprecation warning (LOW)

**Severity:** LOW
**Status:** FIXED
**Fix:** Migrated from `expo-av` to `expo-audio` package. Updated `audioManager.ts` to use `createAudioPlayer()` and `useBackgroundMusic.ts` to use `useAudioPlayer()` hook.

---

## BUG-4: setBackgroundColorAsync not supported with edge-to-edge (LOW)

**Severity:** LOW
**Status:** FIXED
**Fix:** Removed `setBackgroundColorAsync()` call in `androidFeatures.ts` since it's incompatible with `edgeToEdgeEnabled: true`. Kept `setButtonStyleAsync()` which is still supported.

---

## BUG-5: Project ID is undefined (INFO)

**Severity:** INFO
**Status:** Expected behavior (no EAS project configured for local dev builds)

---

## PERF-1: App extremely slow / almost unplayable

**Severity:** CRITICAL
**Status:** FIXED
**Fixes applied:**
1. **Game loop dependency churn** — `useGameLoop` effect had `joystickValue`, `swipeImpulse`, `playerVel`, `colors` in dependency array, causing RAF restart every frame. Fixed by storing these in refs and only depending on `paused`.
2. **Duplicate playSfx calls** — `fireOnce()` called `playSfx('shoot_player')` twice per shot. Removed duplicate.
3. **Duplicate playSfx for powerup_pickup** — Same issue in powerup collection. Removed duplicate.
4. **Array allocation in collision detection** — Replaced `.filter()` with write-index compaction pattern (zero-allocation) for bullets, asteroids, missiles, powerups, and enemies.
5. **Inline render computations** — Moved `getShakeOffset()`, `hasPowerUp()`, and challenge lookup out of JSX props into variables.

---

## Summary

| # | Bug | Severity | Status |
|---|-----|----------|--------|
| 1 | Unknown module "2014" error | HIGH | **Fixed** |
| 2 | Background music null source | HIGH | **Fixed** |
| 3 | expo-av deprecation | LOW | **Fixed** |
| 4 | edge-to-edge setBackgroundColor | LOW | **Fixed** |
| 5 | Project ID undefined | INFO | Expected |
| P1 | App extremely slow | CRITICAL | **Fixed** |
