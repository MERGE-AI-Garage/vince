# Vince: Video Generation (Veo Integration)
**Date:** Mar 7, 2026

---

## What It Does

Vince can generate short brand videos via Veo 3 (fast and quality tiers). Video generation is fire-and-forget — Vince queues the render and it appears in the History panel when ready (typically 1-3 minutes). No polling required from the frontend.

---

## Tool: `generate_video`

**Input parameters:**

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `prompt` | string | required | Full video description |
| `aspect_ratio` | `"16:9"` \| `"9:16"` | `"16:9"` | 16:9 for hero/cinematic, 9:16 for stories/reels |
| `duration_seconds` | 4 \| 6 \| 8 | 8 | Must be exactly one of these values |
| `resolution` | string | `"720p"` | |
| `model` | `"fast"` \| `"quality"` | `"fast"` | quality = `veo-3.1-generate-preview`, fast = `veo-3.1-fast-generate-preview` |
| `generation_type` | string | `"text_to_video"` | |
| `reference_image_url` | string | optional | Quality model only — anchors subject/logo consistency |

**Audio:** Always included automatically, no parameter needed. Both models produce audio.

---

## Architecture: Fire-and-Forget Pattern

```
Vince calls generate_video
  ↓
brand-prompt-agent calls generate-creative-video edge function
  ↓
Edge function INSERTs a job row → returns { queued: true } immediately
  ↓
pg_net AFTER INSERT trigger fires the Veo worker
  ↓
Worker calls Veo API, uploads result, updates job status
  ↓
creative_studio_generations table row → real-time subscription
  ↓
History panel updates automatically (useRealtimeGenerations hook)
```

The `brand-prompt-agent` handler returns `{ queued: true }` — the frontend detects this and starts the elapsed-seconds timer rather than waiting for a video URL.

---

## UI: Video Rendering Indicator

When `generate_video` returns with `queued: true`, the `BrandAgentApp` starts an elapsed-time ticker:

```
● Video rendering
  42s elapsed · appears in History when ready     [×]
```

The `×` dismisses the indicator. If the video returns synchronously with `output_urls` (unexpected in fire-and-forget), the ticker stops and a video player card renders in chat.

When video arrives via real-time:
- The `creative_studio_generations` INSERT fires `useRealtimeGenerations`
- History panel refreshes and shows the video thumbnail
- No action required from the user

---

## Voice Mode Handling

`onToolResult` in `BrandAgentApp` handles two cases:
- `result.queued === true` → `setVideoRenderingAt(new Date())` — starts timer
- `result.output_urls` present → `setVideoRenderingAt(null)` + inject video message with player

Status text in the voice bar shows "⏳ Rendering video (1-3 min)..." while `activeToolName === 'generate_video'` (covers the brief window while Vince is making the call, not the full render).

---

## System Prompt Rules

```
VIDEO GENERATION:
- Duration must be exactly 4, 6, or 8 seconds — never 5 or 7.
- aspect_ratio supports only "16:9" or "9:16" — no 1:1 for video.
- Default: fast model, 8 seconds, 720p, 16:9.
- Audio is automatic on both models — always included, no parameter needed.
- Use model: "quality" when the user wants best cinematic output or provides reference images.
- Use reference_image_url when the user wants consistent subject/logo/product — quality model only.
- Video renders in 1-3 minutes and appears in the History panel automatically.
- NEVER narrate generating a video without calling generate_video — text descriptions do nothing.
```

---

## Trigger Phrases

Vince calls `generate_video` when the user asks for:
- "a video", "a short film", "a reel", "a story ad", "a motion concept"
- "make it move", "animate this", "video version of this campaign"

---

## What's Not Yet Built

- Polling fallback: if the real-time subscription misses the completion event, there's no manual "check if ready" button for the user
- `generate_brand_playbook_status` tool (noted in gap analysis) — would let Vince report on any in-flight job
- Download button on the video player card
- Video appearing in the voice mode Competitive Intel counter-campaign flow (video could be the counter-campaign deliverable)
