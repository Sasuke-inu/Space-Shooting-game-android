// ------------------------------------------------------------------ //
//                         Spacing Tokens
// ------------------------------------------------------------------ //

/**
 * Spacing scale for consistent padding, margin, and gap values.
 * Use these tokens instead of magic numbers.
 */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const

/**
 * Border radius scale for consistent rounded corners.
 */
export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 22,
  round: 70,
  full: 9999,
} as const

/**
 * Common dimension values used across the app.
 */
export const size = {
  joystickPad: 140,
  joystickStick: 44,
  buttonHeight: 48,
  iconSm: 24,
  iconMd: 32,
  iconLg: 48,
  modalWidth: 340,
  toggleWidth: 50,
  toggleHeight: 28,
  toggleThumb: 24,
  sliderHeight: 8,
  sliderBarWidth: 60,
} as const

/**
 * Shadow configurations (for future use).
 */
export const shadow = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  glow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
  },
} as const

export type Spacing = keyof typeof spacing
export type Radius = keyof typeof radius
export type Size = keyof typeof size
