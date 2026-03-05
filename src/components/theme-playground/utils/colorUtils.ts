// ABOUTME: Centralized color conversion utilities for the theme playground
// ABOUTME: Single source of truth for hex-to-HSL, hex-to-RGB, and related conversions

/**
 * RGB color representation (0-255)
 */
export interface RGB {
  r: number
  g: number
  b: number
}

/**
 * HSL color representation
 */
export interface HSL {
  h: number  // 0-360
  s: number  // 0-100
  l: number  // 0-100
}

/**
 * Parse hex color to RGB
 * Returns null if invalid hex format
 */
export function hexToRgb(hex: string): RGB | null {
  if (!hex || typeof hex !== 'string') return null

  // Remove # if present
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex

  // Validate hex format
  if (!/^[a-fA-F0-9]{6}$/.test(cleanHex)) return null

  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16)
  }
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)))
    return clamped.toString(16).padStart(2, '0')
  }
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

/**
 * Convert hex color to HSL
 * Returns null if invalid hex format
 */
export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null

  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

/**
 * Convert HSL to hex
 */
export function hslToHex(hsl: HSL): string {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }

  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return rgbToHex({
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  })
}

/**
 * Convert hex to CSS HSL values string (for CSS custom properties)
 * Format: "210 50% 40%" (no hsl() wrapper, space-separated)
 * Returns fallback "0 0% 0%" for invalid input
 */
export function hexToHslValues(hex: string): string {
  const hsl = hexToHsl(hex)
  if (!hsl) return '0 0% 0%'
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`
}

/**
 * Convert hex to full CSS hsl() function string
 * Format: "hsl(210, 50%, 40%)"
 */
export function hexToHslCss(hex: string): string {
  const hsl = hexToHsl(hex)
  if (!hsl) return 'hsl(0, 0%, 0%)'
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
}

/**
 * Adjust lightness of a hex color
 * @param hex - Input hex color
 * @param amount - Amount to adjust (-1 to 1, negative = darker)
 */
export function adjustLightness(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  if (!hsl) return hex

  const newL = Math.max(0, Math.min(100, hsl.l + amount * 100))
  return hslToHex({ ...hsl, l: newL })
}

/**
 * Adjust saturation of a hex color
 * @param hex - Input hex color
 * @param amount - Amount to adjust (-1 to 1, negative = less saturated)
 */
export function adjustSaturation(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  if (!hsl) return hex

  const newS = Math.max(0, Math.min(100, hsl.s + amount * 100))
  return hslToHex({ ...hsl, s: newS })
}

/**
 * Calculate relative luminance for WCAG contrast calculations
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Calculate WCAG contrast ratio between two colors
 * Returns ratio from 1:1 to 21:1
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1)
  const l2 = getRelativeLuminance(hex2)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check WCAG compliance level for contrast
 */
export type WCAGLevel = 'AAA' | 'AA' | 'AA-large' | 'fail'

export function getWCAGLevel(contrastRatio: number): WCAGLevel {
  if (contrastRatio >= 7) return 'AAA'
  if (contrastRatio >= 4.5) return 'AA'
  if (contrastRatio >= 3) return 'AA-large'
  return 'fail'
}

/**
 * Generate a random hex color
 */
export function randomHex(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}

/**
 * Check if a string is a valid hex color
 */
export function isValidHex(hex: string): boolean {
  if (!hex || typeof hex !== 'string') return false
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex
  return /^[a-fA-F0-9]{6}$/.test(cleanHex)
}

/**
 * Normalize hex color format (ensure # prefix and lowercase)
 */
export function normalizeHex(hex: string): string {
  if (!hex) return '#000000'
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex
  if (!/^[a-fA-F0-9]{6}$/.test(cleanHex)) return '#000000'
  return `#${cleanHex.toLowerCase()}`
}

// ============================================
// Theme Value Parsing Utilities
// ============================================

/**
 * Parse a boolean-like value from string, boolean, or undefined
 * Handles the legacy storage format where booleans are stored as strings
 * @param value - String ('true'/'false'), boolean, or undefined
 * @param defaultValue - Default if undefined (default: true)
 */
export function parseBoolean(value: string | boolean | undefined, defaultValue: boolean = true): boolean {
  if (value === undefined || value === null) return defaultValue
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    return value.toLowerCase() !== 'false'
  }
  return defaultValue
}

/**
 * Convert a boolean to string for storage
 * Provides consistent serialization
 */
export function stringifyBoolean(value: boolean): string {
  return String(value)
}
