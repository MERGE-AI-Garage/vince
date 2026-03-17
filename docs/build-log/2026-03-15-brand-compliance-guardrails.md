# Brand Compliance Guardrails: Creative Package Generation

Fixes for three categories of output violations observed in AI-generated creative package deliverables: technical production specs bleeding into copy, hex colors rendering as visible design elements, and title case headlines when sentence case is required.

---

## Issues Identified

### 1. Print production specs in generated copy (our bug)

The `DELIVERABLE_TEMPLATES` `image_instructions` for print formats contained language like "CMYK-safe color palette," "rich tonal detail suitable for offset printing," and "print-production detail." Gemini echoed these rendering instructions back as bullet points in the generated copy — most visibly on sell sheets, where the bullets read as literal production specs.

Root cause: We included production spec language in `image_instructions` as artistic direction for the model, but Gemini conflated the rendering guidance with copy generation.

### 2. Hex color codes rendering as visible elements (our bug)

Brand context passed raw hex palette values (e.g., `Full Palette: #4285F4, #EA4335, #FBBC05, #34A853`). Gemini rendered these as color swatches with hex labels directly inside generated images.

### 3. Title case headlines (sparse brand data + no default)

Google brand requires sentence case for all headlines. The `synthesize-generation-prompt` function enforces sentence case — but only when the brand profile explicitly contains typography rules. The Google brand profile in Vince was built from scraped data and lacked explicit typography directives, so Gemini defaulted to its own preference (title case).

### 4. Hallucinated / garbled body copy

`gemini-3.1-flash-image-preview` occasionally generates incoherent text in body copy. This is a model quality issue — partially mitigated by explicit instruction, not fully preventable at the prompt level.

---

## Changes

**File:** `supabase/functions/generate-creative-package/index.ts`

### Sanitized print template `image_instructions`

All five print format templates (`print_full_page`, `print_ooh_billboard`, `print_ooh_transit`, `print_direct_mail`, `print_collateral`) had production spec language removed from `image_instructions`:

- Removed: "CMYK-safe color palette," "offset printing," "print-production detail," "tonal detail suitable for," "large-format outdoor printing"
- Replaced with neutral quality direction: "accurate brand colors," "premium editorial quality," "crisp detail"

### Universal guardrail block

Added a `universalGuardrails` block appended to every system instruction, unconditionally:

```
UNIVERSAL OUTPUT RULES — ALWAYS ENFORCE:
- Headlines and body text must use sentence case: capitalize only the first word and proper nouns
- NEVER render hex color codes (#XXXXXX), RGB values, CMYK percentages, or PMS numbers as visible text or design elements in any image
- NEVER include technical production specs (CMYK, offset printing, DPI, bleed, resolution, print quality) in any copy block, bullet points, or image text
- NEVER use placeholder text — every copy field must contain real, finished marketing language
- Body copy must consist of complete, grammatically correct English sentences
```

These rules apply regardless of brand, Brand DNA status, or agent directives.

### brand_standards wired into generation pipeline

**Previously:** `creative_studio_brand_profiles` was queried with `.select('visual_dna, photography_style, color_profile, composition_rules, brand_identity, tone_of_voice')`. The `brand_standards` and `typography` fields were fetched by `synthesize-generation-prompt` (during Brand DNA synthesis) but never by `generate-creative-package` (during actual generation).

**Now:** Both `brand_standards` and `typography` are included in the profile query. `buildBrandContext()` reads `brand_standards.typography_system.rules` and injects them as "Brand Typography Rules" when present. This means that when a brand has real guidelines loaded (logo safe space rules, font case requirements, etc.), they reach the generation prompt.

---

## What This Doesn't Fix

- **Garbled body copy** — model quality issue with `gemini-3.1-flash-image-preview`. The sentence coherence guardrail reduces frequency but can't eliminate it.
- **Logo safe space violations** — requires populated `brand_standards` data. Fix 3 above wires the pipeline; the data still needs to be loaded per brand.
- **Face obstruction from data visualization overlays** — prompt-level mitigation is fragile. Better handled in post-generation review.

---

## Implementation Notes

- Edge function: `supabase/functions/generate-creative-package/index.ts`
- Deployed: version 31 to project `foolpmhiedplyftbiocb` (brand-lens)
- The universal guardrails apply to both the interleaved generation path and the copy-only (`pre_generated_image_url`) path, since both use `fullSystemInstruction`

---

## Context: Why Brand Data Is Sparse

For demo purposes, Vince's Google/Chromebook brand profile was built from web-scraped data rather than official brand guidelines. Real clients provide brand books with explicit rules (approved typefaces, case requirements, color systems, safe space specifications). With richer data, the `brand_standards` pipeline (now wired up) will enforce those rules automatically during generation.
