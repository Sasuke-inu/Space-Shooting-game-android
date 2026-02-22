export type LanguageCode = 'en' | 'es' | 'zh' | 'ja' | 'ko';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export interface Translations {
  menu: {
    play: string;
    settings: string;
    highScores: string;
    ships: string;
    quit: string;
  };
  game: {
    score: string;
    wave: string;
    lives: string;
    hull: string;
    combo: string;
    paused: string;
    gameOver: string;
    restart: string;
    mainMenu: string;
  };
  settings: {
    title: string;
    language: string;
    theme: string;
    sound: string;
    music: string;
    vibration: string;
    controls: string;
    sensitivity: string;
    joystickSize: string;
    autoFire: string;
    invertY: string;
    general: string;
    account: string;
    resetProgress: string;
    resetSettings: string;
    resetProgressConfirm: string;
    resetSettingsConfirm: string;
    small: string;
    medium: string;
    large: string;
  };
  ships: {
    selectShip: string;
    compareShips: string;
    locked: string;
    selected: string;
    insufficientCredits: string;
    specialAbility: string;
    cooldown: string;
    fighter: {
      name: string;
      description: string;
    };
    scout: {
      name: string;
      description: string;
    };
    tank: {
      name: string;
      description: string;
    };
    interceptor: {
      name: string;
      description: string;
    };
    support: {
      name: string;
      description: string;
    };
    stealth: {
      name: string;
      description: string;
    };
    heavy: {
      name: string;
      description: string;
    };
  };
  achievements: {
    firstKill: {
      name: string;
      description: string;
    };
    sharpshooter: {
      name: string;
      description: string;
    };
    survivor: {
      name: string;
      description: string;
    };
    waveRider: {
      name: string;
      description: string;
    };
    destroyer: {
      name: string;
      description: string;
    };
    untouchable: {
      name: string;
      description: string;
    };
    speedDemon: {
      name: string;
      description: string;
    };
    comboMaster: {
      name: string;
      description: string;
    };
    closeCall: {
      name: string;
      description: string;
    };
    bulletHell: {
      name: string;
      description: string;
    };
    asteroid: {
      name: string;
      description: string;
    };
    veteran: {
      name: string;
      description: string;
    };
  };
  stats: {
    gamesPlayed: string;
    totalScore: string;
    highScore: string;
    totalKills: string;
    accuracy: string;
    longestStreak: string;
    highestWave: string;
    totalPlayTime: string;
    averageScore: string;
    totalDeaths: string;
    speed: string;
    fireRate: string;
    damage: string;
    hull: string;
  };
  statistics: {
    title: string;
    totalKills: string;
    totalDeaths: string;
    bossesDefeated: string;
    asteroidsDestroyed: string;
    accuracy: string;
    highestCombo: string;
    totalPlayTime: string;
    averageWave: string;
    longestSurvivalTime: string;
    damageDealt: string;
    damageTaken: string;
    powerUpsCollected: string;
    sectionOverview: string;
    sectionCombat: string;
    sectionEnemyKills: string;
    sectionBossKills: string;
    sectionProgress: string;
    sectionAchievements: string;
    sectionShooting: string;
    sectionFavorites: string;
    sectionRecentSession: string;
    kdRatio: string;
    unlocked: string;
    completion: string;
    shotsFired: string;
    shotsHit: string;
    bestAccuracy: string;
    shotsMissed: string;
    favoriteShip: string;
    favoriteTheme: string;
    unlockedOn: string;
    sessionScore: string;
    sessionWave: string;
    sessionKills: string;
    sessionAccuracy: string;
    sessionTime: string;
    noRecentSession: string;
  };
  enemyTypes: {
    scout: string;
    tank: string;
    sniper: string;
    bomber: string;
    healer: string;
    juggernaut: string;
  };
  bossTypes: {
    destroyer: string;
    carrier: string;
    dreadnought: string;
    mothership: string;
  };
  statistics: {
    title: string;
    tabs: {
      overview: string;
      perShip: string;
      achievements: string;
    };
    charts: {
      scoreProgression: string;
      killsByType: string;
      waveProgression: string;
      playTimeByShip: string;
    };
    labels: {
      bestCombo: string;
      bossKills: string;
      powerUpsCollected: string;
      favoriteShip: string;
      noDataYet: string;
      playToUnlock: string;
    };
  };
  general: {
    confirm: string;
    cancel: string;
    save: string;
    back: string;
    on: string;
    off: string;
    credits: string;
  };
  skins: {
    fighter: {
      default: {
        name: string;
        description: string;
      };
      stealth: {
        name: string;
        description: string;
      };
      neon: {
        name: string;
        description: string;
      };
      gold: {
        name: string;
        description: string;
      };
      veteran: {
        name: string;
        description: string;
      };
    };
    scout: {
      default: {
        name: string;
        description: string;
      };
      stealth: {
        name: string;
        description: string;
      };
      neon: {
        name: string;
        description: string;
      };
      gold: {
        name: string;
        description: string;
      };
      veteran: {
        name: string;
        description: string;
      };
    };
    tank: {
      default: {
        name: string;
        description: string;
      };
      stealth: {
        name: string;
        description: string;
      };
      neon: {
        name: string;
        description: string;
      };
      gold: {
        name: string;
        description: string;
      };
      veteran: {
        name: string;
        description: string;
      };
    };
    interceptor: {
      default: {
        name: string;
        description: string;
      };
      stealth: {
        name: string;
        description: string;
      };
      neon: {
        name: string;
        description: string;
      };
      gold: {
        name: string;
        description: string;
      };
      veteran: {
        name: string;
        description: string;
      };
    };
    support: {
      default: {
        name: string;
        description: string;
      };
      stealth: {
        name: string;
        description: string;
      };
      neon: {
        name: string;
        description: string;
      };
      gold: {
        name: string;
        description: string;
      };
      veteran: {
        name: string;
        description: string;
      };
    };
    stealth: {
      default: {
        name: string;
        description: string;
      };
      stealth: {
        name: string;
        description: string;
      };
      neon: {
        name: string;
        description: string;
      };
      gold: {
        name: string;
        description: string;
      };
      veteran: {
        name: string;
        description: string;
      };
    };
    heavy: {
      default: {
        name: string;
        description: string;
      };
      stealth: {
        name: string;
        description: string;
      };
      neon: {
        name: string;
        description: string;
      };
      gold: {
        name: string;
        description: string;
      };
      veteran: {
        name: string;
        description: string;
      };
    };
  };
  leaderboard: {
    title: string;
    rank: string;
    name: string;
    score: string;
    wave: string;
    noScores: string;
    close: string;
  };
  challenges: {
    title: string;
    daily: string;
    progress: string;
    reward: string;
    complete: string;
    completed: string;
    refresh: string;
    refreshIn: string;
    noActiveChallenges: string;
    killCount: {
      name: string;
      description: string;
    };
    combo: {
      name: string;
      description: string;
    };
    survival: {
      name: string;
      description: string;
    };
    boss: {
      name: string;
      description: string;
    };
    accuracy: {
      name: string;
      description: string;
    };
    powerUp: {
      name: string;
      description: string;
    };
    noDamage: {
      name: string;
      description: string;
    };
  };
  weeklyEvent: {
    title: string;
    activeEvent: string;
    noActiveEvent: string;
    eventModifiers: string;
    rewards: string;
    playEvent: string;
    viewLeaderboard: string;
    leaderboard: string;
    timeRemaining: string;
    eventEnded: string;
    remaining: string;
    participation: string;
    firstPlace: string;
    secondPlace: string;
    thirdPlace: string;
    topTen: string;
    modifiers: {
      double_speed: {
        name: string;
        description: string;
      };
      no_powerups: {
        name: string;
        description: string;
      };
      rapid_bosses: {
        name: string;
        description: string;
      };
      bullet_hell: {
        name: string;
        description: string;
      };
      glass_cannon: {
        name: string;
        description: string;
      };
      big_asteroids: {
        name: string;
        description: string;
      };
    };
  };
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
];
