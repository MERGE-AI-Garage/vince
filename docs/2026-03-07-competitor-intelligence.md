# Vince: Competitive Intelligence via Voice
**Date:** Mar 7, 2026

---

## What It Does

Vince can analyze a competitor's video ad or campaign URL and return structured strategic intelligence — what they're saying, who they're targeting, and where their creative is weak. The analysis feeds directly into a counter-brief that Vince can immediately turn into a creative package.

---

## How It Works

### Tool: `analyze_competitor_content`

Vince tool that forwards to the `analyze-competitor-video` edge function.

**Input:**
- `video_url` (required) — YouTube URL or direct video URL
- `analysis_context` (optional) — additional framing, e.g. "focus on emotional tone"

**What it calls:** `${SUPABASE_URL}/functions/v1/analyze-competitor-video` with the brand context attached so the analysis is relative to the active brand's positioning.

**Returns:**
```
competitor_summary     — 1-2 sentence overview
key_messages           — string[] of core claims
visual_style           — description of their visual language
target_audience        — who they're speaking to
emotional_hooks        — techniques they're using
weaknesses             — strategic gaps and vulnerabilities
counter_brief          — Vince's recommended counter-strategy
counter_deliverables   — suggested campaign assets to build
latency_ms             — analysis time
```

Vince presents the findings but **does not auto-generate** — it asks "Want to build a counter-campaign?" before calling `generate_creative_package`. This is intentional; the system prompt enforces the pause.

---

## UI: Competitive Intel Card

When `analyze_competitor_content` returns successfully, a structured card renders in the chat thread (orange accent, separate from the purple brand theme):

```
COMPETITIVE INTEL
[competitor_summary]

Strategic Openings
› [weakness 1]
› [weakness 2]
...

Counter Brief
[counter_brief text]
```

The card renders in both text chat and voice mode (`onToolResult` handler wires it up for voice via `compMsgId` message injection).

---

## Voice Mode Flow

The intended demo path:

1. User is in voice mode with Vince
2. User says: "Analyze this competitor ad"
3. User pastes the URL into the URL input field in the voice bar and presses Enter (or clicks Send)
4. Vince receives the URL via `liveControlRef.current.sendText()`
5. Vince calls `analyze_competitor_content` — status bar shows "⏳ Analyzing competitor video..."
6. Competitive Intel card appears in the chat thread
7. Vince narrates the key findings and asks about counter-campaign
8. User says "Yes, build it" → Vince calls `generate_creative_package`

---

## Edge Function: `analyze-competitor-video`

- Receives `video_url`, `brand_id`, `analysis_context`
- Fetches the video content (or uses Gemini's native URL understanding)
- Calls Gemini with a structured analysis prompt that compares against the active brand's DNA
- Returns `{ analysis: { competitor_summary, key_messages, ... }, video_url, latency_ms }`

---

## Trigger Phrases (System Prompt)

Vince is instructed to call `analyze_competitor_content` when the user:
- Shares a video URL and asks for analysis
- Says "analyze this ad", "what are they doing", "look at this competitor", etc.
- Pastes a YouTube or video link in voice mode

---

## What's Not Yet Built

- Rendering the `counter_deliverables` list as clickable action buttons (e.g. "Build LinkedIn Post" → auto-calls `generate_creative_package` with that deliverable type)
- Saving competitor analyses to a `competitive_intelligence` table for brand-level history
- Side-by-side brand vs. competitor visual comparison view
