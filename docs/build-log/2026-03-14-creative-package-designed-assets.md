# Creative Packages: Enforcing Designed Marketing Assets

How Vince ensures creative package deliverables are fully designed marketing assets — not plain photographs.

---

## The Problem This Solves

When a user uploads a headshot reference and requests a creative package (e.g., a LinkedIn post), Vince was generating plain portrait photos with copy alongside them rather than fully designed marketing assets with text, logos, and brand elements rendered directly on the image.

Three bugs converged to cause this:

1. **System instruction gap** — The system prompt told Gemini to "reflect the brand's visual identity" but never mandated rendering text and logos onto the image. Gemini treated deliverables as photo briefs.

2. **Subject reference override** — The prompt injection for reference images said "Feature the above subject(s) as the primary visual in ALL generated images," which caused Gemini to treat the headshot as the whole deliverable and ignore the layout instructions in the deliverable template.

3. **`pre_generated_image_url` shortcut** — When a headshot was pre-generated via `generate_headshot_scene`, the code bypassed image generation entirely: it generated copy with a text model and attached the raw headshot as the deliverable image. No design treatment occurred.

---

## What Changed

### 1. System instruction mandate (`generate-creative-package/index.ts`)

Added a `CRITICAL` rule to the base system instruction:

> Every image you generate must be a FULLY DESIGNED MARKETING ASSET — not a photograph or portrait. Each image must have text rendered directly on it (headlines, CTAs), the brand logo placed in the composition, and brand color treatments applied. Think: finished ad creative, not a photo shoot. If a subject reference is provided, incorporate them INTO the designed layout as a visual element within the composition — the subject does not replace the design.

### 2. Subject reference framing

Changed the subject reference injection from:

> Feature the above subject(s) as the primary visual in all generated images. Match the described appearance closely.

To:

> Incorporate the above subject(s) into each deliverable's designed layout. The subject is a visual element within the composition — not the entire image. Each deliverable must still include all required design elements (headlines, logo, brand colors, typography) rendered directly on the image as specified.

### 3. Removed the `pre_generated_image_url` shortcut

The copy-only path that attached a raw headshot to the deliverable was removed. When `pre_generated_image_url` is set, Vince now:

1. Runs the image through Gemini Vision to extract a subject description
2. Injects that description as a subject reference into the deliverable prompt
3. Falls through to the full interleaved generation path

This means the headshot is treated exactly like any other reference image — Gemini generates a properly designed deliverable with the person incorporated into it.

---

## Deliverable Templates

Each deliverable type in `DELIVERABLE_TEMPLATES` already specifies detailed layout requirements (headline placement, logo position, brand color treatment, aspect ratio). These instructions were correct — the bug was that upstream prompt framing was overriding them. The templates themselves were not changed.

Current deliverable types:

| Type | Format | Layout Requirements |
|------|--------|---------------------|
| `linkedin_post` | 4:3 | Headline in upper third, logo in corner, brand color accent bar |
| `social_story` | 9:16 | Bold headline top third, CTA bottom, logo corner |
| `tiktok_reel` | 9:16 | Hook text top safe zone, logo + CTA bottom safe zone |
| `display_banner` | 16:9 | Logo left, headline center, CTA button right |
| `instagram_feed_portrait` | 4:5 | Subject centered, brand wash + logo in lower third |
| `print_full_page` | 3:4 | Studio aesthetic, clear copy zones, no text overlay |
| `print_ooh_billboard` | 16:9 | Max 3 words, extreme scale, single dominant visual |
| `banner_leaderboard` | 8:1 | Three-zone: logo/visual | headline | CTA button |
| `banner_skyscraper` | 1:4 | Three-zone vertical: logo | visual | CTA button |

---

## Expected Output

**Before:** LinkedIn post deliverable = plain headshot with copy as separate text
**After:** LinkedIn post deliverable = designed card with headline rendered on image, brand logo placed, brand color bar, subject incorporated into layout

---

## Implementation Notes

- Function: `supabase/functions/generate-creative-package/index.ts`
- The `pre_generated_image_url` branch was removed; the interleaved generation path is now always used
- Vision model for subject analysis: `gemini-2.0-flash`
- Creative generation model: `gemini-3.1-flash-image-preview` with `responseModalities: ['TEXT', 'IMAGE']`
- The subject reference block and the `pre_generated_image_url` block both guard against double-injection (the latter only runs when no `reference_image_urls` are already present)
