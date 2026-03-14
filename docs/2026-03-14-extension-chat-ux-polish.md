# Extension Chat UX Polish

Changes shipped 2026-03-14 to bring the Chrome extension chat experience up to production quality.

---

## Chat Tab — Dedicated Full-Screen Mode

**Files:** `extension/src/BrandApp.tsx`, `extension/src/chat/ChatTab.tsx`

### Problem
Chat was rendered inside the same column as Prompt Builder and Brand Kit, squeezed into a small scrollable window at the top. Tab-switching unmounted `ChatTab`, destroying message history.

### Fix
Chat is now a separate full-screen mode — when active, the normal header (brand picker + tab nav) is replaced with a minimal chat header:

- **Back arrow** returns to Prompt Builder
- **Brand dot + name** stays visible for context
- **Mic control** — mute/unmute when voice is active, or start voice when idle

`ChatTab` is always mounted using `display: flex/none` toggling so React state (message history) survives tab switches and mic stop/start.

---

## Microphone Mute Without Ending Session

**Files:** `extension/src/hooks/useVinceVoice.ts`, `extension/src/BrandApp.tsx`, `extension/src/chat/ChatTab.tsx`

### Problem
No way to mute the microphone mid-session. Stopping voice to silence yourself ended the session and lost the conversation.

### Fix
Added `isMuted` state and `toggleMute` callback to `useVinceVoice`. Calls `sessionRef.current?.setMuted(next)` on the live session (the underlying `LiveSessionControl.setMuted()` was already implemented in `brandAgentLiveService`). The mute state:

- Resets to `false` when `stopVoice()` is called
- Drives a visual mute indicator in the voice status bar (status dot changes color, "Muted" label shows, audio bars hide)
- Exposed via a circular mute/unmute button in the chat header and voice status bar

---

## Reference URL Attachment — Always Visible

**Files:** `extension/src/chat/ChatTab.tsx`

### Change
The URL attachment row (for reference images and video URLs) is now always visible above the text input — no toggle required. The link icon turns purple when a URL is attached. Clearing with × removes the URL. On send, the URL is appended to the message text as `[Reference: url]` and a 🔗 indicator is shown in the user bubble.

---

## Creative Package Deliverable Names

**Files:** `supabase/functions/brand-prompt-agent/index.ts`, `extension/src/chat/CreativePackageCard.tsx`

### Problem
Deliverable cards showed generic "DELIVERABLE 1" labels instead of the actual deliverable type (e.g., "LinkedIn Post", "Banner Ad").

### Root cause
The `generateCreativePackage` tool handler in `brand-prompt-agent` returned `parts, image_urls, latency_ms, model, brief, deliverable_names, brand_alignment` but omitted `brand_name`. The missing field caused the card header to render blank, and `deliverable_names` was not being forwarded to the card renderer.

### Fix
Added `brand_name: result.brand_name` to the tool handler return object. Edge function redeployed as version 66 with `verify_jwt: false`.

---

## Brand Alignment Score — Expandable Detail

**File:** `extension/src/chat/CreativePackageCard.tsx`

### Change
The brand alignment row is now a clickable toggle. Collapsed state shows:

- Shield icon (color-coded green/amber/red by tier)
- "Brand Alignment" label
- Score percentage
- `n/4` pass count
- Expand/collapse chevron

Expanded state shows per-dimension breakdown with Pass/Miss badges for: Visual Identity, Photography, Color System, Brand Voice. A 100% score adds a confirming note.

---

## Purple Extension Icon

**Files:** `extension/icons/icon-{16,32,48,128}.png`, `extension/dist/icons/`

### Change
Replaced placeholder icons with a purple (#8b5cf6) rounded rectangle icon with a centered bold white "V". Generated via Python Pillow at all four required sizes (16, 32, 48, 128px). Matches the Vince brand accent color.

---

## Stale State Reference Fix

**File:** `extension/src/chat/ChatTab.tsx`

A `setShowUrlInput(false)` call remained in `sendMessage` after the URL input toggle was removed (making the bar always visible). Removed the stale call.
