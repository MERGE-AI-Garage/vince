# Conversation History: Admin & In-App Fixes
**Date:** March 15, 2026

---

## Problem

The admin Conversations table showed 291 total Vince conversations, but 229 (79%) had 0 messages and `--` preview. The in-app history picker (both web and extension) showed only 1 conversation despite many existing. No column sorting. Average message stats were misleading (pulled from mostly-empty records).

---

## Root Causes

**Empty shell records:** `BrandAgentApp.tsx` called `createBrandAgentConversation()` on component mount in `initializeVince()` — every time a user opened the chat, a conversation row was created before they sent a single message. Users who closed without typing left empty shells. 229 of 291 rows (79%) were shells.

**In-app history blank:** `fetchRecentConversations` fetched 25 rows sorted by `updated_at DESC`. After lazy-creation was identified as the issue, most recent rows were today's freshly created shells. The `.not('messages', 'eq', '[]')` filter wasn't applied.

**Source tag wiped on every message:** The edge function's upsert used `metadata: { assistant: 'vince' }` — a literal object, not a merge. This replaced the entire `metadata` JSONB column on every save, discarding the `source` field set at creation time.

---

## Fixes

### 1. Lazy conversation creation

**`src/components/creative-studio/BrandAgentApp.tsx`**

Removed `createBrandAgentConversation()` from `initializeVince()`. Record is now created inside `handleSendMessage()` on the first actual message, using the same `conversationId` state + ref.

```typescript
let activeConversationId = conversationId;
if (!activeConversationId && userId) {
  activeConversationId = await createBrandAgentConversation(userId, source);
  setConversationId(activeConversationId);
  conversationIdRef.current = activeConversationId;
}
```

Same change applied to **`extension/src/chat/ChatTab.tsx`** — was also creating eagerly on mount.

### 2. Filter empty conversations

Applied `.not('messages', 'eq', '[]')` in three places:
- `src/services/conversationService.ts` — admin table
- `src/services/vinceConversationHistory.ts` — web in-app history picker
- `extension/src/services/conversationHistoryService.ts` — extension history picker

### 3. Source tagging

Added `source: 'web' | 'extension' | 'ios'` to conversation metadata at creation:
- `brandAgentGeminiService.ts`: `createBrandAgentConversation(userId, source)` now accepts source, defaults to `'web'`
- `mobile/src/MobileApp.tsx`: passes `source="ios"` to `BrandAgentApp`
- Extension `ChatTab.tsx`: passes `'extension'` to `createBrandAgentConversation`

**`supabase/functions/brand-prompt-agent/index.ts`:** Changed upsert from `metadata: { assistant: 'vince' }` to `metadata: { ...existingMetadata, assistant: 'vince' }` — loads existing metadata before saving to preserve `source` and other fields.

Backfilled existing records with `source: 'unknown'`:
```sql
UPDATE chatbot_conversations
SET metadata = jsonb_set(metadata, '{source}', '"unknown"')
WHERE metadata @> '{"assistant": "vince"}' AND NOT metadata ? 'source'
```

### 4. Admin table improvements

**`src/services/conversationService.ts`:**
- Added `sortBy?: 'updated_at' | 'created_at'` and `sortAsc?: boolean` to `FetchConversationsOptions`
- Added `source` and `mode` fields to `ConversationRecord`

**`src/components/agent-conversations/ConversationsTab.tsx`:**
- Clickable Date column header toggles sort with chevron indicator
- `SourceBadge` component with color-coded styles: web (blue), extension (violet), ios (emerald)
- Avg message/tool-call stats now computed only over conversations with `message_count > 0`

### 5. TypeScript build fix

`src/pages/CreativeStudio.tsx`: `CreativePackageDisplay` gained required `brandName` and `model` props — call site updated to pass `historyPackageGen.brand?.name ?? ''` and `historyPackageGen.model_used ?? ''`.

---

## Deployment

```bash
npx supabase functions deploy brand-prompt-agent --project-ref foolpmhiedplyftbiocb --no-verify-jwt
cd extension && npx vite build
cd extension/dist && zip -r ../../public/vince-extension.zip .
```

---

## Result

- Admin table: 62 meaningful conversations visible (was 291 with 229 empty)
- In-app history picker: shows real historical conversations
- Source column: web/extension/ios conversations visually distinguished
- Source tags survive message saves (no longer overwritten by edge function upsert)
- Going forward: no empty shell records created on chat open
