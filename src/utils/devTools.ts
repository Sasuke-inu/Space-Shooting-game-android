/**
 * Development utilities for testing theme unlock system
 * DO NOT USE IN PRODUCTION - For testing only
 *
 * Usage in React Native Debugger console:
 *   devTools.showAllThemes()
 *   devTools.testAllUnlocks()
 *   devTools.grantCredits(1000)
 *   devTools.unlockAchievement('boss_slayer')
 *   devTools.reachWave(15)
 */

import { useAchievementStore, useUpgradesStore, useThemeUnlockStore, checkAchievementThemeUnlocks, checkWaveThemeUnlocks } from '../state/progressStore';
import type { AchievementId } from '../types/game';
import type { ThemeId } from '../theme/types';

export const devTools = {
  /**
   * Grant credits for testing purchases
   */
  grantCredits(amount: number) {
    useUpgradesStore.getState().addCredits(amount);
    const total = useUpgradesStore.getState().credits;
    console.log(`✅ Granted ${amount} credits. Total: ${total}`);
    return total;
  },

  /**
   * Unlock achievement and trigger theme checks
   */
  unlockAchievement(achievementId: AchievementId) {
    useAchievementStore.getState().unlockAchievement(achievementId);
    checkAchievementThemeUnlocks(achievementId);
    console.log(`✅ Unlocked achievement: ${achievementId}`);

    // Check if any themes were unlocked
    const recentTheme = useThemeUnlockStore.getState().recentThemeUnlock;
    if (recentTheme) {
      console.log(`🎨 Theme unlocked: ${recentTheme}`);
    }
  },

  /**
   * Simulate reaching a wave to test wave-based unlocks
   */
  reachWave(wave: number) {
    checkWaveThemeUnlocks(wave);
    console.log(`✅ Simulated reaching wave ${wave}`);

    // Check if any themes were unlocked
    const recentTheme = useThemeUnlockStore.getState().recentThemeUnlock;
    if (recentTheme) {
      console.log(`🎨 Theme unlocked: ${recentTheme}`);
    }
  },

  /**
   * Purchase a theme (requires sufficient credits)
   */
  purchaseTheme(themeId: ThemeId) {
    const themeStore = useThemeUnlockStore.getState();
    const upgradesStore = useUpgradesStore.getState();
    const condition = themeStore.getUnlockCondition(themeId);

    if (condition.type !== 'purchase') {
      console.log(`❌ ${themeId} is not a purchasable theme (type: ${condition.type})`);
      return false;
    }

    const cost = condition.cost || 0;
    const credits = upgradesStore.credits;

    if (credits < cost) {
      console.log(`❌ Insufficient credits. Need ${cost}, have ${credits}`);
      return false;
    }

    const success = themeStore.purchaseTheme(themeId);
    if (success) {
      console.log(`✅ Purchased ${themeId} for ${cost} credits`);
      console.log(`💰 Remaining credits: ${useUpgradesStore.getState().credits}`);
    } else {
      console.log(`❌ Purchase failed for ${themeId}`);
    }

    return success;
  },

  /**
   * Check theme unlock status
   */
  checkTheme(themeId: ThemeId) {
    const themeStore = useThemeUnlockStore.getState();
    const unlocked = themeStore.isThemeUnlocked(themeId);
    const condition = themeStore.getUnlockDescription(themeId);

    console.log(`\n🎨 Theme: ${themeId}`);
    console.log(`   Status: ${unlocked ? '✅ Unlocked' : '🔒 Locked'}`);
    console.log(`   Condition: ${condition}`);

    return unlocked;
  },

  /**
   * Show all theme unlock status
   */
  showAllThemes() {
    const themeStore = useThemeUnlockStore.getState();
    const themes: ThemeId[] = [
      'neon-void',
      'nomad',
      'sakura',
      'forest-matrix',
      'inferno',
      'arctic',
      'halloween',
      'synthwave',
      'winter',
    ];

    console.log('\n=== 🎨 Theme Unlock Status ===');
    themes.forEach((theme) => {
      const unlocked = themeStore.isThemeUnlocked(theme);
      const condition = themeStore.getUnlockDescription(theme);
      const icon = unlocked ? '✅' : '🔒';
      console.log(`${icon} ${theme.padEnd(15)} - ${condition}`);
    });

    const unlockedCount = themeStore.unlockedThemes.length;
    console.log(`\n📊 Total: ${unlockedCount}/${themes.length} themes unlocked`);
  },

  /**
   * Quick test all unlock mechanisms
   */
  testAllUnlocks() {
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  Testing Theme Unlock System              ║');
    console.log('╚═══════════════════════════════════════════╝');

    // Test Halloween (achievement)
    console.log('\n1️⃣  Testing Halloween unlock (Boss Slayer achievement)');
    this.unlockAchievement('boss_slayer');
    this.checkTheme('halloween');

    // Test Synthwave (purchase)
    console.log('\n2️⃣  Testing Synthwave unlock (750 credits)');
    this.grantCredits(1000);
    this.purchaseTheme('synthwave');
    this.checkTheme('synthwave');

    // Test Winter (wave)
    console.log('\n3️⃣  Testing Winter unlock (wave 15)');
    this.reachWave(15);
    this.checkTheme('winter');

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  Test Complete - All Themes Unlocked!    ║');
    console.log('╚═══════════════════════════════════════════╝');

    // Show final status
    this.showAllThemes();
  },

  /**
   * Show current player resources
   */
  showResources() {
    const credits = useUpgradesStore.getState().credits;
    const achievements = useAchievementStore.getState().achievements;
    const unlockedCount = Object.values(achievements).filter((a) => a.unlocked).length;
    const totalAchievements = Object.keys(achievements).length;

    console.log('\n=== 📊 Player Resources ===');
    console.log(`💰 Credits: ${credits}`);
    console.log(`🏆 Achievements: ${unlockedCount}/${totalAchievements}`);
  },

  /**
   * Test specific theme unlock (by name)
   */
  testTheme(themeName: string) {
    const themeId = themeName.toLowerCase() as ThemeId;
    const themeStore = useThemeUnlockStore.getState();
    const condition = themeStore.getUnlockCondition(themeId);

    console.log(`\n=== Testing ${themeName} Theme ===`);

    switch (condition.type) {
      case 'default':
        console.log('ℹ️  This is a default theme (already unlocked)');
        break;

      case 'achievement':
        console.log(`📋 Unlock method: Complete achievement "${condition.requirement}"`);
        console.log('🔧 Testing unlock...');
        this.unlockAchievement(condition.requirement as AchievementId);
        break;

      case 'purchase':
        console.log(`💰 Unlock method: Purchase for ${condition.cost} credits`);
        console.log('🔧 Granting credits and purchasing...');
        this.grantCredits(condition.cost || 0);
        this.purchaseTheme(themeId);
        break;

      case 'wave':
        console.log(`🌊 Unlock method: Reach wave ${condition.requirement}`);
        console.log('🔧 Simulating wave progress...');
        this.reachWave(condition.requirement as number);
        break;
    }

    this.checkTheme(themeId);
  },
};

// Expose to global for easy console access in development
if (__DEV__) {
  (global as any).devTools = devTools;
  console.log('🛠️  Dev Tools loaded! Try: devTools.showAllThemes()');
}

export default devTools;
