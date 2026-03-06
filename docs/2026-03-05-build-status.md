# Brand Lens — Build Status

**Project:** Gemini Live Agent Challenge (Google hackathon)
**Submission window:** Feb 16 — Mar 16, 2026
**Repo created:** Mar 5, 2026
**Supabase project:** `foolpmhiedplyftbiocb`

---

## What Brand Lens Is

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
- [x] Simplified navigation (Brand Lens, not AI Garage)
- [x] Pre-filled demo credentials on login page

### Edge Functions
- [x] `brand-prompt-agent` — Vince's brain. Gemini function calling with 10+ tools
- [x] `generate-creative-package` — interleaved output (text + images in one call)
- [x] `generate-creative-image` — single image generation via Imagen/Gemini

### Interleaved Output Pipeline (Hackathon Centerpiece)
- [x] Phase 0 validated — Gemini interleaved output works (12-56s latency, acceptable for demo)
- [x] `generate-creative-package` edge function calls Gemini with `responseModalities: ['TEXT', 'IMAGE']`
- [x] `brand-prompt-agent` has `generate_creative_package` tool wired to the edge function
- [x] `CreativePackageDisplay` component renders alternating copy blocks and images
- [x] `BrandAgentApp` extracts package data from tool actions and renders the display
- [x] `formatToolAction` shows package stats (image count, latency)

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
