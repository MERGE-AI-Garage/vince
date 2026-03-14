# UI Performance Fixes — Media Library & Generation Details

Fixes applied 2026-03-14 for hackathon demo readiness.

---

## Media Library — 10–15s Load → ~1–2s

**File:** `src/components/creative-studio/MediaLibraryTab.tsx`

### Root causes

1. **Double full-table scan on mount.** `fetchData` and `fetchStats` both ran in parallel on every mount. `fetchStats` had no `LIMIT` clause — it fetched all rows (252+) just to compute counts client-side.

2. **`select('*')` with 300-row limit.** Fetched all columns on every row, including heavy jsonb fields: `custom_metadata`, `color_palette`, `ai_provenance`, `auto_tags`, `description`. Unnecessary for the grid view.

3. **Tags loaded eagerly.** `media_tags` was fetched on every mount even though tags are only needed when the tag dialog opens.

### Fixes

| Change | Before | After |
|--------|--------|-------|
| Stats query | `select('file_type, size_bytes')` — no limit, returns all rows | Computed from `fetchData` results; `count: 'exact'` gets accurate total |
| Column selection | `select('*')` | `select('id, filename, title, url, thumbnail_url, mime_type, file_type, folder_id, created_at, size_bytes, created_by')` |
| Row limit | 300 | 100 |
| `fetchStats` | Separate query on every mount | Removed — stats computed from main query |
| Tags | Fetched on mount | Lazy-loaded when tag dialog opens |
| Image rendering | `loading="lazy"` | `loading="lazy" decoding="async"`, uses `thumbnail_url` when available |
| Video preload | `preload="metadata"` (downloads first 25% of each video) | `preload="none"` |
| Number of queries on mount | 4 (`media`, `media_folders` ×2, `media_tags`, `media` stats) | 3 (`media` with count, `media_folders` ×2) |

---

## Generation Details Dialog — Metadata Cut Off, Can't Scroll

**File:** `src/components/creative-studio/GenerationInfoDialog.tsx`

### Root cause

The two-panel container used `maxHeight` instead of `height`. In a flex layout, `maxHeight` on the parent doesn't constrain flex children — they grow to their natural content height. The panels had `overflow-y-auto` but the flex container never had a bounded height, so scrolling never activated; the content just overflowed the dialog.

Classic flexbox gotcha: `overflow-y-auto` on a flex child requires the parent to have a defined height (not just `max-height`), and the child needs `min-h-0` to allow shrinking below its content size.

### Fix

```tsx
// Before
<div className="flex flex-col md:flex-row" style={{ maxHeight: 'calc(85vh - 64px)' }}>
  <div className="md:w-[42%] ... overflow-y-auto ...">
  <div className="md:w-[58%] overflow-y-auto">

// After
<div className="flex flex-col md:flex-row min-h-0" style={{ height: 'calc(85vh - 64px)' }}>
  <div className="md:w-[42%] ... overflow-y-auto ... min-h-0">
  <div className="md:w-[58%] overflow-y-auto min-h-0">
```

Both panels now scroll independently. Long prompts, detailed camera settings, and metadata are fully accessible.

---

## Generation Type Constraint Migration

**Migration:** `add_headshot_scene_generation_type`

`headshot_scene` was not in the `creative_studio_generations_generation_type_check` constraint. This caused all history inserts from `generateHeadshotScene` to fail silently (no error surface to the user, just no record created).

Added `headshot_scene` to the allowed values. Existing `generate_headshot_scene` outputs that were orphaned in storage were backfilled into both `creative_studio_generations` and `media`.
