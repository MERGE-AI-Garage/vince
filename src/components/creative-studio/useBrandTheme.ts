// ABOUTME: Derives scoped CSS custom properties from a Creative Studio brand's accent colors
// ABOUTME: Provides --cs-primary, --cs-secondary, --cs-accent, and gradient vars for brand accents only

import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { CreativeStudioBrand } from '@/types/creative-studio';
import { hexToHslValues } from '@/components/theme-playground/utils/colorUtils';
import {
  lighten,
  hexToOklch,
  oklchToHex,
} from '@/components/theme-playground/utils/oklchConverter';

/**
 * Derive scoped brand accent CSS properties from a CreativeStudioBrand.
 *
 * Returns a CSSProperties object that sets --cs-* custom properties on a
 * container element. Child components reference these with fallbacks:
 *   var(--cs-primary, hsl(var(--primary)))
 *
 * Only provides accent-level color variables (icons, gradient text, buttons).
 * Surface colors come from the Studio Surface System in index.css.
 */
export function useBrandTheme(
  brand: CreativeStudioBrand | undefined
): CSSProperties {
  return useMemo(() => {
    if (!brand) return {};

    const primary = brand.primary_color;
    const secondary = brand.secondary_color;
    const palette = brand.color_palette;

    // Accent: third palette color, or a lighter variant of primary
    const accent =
      palette && palette.length > 2
        ? palette[2]
        : lighten(primary, 0.15) ?? primary;

    // Generate a gradient stop between primary and secondary
    const oklchPrimary = hexToOklch(primary);
    const oklchSecondary = hexToOklch(secondary);
    let gradientMid = primary;
    if (oklchPrimary && oklchSecondary) {
      gradientMid = oklchToHex({
        l: (oklchPrimary.l + oklchSecondary.l) / 2,
        c: (oklchPrimary.c + oklchSecondary.c) / 2,
        h: (oklchPrimary.h + oklchSecondary.h) / 2,
      });
    }

    return {
      '--cs-primary': primary,
      '--cs-primary-hsl': hexToHslValues(primary),
      '--cs-secondary': secondary,
      '--cs-secondary-hsl': hexToHslValues(secondary),
      '--cs-accent': accent,

      // Gradient stops
      '--cs-gradient': `linear-gradient(135deg, ${primary}, ${gradientMid}, ${secondary})`,
      '--cs-gradient-start': primary,
      '--cs-gradient-end': secondary,
    } as CSSProperties;
  }, [brand]);
}
