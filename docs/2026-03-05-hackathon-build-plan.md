# Hackathon Build Plan — Brand Lens

**Date:** 2026-03-05
**Deadline:** March 16, 2026 @ 5:00 PM PDT (11 days)
**Repo:** `brand-lens` (to be created)
**Supabase:** `foolpmhiedplyftbiocb` (brand-lens, micro)
**Source:** Extracted from `merge-ai-garage` (AI Garage platform)
**PRD:** `docs/gemini-live-agent-challenge-prd.md`

---

## Phase 0: Validate the Unknown (Day 1 — FIRST)

**Goal:** Confirm interleaved output works before extracting anything.

This is the hackathon requirement. If it doesn't work, we need to know immediately.

- [ ] Write a standalone Node script using `@google/genai` SDK
- [ ] Call `gemini-3.1-flash-image-preview` with `responseModalities: ['TEXT', 'IMAGE']`
- [ ] Test with a simple creative brief + brand context as systemInstruction
- [ ] Confirm: response contains interleaved text + base64 image parts
- [ ] Measure: latency (expecting 4-6 seconds), image quality, token usage
- [ ] Test: multiple images per response (target 3 deliverables)
- [ ] Test: aspect ratio control via `imageConfig.aspectRatio`
- [ ] Document findings — update PRD constraints if needed

**Decision gate:** If interleaved output doesn't work or quality is unusable, we pivot before investing extraction time.

---

## Phase 1: Create Repo + Scaffold (Day 1-2)

### 1a. Repository Setup

- [ ] Create `brand-lens` repo on GitHub (public — hackathon requirement)
- [ ] Initialize: Vite + React + TypeScript + Tailwind + shadcn/ui
- [ ] Match AI Garage's toolchain: same Vite config, same tsconfig paths (`@/` alias)
- [ ] Copy `tailwind.config.ts`, `components.json`, `postcss.config.js`
- [ ] Install dependencies (match versions from AI Garage `package.json`):
  - `@supabase/supabase-js`
  - `@google/genai` (for interleaved output + Live API)
  - `zustand` (state management)
  - `@tanstack/react-query`
  - `lucide-react`
  - `sonner` (toasts)
  - `recharts` (admin charts)
  - shadcn/ui components (copy used ones)
- [ ] Set up `.env` with new Supabase URL/anon key + Gemini API key
- [ ] CLAUDE.md with project-specific instructions

### 1b. Database Schema

Extract migrations from AI Garage. These tables are needed:

**Core brand system:**
- `creative_studio_brands` — brand records
- `creative_studio_brand_profiles` — synthesized DNA (the big JSONB columns)
- `creative_studio_brand_analyses` — per-source analysis results
- `creative_studio_brand_references` — reference image metadata
- `creative_studio_brand_logos` — logo variants
- `creative_studio_brand_prompts` — prompt templates / quick starters
- `creative_studio_agent_directives` — governance rules

**Generation system:**
- `creative_studio_models` — model registry
- `creative_studio_generations` — generation history
- `creative_studio_audit_log` — audit trail
- `creative_studio_cost_settings` — cost tracking config

**Agent system:**
- `brand_agent_settings` — Vince configuration
- `chatbot_conversations` — conversation history

**Supporting:**
- `ai_prompt_templates` — system prompts for edge functions
- `prompt_model_assignments` — which model each prompt uses
- `gemini_model_configs` — model definitions
- `profiles` — user profiles (simplified)
- `user_roles` — RBAC (simplified — probably just one admin user)
- `media` + `media_folders` — media library

**Approach:**
- [ ] Extract relevant CREATE TABLE statements from `20250814000000_remote_schema.sql`
- [ ] Extract relevant ALTER TABLE / index / RLS policy statements from subsequent migrations
- [ ] Consolidate into one clean migration for the new project
- [ ] Apply via `mcp__supabase__apply_migration`
- [ ] Seed: `has_role()` function, admin user role, model configs, prompt templates

### 1c. Auth Simplification

AI Garage uses Supabase Auth with Google OAuth. For the hackathon demo:

- [ ] Option A: Keep Supabase Auth but with email/password only (create one demo account)
- [ ] Option B: Bypass auth entirely — hardcode a demo user, skip RLS checks
- [ ] **Recommendation: Option A** — keeps RLS working naturally, one `INSERT INTO auth.users` in seed

---

## Phase 2: Extract Frontend (Day 2-4)

This is the bulk of the work. Systematic, tedious, necessary.

### 2a. Shared Infrastructure (extract first — everything depends on these)

- [ ] `src/integrations/supabase/client.ts` — Supabase client init
- [ ] `src/contexts/AuthContext.tsx` — auth provider (simplified)
- [ ] `src/lib/utils.ts` — `cn()` helper
- [ ] `src/hooks/use-toast.ts` + toast provider
- [ ] `src/hooks/use-mobile.ts`
- [ ] shadcn/ui components used by creative studio (Button, Dialog, Card, Tabs, Select, Slider, Switch, Badge, ScrollArea, Tooltip, DropdownMenu, Popover, etc.)

### 2b. Types + Stores

- [ ] `src/types/creative-studio.ts` (680 lines — copy whole file)
- [ ] Zustand stores (image params store, edit store)
- [ ] Strip any imports that reference non-creative-studio types

### 2c. Hooks (8 files, ~2,160 lines)

- [ ] `useCreativeStudioBrands.ts`
- [ ] `useCreativeStudioBrandIntelligence.ts`
- [ ] `useCreativeStudioModels.ts`
- [ ] `useCreativeStudioGenerations.ts`
- [ ] `useCreativeStudioQuota.ts`
- [ ] `useCreativeStudioDirectives.ts`
- [ ] `useCameraOptions.ts`
- [ ] Other supporting hooks (identify during extraction)

**Watch for:** These hooks import from `@/integrations/supabase/client` and `@/types/creative-studio`. Both will exist in the new repo, so paths should work if we maintain the `@/` alias.

### 2d. Creative Studio Components (~37 files)

- [ ] Copy entire `src/components/creative-studio/` directory
- [ ] Audit imports — find references to non-creative-studio code:
  - `@/contexts/AuthContext` → will exist (simplified)
  - `@/components/ui/*` → shadcn components, will exist
  - `@/hooks/use-toast` → will exist
  - Any references to Guidelines, Toolkit, Ivy, Axel, etc. → must be removed or stubbed
- [ ] Fix broken imports iteratively — `npm run build` to find them

### 2e. Vince (Brand Agent) Components + Services

- [ ] `src/components/creative-studio/BrandAgentApp.tsx` (Vince chat UI)
- [ ] `src/components/creative-studio/BrandAgentSettingsPanel.tsx`
- [ ] `src/services/brand-agent/brandAgentSettings.ts`
- [ ] `src/services/brand-agent/brandAgentGeminiService.ts`
- [ ] `src/services/brand-agent/brandAgentLiveService.ts`
- [ ] Voice visualizer components (4 styles)
- [ ] Vince control panel page + 5 tab components

### 2f. Pages

- [ ] `src/pages/CreativeStudio.tsx` — main canvas page
- [ ] `src/pages/CreativeStudioAdmin.tsx` — admin panel (11 tabs)
- [ ] `src/pages/VinceControlPanel.tsx` — agent settings
- [ ] Routing setup (React Router — simplified, just these 3 pages + a landing)

### 2g. Chrome Extension

- [ ] Copy entire `extension-brand-ai/` directory
- [ ] Update `@/` alias to point to new repo's `src/`
- [ ] Update Supabase config to point to new project
- [ ] Verify manifest.json, build process

### Extraction Strategy

Don't try to extract everything at once. Go layer by layer:

1. Shared infra (auth, supabase client, shadcn) → verify builds
2. Types + stores → verify builds
3. Hooks → verify builds (will have missing component imports — that's OK)
4. Components → verify builds
5. Pages → verify builds
6. Wire up routing → verify full app loads

Run `npm run build` after each layer. Fix import errors before moving to the next layer.

---

## Phase 3: Extract Edge Functions (Day 3-4, parallel with Phase 2)

### 3a. Shared Modules

- [ ] `_shared/prompt-utils.ts`
- [ ] `_shared/json-sanitizer.ts`
- [ ] `_shared/content-scraper.ts`
- [ ] `_shared/image-compress.ts`
- [ ] `_shared/media-registration.ts`
- [ ] `_shared/ai-usage-tracker.ts`

### 3b. Edge Functions (15+)

Deploy each with `npx supabase functions deploy {name} --project-ref foolpmhiedplyftbiocb --no-verify-jwt`:

- [ ] `brand-prompt-agent` (Vince — the big one, ~800 lines)
- [ ] `generate-creative-image`
- [ ] `generate-creative-video`
- [ ] `analyze-brand-website`
- [ ] `analyze-brand-images`
- [ ] `analyze-brand-documents`
- [ ] `synthesize-brand-profile`
- [ ] `synthesize-generation-prompt`
- [ ] `generate-brand-guardrails`
- [ ] `generate-brand-starters`
- [ ] `generate-brand-card-images`
- [ ] `generate-brand-prompt`
- [ ] `enhance-image-prompt`
- [ ] `enhance-director-prompt`
- [ ] `validate-brand-compliance`

### 3c. Environment Variables

Each edge function needs secrets set on the new project:

- [ ] `GEMINI_API_KEY`
- [ ] `SUPABASE_URL` (auto-set)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (auto-set)
- [ ] `SUPABASE_ANON_KEY` (auto-set)
- [ ] Any others referenced by edge functions (check each one)

### 3d. Seed Data

- [ ] `ai_prompt_templates` — all prompt slugs used by edge functions
- [ ] `prompt_model_assignments` — model assignments for each prompt
- [ ] `gemini_model_configs` — model registry entries
- [ ] `creative_studio_models` — UI-visible model list
- [ ] `creative_studio_cost_settings` — cost per model

---

## Phase 4: New Features (Day 5-7)

### 4a. Interleaved Output (the hackathon feature)

- [ ] Create `generate-creative-package` edge function (or add to `brand-prompt-agent`)
- [ ] Accept: brief, deliverables, aspect_ratios, brand_id
- [ ] Load brand context (profile, directives, generation prompt)
- [ ] Call `gemini-3.1-flash-image-preview` with `responseModalities: ['TEXT', 'IMAGE']`
- [ ] Inject brand context as systemInstruction
- [ ] Return structured response: `{ parts: [{ type: 'text', content }, { type: 'image', data, mimeType }] }`
- [ ] Build `InterleavedOutputRenderer` React component
- [ ] Wire into Vince's tool calling flow

### 4b. New Vince Tools

Add to `brand-prompt-agent` tool definitions and `executeTool()` switch:

- [ ] `create_brand` — INSERT into `creative_studio_brands`, return brand_id
- [ ] `analyze_brand_website` — call `analyze-brand-website` edge function
- [ ] `import_brand_document` — call `analyze-brand-documents` edge function
- [ ] `generate_brand_playbook` — chain: synthesize-brand-profile → generate-brand-guardrails → generate-brand-starters → synthesize-generation-prompt → generate-brand-card-images
- [ ] `generate_creative_package` — call the interleaved output function

### 4c. Voice → Interleaved Bridge

- [ ] In `brandAgentLiveService.ts`, handle `generate_creative_package` tool call
- [ ] Send filler text back to Live session while generation runs
- [ ] Fire async call to interleaved output endpoint
- [ ] Return results to frontend via separate data channel
- [ ] Send tool_response back to Live session so Vince can narrate the results

---

## Phase 5: Cloud Run Deployment (Day 8)

- [ ] Create `Dockerfile`:
  ```dockerfile
  FROM node:20-alpine AS build
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build

  FROM nginx:alpine
  COPY --from=build /app/dist /usr/share/nginx/html
  COPY nginx.conf /etc/nginx/conf.d/default.conf
  EXPOSE 8080
  ```
- [ ] Create `nginx.conf` (SPA routing — all paths → index.html)
- [ ] Create GCP project (or use existing)
- [ ] Enable Cloud Run API
- [ ] `gcloud builds submit --tag gcr.io/{PROJECT}/brand-lens`
- [ ] `gcloud run deploy brand-lens --image gcr.io/{PROJECT}/brand-lens --port 8080 --allow-unauthenticated`
- [ ] Verify all features work on deployed URL
- [ ] Take screenshot of Cloud Run console (submission requirement)

---

## Phase 6: Polish + Record (Day 9-10)

### 6a. UI Polish

- [ ] Remove any AI Garage branding (logos, "AI Garage" text, MERGE references)
- [ ] Add Brand Lens branding (or keep it clean/minimal)
- [ ] Verify dark/light mode works
- [ ] Test on Chrome (primary — extension requires it)
- [ ] Remove unused routes/pages/nav items

### 6b. Chrome Extension Polish

- [ ] Update extension name/description in manifest.json
- [ ] Update icons if needed
- [ ] Test side panel opens, voice works, brand creation works
- [ ] Package as .crx or provide load-unpacked instructions

### 6c. Demo Dry Run

- [ ] Delete all brands — start from zero
- [ ] Pre-bookmark Google PDF download URLs
- [ ] Run through full demo script end-to-end
- [ ] Time each act — total must be under 4 minutes
- [ ] Identify any dead air / waiting that needs narration
- [ ] Find a prompt that triggers compliance violation (for showing guardrails)
- [ ] Test video generation prompt
- [ ] Rehearse at least 3 times

### 6d. Record Demo Video

- [ ] Clean browser — no bookmarks bar, no tabs, no notifications
- [ ] Screen recording: OBS or QuickTime, 1080p minimum
- [ ] Record in one take if possible (judges see authenticity)
- [ ] Keep under 4 minutes
- [ ] No post-production needed but trim dead space at start/end

---

## Phase 7: Submission (Day 11 — March 16)

- [ ] Write DevPost submission text:
  - What it does
  - How we built it (90 days of production development → hackathon extraction)
  - Technologies used (Gemini Live, Gemini 3.1 Flash Image, Cloud Run, Supabase)
  - Challenges (two-model architecture, latency masking, brand context injection)
  - What we learned
  - What's next
- [ ] Upload demo video
- [ ] Link to public GitHub repo
- [ ] Upload architecture diagram
- [ ] Upload Cloud Run deployment proof (screenshot or screen recording)
- [ ] Link to published content if any (#GeminiLiveAgentChallenge)
- [ ] Submit before 5:00 PM PDT

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Interleaved output doesn't work as documented | Low | Critical | Phase 0 validates this day 1. Pivot to sequential text+image if needed. |
| Extraction takes longer than expected (dependency hell) | High | Medium | Layer-by-layer approach with builds between each. Cut non-critical components. |
| Edge functions fail on new Supabase project (missing secrets, different config) | Medium | Medium | Deploy and test each function individually. Don't batch. |
| Live API WebSocket issues on Cloud Run | Medium | Medium | Test early in Phase 5. Cloud Run supports WebSockets natively. |
| Demo video goes over 4 minutes | High | Low | Ruthless rehearsal. Cut features that don't serve the story. |
| Google website crawl fails during live demo | Medium | Low | Have a backup plan — skip to document upload. Narrate through it. |
| Chrome extension doesn't work with new Supabase project | Low | Medium | Test in Phase 2g. It's just config changes (URL, keys). |

---

## What We're NOT Doing

- No new UI design — we're extracting what exists
- No multi-user auth — one demo account
- No CI/CD pipeline — manual deploys are fine for a hackathon
- No automated tests — we're extracting tested code, not writing new tests
- No mobile optimization — desktop Chrome only
- No file upload in Chrome extension — use main app for doc upload
- No multi-persona directive generation — single auto-generated directive is fine
- No real-time progress streaming for document processing — spinner + narration

---

## Daily Targets

| Day | Date | Target |
|-----|------|--------|
| 1 | Mar 6 | Phase 0 complete (interleaved output validated). Repo created. |
| 2 | Mar 7 | Database migrated + seeded. Shared infra extracted. |
| 3 | Mar 8 | Frontend extraction ~50% (types, hooks, core components). Edge functions deploying. |
| 4 | Mar 9 | Frontend extraction complete. All edge functions deployed. App loads with empty data. |
| 5 | Mar 10 | New Vince tools (create_brand, analyze_website, import_document). |
| 6 | Mar 11 | generate_creative_package + interleaved output renderer. |
| 7 | Mar 12 | generate_brand_playbook chain. Voice → interleaved bridge. |
| 8 | Mar 13 | Cloud Run deployment. Full flow test. |
| 9 | Mar 14 | Polish. Chrome extension verified. Dry runs. |
| 10 | Mar 15 | Record demo video. Write DevPost text. |
| 11 | Mar 16 | Final review. Submit before 5 PM PDT. |
