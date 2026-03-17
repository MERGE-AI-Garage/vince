# AI Guidelines Dialog — Brand-Aware Header

## Overview

The AI Guidelines dialog header adapts to whichever brand is selected — using the brand's own colors, logo mark, and full wordmark rather than any fixed identity.

## Design

- **Background**: `bg-gray-950` — dark but not pure black
- **Accent**: Radial gradient using `brand.primary_color` at 20% opacity (`color33`) from top-right — subtle brand tint without overwhelming the UI
- **Border bottom**: 1px at `brand.primary_color` 25% opacity — ties the header to the brand color
- **Icon box** (40×40): Uses `brand.logo_mark_url` only (compact symbol/mark, not full wordmark). Falls back to brand initial letter on colored background (`brand.primary_color` at 30% opacity). Never uses full wordmark in this box — wordmarks at 40px become illegible colored blobs.
- **Watermark**: `brand.logo_url` (full wordmark) in bottom-right corner at `opacity-[0.08]` — large (~80px tall), purely decorative, doesn't interfere with text. Falls back to oversized brand initial at 5% opacity.

## Why Logo Mark vs. Full Wordmark

The icon box is 40×40px. Full horizontal wordmarks (e.g. "Google", "Adobe") at that size render as unreadable colored rectangles. The `logo_mark_url` field is specifically for compact symbols (G mark, Adobe A, etc.) designed to work at small sizes. The full wordmark goes in the watermark position where it has room to breathe.

If a brand hasn't uploaded a `logo_mark_url`, the fallback (brand initial on brand-colored background) looks intentional and clean.

## Code Pattern

```tsx
<div className="relative overflow-hidden px-6 py-5 bg-gray-950"
     style={{ borderBottom: `1px solid ${brand.primary_color}40` }}>

  {/* Brand color radial glow */}
  <div className="absolute inset-0 pointer-events-none"
       style={{ background: `radial-gradient(ellipse at top right, ${brand.primary_color}33, transparent 70%)` }} />

  {/* Full wordmark watermark */}
  {brand.logo_url ? (
    <img src={brand.logo_url} alt="" className="absolute bottom-0 -right-2 h-20 w-auto object-contain opacity-[0.08] pointer-events-none" />
  ) : (
    <span className="absolute -bottom-4 -right-6 text-[120px] font-bold text-white/[0.05] select-none pointer-events-none leading-none">
      {brand.name.charAt(0)}
    </span>
  )}

  {/* Icon box — logo mark only */}
  <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
       style={{ background: `${brand.primary_color}30`, border: `1px solid ${brand.primary_color}50` }}>
    {brand.logo_mark_url ? (
      <img src={brand.logo_mark_url} alt={brand.name} className="w-7 h-7 object-contain" />
    ) : (
      <span className="font-bold text-lg text-white">{brand.name.charAt(0)}</span>
    )}
  </div>
```

## Files Changed

- `src/components/creative-studio/AIGuidelinesDialog.tsx`
  - Brand-aware header using `brand.primary_color`, `brand.logo_mark_url`, `brand.logo_url`
  - Tool names: removed anchor link wrapper (plain `<span>` — tool URLs weren't reliable)
