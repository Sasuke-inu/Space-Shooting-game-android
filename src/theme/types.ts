// ------------------------------------------------------------------ //
//                         Theme Types
// ------------------------------------------------------------------ //

export interface ThemeColors {
  // Canvas
  background: string
  backgroundRgba: string
  stars: string

  // Player
  playerShip: string
  playerShipFill: string
  playerBullet: string
  thrusterFlame: string

  // Enemies
  enemyShip: string
  enemyShipFill: string
  enemyBullet: string

  // Objects
  asteroid: string
  particle: string
  particleHit: string
  particleExplosion: string
  particleDamage: string
  particleCollision: string

  // HUD
  hudText: string
  hudAccent: string
  hullBar: string
  hullBarBg: string

  // UI
  panelBg: string
  panelBorder: string
  buttonPrimary: string
  buttonSecondary: string
  buttonText: string
  modalOverlay: string
  textPrimary: string
  textSecondary: string
  textMuted: string

  // Controls
  joystickPad: string
  joystickStick: string
  joystickBorder: string
  joystickGlow: string

  // Power-ups
  powerUpShield: string
  powerUpRapidFire: string
  powerUpSpreadShot: string
  powerUpMagnet: string

  // Combo
  comboText: string
  comboGlow: string
}

export interface GameTheme {
  id: string
  name: string
  description: string
  icon: string

  colors: ThemeColors
}

export type ThemeId =
  | 'neon-void'
  | 'nomad'
  | 'sakura'
  | 'forest-matrix'
  | 'inferno'
  | 'arctic'
  | 'halloween'
  | 'synthwave'
  | 'winter'
