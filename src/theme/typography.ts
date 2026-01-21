// ------------------------------------------------------------------ //
//                         Typography Tokens
// ------------------------------------------------------------------ //

import { Platform } from 'react-native'

/**
 * Font size scale for consistent text sizing.
 * Use these tokens instead of magic numbers.
 */
export const fontSize = {
  xs: 10,
  sm: 11,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 28,
} as const

/**
 * Line height multipliers for text.
 */
export const lineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 2.0,
} as const

/**
 * Font weight values.
 */
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const

/**
 * Font family definitions.
 */
export const fontFamily = {
  mono: Platform.select({
    ios: 'Courier',
    android: 'monospace',
    default: 'monospace',
  }),
  system: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
} as const

/**
 * Pre-defined text styles for common use cases.
 */
export const textStyle = {
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
  },
  body: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.normal,
  },
  bodyBold: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  button: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  heading: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
  },
  display: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
  },
} as const

export type FontSize = keyof typeof fontSize
export type LineHeight = keyof typeof lineHeight
export type FontWeight = keyof typeof fontWeight
export type TextStyle = keyof typeof textStyle
