# Vince: Veo Video Generation — Full Feature Buildout
**Date:** Mar 7, 2026

---

## Overview

### `generate_video` Tool — Complete Overhaul

The tool definition, edge function, and voice fast-path were all updated together to support the full Veo 3.1 feature surface.

---

## Bugs Fixed

### `durationSeconds out of bound` Error
**Root cause:** Veo only accepts exactly **4, 6, or 8 seconds** — not a continuous range. Passing `5` (the old default) caused a hard API error.

**Fix:** The `generate-creative-video` edge function now snaps the incoming duration to the nearest valid value before calling the API:
```typescript
const validDurations = [4, 6, 8];
const snappedDuration = validDurations.reduce((prev, curr) =>
  Math.abs(curr - effectiveDuration) < Math.abs(prev - effectiveDuration) ? curr : prev
);
```
1080p and 4K resolutions are automatically forced to 8s (maximum detail at high res).

---

### `generateAudio isn't supported by this model` Error
**Root cause:** `generateAudio` is not a valid Veo API parameter. Veo 3 generates audio natively and automatically on every generation — there is no opt-in flag.

**Fix:** The `generateAudio` parameter was removed entirely from both the edge function and the `brand-prompt-agent` tool definition. The system prompt was updated to inform Vince that "both models include audio automatically."

---

### Voice Session Dying After Tool Definition Change
**Root cause:** The `generate_video` tool's `duration` field had `enum: [4, 6, 8]` on a `number` type. Gemini `FunctionDeclaration` schema only supports string enums — a numeric enum silently breaks the Live API connection, causing the session to die immediately on start.

**Fix:** Removed the `enum` constraint. Duration is now a plain `number` type with the constraint expressed in the description: "Must be exactly 4, 6, or 8 — no other values are valid."

---

## New Capabilities

### Fast vs. Quality Model Selection
Vince can now choose between two Veo 3.1 tiers:

| Model param | API model ID | Cost | Audio | Reference images |
|-------------|-------------|------|-------|-----------------|
| `fast` | `veo-3.1-fast-generate-preview` | ~$0.80 | Yes (native) | Not supported |
| `quality` | `veo-3.1-generate-preview` | ~$2.00+ | Yes (native) | Supported |

System prompt guidance:
- Use `fast` by default unless the user asks for maximum quality or provides reference images
- `quality` is required for reference images
- When user asks about audio, clarify both models include it automatically

### Reference Images
The quality model supports up to 3 reference images that Veo uses to guide visual style:
- Passed as `reference_images: string[]` (data URIs or URLs) in the tool call
- The edge function silently skips reference images on the fast model and logs a warning
- Quality model with reference images is forced to 8s duration
- Voice mode: session-level uploaded images (`sessionReferenceImages`) are automatically appended when the quality model is selected

### Resolution
Both models support `720p` (default) and `1080p`. High-resolution generations are automatically snapped to 8s.

### Logo Injection
The existing `include_logo` pattern from image generation is available in the voice fast-path — the session's active brand logo can be included as a reference image when the quality model is selected.

---

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/generate-creative-video/index.ts` | Duration snapping, removed `generateAudio`, reference image model-gating, resolution support |
| `supabase/functions/brand-prompt-agent/index.ts` | Tool definition: `model` enum (fast/quality), `duration` as plain number, `reference_image_url`, `resolution`; `generateVideo()` maps to model IDs; updated system prompt VIDEO GENERATION section |
| `src/services/brand-agent/brandAgentLiveService.ts` | Voice fast-path updated: maps `model` → model ID, passes `resolution`, collects reference images from session, removed `include_audio` |

---

## Tool Definition (Current)

```typescript
generate_video: {
  description: 'Queue a Veo video generation. Fire-and-forget — appears in History when ready.',
  parameters: {
    prompt:              { type: 'string' },          // required
    model:               { type: 'string', enum: ['fast', 'quality'] },
    duration:            { type: 'number' },           // 4 | 6 | 8 only
    aspect_ratio:        { type: 'string', enum: ['16:9', '9:16', '1:1'] },
    resolution:          { type: 'string', enum: ['720p', '1080p'] },
    reference_image_url: { type: 'string' },           // quality model only
    brand_id:            { type: 'string' },
  }
}
```

---

## Deployment Notes
- `generate-creative-video` redeployed with `--no-verify-jwt`
- `brand-prompt-agent` redeployed — final bundle 158.4kB
- Both deployed to Supabase project `foolpmhiedplyftbiocb` (brand-lens)
