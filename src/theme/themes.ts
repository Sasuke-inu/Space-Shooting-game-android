// ------------------------------------------------------------------ //
//                         Theme Definitions
// ------------------------------------------------------------------ //

import type { GameTheme, ThemeId } from './types'

// Helper to create rgba from hex with alpha
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// ------------------------------------------------------------------ //
//                         1. Neon Void (Default)
// ------------------------------------------------------------------ //
export const neonVoidTheme: GameTheme = {
  id: 'neon-void',
  name: 'Neon Void',
  description: 'Cyberpunk neon aesthetic',
  icon: '🌊',

  colors: {
    // Canvas
    background: '#0a121c',
    backgroundRgba: 'rgba(10, 18, 28, 1)',
    stars: 'rgba(17, 51, 51, 0.7)',

    // Player
    playerShip: '#8ff',
    playerShipFill: 'rgba(136, 255, 255, 0.12)',
    playerBullet: '#ffffff',
    thrusterFlame: '#ff9',

    // Enemies
    enemyShip: '#f9a',
    enemyShipFill: 'rgba(255, 120, 160, 0.12)',
    enemyBullet: '#ff6688',
    enemyTank: '#ff6666',
    enemySniper: '#9966ff',
    enemyBomber: '#ff9933',

    // Objects
    asteroid: '#bdf',
    particle: '#8ff',
    particleHit: '#bdf',
    particleExplosion: '#f9a',
    particleDamage: '#ff6666',
    particleCollision: '#ffff99',

    // HUD
    hudText: '#bdf',
    hudAccent: '#8ff',
    hullBar: '#2aefc9',
    hullBarBg: '#8ff',

    // UI
    panelBg: '#0f1c28',
    panelBorder: '#21445e',
    buttonPrimary: '#2aefc9',
    buttonSecondary: '#163247',
    buttonText: '#0a121c',
    modalOverlay: 'rgba(0, 0, 0, 0.8)',
    textPrimary: '#2aefc9',
    textSecondary: '#8ff',
    textMuted: '#cfe',

    // Controls
    joystickPad: 'rgba(12, 24, 36, 0.5)',
    joystickStick: '#2aefc9',
    joystickBorder: '#21445e',
    joystickGlow: 'rgba(39, 200, 210, 0.55)',

    // Power-ups
    powerUpShield: '#4da6ff',
    powerUpRapidFire: '#ff4d4d',
    powerUpSpreadShot: '#ffdd4d',
    powerUpMagnet: '#d94dff',
    powerUpScoreMultiplier: '#ff9933',

    // Combo
    comboText: '#ffdd4d',
    comboGlow: 'rgba(255, 221, 77, 0.6)',

    // Parallax
    parallaxDistantStars: 'rgba(136, 255, 255, 0.15)',
    parallaxNebula: 'rgba(42, 239, 201, 0.08)',
    parallaxDebris: 'rgba(136, 255, 255, 0.25)',
  },
}

// ------------------------------------------------------------------ //
//                         2. Nomad (Desert Drifter)
// ------------------------------------------------------------------ //
export const nomadTheme: GameTheme = {
  id: 'nomad',
  name: 'Nomad',
  description: 'Desert drifter sandstorm',
  icon: '🏜️',

  colors: {
    // Canvas
    background: '#1a1510',
    backgroundRgba: 'rgba(26, 21, 16, 1)',
    stars: 'rgba(85, 68, 51, 0.5)',

    // Player
    playerShip: '#f0c070',
    playerShipFill: 'rgba(240, 192, 112, 0.15)',
    playerBullet: '#ffe4b5',
    thrusterFlame: '#ff8c00',

    // Enemies
    enemyShip: '#c45c3e',
    enemyShipFill: 'rgba(196, 92, 62, 0.15)',
    enemyBullet: '#ff6347',
    enemyTank: '#a0522d',
    enemySniper: '#8b4789',
    enemyBomber: '#d2691e',

    // Objects
    asteroid: '#8b7355',
    particle: '#d4a574',
    particleHit: '#e8a54b',
    particleExplosion: '#c45c3e',
    particleDamage: '#ff6347',
    particleCollision: '#ffd700',

    // HUD
    hudText: '#d4a574',
    hudAccent: '#e8a54b',
    hullBar: '#e8a54b',
    hullBarBg: '#8b7355',

    // UI
    panelBg: '#1f1a14',
    panelBorder: '#4a3c2a',
    buttonPrimary: '#e8a54b',
    buttonSecondary: '#2d2418',
    buttonText: '#1a1510',
    modalOverlay: 'rgba(0, 0, 0, 0.85)',
    textPrimary: '#e8a54b',
    textSecondary: '#d4a574',
    textMuted: '#b89a7a',

    // Controls
    joystickPad: 'rgba(45, 36, 24, 0.6)',
    joystickStick: '#e8a54b',
    joystickBorder: '#4a3c2a',
    joystickGlow: 'rgba(232, 165, 75, 0.5)',

    // Power-ups
    powerUpShield: '#87ceeb',
    powerUpRapidFire: '#ff6347',
    powerUpSpreadShot: '#ffd700',
    powerUpMagnet: '#dda0dd',
    powerUpScoreMultiplier: '#ff8c42',

    // Combo
    comboText: '#ffd700',
    comboGlow: 'rgba(255, 215, 0, 0.6)',

    // Parallax
    parallaxDistantStars: 'rgba(240, 192, 112, 0.12)',
    parallaxNebula: 'rgba(212, 165, 116, 0.1)',
    parallaxDebris: 'rgba(232, 165, 75, 0.2)',
  },
}

// ------------------------------------------------------------------ //
//                         3. Sakura (Cherry Blossom)
// ------------------------------------------------------------------ //
export const sakuraTheme: GameTheme = {
  id: 'sakura',
  name: 'Sakura',
  description: 'Japanese cherry blossom',
  icon: '🌸',

  colors: {
    // Canvas
    background: '#1a0f18',
    backgroundRgba: 'rgba(26, 15, 24, 1)',
    stars: 'rgba(255, 182, 193, 0.3)',

    // Player
    playerShip: '#a2d2ff',
    playerShipFill: 'rgba(162, 210, 255, 0.15)',
    playerBullet: '#e0ffff',
    thrusterFlame: '#ffb7c5',

    // Enemies
    enemyShip: '#ff5c8a',
    enemyShipFill: 'rgba(255, 92, 138, 0.15)',
    enemyBullet: '#ff1493',
    enemyTank: '#ff6b9d',
    enemySniper: '#da70d6',
    enemyBomber: '#ff8c69',

    // Objects
    asteroid: '#cdb4db',
    particle: '#ffc8dd',
    particleHit: '#ffafcc',
    particleExplosion: '#ff5c8a',
    particleDamage: '#ff6b9d',
    particleCollision: '#fff44f',

    // HUD
    hudText: '#ffc8dd',
    hudAccent: '#ff8fab',
    hullBar: '#ff8fab',
    hullBarBg: '#cdb4db',

    // UI
    panelBg: '#1f141c',
    panelBorder: '#5c3d5e',
    buttonPrimary: '#ff8fab',
    buttonSecondary: '#2d1f2a',
    buttonText: '#1a0f18',
    modalOverlay: 'rgba(0, 0, 0, 0.8)',
    textPrimary: '#ff8fab',
    textSecondary: '#ffc8dd',
    textMuted: '#e8c1d0',

    // Controls
    joystickPad: 'rgba(45, 31, 42, 0.6)',
    joystickStick: '#ff8fab',
    joystickBorder: '#5c3d5e',
    joystickGlow: 'rgba(255, 143, 171, 0.5)',

    // Power-ups
    powerUpShield: '#a2d2ff',
    powerUpRapidFire: '#ff6b9d',
    powerUpSpreadShot: '#fff44f',
    powerUpMagnet: '#da70d6',
    powerUpScoreMultiplier: '#ffb347',

    // Combo
    comboText: '#fff44f',
    comboGlow: 'rgba(255, 244, 79, 0.6)',

    // Parallax
    parallaxDistantStars: 'rgba(255, 200, 221, 0.15)',
    parallaxNebula: 'rgba(255, 143, 171, 0.1)',
    parallaxDebris: 'rgba(255, 175, 204, 0.22)',
  },
}

// ------------------------------------------------------------------ //
//                         4. Forest Matrix
// ------------------------------------------------------------------ //
export const forestMatrixTheme: GameTheme = {
  id: 'forest-matrix',
  name: 'Forest Matrix',
  description: 'Green hacker aesthetic',
  icon: '🌲',

  colors: {
    // Canvas
    background: '#0a140a',
    backgroundRgba: 'rgba(10, 20, 10, 1)',
    stars: 'rgba(57, 255, 20, 0.2)',

    // Player
    playerShip: '#00ff7f',
    playerShipFill: 'rgba(0, 255, 127, 0.12)',
    playerBullet: '#adff2f',
    thrusterFlame: '#7fff00',

    // Enemies
    enemyShip: '#ff4500',
    enemyShipFill: 'rgba(255, 69, 0, 0.12)',
    enemyBullet: '#ff6b35',
    enemyTank: '#ff5733',
    enemySniper: '#ff1493',
    enemyBomber: '#ff8c00',

    // Objects
    asteroid: '#228b22',
    particle: '#39ff14',
    particleHit: '#7fff00',
    particleExplosion: '#ff4500',
    particleDamage: '#ff6b35',
    particleCollision: '#adff2f',

    // HUD
    hudText: '#7fff00',
    hudAccent: '#39ff14',
    hullBar: '#39ff14',
    hullBarBg: '#228b22',

    // UI
    panelBg: '#0f1a0f',
    panelBorder: '#2d5a2d',
    buttonPrimary: '#39ff14',
    buttonSecondary: '#1a2d1a',
    buttonText: '#0a140a',
    modalOverlay: 'rgba(0, 0, 0, 0.85)',
    textPrimary: '#39ff14',
    textSecondary: '#7fff00',
    textMuted: '#90ee90',

    // Controls
    joystickPad: 'rgba(26, 45, 26, 0.6)',
    joystickStick: '#39ff14',
    joystickBorder: '#2d5a2d',
    joystickGlow: 'rgba(57, 255, 20, 0.5)',

    // Power-ups
    powerUpShield: '#00bfff',
    powerUpRapidFire: '#ff4500',
    powerUpSpreadShot: '#ffd700',
    powerUpMagnet: '#9932cc',
    powerUpScoreMultiplier: '#ff8800',

    // Combo
    comboText: '#ffd700',
    comboGlow: 'rgba(255, 215, 0, 0.6)',

    // Parallax
    parallaxDistantStars: 'rgba(57, 255, 20, 0.12)',
    parallaxNebula: 'rgba(127, 255, 0, 0.08)',
    parallaxDebris: 'rgba(0, 255, 127, 0.2)',
  },
}

// ------------------------------------------------------------------ //
//                         5. Inferno
// ------------------------------------------------------------------ //
export const infernoTheme: GameTheme = {
  id: 'inferno',
  name: 'Inferno',
  description: 'Volcanic fire and flames',
  icon: '🔥',

  colors: {
    // Canvas
    background: '#140a0a',
    backgroundRgba: 'rgba(20, 10, 10, 1)',
    stars: 'rgba(255, 69, 0, 0.25)',

    // Player
    playerShip: '#ffd700',
    playerShipFill: 'rgba(255, 215, 0, 0.15)',
    playerBullet: '#ffff00',
    thrusterFlame: '#ff4500',

    // Enemies
    enemyShip: '#8b0000',
    enemyShipFill: 'rgba(139, 0, 0, 0.15)',
    enemyBullet: '#dc143c',
    enemyTank: '#b22222',
    enemySniper: '#8b008b',
    enemyBomber: '#ff4500',

    // Objects
    asteroid: '#cd5c5c',
    particle: '#ff6b35',
    particleHit: '#ff4500',
    particleExplosion: '#ffd700',
    particleDamage: '#dc143c',
    particleCollision: '#ffff00',

    // HUD
    hudText: '#ff6b35',
    hudAccent: '#ff4500',
    hullBar: '#ff4500',
    hullBarBg: '#8b0000',

    // UI
    panelBg: '#1a0f0f',
    panelBorder: '#5a2d2d',
    buttonPrimary: '#ff4500',
    buttonSecondary: '#2d1a1a',
    buttonText: '#140a0a',
    modalOverlay: 'rgba(0, 0, 0, 0.85)',
    textPrimary: '#ff4500',
    textSecondary: '#ff6b35',
    textMuted: '#cd8c8c',

    // Controls
    joystickPad: 'rgba(45, 26, 26, 0.6)',
    joystickStick: '#ff4500',
    joystickBorder: '#5a2d2d',
    joystickGlow: 'rgba(255, 69, 0, 0.5)',

    // Power-ups
    powerUpShield: '#4169e1',
    powerUpRapidFire: '#ff0000',
    powerUpSpreadShot: '#ffd700',
    powerUpMagnet: '#9400d3',
    powerUpScoreMultiplier: '#ffaa00',

    // Combo
    comboText: '#ffd700',
    comboGlow: 'rgba(255, 215, 0, 0.6)',

    // Parallax
    parallaxDistantStars: 'rgba(255, 107, 53, 0.15)',
    parallaxNebula: 'rgba(255, 69, 0, 0.12)',
    parallaxDebris: 'rgba(255, 215, 0, 0.25)',
  },
}

// ------------------------------------------------------------------ //
//                         6. Arctic
// ------------------------------------------------------------------ //
export const arcticTheme: GameTheme = {
  id: 'arctic',
  name: 'Arctic',
  description: 'Cold icy minimal',
  icon: '❄️',

  colors: {
    // Canvas
    background: '#0a1014',
    backgroundRgba: 'rgba(10, 16, 20, 1)',
    stars: 'rgba(176, 224, 230, 0.3)',

    // Player
    playerShip: '#ffffff',
    playerShipFill: 'rgba(255, 255, 255, 0.12)',
    playerBullet: '#f0ffff',
    thrusterFlame: '#87ceeb',

    // Enemies
    enemyShip: '#4169e1',
    enemyShipFill: 'rgba(65, 105, 225, 0.15)',
    enemyBullet: '#1e90ff',
    enemyTank: '#5f9ea0',
    enemySniper: '#9370db',
    enemyBomber: '#ff8c69',

    // Objects
    asteroid: '#b0c4de',
    particle: '#e0f7ff',
    particleHit: '#87ceeb',
    particleExplosion: '#4169e1',
    particleDamage: '#ff6b6b',
    particleCollision: '#f0ffff',

    // HUD
    hudText: '#b0c4de',
    hudAccent: '#e0f7ff',
    hullBar: '#87ceeb',
    hullBarBg: '#4682b4',

    // UI
    panelBg: '#0f151a',
    panelBorder: '#3d5a6e',
    buttonPrimary: '#87ceeb',
    buttonSecondary: '#1a2530',
    buttonText: '#0a1014',
    modalOverlay: 'rgba(0, 0, 0, 0.8)',
    textPrimary: '#e0f7ff',
    textSecondary: '#87ceeb',
    textMuted: '#a0c4d4',

    // Controls
    joystickPad: 'rgba(26, 37, 48, 0.6)',
    joystickStick: '#87ceeb',
    joystickBorder: '#3d5a6e',
    joystickGlow: 'rgba(135, 206, 235, 0.5)',

    // Power-ups
    powerUpShield: '#00bfff',
    powerUpRapidFire: '#ff6347',
    powerUpSpreadShot: '#ffd700',
    powerUpMagnet: '#da70d6',
    powerUpScoreMultiplier: '#ff9f4a',

    // Combo
    comboText: '#ffd700',
    comboGlow: 'rgba(255, 215, 0, 0.6)',

    // Parallax
    parallaxDistantStars: 'rgba(176, 224, 230, 0.15)',
    parallaxNebula: 'rgba(135, 206, 235, 0.1)',
    parallaxDebris: 'rgba(224, 247, 255, 0.22)',
  },
}

// ------------------------------------------------------------------ //
//                         7. Halloween
// ------------------------------------------------------------------ //
export const halloweenTheme: GameTheme = {
  id: 'halloween',
  name: 'Halloween',
  description: 'Spooky orange and purple',
  icon: '🎃',

  colors: {
    // Canvas
    background: '#0f0a14',
    backgroundRgba: 'rgba(15, 10, 20, 1)',
    stars: 'rgba(138, 43, 226, 0.3)',

    // Player
    playerShip: '#ff8c00',
    playerShipFill: 'rgba(255, 140, 0, 0.15)',
    playerBullet: '#ffa500',
    thrusterFlame: '#ff6347',

    // Enemies
    enemyShip: '#9370db',
    enemyShipFill: 'rgba(147, 112, 219, 0.15)',
    enemyBullet: '#8a2be2',
    enemyTank: '#d2691e',
    enemySniper: '#800080',
    enemyBomber: '#ff4500',

    // Objects
    asteroid: '#4b3a5a',
    particle: '#ff8c00',
    particleHit: '#ffa500',
    particleExplosion: '#9370db',
    particleDamage: '#dc143c',
    particleCollision: '#ff4500',

    // HUD
    hudText: '#ff8c00',
    hudAccent: '#ffa500',
    hullBar: '#ff8c00',
    hullBarBg: '#4b3a5a',

    // UI
    panelBg: '#14101a',
    panelBorder: '#4b2d6e',
    buttonPrimary: '#ff8c00',
    buttonSecondary: '#1f1a28',
    buttonText: '#0f0a14',
    modalOverlay: 'rgba(0, 0, 0, 0.85)',
    textPrimary: '#ff8c00',
    textSecondary: '#ffa500',
    textMuted: '#d4a574',

    // Controls
    joystickPad: 'rgba(31, 26, 40, 0.6)',
    joystickStick: '#ff8c00',
    joystickBorder: '#4b2d6e',
    joystickGlow: 'rgba(255, 140, 0, 0.55)',

    // Power-ups
    powerUpShield: '#4169e1',
    powerUpRapidFire: '#ff4500',
    powerUpSpreadShot: '#ffd700',
    powerUpMagnet: '#9370db',
    powerUpScoreMultiplier: '#ffd700',

    // Combo
    comboText: '#ffd700',
    comboGlow: 'rgba(255, 215, 0, 0.6)',

    // Parallax
    parallaxDistantStars: 'rgba(138, 43, 226, 0.15)',
    parallaxNebula: 'rgba(255, 69, 0, 0.1)',
    parallaxDebris: 'rgba(147, 112, 219, 0.2)',
  },
}

// ------------------------------------------------------------------ //
//                         8. Synthwave
// ------------------------------------------------------------------ //
export const synthwaveTheme: GameTheme = {
  id: 'synthwave',
  name: 'Synthwave',
  description: 'Retro 80s neon dreams',
  icon: '🌆',

  colors: {
    // Canvas
    background: '#0a0a1a',
    backgroundRgba: 'rgba(10, 10, 26, 1)',
    stars: 'rgba(168, 85, 247, 0.4)',

    // Player
    playerShip: '#00f0ff',
    playerShipFill: 'rgba(0, 240, 255, 0.15)',
    playerBullet: '#00ffff',
    thrusterFlame: '#ff006e',

    // Enemies
    enemyShip: '#ff006e',
    enemyShipFill: 'rgba(255, 0, 110, 0.15)',
    enemyBullet: '#ff1493',
    enemyTank: '#ff006e',
    enemySniper: '#bd00ff',
    enemyBomber: '#ff9e00',

    // Objects
    asteroid: '#a855f7',
    particle: '#00f0ff',
    particleHit: '#d946ef',
    particleExplosion: '#ff006e',
    particleDamage: '#ff69b4',
    particleCollision: '#00ffff',

    // HUD
    hudText: '#00f0ff',
    hudAccent: '#ff006e',
    hullBar: '#00f0ff',
    hullBarBg: '#a855f7',

    // UI
    panelBg: '#100a1f',
    panelBorder: '#5a2d7e',
    buttonPrimary: '#ff006e',
    buttonSecondary: '#1a0f2e',
    buttonText: '#ffffff',
    modalOverlay: 'rgba(0, 0, 0, 0.85)',
    textPrimary: '#ff006e',
    textSecondary: '#00f0ff',
    textMuted: '#c084fc',

    // Controls
    joystickPad: 'rgba(26, 15, 46, 0.6)',
    joystickStick: '#ff006e',
    joystickBorder: '#5a2d7e',
    joystickGlow: 'rgba(255, 0, 110, 0.6)',

    // Power-ups
    powerUpShield: '#00f0ff',
    powerUpRapidFire: '#ff006e',
    powerUpSpreadShot: '#ffd700',
    powerUpMagnet: '#a855f7',
    powerUpScoreMultiplier: '#00ff00',

    // Combo
    comboText: '#ffd700',
    comboGlow: 'rgba(255, 215, 0, 0.6)',

    // Parallax
    parallaxDistantStars: 'rgba(168, 85, 247, 0.2)',
    parallaxNebula: 'rgba(0, 240, 255, 0.1)',
    parallaxDebris: 'rgba(255, 0, 110, 0.2)',
  },
}

// ------------------------------------------------------------------ //
//                         9. Winter
// ------------------------------------------------------------------ //
export const winterTheme: GameTheme = {
  id: 'winter',
  name: 'Winter',
  description: 'Icy crystalline frost',
  icon: '❄️',

  colors: {
    // Canvas
    background: '#0d0f1a',
    backgroundRgba: 'rgba(13, 15, 26, 1)',
    stars: 'rgba(200, 220, 240, 0.4)',

    // Player
    playerShip: '#c0d8e8',
    playerShipFill: 'rgba(192, 216, 232, 0.15)',
    playerBullet: '#f0f8ff',
    thrusterFlame: '#a8d8ea',

    // Enemies
    enemyShip: '#5b8fb9',
    enemyShipFill: 'rgba(91, 143, 185, 0.15)',
    enemyBullet: '#6495ed',
    enemyTank: '#708090',
    enemySniper: '#9370db',
    enemyBomber: '#ffb6c1',

    // Objects
    asteroid: '#8ba9c0',
    particle: '#d0e5f0',
    particleHit: '#b8d4e6',
    particleExplosion: '#7fb3d5',
    particleDamage: '#ff8fa3',
    particleCollision: '#f0f8ff',

    // HUD
    hudText: '#c0d8e8',
    hudAccent: '#a8d8ea',
    hullBar: '#a8d8ea',
    hullBarBg: '#5b8fb9',

    // UI
    panelBg: '#12151f',
    panelBorder: '#3d5a73',
    buttonPrimary: '#a8d8ea',
    buttonSecondary: '#1a2030',
    buttonText: '#0d0f1a',
    modalOverlay: 'rgba(0, 0, 0, 0.85)',
    textPrimary: '#a8d8ea',
    textSecondary: '#c0d8e8',
    textMuted: '#8ba9c0',

    // Controls
    joystickPad: 'rgba(26, 32, 48, 0.6)',
    joystickStick: '#a8d8ea',
    joystickBorder: '#3d5a73',
    joystickGlow: 'rgba(168, 216, 234, 0.55)',

    // Power-ups
    powerUpShield: '#5dade2',
    powerUpRapidFire: '#ff6b9d',
    powerUpSpreadShot: '#f8f8ff',
    powerUpMagnet: '#c39bd3',
    powerUpScoreMultiplier: '#e0ffff',

    // Combo
    comboText: '#f0f8ff',
    comboGlow: 'rgba(240, 248, 255, 0.7)',

    // Parallax
    parallaxDistantStars: 'rgba(200, 220, 240, 0.2)',
    parallaxNebula: 'rgba(168, 216, 234, 0.12)',
    parallaxDebris: 'rgba(224, 247, 255, 0.25)',


  },
}

// ------------------------------------------------------------------ //
//                         10. Deep Space
// ------------------------------------------------------------------ //
export const deepSpaceTheme: GameTheme = {
  id: 'deep-space',
  name: 'Deep Space',
  description: 'Deep purple void with distant stars',
  icon: '🌌',

  colors: {
    // Canvas
    background: '#0a0814',
    backgroundRgba: 'rgba(10, 8, 20, 1)',
    stars: 'rgba(100, 120, 200, 0.4)',

    // Player
    playerShip: '#d0e0ff',
    playerShipFill: 'rgba(208, 224, 255, 0.15)',
    playerBullet: '#ffffff',
    thrusterFlame: '#8099ff',

    // Enemies
    enemyShip: '#a060ff',
    enemyShipFill: 'rgba(160, 96, 255, 0.15)',
    enemyBullet: '#8844ff',
    enemyTank: '#7744cc',
    enemySniper: '#c088ff',
    enemyBomber: '#9955dd',

    // Objects
    asteroid: '#4a3f6a',
    particle: '#b0b8ff',
    particleHit: '#8899ff',
    particleExplosion: '#a060ff',
    particleDamage: '#ff6699',
    particleCollision: '#c0c8ff',

    // HUD
    hudText: '#c0d0ff',
    hudAccent: '#8099ff',
    hullBar: '#8099ff',
    hullBarBg: '#4a3f6a',

    // UI
    panelBg: '#0f0d1a',
    panelBorder: '#2d2648',
    buttonPrimary: '#8099ff',
    buttonSecondary: '#1a1828',
    buttonText: '#0a0814',
    modalOverlay: 'rgba(0, 0, 0, 0.85)',
    textPrimary: '#8099ff',
    textSecondary: '#c0d0ff',
    textMuted: '#8088b0',

    // Controls
    joystickPad: 'rgba(26, 24, 40, 0.6)',
    joystickStick: '#8099ff',
    joystickBorder: '#2d2648',
    joystickGlow: 'rgba(128, 153, 255, 0.55)',

    // Power-ups
    powerUpShield: '#5599ff',
    powerUpRapidFire: '#ff5588',
    powerUpSpreadShot: '#ffdd66',
    powerUpMagnet: '#cc66ff',
    powerUpScoreMultiplier: '#66ddff',

    // Combo
    comboText: '#ffdd66',
    comboGlow: 'rgba(255, 221, 102, 0.6)',

    // Parallax
    parallaxDistantStars: 'rgba(100, 120, 200, 0.2)',
    parallaxNebula: 'rgba(128, 153, 255, 0.1)',
    parallaxDebris: 'rgba(160, 96, 255, 0.18)',
  },
}

// ------------------------------------------------------------------ //
//                         Theme Registry
// ------------------------------------------------------------------ //

export const themes: Partial<Record<ThemeId, GameTheme>> = {
  'neon-void': neonVoidTheme,
  'nomad': nomadTheme,
  'sakura': sakuraTheme,
  'forest-matrix': forestMatrixTheme,
  'inferno': infernoTheme,
  'arctic': arcticTheme,
  'halloween': halloweenTheme,
  'synthwave': synthwaveTheme,
  'winter': winterTheme,
  'deep-space': deepSpaceTheme,
}

export const themeList: GameTheme[] = Object.values(themes)

export const defaultThemeId: ThemeId = 'neon-void'

export const getTheme = (id: ThemeId): GameTheme => themes[id] ?? neonVoidTheme
