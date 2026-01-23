import { Translations } from '../types';

export const en: Translations = {
  menu: {
    play: 'Play',
    settings: 'Settings',
    highScores: 'High Scores',
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
  },
  general: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    back: 'Back',
    on: 'On',
    off: 'Off',
  },
  tutorial: {
    title: 'Welcome to Space Shooter!',
    skip: 'Skip Tutorial',
    next: 'Next',
    movement: 'Use the joystick on the left to move your ship around. Practice dodging asteroids and enemies!',
    firing: 'Tap the fire button on the right to shoot. Hold it down for continuous fire, or enable Auto-Fire in settings.',
    powerups: 'Collect power-ups to gain temporary abilities: Shield (blue), Rapid Fire (red), Spread Shot (yellow), and Magnet (purple).',
    combos: 'Destroy enemies quickly to build combos! Chain kills within 2 seconds to multiply your score up to 3x.',
    abilities: 'Each ship has a special ability. Tap the ability button when charged to unleash powerful effects!',
    complete: 'You\'re ready! Good luck, Commander. May the stars be with you.',
  },
};
