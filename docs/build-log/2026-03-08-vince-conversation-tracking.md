# Vince Conversation Tracking
**Date:** Mar 8, 2026

---

## What Was Built

Added persistent conversation tracking for Vince (Brand Agent) — both text and voice sessions. All conversations are now stored in the `chatbot_conversations` table and visible in the Vince Control Panel → Conversations tab.

---

## Architecture

### Text Sessions
1. `BrandAgentApp` creates a conversation row lazily — on the first actual message sent, not on mount
2. `createBrandAgentConversation(userId, source)` is called inside `handleSendMessage()` if no `conversationId` exists yet; the resulting ID is stored to state and ref before the message is dispatched
3. Every message send passes `conversationId` to `sendMessageToBrandAgent()`
4. The `brand-prompt-agent` edge function loads history, appends user + assistant messages, and upserts the full messages array back after each turn

### Voice Sessions
1. Same conversation row created on mount
2. Gemini Live transcripts accumulate in `voiceTranscript` state during the session
3. When the user exits voice mode, `handleCloseVoice` collects all final transcript items and calls `saveVoiceConversation()` before clearing local state
4. `saveVoiceConversation()` updates the conversation row with the full transcript and sets `metadata.mode = 'voice'`

### Metadata
All conversations are tagged with `metadata: { assistant: 'vince', source: 'web' | 'extension' | 'ios' }`. The `source` field is set at creation and preserved through all subsequent edge function upserts. Voice sessions also include:
- `mode: 'voice'`
- `brand_id`
- `brand_name`
- `packages_generated`
- `competitor_analyses`
- `videos_queued`

---

## Files Changed

| File | Change |
|------|--------|
| `src/services/brand-agent/brandAgentGeminiService.ts` | Added `saveVoiceConversation()` function |
| `src/components/creative-studio/BrandAgentApp.tsx` | Imported `saveVoiceConversation`, wired into `handleCloseVoice` |
| `supabase/functions/brand-prompt-agent/index.ts` | Redeployed (existing upsert logic confirmed) |

---

## Admin View

Conversations are browsable at **Admin → Vince Control Panel → Conversations tab**.

- Total conversation count shown in the stats header
- Table shows: date, user, message preview, message count, tool call count
- Click any row to view the full transcript

---

## Key Notes

- `saveVoiceConversation()` is fire-and-forget — errors are logged but never thrown, so a save failure does not affect the UX
- The edge function uses upsert (`onConflict: 'id'`) so it handles both the normal case (row pre-created by client) and any edge case where client-side creation failed
- `BrandAgentChat.tsx` is a legacy component that is not currently mounted anywhere — it was not involved in this fix
