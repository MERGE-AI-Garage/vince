// ABOUTME: OKLch color space conversion utilities for perceptually uniform color manipulation
// ABOUTME: Provides hex ↔ OKLch conversion and OKLch-based color harmony functions

/**
 * OKLch color representation
 * L: Lightness (0-1, displayed as 0-100%)
 * C: Chroma (0-0.4 typical, can go higher for vivid colors)
 * H: Hue (0-360 degrees)
 */
export interface OklchColor {
  l: number  // 0-1
  c: number  // 0-0.4+
  h: number  // 0-360
}

/**
 * Oklab color representation (intermediate format)
 */
interface OklabColor {
  l: number
  a: number
  b: number
}

/**
 * Linear RGB (0-1 range, linear light)
 */
interface LinearRGB {
  r: number
  g: number
  b: number
}

// sRGB to Linear RGB conversion
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

// Linear RGB to sRGB conversion
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

// Hex to RGB (0-255)
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

// RGB (0-255) to Hex
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)))
    return clamped.toString(16).padStart(2, '0')
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// Linear RGB to Oklab
function linearRgbToOklab(rgb: LinearRGB): OklabColor {
  const l = 0.4122214708 * rgb.r + 0.5363325363 * rgb.g + 0.0514459929 * rgb.b
  const m = 0.2119034982 * rgb.r + 0.6806995451 * rgb.g + 0.1073969566 * rgb.b
  const s = 0.0883024619 * rgb.r + 0.2817188376 * rgb.g + 0.6299787005 * rgb.b

  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)

  return {
    l: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  }
}

// Oklab to Linear RGB
function oklabToLinearRgb(lab: OklabColor): LinearRGB {
  const l_ = lab.l + 0.3963377774 * lab.a + 0.2158037573 * lab.b
  const m_ = lab.l - 0.1055613458 * lab.a - 0.0638541728 * lab.b
  const s_ = lab.l - 0.0894841775 * lab.a - 1.2914855480 * lab.b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  return {
    r: +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  }
}

// Oklab to OKLch
function oklabToOklch(lab: OklabColor): OklchColor {
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b)
  let h = Math.atan2(lab.b, lab.a) * 180 / Math.PI
  if (h < 0) h += 360
  return { l: lab.l, c, h }
}

// OKLch to Oklab
function oklchToOklab(lch: OklchColor): OklabColor {
  const hRad = lch.h * Math.PI / 180
  return {
    l: lch.l,
    a: lch.c * Math.cos(hRad),
    b: lch.c * Math.sin(hRad)
  }
}

/**
 * Convert hex color to OKLch
 */
export function hexToOklch(hex: string): OklchColor | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null

  const linearRgb: LinearRGB = {
    r: srgbToLinear(rgb.r / 255),
    g: srgbToLinear(rgb.g / 255),
    b: srgbToLinear(rgb.b / 255)
  }

  const oklab = linearRgbToOklab(linearRgb)
  return oklabToOklch(oklab)
}

/**
 * Convert OKLch to hex color
 */
export function oklchToHex(oklch: OklchColor): string {
  const oklab = oklchToOklab(oklch)
  const linearRgb = oklabToLinearRgb(oklab)

  const r = linearToSrgb(linearRgb.r) * 255
  const g = linearToSrgb(linearRgb.g) * 255
  const b = linearToSrgb(linearRgb.b) * 255

  return rgbToHex(r, g, b)
}

/**
 * Format OKLch as CSS oklch() function
 */
export function formatOklchCss(oklch: OklchColor): string {
  const l = (oklch.l * 100).toFixed(1)
  const c = oklch.c.toFixed(3)
  const h = oklch.h.toFixed(1)
  return `oklch(${l}% ${c} ${h})`
}

/**
 * Format OKLch as human-readable string
 */
export function formatOklchReadable(oklch: OklchColor): string {
  const l = (oklch.l * 100).toFixed(0)
  const c = (oklch.c * 100).toFixed(0)
  const h = oklch.h.toFixed(0)
  return `L:${l}% C:${c} H:${h}°`
}

/**
 * Parse CSS oklch() string to OklchColor
 */
export function parseOklchCss(css: string): OklchColor | null {
  // Match patterns like oklch(50% 0.2 240) or oklch(0.5 0.2 240)
  const match = css.match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*\)/)
  if (!match) return null

  let l = parseFloat(match[1])
  const c = parseFloat(match[2])
  const h = parseFloat(match[3])

  // If L was given as percentage, convert to 0-1
  if (l > 1) l = l / 100

  return { l, c, h }
}

// ============================================
// Color Harmony Functions using OKLch
// ============================================

/**
 * Generate complementary color (180° hue shift)
 */
export function getComplementary(hex: string): string | null {
  const oklch = hexToOklch(hex)
  if (!oklch) return null

  const complementary: OklchColor = {
    l: oklch.l,
    c: oklch.c,
    h: (oklch.h + 180) % 360
  }

  return oklchToHex(complementary)
}

/**
 * Generate analogous colors (±30° hue shift)
 */
export function getAnalogous(hex: string): [string, string] | null {
  const oklch = hexToOklch(hex)
  if (!oklch) return null

  const analog1: OklchColor = {
    l: oklch.l,
    c: oklch.c,
    h: (oklch.h + 30 + 360) % 360
  }

  const analog2: OklchColor = {
    l: oklch.l,
    c: oklch.c,
    h: (oklch.h - 30 + 360) % 360
  }

  return [oklchToHex(analog1), oklchToHex(analog2)]
}

/**
 * Generate triadic colors (120° apart)
 */
export function getTriadic(hex: string): [string, string] | null {
  const oklch = hexToOklch(hex)
  if (!oklch) return null

  const triad1: OklchColor = {
    l: oklch.l,
    c: oklch.c,
    h: (oklch.h + 120) % 360
  }

  const triad2: OklchColor = {
    l: oklch.l,
    c: oklch.c,
    h: (oklch.h + 240) % 360
  }

  return [oklchToHex(triad1), oklchToHex(triad2)]
}

/**
 * Generate split-complementary colors (150° and 210°)
 */
export function getSplitComplementary(hex: string): [string, string] | null {
  const oklch = hexToOklch(hex)
  if (!oklch) return null

  const split1: OklchColor = {
    l: oklch.l,
    c: oklch.c,
    h: (oklch.h + 150) % 360
  }

  const split2: OklchColor = {
    l: oklch.l,
    c: oklch.c,
    h: (oklch.h + 210) % 360
  }

  return [oklchToHex(split1), oklchToHex(split2)]
}

/**
 * Lighten a color by adjusting L in OKLch
 */
export function lighten(hex: string, amount: number = 0.1): string | null {
  const oklch = hexToOklch(hex)
  if (!oklch) return null

  const lightened: OklchColor = {
    l: Math.min(1, oklch.l + amount),
    c: oklch.c,
    h: oklch.h
  }

  return oklchToHex(lightened)
}

/**
 * Darken a color by adjusting L in OKLch
 */
export function darken(hex: string, amount: number = 0.1): string | null {
  const oklch = hexToOklch(hex)
  if (!oklch) return null

  const darkened: OklchColor = {
    l: Math.max(0, oklch.l - amount),
    c: oklch.c,
    h: oklch.h
  }

  return oklchToHex(darkened)
}

/**
 * Saturate a color by adjusting C in OKLch
 */
export function saturate(hex: string, amount: number = 0.05): string | null {
  const oklch = hexToOklch(hex)
  if (!oklch) return null

  const saturated: OklchColor = {
    l: oklch.l,
    c: Math.min(0.4, oklch.c + amount),
    h: oklch.h
  }

  return oklchToHex(saturated)
}

/**
 * Desaturate a color by adjusting C in OKLch
 */
export function desaturate(hex: string, amount: number = 0.05): string | null {
  const oklch = hexToOklch(hex)
  if (!oklch) return null

  const desaturated: OklchColor = {
    l: oklch.l,
    c: Math.max(0, oklch.c - amount),
    h: oklch.h
  }

  return oklchToHex(desaturated)
}

/**
 * Generate a palette of shades (same hue, varying lightness)
 */
export function generateShades(hex: string, count: number = 5): string[] {
  const oklch = hexToOklch(hex)
  if (!oklch) return []

  const shades: string[] = []
  const step = 0.8 / (count - 1) // Range from 0.1 to 0.9 lightness

  for (let i = 0; i < count; i++) {
    const shade: OklchColor = {
      l: 0.1 + step * i,
      c: oklch.c,
      h: oklch.h
    }
    shades.push(oklchToHex(shade))
  }

  return shades
}

/**
 * Check if two colors have sufficient perceptual difference
 * Using deltaE in OKLch space
 */
export function getColorDifference(hex1: string, hex2: string): number | null {
  const oklch1 = hexToOklch(hex1)
  const oklch2 = hexToOklch(hex2)
  if (!oklch1 || !oklch2) return null

  // Simple Euclidean distance in OKLch (approximation)
  const dL = oklch1.l - oklch2.l
  const dC = oklch1.c - oklch2.c
  // Handle hue as circular
  let dH = Math.abs(oklch1.h - oklch2.h)
  if (dH > 180) dH = 360 - dH
  dH = dH / 360 // Normalize to 0-1

  return Math.sqrt(dL * dL + dC * dC + dH * dH)
}
