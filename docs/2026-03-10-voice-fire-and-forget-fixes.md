# Voice Mode Fire-and-Forget Fixes

**Date:** 2026-03-10
**Branch:** main
**Files changed:**
- `src/services/brand-agent/brandAgentLiveService.ts`
- `supabase/functions/brand-prompt-agent/index.ts`

---

## Problem

Several long-running Vince tools were blocking the Gemini Live voice session synchronously. The `executeRemoteTool()` generic `await` path held up the session until the tool returned — meaning Vince couldn't speak, respond, or process new input while the operation ran. For a 2-3 minute playbook, this effectively froze the entire voice session.

The pattern is the same root cause as `generate_video` (already fixed): Gemini Live has a ~30-second window before a session with no activity may stall, and multi-step pipelines far exceed that.

---

## Fixed Tools

All four were moved to fire-and-forget **before** the generic `try { await executeRemoteTool(...) }` block in `brandAgentLiveService.ts`.

### `generate_brand_playbook` (2-3 min)

5-step sequential pipeline: synthesize DNA → guardrails (6 Gemini calls) → generation prompt → brand cards (5 image generations) → Director Mode starters.

**Fix:** Returns immediately with "Playbook is running in the background" message. Completion injects via `sendText()` when done.

**Also:** Brand card generation (step 4) decoupled from the main pipeline in the edge function itself — cards fire-and-forget inside `generateBrandPlaybook()` to prevent the edge function from hitting the 150s Supabase timeout. Steps 1-3 and 5 complete synchronously within the window.

### `generate_creative_package` (30-60s)

Multiple Gemini image generations per deliverable.

**Fix:** Returns "Campaign package is generating" immediately. Completion message reports deliverable count when ready.

### `generate_brand_guardrails` (15-90s)

Single focus area: ~15s. All 6 areas (`all_areas: true`): 6 sequential Gemini calls, 60-90s total.

**Fix:** Immediate response with contextual message (explains scope if `all_areas`). Completion reports how many directive sets were created.

### `analyze_self_demo` (~20-30s)

Calls `analyze-competitor-video` edge function in self-critique mode; Gemini vision processes the video.

**Fix:** Returns "Watching the demo now" immediately. Completion injects score + top improvement via `sendText()`.

---

## Pattern Summary

```typescript
// Fire-and-forget template (from brandAgentLiveService.ts)
if (fc.name === 'some_long_tool') {
  // 1. Push optimistic response immediately — unblocks session
  functionResponses.push({
    id: fc.id || '',
    name: 'some_long_tool',
    response: { success: true, started: true, message: "Starting... I'll let you know when done." },
  });
  callbacks.onToolStart?.('some_long_tool');

  // 2. Run in background — inject result via sendText when complete
  executeRemoteTool('some_long_tool', fc.args || {}, activeBrandId, userContext?.id)
    .then(result => {
      if (sessionCancelled) return;
      callbacks.onToolResult?.('some_long_tool', result);
      sessionPromise?.then(s => s.sendText('Done! Here is what happened...')).catch(() => {});
    })
    .catch(err => {
      if (sessionCancelled) return;
      sessionPromise?.then(s => s.sendText('Ran into a problem — check the UI.')).catch(() => {});
    });
  continue;
}
```

---

## Full Fire-and-Forget Inventory (Voice Mode)

| Tool | Duration | Status |
|------|----------|--------|
| `generate_video` | 1-3 min | ✓ fire-and-forget (pre-existing) |
| `analyze_competitor_content` | ~20s | ✓ fire-and-forget (pre-existing) |
| `generate_brand_playbook` | 2-3 min | ✓ fire-and-forget (this fix) |
| `generate_creative_package` | 30-60s | ✓ fire-and-forget (this fix) |
| `generate_brand_guardrails` | 15-90s | ✓ fire-and-forget (this fix) |
| `analyze_self_demo` | ~20-30s | ✓ fire-and-forget (this fix) |
| All DB/fast tools | <5s | ✓ awaited synchronously (correct) |

---

## Demo Issue That Surfaced This

During a live Microsoft brand onboarding demo, `generate_brand_playbook` was called in voice mode. Vince froze for 2+ minutes then reported "complete" but nothing appeared in history. Root cause: the tool was blocking the session, and brand card generation (5 × Gemini image calls) was also pushing the edge function past the timeout window, causing silent failure on the last steps.
