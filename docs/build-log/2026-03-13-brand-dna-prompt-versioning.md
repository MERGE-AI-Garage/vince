# Vince: Brand DNA Prompt Versioning

Added 2026-03-13. The admin settings panel for Brand DNA prompts now supports full version history, rollback, and richer contextual guidance for anyone editing live system prompts.

---

## What problem does this solve?

The Brand DNA prompts are the system instructions Gemini receives during brand analysis — website crawling, image analysis, document parsing, and profile synthesis. Before this change, editing a prompt in the admin panel silently overwrote it with no record of what it used to say and no way to recover if a change broke analysis output.

For a demo environment where prompts get tuned between runs, this is a real risk. One bad edit to the image analysis prompt and every subsequent brand scan returns garbage until someone notices and manually reconstructs what it said before.

---

## What changed

### Prompt versioning

Every save now creates a version record in a new `prompt_versions` table. Each version stores the full prompt text, an optional change summary, the timestamp, and who saved it. The version history is shown inline below each prompt editor as a collapsible timeline.

**Saving a prompt:**
- A "Save as a new version" checkbox appears when you edit a prompt (checked by default)
- An optional change summary field lets you note what you changed — e.g. "Tightened plating instructions for food brands"
- Hitting "Save Changes" atomically updates the active prompt text and writes the version record

**The active prompt is always `ai_prompt_templates.prompt_text`** — there's no "active version" pointer. Versions are audit history, not activation state.

### Rollback

Any non-current version in the history timeline has a Rollback button. Clicking it:
1. Prompts a confirmation dialog explaining the action
2. Restores the old prompt text as the new active version
3. Creates a new version entry with the summary "Restored from vN" — so the restore is itself auditable and reversible

Rollbacks are never destructive. The full history is always preserved.

### Improved settings UI

The section now explains what these prompts are and how they work, rather than assuming the reader knows:

- An amber warning banner makes clear these are live prompts with no staging — changes take effect on the next analysis run
- Each prompt card shows a **"When triggered"** line describing when that specific prompt is auto-selected
- The Food & Restaurant image analysis prompt, for example, shows: *"Auto-selected when the brand category matches food or restaurant"*
- The Hero Image prompt surfaces its available template variables (`{{brand_name}}`, `{{brand_category}}`, etc.) inline above the editor

---

## How prompt selection works (for context)

When a brand analysis runs, the edge function picks the right prompt using this priority order:

1. Brand-level override — if a specific `image_analysis_prompt_id` is set on the brand record
2. Category default — e.g. `brand-image-analysis-food` for food/restaurant brands
3. Generic fallback — `brand-image-analysis` for everything else
4. Hardcoded fallback — if the database row is missing entirely

The new UI makes this logic visible to admins so they understand which prompt is actually firing for a given brand.

---

## Database

New table: `prompt_versions`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| prompt_id | uuid | FK → ai_prompt_templates.id (cascade delete) |
| content | text | Full prompt text at time of save |
| version_number | integer | Auto-incremented per prompt |
| change_summary | text | Optional — user-provided description |
| created_at | timestamptz | Auto-set to now() |
| created_by | uuid | FK → auth.users — nullable |

RLS: authenticated users can read and insert. No update or delete — version records are immutable.

---

## Files changed

| File | What changed |
|------|-------------|
| `supabase/migrations/20260313211248_add_prompt_versions.sql` | New table, index, RLS policies |
| `src/hooks/usePromptVersions.ts` | `usePromptVersions`, `useCreatePromptVersion`, `useRestorePromptVersion` |
| `src/components/creative-studio/PromptVersionHistory.tsx` | Collapsible version timeline, rollback confirmation dialog |
| `src/components/creative-studio/BrandDNAPrompts.tsx` | Versioned save flow, improved section header, per-prompt trigger descriptions, variable hints |
