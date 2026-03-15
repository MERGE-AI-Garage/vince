# Campaign UI Polish + Voice Conversation Linkage Fix

**Date:** March 15, 2026

## Summary

Three improvements to the campaign detail view and brand standards logo system, plus a bug fix for voice-mode campaigns not recording their conversation transcript.

---

## 1. Dark Background — Emerald Tint Restored

**Files:** `src/index.css`

The dark mode background was rendering as near-black (7% lightness) with no visible green hue. Bumped both `.dark` and `.dark .creative-studio` blocks:

| Token | Before | After |
|-------|--------|-------|
| `--background` | `165 35% 7%` | `165 35% 10%` |
| `--card` | `165 30% 10%` | `165 28% 14%` |
| CS surface vars | matched old background | updated to match |

Cards now have visible separation from the background, and the emerald hue reads as green rather than black.

---

## 2. Campaign Detail — Hero Header Redesign

**File:** `src/components/creative-studio/CampaignsTab.tsx`

Replaced the minimal single-row header (back button + badges) with a two-zone layout:

**Zone 1 — Breadcrumb row**
```
← Campaigns  /  {Brand Name}  /  Campaign
```
Gives immediate orientation — no more wondering where you are.

**Zone 2 — Hero block**
- Brand name as `text-xl font-bold` headline
- Formatted creation date + attributed user beneath it
- Deliverable count badge with emerald accent color
- Generation time badge
- Brief as `text-sm` body copy (was tiny muted text, now readable)
- Emerald `border-b` accent line

Also updated the "Conversation was not recorded" empty state to be more specific — old campaigns that predate this fix will show "Conversation was not recorded for this session" rather than the generic "generated after this update" message.

---

## 3. Voice Mode — Campaign Conversation Linkage

**Root cause:** When Vince generates a campaign via voice/live session on iOS (or desktop), the `conversation_id` was never passed to the `generate_creative_package` tool call. The transcript also wasn't saved to the database, so even if the ID had been passed, the conversation tab would show nothing.

**Files changed:**
- `src/services/brand-agent/brandAgentLiveService.ts`
- `supabase/functions/brand-prompt-agent/index.ts` (deployed as v76)

**Fix:**

1. A `liveConversationId` (UUID) is generated at live session start.
2. Finalized transcript turns are accumulated in `sessionMessages` on each `turnComplete` event.
3. When `generate_creative_package` fires:
   - Current transcript is upserted to `chatbot_conversations` (with `metadata.source: 'live_session'`)
   - `liveConversationId` is passed to `executeRemoteTool`
4. `brand-prompt-agent` now forwards `body.conversation_id` through the `executeTool` context object.
5. `generateCreativePackage` already forwarded `context.conversation_id` to the `generate-creative-package` edge function — no change needed there.

Going forward, every voice-generated campaign will have its conversation transcript linked and visible in the Conversation tab.

**Note:** Existing campaigns generated before this fix have no saved transcript. Their Conversation tab will show "Conversation was not recorded for this session."

---

## 4. Logo System — Copy URL + Download on Hover

**File:** `src/components/creative-studio/BrandStandardsDialog.tsx`

Logo tiles in the Brand Standards Logo System card now show a dark overlay on hover with two small action buttons:

- **Link icon** — copies the logo's Supabase storage URL to clipboard (toast confirmation)
- **Download icon** — fetches the file and triggers a browser download named `logo-{variant}.{ext}`

Applies to both the preview row (first 3 logos) and the expanded grid ("View all N logos"). The download uses `fetch` + blob to work around CORS on direct `<a download>` links.
