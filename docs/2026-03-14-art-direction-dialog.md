# Art Direction: The 4th Brand Intelligence Card
**Date:** 2026-03-14
**Context:** Brand intelligence audit — surfacing data that the system was capturing but never showing the user.

---

## Problem

Vince's brand analysis pipeline captures significantly more data than the UI was showing. Three categories of extracted intelligence had no UI representation at all:

| Data | Where it lives | What was happening |
|---|---|---|
| `photography_style` | `creative_studio_brand_profiles` | Captured from image analysis, used in generation prompt, invisible to users |
| `composition_rules` | `creative_studio_brand_profiles` | Same — extracted, injected into generation, never displayed |
| `product_catalog` | `creative_studio_brand_profiles` | Populated by product page scans, referenced by Brand Agent, never surfaced |

A user could scan a product page, have Vince analyze dozens of images, and receive a `confidence_score` — but have no way to see what the system actually learned about their products or creative direction. The data was there; the window wasn't.

---

## What Belongs Where

The brand intelligence UI had three views before today:

| View | Purpose |
|---|---|
| **Brand DNA** | Visual identity — colors, typography, tone, brand identity, visual DNA |
| **Corporate DNA** | Company narrative — mission, heritage, sustainability, culture, competitive position |
| **Brand Guidelines** | Prescriptive specs — logo system, color system, typography rules, writer guidelines |

Photography style, composition rules, and product catalog don't fit cleanly into any of these. They're not brand identity (Brand DNA), company narrative (Corporate DNA), or governance specs (Brand Guidelines). They're *operational creative direction* — the briefing you'd give a photographer before a shoot, or a creative director before a product campaign.

Decision: **Art Direction** as a 4th card. The name maps to a real creative workflow artifact.

---

## What Art Direction Contains

### Photography
Source: `profile.photography_style`

The camera preferences Vince extracts from image analysis:

| Field | What it captures |
|---|---|
| `preferred_aperture` | Depth-of-field signature (e.g., "f/1.8–f/2.8 — shallow, subject isolation") |
| `preferred_focal_length` | Lens character (e.g., "85mm–135mm portrait, 50mm lifestyle") |
| `preferred_lighting` | Lighting approach (e.g., "soft natural window light, minimal fill") |
| `preferred_color_temperature` | Warmth signature (e.g., "3200K–4000K, warm golden tones") |
| `depth_of_field_preference` | Rendering style (e.g., "creamy bokeh, subject always tack-sharp") |
| `film_stock_feel` | Post-processing character (e.g., "slight grain, lifted shadows, Kodak Portra palette") |

This is the data that drives Section 6 (Photography Direction) of the generation prompt. It was always influencing outputs — now it's visible.

### Composition
Source: `profile.composition_rules`

| Field | What it captures |
|---|---|
| `preferred_layouts` | Compositional structures (e.g., "rule of thirds", "centered subject", "negative space left") |
| `framing_conventions` | Framing patterns (e.g., "environmental framing", "tight crop at shoulder", "full-body at 3/4") |
| `aspect_ratio_preference` | Primary format (e.g., "4:5 vertical for social, 16:9 for hero") |

This drives Section 7 (Composition Rules) of the generation prompt.

### Product Catalog
Source: `profile.product_catalog` — a `Record<string, ProductEntry>` populated by the product page scan feature.

Each product entry:
```
{
  name: string               // Product name
  styling_rules: string[]    // How to present this product visually
  required_elements: string[]  // Must appear in every shot
  forbidden_elements: string[] // Never include
}
```

Example entry for an outdoor apparel brand:
```
"Trail Runner Pro": {
  name: "Trail Runner Pro",
  styling_rules: [
    "Always show sole pattern — key visual differentiator",
    "Motion or terrain preferred over clean studio",
    "Pair with brand socks visible at ankle"
  ],
  required_elements: ["trail surface", "brand logo on tongue"],
  forbidden_elements: ["pavement", "indoor gym settings", "white seamless backdrop"]
}
```

The Brand Agent has always had access to this data via its system instruction. It's now visible to the user.

---

## UI Implementation

### New file: `ArtDirectionDialog.tsx`

Follows the same structure as `BrandDNADialog.tsx` and `BrandStoryDialog.tsx`:
- Branded header with gradient + logo + tagline
- `BrandDialogNav` pill navigation
- `ScrollArea` content with brand-tinted background
- `BentoCard` section pattern

**Layout:**
```
┌────────────────────────────────┬──────────────────┐
│ Photography        Composition │ Overview         │
│ ─────────────────  ─────────── │ ──────────────── │
│ Aperture:          Layouts:    │ Brand aesthetic  │
│ Focal Length:      Framing:    │ Signature style  │
│ Color Temp:        Aspect:     │                  │
│ Film Stock:                    │ Visual Principles│
│ Lighting:                      │ ──────────────── │
│ Depth of Field:                │ · principle 1    │
│                                │ · principle 2    │
├────────────────────────────────│                  │
│ Product Catalog                │ Do's & Don'ts    │
│ ─────────────────────────────  │ ──────────────── │
│  [Product A]  Styling rules    │ ✓ do this        │
│               ✓ required       │ ✗ don't do this  │
│               ✗ forbidden      │                  │
│  [Product B]  ...              │ Art Direction    │
│                                │ Snapshot         │
└────────────────────────────────┴──────────────────┘
```

**Right sidebar sections** (from `visual_dna`):
- **Overview** — `brand_identity.brand_aesthetic` (as italic blockquote) + `visual_dna.signature_style`. Hidden if both are empty.
- **Visual Principles** — `visual_dna.visual_principles[]` as a bulleted list. Hidden if empty.
- **Do's & Don'ts** — `visual_dna.dos[]` and `visual_dna.donts[]` with CheckCircle / XCircle icons. Hidden if both empty.
- **Art Direction Snapshot** — always shown; product count, Photography/Composition populated status, last analysis date.

These right-sidebar sections are sourced from `visual_dna`, which also powers the Visual DNA card in the Brand DNA dialog. The difference: Brand DNA shows `visual_dna` as a holistic brand identity summary. Art Direction shows the same data reframed as *operational creative direction* — alongside the concrete technical specs (camera, composition) and product rules that give it teeth.

**Conditional rendering:**
- Photography card: only shown when `photography_style` has at least one populated field
- Composition card: only shown when `composition_rules` has data
- Product Catalog: always shown — empty state displays "Scan a product page to populate the catalog" with a `ScanLine` icon (this is the right behavior; users need to know the feature exists)
- Overview, Principles, Do's & Don'ts: each independently hidden when their source fields are empty

### Updated: `BrandDialogNav.tsx`

`BrandDialogView` type expanded:
```typescript
// Before
type BrandDialogView = 'brand-dna' | 'corporate-dna' | 'brand-standards';

// After
type BrandDialogView = 'brand-dna' | 'corporate-dna' | 'art-direction' | 'brand-standards';
```

Nav pill now shows four items: Brand DNA · Corporate DNA · Art Direction · Brand Guidelines

All four dialogs show the full nav, so users can move between views without closing and reopening.

### Updated: `BrandIntelligenceTab.tsx`

- `artDirectionOpen` state added
- `handleDialogNavigate` handles `'art-direction'` case
- "Art Direction" button added to the showcase button row (Camera icon, 4th position)
- `<ArtDirectionDialog>` rendered alongside the other three dialogs
- `btnColors[3]` falls back to `selectedBrand.primary_color` (same fallback pattern as existing buttons for idx out of range)

---

## Where Art Direction Data Comes From

Art Direction data is populated by two analysis paths, both already in production:

### 1. Image Analysis (`analyze-brand-image` edge function)

When Vince analyzes brand images, it extracts:
- Photography style characteristics from visual signals in each image
- Composition patterns from framing, spatial arrangement, aspect ratio

These are synthesized into `photography_style` and `composition_rules` during the profile synthesis step (`synthesize-brand-profile` edge function). The more images analyzed, the more complete and reliable these fields become.

**Rule of thumb:** 10+ varied brand images produces reliable photography and composition profiles. Under 5 images, these fields will be sparse.

### 2. Product Page Scan (`extract-product-catalog` edge function)

Triggered from BrandDNABuilder when a user enters a product page URL. Scrapes the page and extracts structured product data including:
- Product names
- Visual styling rules derived from product page imagery and copy
- Required and forbidden visual elements per product

Results are written directly into `profile.product_catalog`.

**Note:** Product catalog is flat — it doesn't cross-reference product images or resolve variants. It's a starting point for per-product creative direction, not a full product information system.

---

## Relationship to Generation Prompt

Art Direction data feeds into two sections of the 9-section generation prompt:

| Art Direction field | Generation prompt section |
|---|---|
| `photography_style` | Section 6: Photography Direction |
| `composition_rules` | Section 7: Composition Rules |
| `product_catalog` | Referenced in Brand Agent system instruction; not in the generation prompt sections |

The Art Direction dialog makes these sections auditable. If a generation is coming out with unexpected aperture or framing characteristics, the Photography and Composition cards are now the first place to check.

---

## What's Not in Art Direction (Yet)

**BrandReference collections** (`creative_studio_brand_references`) — reference images grouped by collection type (product, character, style, environment). These are used in Director Mode and prompt templates but not yet shown in any showcase dialog. Likely belongs in Art Direction as a 4th section when built out.

**Per-image analysis detail** (`creative_studio_brand_analyses`) — each analyzed image has a deeply structured analysis record (shot classification, art direction, food styling, clinical context, etc. depending on brand category). This is too granular for a showcase view but could be valuable in an expanded "Image Intelligence" section in the future.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/creative-studio/ArtDirectionDialog.tsx` | New — complete dialog with Photography, Composition, Product Catalog sections |
| `src/components/creative-studio/BrandDialogNav.tsx` | Added `'art-direction'` to `BrandDialogView` type and nav items |
| `src/components/creative-studio/BrandIntelligenceTab.tsx` | Added state, button, render, and navigate case for Art Direction |
