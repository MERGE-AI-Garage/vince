# Vince: Voice Session Stability Fixes + UI Polish
**Date:** Mar 7, 2026

---

## Overview

---

## Bug Fixes

### Vince Frozen / Looping ("keeps saying That's a compelling counter-brief")
**Root cause:** `proactivity: { proactiveAudio: true }` was set in the Gemini Live API config. This option causes the model to spontaneously regenerate audio — even mid-conversation, mid-interrupt, and after long tool calls. It produced a loop where Vince kept re-voicing the previous response while the user was speaking.

**Fix:** Removed `proactivity: { proactiveAudio: true }` from the Live API session config in `brandAgentLiveService.ts`. The greeting still works via the `START_SESSION` text message sent in the `onopen` callback — `proactiveAudio` was never needed for it.

---

### Competitor Analysis Appearing Twice in Chat
**Root cause:** When the user mentioned the competitor a second time (e.g., "what's the counter-brief for that ad?"), Vince re-called `analyze_competitor_content` with the same URL. The second call took 15-20s to resolve, which hit the Live API tool response timeout — ending the session with "Sure." as Vince's final utterance before disconnect.

**Fix:** Two-layer solution:

**Layer 1 — Session-level URL deduplication:** A `Set<string>` (`analyzedCompetitorUrls`) tracks every URL that has been analyzed in the current session. A `lastCompetitorResult` cache stores the most recent result. When a duplicate URL call arrives, the cached result is returned instantly:
```typescript
if (fc.name === 'analyze_competitor_content') {
  const url = (fc.args?.url as string) || '';
  if (url && analyzedCompetitorUrls.has(url) && lastCompetitorResult) {
    functionResponses.push({ id: fc.id || '', name: 'analyze_competitor_content', response: lastCompetitorResult });
    continue;
  }
}
```

**Layer 2 — System prompt guidance:** The voice system prompt was updated to instruct Vince: "Call `analyze_competitor_content` ONCE per URL. If you already have the result in this session, reference it directly."

---

### Tool Call Deduplication (Live API Streaming)
**Root cause:** The Gemini Live API streams messages; multiple chunks can arrive each carrying `toolCall.functionCalls` for the same logical call.

**Fix:** `processedFunctionCallIds` Set tracks call IDs seen in the current message batch. Duplicate IDs are skipped before any tool execution:
```typescript
const newCalls = functionCalls.filter(fc => {
  if (!fc.id) return true;
  if (processedFunctionCallIds.has(fc.id)) return false;
  processedFunctionCallIds.add(fc.id);
  return true;
});
if (newCalls.length === 0) return;
```

---

## UI Polish

### Video Rendering Timer
When Vince queues a video via voice mode, a card appears in the chat showing elapsed render time (live counter, updates every second):
- Purple-tinted card with a spinner
- Shows "Veo 3 rendering... Xs" with a live elapsed second counter
- Dismiss button (X) to close it manually
- Timer auto-stops when user dismisses or starts a new render

**Implementation:**
- `videoRenderingAt: Date | null` state in `BrandAgentApp`
- `elapsedVideoSeconds` state driven by `setInterval` in a `useEffect`
- `onToolResult` callback sets `videoRenderingAt = new Date()` when `result.queued === true`

---

### Default Panel: Vince (Not Director Mode)
`CreativeStudio.tsx` now initializes with Vince open:
```typescript
const [rightSidebarMode, setRightSidebarMode] = useState<RightSidebarMode>('vince');
```
Previously defaulted to `'settings'` (Director Mode / parameters panel). Clicking the Vince icon again collapses it back to the main canvas view.

---

### Quick Prompt Buttons — Purple Theme
The quick prompt pill buttons in the Vince panel were updated from the default muted gray to purple:
```
bg-purple-500/10 border-purple-500/30 text-purple-300
hover:bg-purple-500/20 hover:text-purple-200 hover:border-purple-400/50 rounded-full
```

---

### Send Button — Icon-Only Purple Style
The send button in Vince's text input was redesigned from a solid emerald box to a bare icon that matches the style of the paperclip and microphone icons:
- No background box
- Purple icon color: `text-purple-400 hover:text-purple-300`
- `hover:scale-110 active:scale-95` micro-interaction

**Implementation:** `InputArea.tsx` gained a `sendButtonClassName?: string` prop. When provided, the send button renders as an `h-9 w-9` container using only the provided classes — no forced background, border, or rounded shape. `BrandAgentApp.tsx` passes `sendButtonClassName="text-purple-400 hover:text-purple-300"`.

---

## Files Modified

| File | Change |
|------|--------|
| `src/services/brand-agent/brandAgentLiveService.ts` | Removed `proactiveAudio`, competitor URL dedup + cache, tool call dedup Set, voice system prompt updates |
| `src/components/creative-studio/BrandAgentApp.tsx` | Video rendering timer state + useEffect, rendering bubble in chat, quick prompt pill colors, `sendButtonClassName` prop passed to InputArea |
| `src/components/shared-chat/InputArea.tsx` | `sendButtonClassName` prop added; send button renders icon-only when prop is provided |
| `src/pages/CreativeStudio.tsx` | Default `rightSidebarMode` changed from `'settings'` to `'vince'` |
