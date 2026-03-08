# Brand Recon Pipeline — Complete Auto-Synthesis

## Overview

The Brand DNA Recon pipeline now runs end-to-end automatically. Previously, running Recon analyzed a brand website and synthesized a brand profile — but stopped there. The Brand Agent had no generation context, and `brand_voice` / `visual_identity` remained empty, leaving 5+ edge functions with blind brand context.

**Before:**
```
analyze-brand-website → [analyses] → synthesize-brand-profile → STOPS
```

**After:**
```
analyze-brand-website → [analyses] → synthesize-brand-profile → [brand_profiles + brand_voice/visual_identity synced] → synthesize-generation-prompt → [brand_generation_prompts]
```

## Changes Made

### `supabase/functions/synthesize-brand-profile/index.ts`

**1. Auto-chain to `synthesize-generation-prompt`**

Added a fire-and-forget `fetch()` call immediately after the `brand_profiles` upsert succeeds. Same pattern used throughout the codebase — no `await`, errors logged but don't block the parent response.

```typescript
const genPromptUrl = `${supabaseUrl}/functions/v1/synthesize-generation-prompt`;
fetch(genPromptUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
  body: JSON.stringify({ brand_id }),
}).then(async (resp) => {
  if (!resp.ok) {
    const err = await resp.text().catch(() => 'unknown');
    console.error(`[Synthesize] Generation prompt synthesis failed (${resp.status}):`, err.slice(0, 200));
  } else {
    console.log(`[Synthesize] Generation prompt created for brand ${brand_id}`);
  }
}).catch((err) => {
  console.error('[Synthesize] Failed to trigger generation prompt synthesis:', err);
});
```

**2. Sync `brand_voice` and `visual_identity` back to brands table**

Added to the existing brands sync block (alongside `primary_color`, `secondary_color`, `logo_url`). Non-destructive — only writes when the field is currently empty, so manual edits are preserved.

```typescript
if (!currentBrand?.brand_voice && synthesized.tone_of_voice) {
  const tov = synthesized.tone_of_voice as any;
  const parts = [tov.formality, tov.personality, tov.energy].filter(Boolean);
  if (parts.length > 0) brandSync.brand_voice = parts.join('. ');
}
if (!currentBrand?.visual_identity && synthesized.visual_dna) {
  const vdna = synthesized.visual_dna as any;
  const summary = vdna.signature_style || vdna.key_differentiators || vdna.visual_principles;
  if (summary) brandSync.visual_identity = String(summary).slice(0, 500);
}
```

## Why This Matters

- `brand_generation_prompts` is what `brand-prompt-agent` (Vince) reads for every generation — without it, the Brand Agent has no structured brand context
- `brand_voice` and `visual_identity` are used as fallback brand context by: `generate-brand-starters`, `enhance-director-prompt`, `generate-brand-prompt`, `generate-creative-package`, `analyze-competitor-video` — when empty, all those functions generate without brand personality or visual style
- Previously these required manual editor input after every Recon run; now they're automatic

## Deployment

```bash
npx supabase functions deploy synthesize-brand-profile --project-ref foolpmhiedplyftbiocb --no-verify-jwt
```

Deployed as version 5 on 2026-03-07.

## Verification

1. Run Brand DNA Recon on a brand (Website Analysis)
2. Wait ~30s for both synthesis steps to complete
3. Check `brand_generation_prompts` table — new row for the brand
4. Check `creative_studio_brands.brand_voice` and `visual_identity` — compact text from synthesis
5. Open Brand Agent — it should immediately have brand context without manual steps
6. Re-running Recon does NOT overwrite manually edited `brand_voice`/`visual_identity`
