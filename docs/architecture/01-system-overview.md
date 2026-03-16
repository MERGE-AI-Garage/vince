# System Overview — Vince

> Arc42 Sections 1–4
> Generated: 2026-03-15
> Source: codebase analysis of `/Users/klmiller/Documents/GitHub/vince`

---

## Section 1: Introduction and Goals

### System Purpose

Vince is a voice-driven AI creative director that generates on-brand creative assets — copy, images, and video — grounded in a brand's own intelligence. Users interact via natural language (voice or text); Vince maintains brand context across the conversation and orchestrates Google Gemini models to produce outputs.

**Core Value Proposition** (`README.md`, `docs/2026-03-12-vince-user-guide.md`):
- Brand-grounded generation: all AI outputs are conditioned on uploaded brand DNA (visual style, tone, guidelines, product catalog)
- Multi-modal output: text copy, images (Gemini image generation), and video (Veo 3)
- Multi-surface delivery: same experience on web browser, Chrome extension sidebar, and native mobile (iOS/Android)

### Top Quality Goals

| Priority | Goal | Rationale |
|----------|------|-----------|
| 1 | **Brand fidelity** | Every generated asset must reflect the brand's visual DNA and tone; hallucinated brand details are a product failure |
| 2 | **Responsiveness** | Voice sessions require real-time bidirectional audio (<200ms round-trip); image generation must not block the UI |
| 3 | **Surface parity** | Web, extension, and mobile must expose identical brand context and generation capabilities |

### Stakeholders

| Stakeholder | Concern |
|-------------|---------|
| Marketing practitioner (primary user) | Fast, on-brand asset creation without a designer |
| Brand manager | Brand standards are enforced, not bypassed |
| System administrator | Model configuration, user quotas, AI directives |
| Auditor / security reviewer | API key management, data retention, auth model |

---

## Section 2: Architecture Constraints

### Technical Constraints

| Constraint | Detail | Source |
|------------|--------|--------|
| React + TypeScript | All three surfaces share a single React/TypeScript codebase | `package.json`, `tsconfig.app.json` |
| Supabase-only backend | No custom server; all backend logic runs as Supabase Edge Functions (Deno) | `supabase/functions/` |
| Google Gemini exclusively | Text, image, and video generation use Google's Gemini and Veo models | `src/services/brand-agent/brandAgentGeminiService.ts` |
| Gemini Live requires client-side key | Gemini Live WebSocket API (voice) requires the API key at the browser; server-side proxying is not supported by the Live API | `src/services/brand-agent/brandAgentLiveService.ts` |
| Capacitor for mobile | iOS/Android are web-view wrappers compiled by Capacitor; no React Native | `mobile/capacitor.config.ts` |
| Manifest V3 for extension | Chrome extension uses MV3 service worker + side panel | `extension/manifest.json` |

### Organizational Constraints

- Solo or small-team development (inferred from single-surface commit history)
- No CI/CD pipeline found in codebase (`NOT FOUND: .github/workflows/`, `.gitlab-ci.yml`)
- No automated test suite found (`NOT FOUND: *.test.ts`, `*.spec.ts`, Vitest/Jest config)

### Conventions

- All source files begin with two `// ABOUTME:` comment lines (`CLAUDE.md`)
- Path alias `@/` resolves to `src/` in all three surfaces (`vite.config.ts`, `extension/vite.config.ts`, `mobile/vite.config.ts`)
- Extension and mobile override `@/integrations/supabase/client` with surface-specific auth clients
- All Edge Functions deploy with `verify_jwt: false`; each function handles its own auth (`CLAUDE.md`, `supabase/functions/*/index.ts`)

---

## Section 3: System Scope and Context

### Business Context

Vince solves the "blank canvas" problem for marketers: producing on-brand creative work requires either a skilled designer or extensive prompt engineering. Vince replaces both by storing a brand's DNA (uploaded documents, images, color palettes, tone guidelines) and using it to condition every AI generation.

**Actors:**
- **Marketing practitioner** — creates prompts, generates images/video/copy, saves campaigns
- **Brand manager** — uploads brand documents, reviews brand DNA, sets directives
- **System admin** — configures models, sets per-user quotas, edits AI behavior directives

### Technical Context

Vince integrates with these external systems:

| System | Role | Integration Method |
|--------|------|--------------------|
| **Supabase** | Database (PostgreSQL), Auth, Storage, Edge Function runtime | Supabase JS client + REST (`src/integrations/supabase/client.ts`) |
| **Google Gemini API** (REST) | Text generation, image generation, document analysis | `@google/generative-ai` SDK (`src/services/brand-agent/brandAgentGeminiService.ts`) |
| **Google Gemini Live API** (WebSocket) | Real-time bidirectional voice | `@google/genai` SDK, WebSocket (`src/services/brand-agent/brandAgentLiveService.ts`) |
| **Google Veo 3** | Video generation | Called via Gemini edge function (`supabase/functions/generate-creative-video/`) |
| **Google Cloud Run** | Web app hosting | Docker + nginx deployment (`Dockerfile`, `nginx.conf`) |
| **Chrome Extensions API** | Side panel, storage, identity | Extension manifest + background worker (`extension/manifest.json`) |

→ See [02-architecture-c4.md](02-architecture-c4.md) for context diagrams.

---

## Section 4: Solution Strategy

### High-Level Approach

The system is built as a **serverless frontend monorepo** with a managed backend:
- All business logic lives in short-lived Supabase Edge Functions (Deno) or directly in the browser
- Persistent state (brands, generations, campaigns) lives in Supabase PostgreSQL with Row Level Security
- The three frontend surfaces (web, extension, mobile) share components via a common `src/` tree

### Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend runtime | Supabase Edge Functions (Deno) | Eliminates server ops; co-located with database; Supabase secrets for API keys |
| AI provider | Google Gemini / Veo 3 | Gemini 2.0 Flash supports interleaved text+image; Gemini Live enables real-time voice; Veo 3 for video |
| Auth | Supabase Auth (JWT) | Built into Supabase stack; row-level security ties directly to `auth.uid()` |
| Mobile | Capacitor (web-view) | Allows full code reuse from web app; no separate React Native codebase |
| State management | React Query (server state) + Zustand (client state) | React Query for Supabase data fetching; Zustand for UI-local state |

### Key Architectural Patterns

1. **Brand Context Injection** — `fetchBrandContext()` aggregates brand profile, directives, prompts, and image data before any AI call; this context is injected into every system prompt (`src/services/brand-agent/brandAgentGeminiService.ts`)

2. **Two-Model Voice Architecture** — Gemini Live API (WebSocket) handles real-time voice + tool dispatch; a separate `generateContent` REST call handles interleaved text+image output. These cannot be combined because image generation models do not support function calling (`src/services/brand-agent/brandAgentLiveService.ts`, `src/components/creative-studio/BrandAgentApp.tsx`)

3. **Surface Adapter Pattern** — Each surface overrides `@/integrations/supabase/client` with its own auth-aware Supabase client; all other code runs unchanged (`extension/src/supabaseExtClient.ts`, `mobile/src/` override)

4. **Edge Function Serverless Backend** — Zero long-running servers; all AI orchestration, document analysis, and image generation are stateless Deno functions (`supabase/functions/`)

5. **Soft Delete for Generations** — `creative_studio_generations.archived_at` enables recoverable deletion (`supabase/migrations/20260315000000_add_archived_at_to_generations.sql`)
