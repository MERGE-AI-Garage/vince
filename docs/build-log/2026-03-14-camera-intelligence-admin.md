# Camera Intelligence Admin

**Date:** 2026-03-14
**File:** `src/components/creative-studio/CameraIntelligenceAdmin.tsx`
**Replaces:** `CameraPresetAdmin` in the admin camera tab

---

## Why This Exists

Google Imagen and Gemini are trained on real photography terminology. Using f-stops, focal lengths, film stocks, and lighting setups in prompts produces dramatically more precise results than describing the desired effect in plain language. The old `CameraPresetAdmin` was a flat data table — functional but with zero educational value. Agency creatives using Vince need to understand *why* these settings matter and *how* they translate into prompt fragments, not just toggle things on and off.

---

## Architecture

### 4 Photography Pillars

Options are grouped into four sections that reflect how photographers think, not how the database is organized:

| Pillar | Accent Color | Categories |
|--------|-------------|------------|
| Camera & Film Identity | Amber | camera_body, film_stock, frame_rate |
| Optics & Focus | Sky | aperture, focal_length, depth_of_field |
| Scene Direction | Emerald | lighting, composition, shot_type |
| Post Production | Purple | color_grade, film_effect, print_process, color_temperature |

Pillars are collapsible. The first pillar (Camera & Film Identity) opens by default.

### Hardcoded Educational Metadata

`CATEGORY_META` — 13 entries, one per `CameraOptionCategory`. Each entry has:
- `icon` — Lucide icon
- `label` — display name
- `education` — 2-3 sentence explanation of what this parameter does photographically
- `promptNote` — concrete example of how it gets appended to a generation prompt

This data is intentionally hardcoded. Photography knowledge is stable; it doesn't need to live in the database.

### Manufacturer Brand Badges

`MANUFACTURER_STYLES` — 18 entries mapping manufacturer names to Tailwind color classes. Detection is substring-based on `display_name.toLowerCase()`. Covers:
- Cinema: ARRI (cobalt blue), RED (crimson), Blackmagic (gray), Sony (slate)
- Stills: Leica (red), Canon (dark red), Nikon (amber), Hasselblad (orange), Phase One (indigo), Mamiya (purple), Contax/Pentax/Olympus
- Film: Fuji/Fujifilm (teal), Kodak (gold), Ilford (zinc), Lomography (pink), Cinestill (rose)

### Film Stock Color Swatches

`FILM_SWATCHES` — 16 entries mapping stock slugs to 4-stop color arrays `[highlights, midtones, shadows, deep_shadows]`. Rendered as a 4-segment horizontal strip on film_stock tiles. Stocks covered: Kodak Portra 400/800, Ektar 100, Gold 200, Tri-X, T-Max 400, Fuji Velvia 50/100, Provia 100F, Superia 400, Ilford HP5, Delta 3200, FP4+, CineStill 800T/50D, Lomochrome Purple.

---

## Component Structure

```
CameraIntelligenceAdmin
├── AdminHeroHeader
│   ├── Stats: total options / active / categories
│   └── "Add Option" button (opens dialog with no preset category)
├── Photography concept banner (BookOpen icon, always visible)
├── PillarCard × 4 (collapsible)
│   ├── Pillar header: icon, title, active/total badge, category count
│   └── [expanded] CategorySection × N (collapsible)
│       ├── Category header: icon, label, active/total, "+" add button
│       └── [expanded] Education callout (dismissible per-category, localStorage)
│                       OptionGrid (1–3 col responsive)
│                           └── OptionTile × N
│                               ├── Film swatch OR category icon
│                               ├── Display name + manufacturer badge
│                               ├── Active toggle (Switch)
│                               ├── Expand toggle
│                               └── [expanded] InlineEdit fields
│                                   ├── Description
│                                   ├── Prompt fragment (+ copy button)
│                                   ├── Media type selector
│                                   ├── slug/category identifier
│                                   └── Delete button
├── CreateOptionDialog
└── DeleteConfirmDialog
```

---

## State Model

| State | Type | Purpose |
|-------|------|---------|
| `expandedPillars` | `Set<string>` | Which pillar IDs are open |
| `expandedCategories` | `Set<string>` | Which `pillarId-category` keys are open |
| `expandedOptionId` | `string \| null` | Which option tile is expanded for editing |
| `createDialogCategory` | `CameraOptionCategory \| null \| undefined` | `undefined` = dialog closed; `null` = open with no preset; `cat` = open pre-filled |
| `deleteConfirm` | `string \| null` | ID of option pending deletion |
| `educationDismissed` | `Set<string>` | Categories whose education callout has been dismissed |

Education dismissed state persists to `localStorage` under key `vince_camera_education_dismissed`.

---

## Hooks Used

All from `useCreativeStudioCameraOptions`:
- `useAllCameraOptions()` — fetches all options including inactive (admin view)
- `useCreateCameraOption()` — create mutation
- `useUpdateCameraOption()` — update mutation (inline editing)
- `useToggleCameraOption()` — active/inactive toggle
- `useDeleteCameraOption()` — delete mutation

---

## InlineEdit Pattern

Click-to-edit fields throughout. Single-line: Enter to save, Escape to cancel. Multiline: ⌘↵ to save, Escape to cancel. `onBlur` also saves. Fields: display_name (tile header), description, prompt_fragment (multiline), sort_order, media_type (Select, not inline edit).

---

## Adding New Film Stock Swatches

Add an entry to `FILM_SWATCHES` in the component using the stock's `slug` as the key:

```typescript
my_stock_slug: ['#highlights', '#midtones', '#shadows', '#deep_shadows'],
```

The 4 hex values should represent the characteristic color signature of the stock at roughly: zone VIII (highlights), zone V (midtones), zone III (shadows), zone I (deep shadows).

## Adding New Manufacturer Styles

Add an entry to `MANUFACTURER_STYLES` using the manufacturer name in lowercase as the key. Detection is substring-based, so `'red'` will match "RED Camera", "RED Komodo", etc.

```typescript
'manufacturername': { bg: 'bg-color/10', text: 'text-color-300', border: 'border-color/30' },
```
