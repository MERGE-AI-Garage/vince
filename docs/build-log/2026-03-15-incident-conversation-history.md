# Incident: Campaign Conversation History Missing in Intelligence Console
**Date:** March 15, 2026
**Severity:** Medium — campaigns generated without conversation transcripts; provenance audit trail incomplete
**Duration:** Ongoing until ~05:20 UTC (fix deployed)
**Resolved:** Yes — going forward; affected campaigns cannot be recovered

---

## What Broke

Campaigns generated via Vince and viewed in the Intelligence Console → Campaigns tab showed "No conversation linked" in the Conversation tab. The full chat transcript that led to the campaign was not visible.

---

## Root Cause

In `supabase/functions/brand-prompt-agent/index.ts`, conversation persistence was gated on a client-provided `conversation_id`:

```typescript
if (conversation_id) {
  // upsert to chatbot_conversations
} else {
  console.warn('[Vince] No conversation_id — messages not persisted');
}
```

If the client failed to create (or pass) a conversation ID before sending the message, the edge function processed the entire conversation — including calling `generate_creative_package` — but discarded all messages at the end, logging only a warning. The `generate_creative_package` edge function also received no `conversation_id`, so the campaign's `metadata.conversation_id` was left null.

Additionally, the TypeScript context type for all tool executor functions was typed as `{ brand_id: string; user_id: string }`, omitting `conversation_id`. The `generateCreativePackage` function accessed it via an unsafe cast (`(context as Record<string, unknown>).conversation_id`) rather than a proper type.

**DB evidence:**
- 2 campaigns (05:01 and 05:03 UTC) had `metadata.conversation_id = null`
- No `chatbot_conversations` rows with messages existed for that time window
- One empty conversation row (05:05 UTC, 0 messages) was present — a client-created shell that was never populated

---

## Affected Campaigns

| Campaign ID | Created (UTC) | Brand | Status |
|---|---|---|---|
| `35c7ad94` | 2026-03-15 05:03 | Google | Transcript permanently lost |
| `8f82d03b` | 2026-03-15 05:01 | Google | Transcript permanently lost |

The conversation messages for these two campaigns were processed in memory by the edge function but never written to the database. They cannot be recovered.

---

## Fix Applied

**`supabase/functions/brand-prompt-agent/index.ts`:**

1. **Auto-generate conversation ID** — before the tool loop, compute `effectiveConversationId = conversation_id ?? crypto.randomUUID()`. Conversation persistence now runs unconditionally using this ID.

2. **Pass to tool context** — `effectiveConversationId` is passed to `executeTool()` context so `generateCreativePackage` always receives a valid conversation ID, ensuring it's stored in campaign metadata.

3. **Fix context type** — all tool executor function signatures updated from `{ brand_id: string; user_id: string }` to `{ brand_id: string; user_id: string; conversation_id?: string }`, removing the unsafe cast.

Deployed via:
```bash
npx supabase functions deploy brand-prompt-agent --no-verify-jwt
```

---

## Prevention

The `else { console.warn(...) }` pattern for non-critical failures is dangerous when the "failure" silently destroys data that the user expects to exist. Any time the server has all the information it needs to act, it should act — not defer to whether the client remembered to send an ID.

Going forward: if a Vince session produces a campaign, a conversation record will always exist, even if the client never created one.

---

## Timeline

| Time (UTC) | Event |
|---|---|
| 2026-03-15 05:01 | Campaign `8f82d03b` generated with `conv_id: null` |
| 2026-03-15 05:03 | Campaign `35c7ad94` generated with `conv_id: null` |
| 2026-03-15 ~05:10 | Issue reported: "no conversation history" in Campaigns tab |
| 2026-03-15 ~05:15 | DB confirmed: `conv_id` null on both campaigns, no matching conversation rows |
| 2026-03-15 ~05:20 | Fix deployed — server-side auto-generate conversation ID |
