# Design System Overhaul — Studio + Admin Unification

**Date:** 2026-03-14
**Scope:** Full visual redesign — color unification, admin layout, welcome screen, image prompts

---

## Problem

The Creative Studio (dark emerald) and Intelligence Console admin (dark navy/blue) looked like two different products. The admin had a bloated layout with 5–6 visual layers before reaching content (cinematic hero → floating stat cards → primary tabs → content header → secondary tabs → content). Feature card images looked like cheap 3D renders. "Getting Started" CTAs were invisible without scrolling on smaller screens.

---

## Changes Made

### 1. Color System Unification
**`src/index.css`**
Moved the emerald dark palette (`#0D1B16` base, `165 35% 7%`) from `.dark .creative-studio` scope to global `.dark`. The entire app — Studio and Admin — now shares the same dark emerald foundation. No more navy blue anywhere.

**`src/components/ui/tabs.tsx`**
Changed active tab state from `bg-violet-600` (purple) to `bg-[#00856C]` (viridian). Every tab bar in the app now uses brand color.

---

### 2. Studio Welcome Screen
**`src/components/creative-studio/WelcomeScreen.tsx`**
- **CSS-only hero**: Replaced the image-based banner (the "lens" bokeh image) with a pure CSS version. Large Fraunces "Vince" wordmark centered on dark emerald with two radial glow orbs in brand colors. No image dependency — always looks premium.
- **Getting Started moved up**: The 3-step instructions and Upload/Platform Demo buttons now appear immediately after the hero, before the capability cards. Previously buried at the bottom below 8 capability cards and the Chrome Extension CTA — invisible on smaller viewports.
- Removed the `heroImage` ambient wash from the background section and the `SYSTEM_HERO_IMAGE` constant.

---

### 3. Admin Header Redesign
**`src/components/headers/AdminHeroHeader.tsx`**
Complete rewrite. Replaced the cinematic full-bleed image carousel (200px+ hero with cross-fading images) with a slim functional page header:
- Height: ~72px
- Left: icon + title + description in one clean row
- Right: action buttons
- Stats appear as compact bordered pill cards in a horizontal strip below the title, separated by a subtle border — not floating and overlapping the hero
- All `backgroundImages`, `backgroundImage`, `cinematic`, and `carouselInterval` props are kept in the interface for backward compat but silently ignored

---

### 4. Intelligence Console (Admin) Layout
**`src/pages/CreativeStudioAdmin.tsx`**
- Renamed "Vince Admin" → **"Intelligence Console"**
- Removed `HERO_IMAGES` constant and `cinematic`/`backgroundImages` props from the AdminHeroHeader call
- Added **"Vince" tab** to the primary admin tab bar, containing Voice / Chat / Prompts / Brand Intel / Conversations in a sidebar nav layout (eliminates double-nesting of tabs)
- Added `VINCE_SECTIONS` constant and `vinceSection` state
- Imports: `VoiceTab`, `ChatTab`, `PromptsTab`, `BrandIntelTab`, `ConversationsTab`

**`src/components/ui/navigation.tsx`**
Removed the "Vince" link from the top navigation bar. Vince agent settings now live inside the Intelligence Console admin tab bar.

---

### 5. Feature Card Image Prompts
**`supabase/functions/generate-studio-welcome-images/index.ts`** (deployed as version 6)
Rewrote all 9 prompts (8 capability cards + hero). Direction shift:
- **Before**: "Stylized 3D icon floating in space with viridian green geometry" — produced toy-like cartoon renders
- **After**: Editorial/product photography showing the *output* of each capability

| Card | New Direction |
|------|---------------|
| Hero (16:9) | Abstract color-field photography — emerald shadows, Rothko-style light shaft |
| Image Generation | High-fashion studio portrait — demonstrates photorealism |
| Video Generation | Cinematic aurora borealis still frame — demonstrates film quality |
| Editing Suite | Split before/after composition — raw vs. precision-edited |
| Upscaling | Extreme macro luxury watch — hyper-detail at 1:1 |
| Product Recontext | Perfume bottle in dreamlike underwater scene |
| Virtual Try-On | Forest-green structured blazer on seamless backdrop |
| Conversational Editing | Minimal dark-mode UI fragment — chat bubble + preview |
| Camera Controls | Fisheye upward architectural perspective |

To apply new images: go to Intelligence Console → Welcome Page tab → Generate All.

---

## Design Principles Applied

- **Single dark emerald theme**: `#0D1B16` base, `#00856C` viridian, `#1ED75F` electrolight green
- **Functional admin headers**: No imagery in admin pages — title, stats, actions only
- **No hero images on the welcome screen**: CSS gradients are more reliable and always premium
- **Card definition**: Explicit `border border-white/[0.08]` containers, not ghost-like transparent blobs
- **Flat navigation hierarchy**: Admin has one primary tab bar; Vince content uses sidebar within its tab

---

## Follow-up Items

- **Settings sub-tabs sidebar**: Convert the 7 Settings secondary tabs (General / AI Models / Camera Presets / Analytics / User Quotas / Audit Trail / Prompt History) from a horizontal tab bar to a sidebar list — consistent with the Vince tab approach
- **Color injection in image prompts**: Admin UI to select which brand palette colors to inject into Welcome Page image regeneration prompts
- **Mobile/extension strategy**: Chrome extension is desktop-only; if mobile coverage is needed, PWA wrapper extracting the extension panel component is the right path
