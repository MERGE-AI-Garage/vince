# Campaigns Tab — Creative Package Archive

**Date:** 2026-03-14
**Edge function:** `generate-creative-package` v22
**Status:** Deployed and live

---

## Background and motivation

When Vince generates a creative package, the copy (headlines, body text, CTAs, LinkedIn posts, email subjects/bodies, hashtags) lived only in the chat session and disappeared when the session ended. The images landed in the media library but the copy — the most actionable part — was gone. A creative director reviewing past work could see thumbnails in the media library or chat history, but had no way to:

- Read the full copy for a deliverable
- Download a ZIP of the entire campaign (copy + images, organized by deliverable)
- Trace which conversation led to a campaign
- Run a brand standards analysis against the generated assets
- Compare against a competitor

The Campaigns tab is the answer: a permanent, organized, first-class archive of every creative package Vince has ever generated.

---

## Data architecture

### `copy_blocks` (new column)
```sql
ALTER TABLE creative_studio_generations
  ADD COLUMN IF NOT EXISTS copy_blocks JSONB NULL;
```

Stores the complete interleaved `parts` array from Gemini at generation time — an ordered array of alternating text and image objects:

```json
[
  { "type": "text", "content": "**Hook**\nThe future of advertising isn't louder — it's smarter.\n\n**Body**\n..." },
  { "type": "image", "content": "https://...supabase.../packages/google/1234.jpg" },
  { "type": "text", "content": "**Subject Line**\nYour inbox just got an upgrade\n\n**Preview Text**\n..." },
  { "type": "image", "content": "https://...supabase.../packages/google/5678.jpg" }
]
```

Images in `copy_blocks` store the public Supabase URL (base64 is replaced immediately after upload). This means the stored payload is compact and copy is permanently retrievable.

Campaigns generated before March 14, 2026 have `copy_blocks: null` and show an amber fallback notice in the detail view with images-only display.

### `conversation_id` in metadata
`generate-creative-package` accepts `conversation_id` in the request body and stores it as `metadata.conversation_id`. This links the generation record back to the originating chat session, enabling the Conversation tab in the detail view to load the full transcript.

### `user` join
`GenerationWithDetails` includes a `user` join (`full_name`, `avatar_url`) so the Campaigns tab can display who created each campaign — important in a multi-user agency context.

---

## Copy quality overhaul

### Root cause
All 14 `DELIVERABLE_TEMPLATES` had `copy_instructions` that asked for **on-image text only** with severely truncated limits:

- **LinkedIn Post:** `"Write a LinkedIn post (200–300 characters)"` — that's a tweet, not a post
- **Email Header:** `"Write the email subject line (50 characters max) and a preview text snippet (90 characters max)"` — nothing after the open
- **Print Full Page:** `"one powerful 5–7 word headline, one 10–15 word subheadline, one 15–20 word body line"` — an entire print ad reduced to ~50 words
- **Social Story:** `"Write a 1-sentence hook and a 3–5 word CTA"` — nothing publishable

The model followed instructions exactly. The copy was correct but minimal.

### Fix: full publishable copy packages
Every template now asks for complete, labeled deliverable copy — the kind a creative director or copywriter would hand off for production:

| Format | Before | After |
|--------|--------|-------|
| **LinkedIn Post** | 200–300 chars | 150–250 words: Hook / Body (3–4 sentences with proof points) / CTA / 3–5 Hashtags |
| **Email Header** | Subject line + preview | Subject (40–50 chars) / Preview text / Email Headline / Opening body (60–90 words) / Middle body (60–90 words) / CTA button label / P.S. line |
| **Product Shot** | 2–3 sentences | Headline / Subheadline / Body (60–90 words) / CTA / Social Caption (with hashtags) |
| **Social Story** | 1-sentence hook + CTA | Hook / On-screen overlay text / CTA / Post Caption (50–80 words + hashtags) |
| **TikTok / Reels** | Hook + overlay + hashtags | Hook / On-screen overlay / Script/Voiceover (40–70 words) / Video Caption (80–120 words) / 5–8 Hashtags |
| **Instagram Feed** | Hook + body + CTA + hashtags | Caption Hook (visible before "more") / Body (80–120 words, sensory/emotional) / CTA / 8–12 Hashtags |
| **Print Full Page** | 1 headline + 20-word body | Headline / Subheadline / Body copy (50–80 words) / Tagline / CTA / Art Director's Note |
| **OOH Billboard** | Headline + tagline | Headline (3–5 words max) / Tagline/CTA / Campaign Rationale (why this brevity works at scale) |
| **OOH Transit Shelter** | Headline + supporting line + CTA | Headline / Supporting line / CTA / Campaign Context (audience + rationale) |
| **Direct Mail** | Headline + offer + CTA | Outer Headline / Offer Statement / Body copy (back of card, 60–90 words) / CTA / P.S. Line |
| **Collateral / Sell Sheet** | Title + value prop | Document Title / Value Proposition / 3 Section Headlines / Intro Paragraph / 3 Key Benefits / Contact/CTA |
| **Display Banner** | Headline + subheadline + CTA | Headline / Subheadline / CTA Button / Ad Copy Rationale |
| **Leaderboard Banner** | Headline + CTA | Headline / CTA / A/B Variant Headline / Placement Strategy Note |
| **Skyscraper Banner** | Headline + CTA | Headline / Supporting Line / CTA / A/B Variant / Placement Strategy Note |

### Why this doesn't affect image quality
The copy and image generation are cleanly separated in Gemini's interleaved output. The `copy_instructions` and `image_instructions` are labeled sections in the prompt. Gemini produces `text` parts and `image` parts as separate output modalities — the model generates the text block first (following copy instructions), then generates the image (following image instructions and brand context). The richer copy prompts produce richer text blocks; the image generation is unaffected.

### `pre_generated_image_url` path
When `pre_generated_image_url` is set (e.g., headshot scene pipeline), the function takes a **copy-only path**: generates text with `gemini-2.0-flash` (TEXT modality only) and attaches the pre-supplied image. This preserves the person's actual likeness — re-generating would lose it.

---

## UI components

### `CampaignsTab` (main list view)

**Hero header block:**
- Campaign count, brand count, date range of archive
- Description of what the tab does

**Controls row:**
- Full-text search (brand name, brief, deliverable names)
- Brand dropdown filter (only shown when >1 brand exists)
- Sort toggle (newest/oldest first)
- View mode toggle (grid cards / list rows)

**Grid card (`CampaignGridCard`):**
- Mosaic thumbnail (1 image = full width; 2 = split; 3 = 2/3 + stack; 4+ = 2×2 grid with "+N more" overlay)
- Brand primary color accent bar (3px) between image and metadata
- Brand name + relative timestamp
- Brief excerpt (line-clamped to 2 lines)
- Deliverable chips (up to 4, then "+N more")
- Image count, model, generation time in subdued metadata row
- User badge (avatar initials + name)
- "Open" button + ZIP download icon button

**List row (`CampaignListRow`):**
- Brand color accent stripe (left edge)
- Up to 4 strip thumbnails (fixed 200px width strip)
- Brand name, brief, deliverable chips, user badge
- Relative timestamp + image count
- "Open" + ZIP buttons

### `CampaignDetail` (detail view)

**Header:**
- Back arrow to list
- Brand name + deliverable count badge + generation time badge + created-by badge
- Full brief text (no truncation)
- Download ZIP button

**Main content area (tabbed):**

**Campaign tab:**
- `CreativePackageDisplay` with `onImageInfo` callback for the per-image info dialog
- Historical campaigns (no `copy_blocks`): amber notice + image-only display with hover-to-download

**Conversation tab:**
- `ConversationTranscript` component — loads messages via `loadConversationMessages(conversationId)`
- Chat bubble UI: user messages right-aligned (violet), assistant messages left-aligned (muted)
- "No conversation linked" empty state for pre-update campaigns

**Analysis tab (`AnalysisPanel`):**
- **Brand Standards Analysis** — "Analyze Brand Fit" button invokes `brand-prompt-agent` with all image URLs + brief; returns per-deliverable scores and actionable feedback; scrollable result panel with "Re-run" option
- **Competitor Comparison** — URL input field (YouTube, ad landing page, etc.); invokes `brand-prompt-agent` to compare competitor content against our campaign; returns strengths/weaknesses, what we do better, strategic opportunities

**Right sidebar (sticky):**
`CampaignMetadataPanel` sections:
1. **Created By** — user avatar badge
2. **Generation Info** — model (monospace), generated date/time, generation time (to 2 decimal places), deliverable count, images generated, copy stored flag
3. **Brand** — name, category, primary color swatch + hex
4. **Deliverables** — numbered list with zero-padded indices
5. **Brand Alignment** — score bar + percentage (purple ≥75%, amber ≥50%, red <50%)
6. **Record** — package ID (monospace), completed timestamp, conversation ID (if present)

### Per-image info dialog
Triggered by hovering an image in the Campaign tab and clicking the `ℹ` button (added to `CreativePackageDisplay`'s image hover overlay). Shows:
- Full-width image preview (max-h-64, object-contain)
- 2-column metadata grid: Deliverable name, Index (01 of N), Model, Generated date/time, Generation Time, Brand
- Image URL (monospace, break-all, scrollable)
- Associated copy text (stripped of markdown bold markers, whitespace-preserved)
- Download Image button

### `CreativePackageDisplay` changes
- Added `onImageInfo?: (index: number, name: string, imageUrl: string) => void` prop
- Added `Info` icon button to image hover overlay (alongside "Use in Canvas" and "Save")
- Removed `line-clamp-2` from brief text in component header (was causing `...` truncation in the campaigns detail view, confusingly suggesting clickable expansion)

---

## ZIP download structure

```
{brand-slug}-campaign-{date}/
  _campaign-info.txt        ← comprehensive campaign metadata
  01-linkedin-post.txt      ← deliverable metadata header + full copy
  01-linkedin-post.jpg      ← image (fetched as blob)
  02-email-header.txt
  02-email-header.jpg
  ...
```

`_campaign-info.txt` contains:
- Brand, Created By, Generated (date/time), Generation Time, Model, Package ID, Deliverable Count
- Numbered deliverable list
- Full creative brief
- All image URLs with deliverable labels

Per-deliverable `.txt` files contain:
- `DELIVERABLE N: NAME` header
- Brand, Model, Generated date, Image URL
- `COPY` section with full text (markdown stripped)

---

## Files changed

| File | Action | Notes |
|------|--------|-------|
| `src/components/creative-studio/CampaignsTab.tsx` | Created | ~1,100 lines — full campaigns archive |
| `src/components/creative-studio/CreativePackageDisplay.tsx` | Modified | `onImageInfo` prop, Info button, removed `line-clamp-2` |
| `src/pages/CreativeStudioAdmin.tsx` | Modified | Added Campaigns tab with `Layers` icon |
| `src/types/creative-studio.ts` | Modified | Added `copy_blocks` to `CreativeStudioGeneration` |
| `supabase/functions/generate-creative-package/index.ts` | Modified | `copy_blocks` in insert, expanded copy instructions (all 14 templates), `conversation_id` in metadata, `pre_generated_image_url` copy-only path |
| Supabase migration | Applied | `ADD COLUMN copy_blocks JSONB NULL` |

### Git commits this session
- `feat: campaigns tab — per-image info dialog, fix brief truncation`
- `fix: expand copy_instructions to produce full publishable deliverable copy`

---

## Known limitations / future work
- Campaigns generated before 2026-03-14 show images only (no copy). Copy is not retroactively available.
- Conversation tab only works for campaigns where `conversation_id` was passed to `generate-creative-package` at call time. Pre-update campaigns have no conversation link.
- Analysis tab competitor comparison is text-only — does not fetch/render the competitor URL visually.
- `useMyGenerations(200)` — capped at 200 campaigns. Pagination not yet implemented.
