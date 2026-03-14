# Creative Package Demo Polish

Fixes applied 2026-03-14 for hackathon demo readiness — brand alignment display, deliverable naming, generation details, and history recording.

---

## Brand Alignment Box — Pill Overflow

**File:** `src/components/creative-studio/CreativePackageDisplay.tsx`

### Problem
The four dimension pills (Visual, Photo, Color, Voice) wrapped onto a second line because the flex container didn't constrain the right-side group. Under certain viewport widths the "Voice" pill was pushed to a new row, making the alignment section look broken.

### Fix
Three targeted layout changes:

```tsx
// Left side: allow text to truncate instead of pushing right group out
<div className="flex items-center gap-2 min-w-0">
  <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${iconCls}`} />
  <span className="text-xs font-medium text-foreground/80 truncate">Brand Alignment</span>
</div>

// Right side: prevent shrinking so pill group stays intact
<div className="flex items-center gap-3 shrink-0">
  // Pills row: force single line regardless of container width
  <div className="flex items-center gap-1 flex-nowrap">
```

`min-w-0` on the left side allows the label to truncate. `shrink-0` on the right side prevents the pill group from being compressed. `flex-nowrap` keeps all four pills on one line.

---

## Deliverable Titles — Defensive Name Extraction

**File:** `supabase/functions/generate-creative-package/index.ts`

### Problem
When Gemini called `generate_creative_package` without a `deliverable_type` or `name` field on the deliverable objects, the fallback was `"Deliverable 1"`, `"Deliverable 2"`, etc. — generic labels that showed up in the UI and killed the premium feel.

### Fix
Defensive extraction that infers a short name from `description` when `name` and `type` are both absent:

```ts
const deliverableNames = resolvedDeliverables.length > 0
  ? resolvedDeliverables.map((d, i) => {
      if (d.name) return d.name;
      if (d.description) {
        const words = d.description.replace(/\n.*/s, '').trim().split(/\s+/).slice(0, 3).join(' ');
        if (words.length > 2) return words;
      }
      return `Deliverable ${i + 1}`;
    })
  : [];
```

The inference takes the first line of `description`, grabs the first three words, and uses them as the label. This surfaces something meaningful (e.g., "Create a LinkedIn" → "Create a LinkedIn") even in degraded cases. DELIVERABLE_TEMPLATES always include a `name` field so this fallback path only fires for freeform deliverables.

---

## Generation Details Dialog — Deliverables Metadata Row

**File:** `src/components/creative-studio/GenerationInfoDialog.tsx`

### Problem
The generation detail view showed "Type: Creative Package" for every generation regardless of what was actually requested. No way to see which specific deliverables (LinkedIn Post, Print Full Page, etc.) were included in a run.

### Fix
Added a "Deliverables" row that reads from `metadata.deliverable_names`:

```tsx
{Array.isArray(meta.deliverable_names) && (meta.deliverable_names as string[]).length > 0 && (
  <MetaRow label="Deliverables" value={(meta.deliverable_names as string[]).join(', ')} emphasis />
)}
```

Rendered after the "Type" row. Only visible when the field is present in metadata — harmless for older records that don't have it.

---

## History Recording — Error Context

**File:** `supabase/functions/generate-creative-package/index.ts`

### Problem
Insert errors into `creative_studio_generations` were logged as a single-line message with no context — `user_id`, `brand_id`, and Supabase error code were all missing. Silent failures were impossible to diagnose.

### Fix
Error log now includes error code, message, and the relevant identifiers:

```ts
console.error(
  '[generate-creative-package] Generation record insert failed:',
  insertError.code,
  insertError.message,
  { user_id: userId, brand_id }
);
```

The function still returns success to the caller (the generation itself succeeded), but failures are now diagnosable from edge function logs. Root cause of intermittent failures is most likely an RLS policy rejecting rows where `user_id` is null — check `creative_studio_generations` RLS policy if inserts continue to fail silently.
