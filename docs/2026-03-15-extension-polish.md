# Chrome Extension Polish — 2026-03-15

Design, UX, and parity improvements shipped to the Vince Chrome extension.

---

## Auth: Replaced Google OAuth with Email/Password

**File:** `extension/src/AuthGate.tsx`

### Problem
The extension used Google OAuth exclusively while the iPhone app and web app use Supabase email/password auth. This created two separate Supabase user accounts — meaning the extension couldn't see past generations, conversation history, or brand data created in the other apps.

### Fix
Removed all Google OAuth / `chrome.identity` sign-in code. Replaced with a clean email + password form (`signInWithPassword`) matching the other apps. Users signing in with the same credentials now share a single user_id across all Vince surfaces.

---

## Generation History Grid in Chat

**Files:** `extension/src/chat/GenerationHistoryCard.tsx` (new), `extension/src/chat/ToolResultRenderer.tsx`, `extension/src/services/chatService.ts`, `extension/src/hooks/useVinceVoice.ts`

### Problem
When asking Vince "show me recent generations", the `list_generations` tool call succeeded on the server but the extension didn't extract or render the result — no images appeared. The main app and iPhone app both render a thumbnail grid.

### Fix
- Added `generation_history` to the `ToolResult` union type and the new `GenerationRecord` interface in `useVinceVoice.ts`
- Added `list_generations` extraction to `chatService.ts`'s `extractToolResults()`
- Built `GenerationHistoryCard` — a 2-column thumbnail grid with prompt preview, relative timestamp, and click-to-play video support
- Wired it into `ToolResultRenderer`

---

## Prompt Studio: Quick Starters Overhaul

**Files:** `extension/src/hooks/useQuickStarters.ts`, `extension/src/prompt-builder/QuickStarters.tsx`

### {{token}} Variable Bug Fix
Templates stored in the DB with `{{content_type}}` / `{{platform}}` tokens but empty `variable_fields` fired unsubstituted. Added `autoDetectVariableFields()` which scans `prompt_template` for `{{word}}` patterns and auto-generates fallback `VariableField` entries for any unmatched tokens.

### Category Ordering
Expanded `STANDARD_CATEGORIES` from 7 to 11 entries in logical order: `brand-overview → social → hero → product → lifestyle → campaign → editorial → cinematography → email → blog → presentation`. Categories `product`, `lifestyle`, `campaign`, `editorial` were not in the map and were appearing in random DB order.

### Agency-Quality Fallback Templates
Rewrote `buildGenericFallbacks()` with 11 categories × 4 presets = 44 agency brief–quality templates. Each preset uses strategic briefing language (proposition, audience mind state, proof points) with specific `variableFields`. Covers all categories so no brand is left with an empty tab while DB templates are being authored.

### Glassmorphism Card Design
Category and preset cards upgraded with `box-shadow`, hover `translateY(-1px)` lift, frosted glass background, and brand-color accent borders on expanded state. Sections in `PromptBuilderTab` wrapped in glass panels (`rgba(255,255,255,0.85)` + `backdrop-filter: blur(12px)`). Background changed from `#fafafa` to `#eef0f3` for card contrast.

---

## Tab Bar: Text-Only Navigation

**File:** `extension/src/BrandApp.tsx`

Removed icons from all five tab buttons (Prompt, Brand, Logos, Create, Chat). Text labels only — cleaner, more space-efficient at the extension's narrow width.

---

## Brand Picker: Text Only

**File:** `extension/src/BrandApp.tsx`

Removed the brand logo/icon from the picker button and the colored dot from each dropdown row. Brand name and "Default" badge remain.

---

## Prompt Studio Heading Font

**File:** `extension/src/tabs/PromptBuilderTab.tsx`

Changed heading typeface from `Fraunces, serif` to `Google Sans, Roboto, system-ui, sans-serif`. Better matches Google's design language and the extension's primary brand context.

---

## Logos Tab: Copy Button in Compact Grid View

**File:** `extension/src/tabs/LogosTab.tsx`

The copy-to-clipboard button was hidden when `compact=true` (small 3-column grid). Added a 22×22px copy button in the top-right corner of each compact card. The larger grid view retains both copy and download buttons.

---

## Chat Color Refinement

**File:** `extension/src/chat/ChatTab.tsx`, `extension/src/chat/ToolResultRenderer.tsx`

Softened the chat accent from `#8b5cf6` (vivid purple) to `#7c6ef5` (slightly desaturated). Tool result container borders changed from purple-tinted to neutral `rgba(255,255,255,0.10)`.
