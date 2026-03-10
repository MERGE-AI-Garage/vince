# Vince: Beat This Ad — Enhanced Competitor Card, Self-Demo Analysis, and Voice Persistence
**Date:** Mar 10, 2026

---

## Beat This Ad — Enhanced Competitor Analysis Card

The orange Competitive Intel card was significantly expanded. It now renders a full multi-section analysis rather than just a summary + counter brief.

### New sections in the card

**Scene Breakdown**
A timeline of the competitor video, one row per scene:
- Timestamp (monospace orange)
- Scene type (what's happening visually)
- Emotional signal (what they're evoking, italic)

Only renders if `scenes[]` is returned by the edge function.

**Strategic Openings**
Unchanged from initial build — bullet list of `weaknesses[]`.

**3 Ways to Beat It** (new)
Up to 3 `CampaignDirection` objects, each rendered as a clickable card:
- Title (bold)
- Concept description
- Tagline (italic orange)

Clicking a direction sends a pre-composed message to Vince: `"Let's go with the [title] direction. [concept] Tagline: [tagline]"` — hands it off for immediate creative package generation.

**Build These** (new)
`counter_deliverables[]` rendered as clickable buttons. Each one shows the deliverable name + aspect ratio. Clicking sends a full brief to Vince:
```
"Generate a creative package for a [name] ([aspect_ratio], deliverable_type: [type]) as part of the counter-campaign. Brief: [description]"
```

**Full Counter Brief** (new)
Collapsible `<details>` element — hidden by default to keep the card compact, expandable for the full written brief.

### Updated interfaces

```typescript
interface CompetitorScene {
  timestamp: string;
  scene_type: string;
  emotional_signal: string;
  marketing_intent: string;
}

interface CampaignDirection {
  title: string;
  concept: string;
  emotional_angle: string;
  tagline: string;
}

interface CompetitorAnalysis {
  // existing fields...
  scenes: CompetitorScene[];
  campaign_directions: CampaignDirection[];
  counter_deliverables?: Array<{
    name: string;
    description: string;
    deliverable_type: string;
    aspect_ratio: string;
  }>;
  // counter_brief is now collapsible, not the primary CTA
}
```

### Analyzing Video Indicator (new)

When the user sends a message containing a YouTube, .mp4, or .mov URL, the UI immediately starts an orange elapsed-time indicator:

```
● Analyzing video
  12s · Gemini is watching the video...
```

After 60s it switches to: `1m 5s · almost there...`

The indicator auto-dismisses when `handleSendMessage` completes (either success or error). It runs in parallel to the thinking indicator — both can show simultaneously if the message includes a video URL.

**Trigger:** `if (/youtu\.?be|youtube\.com|\.mp4|\.mov/.test(text)) setAnalyzingVideoAt(new Date())`

---

## Self-Demo Analysis

A new violet-accented card for the `analyze_self_demo` tool — Vince can analyze a recording of your own product demo and return structured feedback.

### Tool: `analyze_self_demo`

Takes a video URL and returns:
```
product_summary           — what the demo shows
demo_score                — 0-100 quality rating
ux_observations           — what was observed about the UX
missed_opportunities      — things that could have been shown
demo_narrative_issues     — structural or flow problems
recommended_improvements  — specific things to change
```

### Card UI

Violet accent (`bg-violet-500/5`, `border-violet-500/20`), score displayed in header:
```
SELF ANALYSIS                     Demo Score: 74/100
[product_summary]
UX Observations   [bullet list]
Missed Opportunities   [bullet list]
Narrative Issues   [bullet list]
Recommended Improvements   [bullet list]
```

### Extraction path

Same pattern as competitor analysis — extracted from `response.tool_actions` in `handleSendMessage` and via `onToolResult` in voice mode.

---

## Voice Session Persistence

Voice conversations are now saved to `chatbot_conversations` when the session ends.

### `persistVoiceSession()`

Called in two places:
1. `onClose` callback (session dropped or reconnect attempt)
2. `handleCloseVoice` (user clicks Chat button)

Uses refs (`conversationIdRef`, `messagesRef`) rather than state to avoid stale closure issues inside the live session callbacks.

**Filtering:** System messages are excluded before save — "Reconnecting voice...", "Voice session ended.", "Voice mode unavailable. Using chat instead.", "Voice connection lost. Chat mode active."

**Metadata stored:**
```typescript
{
  brand_id: brandCtx?.brand?.id,
  brand_name: brandCtx?.brand?.name,
  tool_calls_count: voiceToolCallsRef.current,
}
```

`voiceToolCallsRef.current` is incremented in `onToolResult` — gives a count of how many tools Vince used in the session.

### `saveVoiceConversation()`

Imported from `brandAgentGeminiService.ts`. Fire-and-forget — any error is caught internally and logged but never surfaces to the user.

---

## `invalidateGenerations()` Hook

`useInvalidateGenerations()` is now called after a creative package is generated (both text and voice paths). This triggers a React Query invalidation on `creative_studio_generations`, forcing the History panel to refresh and show the new images immediately.

Previously, Vince-generated images were only visible after a manual History refresh or the real-time subscription fired.

---

## Testing

See `2026-03-07-voice-testing-guide.md` for updated test cases covering:
- Beat This Ad card sections (Test 10 updated)
- Analyzing video indicator (new Test 15)
- Self-demo analysis (new Test 16)
- Voice session save to DB (new Test 17)
