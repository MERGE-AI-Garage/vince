# Vince — Build Status

**Updated:** Mar 8, 2026
**Submission deadline:** Mar 16, 2026 (8 days remaining)
**Supabase project:** `foolpmhiedplyftbiocb`
**Repo:** `brand-lens` — 30+ commits as of Mar 7

> This document supersedes `2026-03-05-build-status.md`.

---

## What Vince Is

A voice-driven AI creative director agent ("Vince") that generates brand-aware creative packages using Gemini's interleaved output — text and images in a single API call. Users speak or type what they need; Vince builds technically precise prompts with brand context, camera presets, and compliance guardrails, then returns complete creative packages as alternating copy blocks and images.

### Key Gemini Features Used

- **Interleaved Output** (`responseModalities: ['TEXT', 'IMAGE']`) — single call returns alternating text and generated images
- **Gemini Live** — real-time voice conversation via WebSocket (bidi audio, function calling)
- **Function Calling** — 18 tools (brand recon, package generation, competitor analysis, video, playbook)
- **Google Search Grounding** — brand context enrichment in website analysis

---

## Completed ✅

### Infrastructure
- Supabase project provisioned — all tables, RLS, seed data
- Auth — demo user (`demo@brandlens.dev`) + admin role via `user_roles`
- Storage buckets: `creative-studio`, `media`, `brand-logos`
- 2 demo brands seeded, 6 image generation models, brand agent settings, prompt templates, Gemini model configs
- AI tool registry: `categories`, `vendors`, `products` tables — 13 tools seeded (Google AI, Adobe, Canva, Veo 3 / Imagen 4)

### Codebase
- Vite + React + TypeScript + Tailwind + shadcn/ui builds clean
- 47K+ lines across frontend, edge functions, and shared modules
- 30+ commits as of Mar 7 — full git history present
- 17 TypeScript type errors remaining (non-blocking — Vite builds fine)

### Frontend
- Auth with pre-filled demo credentials on login page
- Creative Studio — full editor with welcome screen, canvas, parameters panel, History panel
- Creative Studio Admin — brand/model management, analytics
- Vince Control Panel — prompt, voice, chat settings
- `BrandAgentApp` — text chat with brand context, tool action cards, quick prompts
- `CreativePackageDisplay` — renders interleaved TEXT + IMAGE blocks
- Simplified, focused navigation (Vince, Creative Studio, Vince)

### Edge Functions (19 deployed)

| Function | Purpose |
|----------|---------|
| `brand-prompt-agent` | Vince's brain — Gemini function calling, 18 tools, conversation persistence |
| `generate-creative-package` | Interleaved output (TEXT + IMAGE), 5 deliverable types |
| `generate-creative-image` | Single image generation |
| `generate-creative-video` | Veo 3 fire-and-forget job queue |
| `generate-brand-guardrails` | AI-generates governance directives (6 focused areas) |
| `analyze-brand-website` | Website crawl, visual DNA extraction (URL hallucination fix applied) |
| `analyze-brand-documents` | PDF/DOCX/PPTX intelligence extraction |
| `analyze-brand-images` | Visual metadata extraction |
| `analyze-competitor-video` | Competitor ad analysis → strategic openings + counter brief |
| `analyze-expansion-direction` | Strategic brand expansion |
| `synthesize-brand-profile` | Merges all intelligence into Brand DNA (auto-chains to generation prompt) |
| `synthesize-generation-prompt` | Brand-aware generation prompt synthesis |
| `generate-brand-starters` | Quick prompts for common use cases |
| `generate-brand-prompt` | Craft brand-aware generation prompts |
| `generate-brand-card-images` | Brand card image generation |
| `generate-header-image` | Header image generation |
| `generate-brand-cards` | Brand card generation |
| `enhance-director-prompt` | Enhance director mode prompts |
| `generate-studio-welcome-images` | Welcome screen image generation |

### Interleaved Output Pipeline ✅
- `generate-creative-package` calls Gemini with `responseModalities: ['TEXT', 'IMAGE']`
- 5 deliverable types with aspect ratio defaults and visual instruction templates: `linkedin_post`, `product_shot_with_text`, `social_story`, `display_banner`, `email_header`
- `CreativePackageDisplay` renders alternating copy blocks and images
- `BrandAgentApp` extracts package data from tool actions and renders display
- Latency: 12–56s under real brand context conditions (plan filler narration accordingly)

### Voice Mode — Gemini Live ✅
- Compact inline voice bar (no full-screen overlay): 3-line transcript, URL input, CompactAudioIndicator, active tool status, Chat exit
- Ghost session bug fixed: connection token pattern prevents pending connections from activating after user exits
- Voice looping bug fixed: removed `proactiveAudio: true` — greeting fires via START_SESSION text message
- Duplicate tool call bug fixed: session-level URL dedup + processedFunctionCallIds Set
- File upload during voice: paperclip routes to `sendFile()` on the live session
- Voice-first startup NOT auto-implemented (browser AudioContext requires direct user gesture — intentional design)
- Docs: `2026-03-07-vince-playbook-voice-fixes.md`, `2026-03-07-vince-voice-stability-ui-polish.md`

### Brand Recon Pipeline ✅
- Auto-synthesis chain: `analyze-brand-website` → `synthesize-brand-profile` → `synthesize-generation-prompt`
- Results synced to `brands.brand_voice` + `visual_identity` (non-destructive merge)
- `brand_generation_prompts` row created automatically
- Doc: `2026-03-07-brand-recon-pipeline-complete.md`

### Brand Playbook Tools ✅
- `synthesize_brand_profile` — merges all raw intelligence into unified Brand DNA
- `generate_brand_playbook` — 4-step chain: synthesize → 6 guardrail sets (parallel) → generation prompt → brand cards
- Doc: `2026-03-07-vince-playbook-voice-fixes.md`

### Competitive Intelligence ✅
- `analyze_competitor_content` — competitor video URL → strategic openings + counter brief
- Orange competitive intel card in chat thread
- Voice flow: paste URL in voice bar → Vince calls tool → analysis card appears
- Vince pauses after analysis and confirms before building counter-campaign
- Doc: `2026-03-07-competitor-intelligence.md`

### Video Generation — Veo 3 ✅
- `generate_video` — fire-and-forget with elapsed timer in chat
- Parameters: prompt, aspect_ratio (16:9 / 9:16), duration_seconds (4/6/8), model (fast/quality), reference_image_url
- Real-time completion via `useRealtimeGenerations` subscription → History panel updates
- Service role JWT auth fix applied (edge-to-edge calls now authenticate correctly)
- Doc: `2026-03-07-vince-veo-video-generation.md`

### Brand Governance ✅
- 6 focused directive areas: visual_identity, photography_and_composition, tone_and_messaging, typography_and_text, product_representation, compliance
- `generate-brand-guardrails` accepts `focus_area` param with specialized prompt instructions per area
- Admin UI: Generate Guardrails dropdown with General + 6 focused options
- Directive cards show focus area badge

### Chrome Extension ✅
- Dark theme matching Creative Studio
- Manifest updated with correct side panel path
- Points to brand-lens Supabase project (verify config before demo)

---

## Not Done / Blocked ❌

### Must-Have for Submission

| Item | Status | Notes |
|------|--------|-------|
| **E2E test: Vince chat → interleaved output** | ❌ | Has the full pipeline run successfully in the browser? |
| **GEMINI_API_KEY in Supabase vault** | ❌ | Edge functions will silently fail without this |
| **Edge function deployment verification** | ❌ | Functions deployed but not tested with real calls |
| **Public deployment** | ❌ | Cloud Run or Vercel — required for submission |
| **Demo video** | ❌ | 3–5 min recording |
| **DevPost submission** | ❌ (draft exists) | `devpost-submission.md` — needs final polish and publish |
| **Architecture diagram** | ❌ | Judges expect this in technical write-up |
| **README** | ❌ | Repo needs spin-up instructions |

### Nice-to-Have (cut if time-constrained)

- Landing page (currently drops straight into Creative Studio)
- Guided brand onboarding wizard (tools exist, no walkthrough UI)
- Counter-deliverable actions from competitive intelligence card (counter_deliverables not rendered as clickable)
- Polling fallback for video completion (real-time subscription assumed reliable)
- 5 missing Vince tools: `check_brand_compliance`, `get_brand_analytics`, `list_brand_directives`, `update_brand_voice`, `generate_brand_playbook_status`
- Configurable quick prompts (static for now)

---

## Known Risks

| Risk | Severity | Notes |
|------|----------|-------|
| Latency 12–56s in demo | Medium | Plan filler narration for each generation wait. Two packages in demo = up to 90s of wait time. |
| Audio context on fresh browser | Medium | AudioContext requires user gesture — demo must start with manual mic click, not auto-start |
| 4-step playbook chain reliability | Medium | 9 concurrent/sequential edge calls — test multiple times before demo day |
| WebSocket timeout during long generation | Low-Medium | Cloud Run has 60s idle WebSocket timeout — 40+ second generation could drop connection |
| UI copy consistency | Low | Verify DB seed data and stored prompt templates all reflect Vince identity |

---

## Architecture (Current)

```
Browser (Vite + React + TypeScript)
  ├── Login (Supabase Auth)
  ├── Creative Studio (main workspace)
  │     ├── Welcome Screen (mode cards, quick brand selector)
  │     ├── Canvas + Parameters Panel (director mode, prompt tuning)
  │     ├── History Panel (real-time generation feed)
  │     └── BrandAgentApp (Vince chat, bottom panel)
  │           ├── Text input → brand-prompt-agent edge function
  │           ├── Voice input → Gemini Live WebSocket (bidi audio)
  │           ├── Compact Voice Bar (inline, transcript + URL input)
  │           └── Tool results → CreativePackageDisplay / CompetitiveIntelCard / VideoTimer
  │
  ├── Creative Studio Admin (brand management, directives, analytics)
  └── Vince Control Panel (prompt versioning, voice config, chat settings)

Supabase Edge Functions (19)
  ├── brand-prompt-agent (Gemini function calling, 18 tools)
  ├── generate-creative-package (interleaved output centerpiece)
  ├── generate-creative-video (Veo 3 async job queue)
  ├── analyze-* (website, documents, images, competitor)
  ├── synthesize-* (brand profile, generation prompt)
  └── generate-* (guardrails, brand cards, starters, header)

Supabase Postgres
  ├── creative_studio_brands, _models, _generations, _agent_directives
  ├── brand_agent_settings, brand_generation_prompts
  ├── chatbot_conversations, ai_prompt_templates
  ├── categories, vendors, products, brand_tool_approvals
  └── profiles, user_roles, media, media_folders

Gemini API
  ├── gemini-3.1-flash-image-preview (interleaved output)
  ├── Gemini Live API (voice — bidi WebSocket)
  └── Veo 3 Fast / Quality (video generation)

Chrome Extension
  └── Side panel → brand-lens Supabase project
```

---

## 8-Day Critical Path

**Day 1–2 (Mar 8–9): Make it run**
- GEMINI_API_KEY → Supabase vault → deploy and verify all edge functions
- First successful Vince text chat in the browser
- First successful interleaved creative package render
- Measure actual latency under demo conditions (full brand context loaded)

**Day 3–4 (Mar 10–11): Make voice work**
- Voice session connects, Vince greets, tool call fires, package renders in voice flow
- Test playbook chain end-to-end at least 5 times — measure reliability
- Test PDF file upload in voice mode (demo Act 2)
- Identify and fix any blocking issues

**Day 5–6 (Mar 12–13): Deploy and close gaps**
- Cloud Run deployment (plan a full day — first deploy always takes longer)
- Verify full flow on Cloud Run (not localhost)
- Architecture diagram (Excalidraw or Mermaid, 2 hours)
- README with setup instructions
- Correct latency claim in DevPost draft (use real measured numbers)

**Day 7–8 (Mar 14–15): Demo**
- 5+ full dry run rehearsals with timing
- Record best run — upload immediately (don't wait until Mar 16)
- Finalize DevPost submission
- Fix naming consistency: pick "Vince" or "Vince" and use it everywhere

**Mar 16: Submit**
- Final review of DevPost text
- Submit before noon, not 5 PM

---

## Files

- **Frontend:** 218+ files across `src/` (components, hooks, services, store, types, pages)
- **Edge functions:** 19 functions + shared modules in `supabase/functions/`
- **Extension:** `extension/` — Chrome side panel
- **Config:** `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`, `Dockerfile`, `nginx.conf`
- **Demo materials:** `demo-assets/`
