# Vince — Build Status

**Project:** Gemini Live Agent Challenge (Google hackathon)
**Submission window:** Feb 16 — Mar 16, 2026
**Repo created:** Mar 5, 2026
**Supabase project:** `foolpmhiedplyftbiocb`

---

## What Vince Is

A voice-driven AI creative director agent ("Vince") that generates brand-aware creative packages using Gemini's interleaved output — text and images in a single API response. Users describe what they need in natural language (text or voice), Vince builds technically precise prompts with brand context, camera presets, and compliance guardrails, then generates complete creative packages with copy + images together.

### Key Gemini Features Used

- **Interleaved Output** (`responseModalities: ['TEXT', 'IMAGE']`) — single API call returns alternating text blocks and generated images
- **Gemini Live** — real-time voice conversation with Vince via WebSocket
- **Function Calling** — Vince has 10+ tools (generate images, save templates, analyze brand DNA, check quotas, etc.)
- **Google Search Grounding** — brand context enrichment

---

## Completed

### Infrastructure
- [x] Supabase project provisioned (all tables, RLS policies, seed data)
- [x] Auth working — demo user (`demo@brandlens.dev`) with admin role
- [x] Storage buckets: `creative-studio`, `media`, `brand-logos`
- [x] 2 demo brands seeded in `creative_studio_brands`
- [x] 6 image generation models seeded in `creative_studio_models`
- [x] Brand agent settings seeded (`brand_agent_settings`)
- [x] AI prompt templates seeded (6 rows)
- [x] Gemini model configs seeded (3 rows)

### Frontend
- [x] Vite + React + TypeScript + Tailwind + shadcn/ui app builds clean
- [x] Auth context with email/password login
- [x] Creative Studio page — full editor with welcome screen, mode cards, parameters panel
- [x] Creative Studio Admin page — brand management, model config, analytics
- [x] Vince Control Panel page — prompt management, voice settings, chat settings
- [x] BrandAgentApp — text chat with brand context, tool actions, image display
- [x] CreativePackageDisplay — renders interleaved text + images from Gemini
- [x] Voice mode UI — live indicator, transcript, controls
- [x] Simplified navigation (Vince branding throughout)
- [x] Pre-filled demo credentials on login page

### Edge Functions
- [x] `brand-prompt-agent` — Vince's brain. Gemini function calling with 10+ tools
- [x] `generate-creative-package` — interleaved output (text + images in one call)
- [x] `generate-creative-image` — single image generation via Imagen/Gemini
- [x] `generate-brand-guardrails` — AI-generates brand governance directives from DNA

### Interleaved Output Pipeline (Hackathon Centerpiece)
- [x] Phase 0 validated — Gemini interleaved output works (12-56s latency, acceptable for demo)
- [x] `generate-creative-package` edge function calls Gemini with `responseModalities: ['TEXT', 'IMAGE']`
- [x] `brand-prompt-agent` has `generate_creative_package` tool wired to the edge function
- [x] `CreativePackageDisplay` component renders alternating copy blocks and images
- [x] `BrandAgentApp` extracts package data from tool actions and renders the display
- [x] `formatToolAction` shows package stats (image count, latency)

### Composite Deliverable Types (Mar 6)
- [x] 5 named deliverable types: `linkedin_post`, `product_shot_with_text`, `social_story`, `display_banner`, `email_header`
- [x] Each type has pre-built image instructions for branded typography rendered directly into the image by Gemini
- [x] `DeliverableSpec.deliverable_type` field in `generate-creative-package` — templates auto-applied when set
- [x] Vince tool updated: `deliverable_type` param exposed with descriptions of all 5 types
- [x] Aspect ratio defaults per type (linkedin_post→4:3, product_shot→1:1, social_story→9:16, etc.)

### Brand Governance — Focused Directives (Mar 6)
- [x] `focus_area` column added to `creative_studio_agent_directives` (6 areas: visual_identity, photography_and_composition, tone_and_messaging, typography_and_text, product_representation, compliance)
- [x] `generate-brand-guardrails` accepts `focus_area` param — each area has specialized system prompt instructions
- [x] Admin UI: "Generate Guardrails" now a dropdown with General + 6 focused options
- [x] Directive cards show focus area badge alongside active/review status
- [x] `DirectiveFocusArea` + `DIRECTIVE_FOCUS_AREAS` exported from `creative-studio.ts`

### Voice Mode — Compact Inline Bar + Exit Fix (Mar 7)
- [x] Ghost session bug fixed: connection token pattern prevents pending connections from activating after user exits
- [x] Full-screen `VoiceOverlay` replaced with compact inline bar (matches compact voice bar pattern in Creative Studio)
- [x] Live transcript up to 3 lines, URL input field, `CompactAudioIndicator`, active tool status, Chat exit button
- [x] File upload during voice mode: paperclip routes to `sendFile()` on the live session
- [x] Doc: `2026-03-07-vince-playbook-voice-fixes.md`

### Brand Playbook Tools (Mar 7)
- [x] `synthesize_brand_profile` — merges all raw intelligence into unified Brand DNA
- [x] `generate_brand_playbook` — 4-step chained sequence: synthesize → all 6 guardrail sets → generation prompt → brand cards
- [x] `brand-prompt-agent` deployed with new tools
- [x] Doc: `2026-03-07-vince-playbook-voice-fixes.md`

### Competitive Intelligence (Mar 7)
- [x] `analyze_competitor_content` — analyzes competitor video URL, returns strategic openings + counter-brief
- [x] Competitive Intel card (orange) in chat thread; voice mode URL injection flow
- [x] Vince pauses after analysis and asks before building counter-campaign
- [x] Doc: `2026-03-07-competitor-intelligence.md`

### Video Generation — Veo 3 (Mar 7)
- [x] `generate_video` — fire-and-forget Veo 3 Fast/Quality, parameters: prompt, aspect ratio, duration, model, reference image
- [x] Elapsed-time rendering indicator in chat; real-time completion via `useRealtimeGenerations`
- [x] Doc: `2026-03-07-video-generation.md`

### Beat This Ad — Enhanced Competitor Card (Mar 10)
- [x] Scene breakdown timeline: timestamp + scene type + emotional signal per scene
- [x] 3 Ways to Beat It: clickable `CampaignDirection` cards (title, concept, tagline) — clicking sends pre-filled message to Vince
- [x] Build These: clickable `counter_deliverables` buttons — clicking sends full brief + deliverable_type to Vince
- [x] Full Counter Brief collapsible section (`<details>`)
- [x] Card header renamed "Beat This Ad" with Target icon
- [x] Analyzing video orange elapsed indicator — fires immediately when YouTube/video URL detected in message
- [x] Doc: `2026-03-10-beat-this-ad-self-demo.md`

### Self-Demo Analysis (Mar 10)
- [x] `analyze_self_demo` tool — analyzes a recording of your own demo, returns score + structured feedback
- [x] Violet Self Analysis card: demo score, UX observations, missed opportunities, narrative issues, recommendations
- [x] Extraction in both text (`handleSendMessage`) and voice (`onToolResult`) paths
- [x] Doc: `2026-03-10-beat-this-ad-self-demo.md`

### Voice Session Persistence (Mar 10)
- [x] `persistVoiceSession()` — saves substantive messages to `chatbot_conversations` on session end or manual exit
- [x] Uses refs (`conversationIdRef`, `messagesRef`) for stale-closure safety inside live session callbacks
- [x] Metadata: `brand_id`, `brand_name`, `tool_calls_count`
- [x] `voiceToolCallsRef` tracks tool call count across the session
- [x] Doc: `2026-03-10-beat-this-ad-self-demo.md`

### Generation History Auto-Refresh (Mar 10)
- [x] `useInvalidateGenerations()` called after creative package generated (text + voice) — History panel updates automatically
- [x] Doc: `2026-03-10-beat-this-ad-self-demo.md`

---

## Not Done / Not Tested

### Must-Have for Submission
- [ ] **First git commit** — repo has zero commits
- [ ] **Vince text chat e2e test** — does brand-prompt-agent respond through the UI?
- [ ] **Interleaved output e2e test** — does generate_creative_package render in the chat?
- [ ] **Edge function deployment verification** — are all functions deployed to brand-lens project?
- [ ] **GEMINI_API_KEY in Supabase secrets** — needed for edge functions
- [ ] **Public deployment** — Cloud Run, Vercel, or Firebase Hosting
- [ ] **Demo video** — 3-5 min showing the agent in action
- [ ] **DevPost submission** — writeup, screenshots, video link

### Nice-to-Have
- [ ] Voice mode (Gemini Live) — needs `get_secret` RPC function + API key in vault
- [ ] Landing page / demo entry point (currently drops into full Creative Studio)
- [ ] Brand onboarding flow (analyze website, upload logos, set brand voice)
- [ ] Clean up 17 remaining tsc type errors (non-blocking, Vite builds fine)
- [ ] Image generation via Creative Studio UI (not just Vince chat)

---

## Architecture

```
Browser (Vite + React)
  |
  |-- Login (Supabase Auth)
  |-- Creative Studio (main workspace)
  |     |-- Welcome Screen (mode cards)
  |     |-- Editor Canvas + Parameters Panel
  |     |-- BrandAgentApp (Vince chat, bottom panel)
  |           |-- Text input -> brand-prompt-agent edge function
  |           |-- Voice input -> Gemini Live WebSocket
  |           |-- Tool results -> CreativePackageDisplay
  |
  |-- Creative Studio Admin (brand/model management)
  |-- Vince Control Panel (prompt/voice/chat settings)

Supabase Edge Functions
  |-- brand-prompt-agent (Gemini function calling, 10+ tools)
  |-- generate-creative-package (interleaved output)
  |-- generate-creative-image (single image gen)
  |-- analyze-brand-images, analyze-brand-website, etc.

Supabase Postgres
  |-- creative_studio_brands, _models, _generations, etc.
  |-- brand_agent_settings
  |-- chatbot_conversations
  |-- profiles, user_roles
```

---

## Files

- **Frontend:** 218 files across `src/` (components, hooks, services, stores, types, pages)
- **Edge functions:** 14 functions + 6 shared modules in `supabase/functions/`
- **Config:** `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`

---

## Critical Path

1. Commit everything to git
2. Deploy + verify edge functions on brand-lens Supabase project
3. Test Vince chat → interleaved output end-to-end
4. Deploy frontend publicly
5. Record demo, write submission
