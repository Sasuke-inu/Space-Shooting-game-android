import { Translations } from '../types';

export const en: Translations = {
  menu: {
    play: 'Play',
    settings: 'Settings',
    highScores: 'High Scores',
    ships: 'Ships',
    quit: 'Quit',
  },
  game: {
    score: 'Score',
    wave: 'Wave',
    lives: 'Lives',
    hull: 'Hull',
    combo: 'Combo',
    paused: 'Paused',
    gameOver: 'Game Over',
    restart: 'Restart',
    mainMenu: 'Main Menu',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    theme: 'Theme',
    sound: 'Sound Effects',
    music: 'Music',
    vibration: 'Vibration',
    controls: 'Controls',
    sensitivity: 'Joystick Sensitivity',
    joystickSize: 'Joystick Size',
    autoFire: 'Auto-Fire',
    invertY: 'Invert Y-Axis',
    general: 'General',
    account: 'Account',
    resetProgress: 'Reset Progress',
    resetSettings: 'Reset Settings',
    resetProgressConfirm: 'Are you sure you want to reset all progress? This cannot be undone.',
    resetSettingsConfirm: 'Are you sure you want to reset all settings to default?',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
  },
  ships: {
    selectShip: 'Select Ship',
    compareShips: 'Compare Ships',
    locked: 'Locked',
    selected: 'Selected',
    insufficientCredits: 'Insufficient Credits',
    specialAbility: 'Special Ability',
    cooldown: 'Cooldown',
    fighter: {
      name: 'Fighter',
      description: 'Balanced ship with good speed and firepower',
    },
    scout: {
      name: 'Scout',
      description: 'Fast and agile, perfect for dodging',
    },
    tank: {
      name: 'Tank',
      description: 'Heavy armor and powerful weapons, but slow',
    },
    interceptor: {
      name: 'Interceptor',
      description: 'Lightning fast with rapid-fire capabilities',
    },
    support: {
      name: 'Support',
      description: 'Healing ship that repairs hull mid-combat',
    },
    stealth: {
      name: 'Stealth',
      description: 'Cloaking ship that phases through enemies',
    },
    heavy: {
      name: 'Heavy',
      description: 'Devastating firepower with charged attacks',
    },
  },
  achievements: {
    firstKill: {
      name: 'First Blood',
      description: 'Destroy your first enemy',
    },
    sharpshooter: {
      name: 'Sharpshooter',
      description: 'Achieve 90% accuracy in a game',
    },
    survivor: {
      name: 'Survivor',
      description: 'Complete a game without dying',
    },
    waveRider: {
      name: 'Wave Rider',
      description: 'Reach wave 10',
    },
    destroyer: {
      name: 'Destroyer',
      description: 'Destroy 100 enemies in one game',
    },
    untouchable: {
      name: 'Untouchable',
      description: 'Take no damage for 60 seconds',
    },
    speedDemon: {
      name: 'Speed Demon',
      description: 'Reach wave 5 in under 2 minutes',
    },
    comboMaster: {
      name: 'Combo Master',
      description: 'Achieve a 20x combo',
    },
    closeCall: {
      name: 'Close Call',
      description: 'Survive with 1% hull remaining',
    },
    bulletHell: {
      name: 'Bullet Hell',
      description: 'Fire 1000 bullets in one game',
    },
    asteroid: {
      name: 'Asteroid Hunter',
      description: 'Destroy 50 asteroids',
    },
    veteran: {
      name: 'Veteran',
      description: 'Play 50 games',
    },
  },
  stats: {
    gamesPlayed: 'Games Played',
    totalScore: 'Total Score',
    highScore: 'High Score',
    totalKills: 'Total Kills',
    accuracy: 'Accuracy',
    longestStreak: 'Longest Streak',
    highestWave: 'Highest Wave',
    totalPlayTime: 'Total Play Time',
    averageScore: 'Average Score',
    totalDeaths: 'Total Deaths',
    speed: 'Speed',
    fireRate: 'Fire Rate',
    damage: 'Damage',
    hull: 'Hull',
  },
  enemyTypes: {
    scout: 'Scout',
    tank: 'Tank',
    sniper: 'Sniper',
    bomber: 'Bomber',
    healer: 'Healer',
    juggernaut: 'Juggernaut',
  },
  bossTypes: {
    destroyer: 'Destroyer',
    carrier: 'Carrier',
    dreadnought: 'Dreadnought',
    mothership: 'Mothership',
  },
  statistics: {
    title: 'Statistics',
    tabs: {
      overview: 'Overview',
      perShip: 'Per-Ship Stats',
      achievements: 'Achievements',
    },
    charts: {
      scoreProgression: 'Score Progression',
      killsByType: 'Kills by Type',
      waveProgression: 'Wave Progression',
      playTimeByShip: 'Play Time by Ship',
    },
    labels: {
      bestCombo: 'Best Combo',
      bossKills: 'Boss Kills',
      powerUpsCollected: 'Power-Ups Collected',
      favoriteShip: 'Favorite Ship',
      noDataYet: 'No data yet',
      playToUnlock: 'Play to unlock',
    },
  },
  general: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    back: 'Back',
    on: 'On',
    off: 'Off',
    credits: 'Credits',
  },
  skins: {
    fighter: {
      default: {
        name: 'Standard',
        description: 'Classic fighter colors',
      },
      stealth: {
        name: 'Stealth',
        description: 'Dark ops paint scheme',
      },
      neon: {
        name: 'Neon',
        description: 'Bright cyberpunk style',
      },
      gold: {
        name: 'Gold',
        description: 'Premium golden finish',
      },
      veteran: {
        name: 'Veteran',
        description: 'Elite pilot colors',
      },
    },
    scout: {
      default: {
        name: 'Standard',
        description: 'Standard scout colors',
      },
      stealth: {
        name: 'Stealth',
        description: 'Shadow runner scheme',
      },
      neon: {
        name: 'Neon',
        description: 'High-speed racer style',
      },
      gold: {
        name: 'Gold',
        description: 'Champion runner finish',
      },
      veteran: {
        name: 'Veteran',
        description: 'Speed demon colors',
      },
    },
    tank: {
      default: {
        name: 'Standard',
        description: 'Standard tank colors',
      },
      stealth: {
        name: 'Stealth',
        description: 'Heavy armor black',
      },
      neon: {
        name: 'Neon',
        description: 'Enforcer glow scheme',
      },
      gold: {
        name: 'Gold',
        description: 'Fortress gold plating',
      },
      veteran: {
        name: 'Veteran',
        description: 'Battle-hardened colors',
      },
    },
    interceptor: {
      default: {
        name: 'Standard',
        description: 'Standard interceptor colors',
      },
      stealth: {
        name: 'Stealth',
        description: 'Silent hunter scheme',
      },
      neon: {
        name: 'Neon',
        description: 'Lightning strike style',
      },
      gold: {
        name: 'Gold',
        description: 'Ace pilot finish',
      },
      veteran: {
        name: 'Veteran',
        description: 'EMP specialist colors',
      },
    },
    support: {
      default: {
        name: 'Standard',
        description: 'Standard support colors',
      },
      stealth: {
        name: 'Stealth',
        description: 'Covert medic scheme',
      },
      neon: {
        name: 'Neon',
        description: 'Bio-luminescent healer style',
      },
      gold: {
        name: 'Gold',
        description: 'Sacred guardian finish',
      },
      veteran: {
        name: 'Veteran',
        description: 'Field surgeon colors',
      },
    },
    stealth: {
      default: {
        name: 'Standard',
        description: 'Standard stealth colors',
      },
      stealth: {
        name: 'Stealth',
        description: 'Ghost operative scheme',
      },
      neon: {
        name: 'Neon',
        description: 'Phase shift style',
      },
      gold: {
        name: 'Gold',
        description: 'Phantom elite finish',
      },
      veteran: {
        name: 'Veteran',
        description: 'Shadow assassin colors',
      },
    },
    heavy: {
      default: {
        name: 'Standard',
        description: 'Standard heavy colors',
      },
      stealth: {
        name: 'Stealth',
        description: 'Dark destroyer scheme',
      },
      neon: {
        name: 'Neon',
        description: 'Plasma cannon style',
      },
      gold: {
        name: 'Gold',
        description: 'Warship admiral finish',
      },
      veteran: {
        name: 'Veteran',
        description: 'Siege breaker colors',
      },
    },
  },
  leaderboard: {
    title: 'Leaderboard',
    rank: 'Rank',
    name: 'Name',
    score: 'Score',
    wave: 'Wave',
    noScores: 'No scores yet. Play a game to set your first record!',
    close: 'Close',
  },
  challenges: {
    title: 'Daily Challenges',
    daily: 'Daily',
    progress: 'Progress',
    reward: 'Reward',
    complete: 'Complete',
    completed: 'Completed',
    refresh: 'Refresh',
    refreshIn: 'Refreshes in',
    noActiveChallenges: 'No active challenges',
    killCount: {
      name: 'Enemy Hunter',
      description: 'Destroy enemies in battle',
    },
    combo: {
      name: 'Combo Master',
      description: 'Achieve a combo streak',
    },
    survival: {
      name: 'Survivor',
      description: 'Survive multiple waves',
    },
    boss: {
      name: 'Boss Slayer',
      description: 'Defeat powerful bosses',
    },
    accuracy: {
      name: 'Sharpshooter',
      description: 'Maintain high accuracy',
    },
    powerUp: {
      name: 'Power Collector',
      description: 'Collect power-ups',
    },
    noDamage: {
      name: 'Untouchable',
      description: 'Complete waves without taking damage',
    },
  },
  weeklyEvent: {
    title: 'Weekly Event',
    activeEvent: 'Active Event',
    noActiveEvent: 'No active event. Check back soon!',
    eventModifiers: 'Event Modifiers',
    rewards: 'Rewards',
    playEvent: 'Play Event',
    viewLeaderboard: 'View Leaderboard',
    leaderboard: 'Event Leaderboard',
    timeRemaining: 'Time Remaining',
    eventEnded: 'Event Ended',
    remaining: 'remaining',
    participation: 'Participation',
    firstPlace: '1st Place',
    secondPlace: '2nd Place',
    thirdPlace: '3rd Place',
    topTen: 'Top 10',
    modifiers: {
      double_speed: {
        name: 'Double Speed',
        description: 'Enemies and asteroids move twice as fast',
      },
      no_powerups: {
        name: 'No Power-Ups',
        description: 'Power-ups do not drop',
      },
      rapid_bosses: {
        name: 'Rapid Bosses',
        description: 'Boss appears every 3 waves',
      },
      bullet_hell: {
        name: 'Bullet Hell',
        description: 'Enemies fire 3x faster',
      },
      glass_cannon: {
        name: 'Glass Cannon',
        description: 'You have only 1 HP but deal 2x damage',
      },
      big_asteroids: {
        name: 'Big Asteroids',
        description: 'Asteroids are 1.5x larger',
      },
    },
  },
};
