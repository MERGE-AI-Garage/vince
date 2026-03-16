# Architectural Decision Records

> Generated: 2026-03-15
> These ADRs are reconstructed from codebase evidence. Dates are approximate where
> original decision records do not exist.

---

# ADR-001: Supabase as the Entire Backend

**Date:** 2025 (estimated)
**Status:** Accepted

## Context

Vince needed a backend for authentication, persistent data storage, file storage, and server-side AI orchestration. Options ranged from a traditional Node.js/Express server to fully managed BaaS platforms.

## Decision

Use Supabase for all backend concerns: authentication (Supabase Auth), relational data (PostgreSQL with RLS), file storage (Supabase Storage), and API logic (Supabase Edge Functions running on Deno).

**Evidence:** `src/integrations/supabase/client.ts`, all `supabase/functions/*/index.ts`, `supabase/migrations/`

## Alternatives Considered

1. **Custom Node.js/Express server**
   - Pros: Full control, established ecosystem, easy to host on any cloud
   - Cons: Requires infrastructure management, auth implementation, database setup
   - Why Rejected: Adds operational complexity (server maintenance, scaling, deployment pipelines) for a small team

2. **Firebase (Google)**
   - Pros: Same BaaS model, tight Google Cloud integration
   - Cons: NoSQL data model makes relational queries harder; less mature Edge Functions equivalent; Firestore doesn't support complex joins needed for brand context aggregation
   - Why Rejected: PostgreSQL's relational model better fits the brand/profile/directive/generation data relationships

3. **AWS Amplify**
   - Pros: Enterprise-scale, tight AWS ecosystem
   - Cons: Significant vendor lock-in, complex configuration, cost unpredictability
   - Why Rejected: Overhead disproportionate to project scale

## Consequences

- **Positive:** No servers to manage, auth + RLS built-in, database co-located with edge functions (fast queries)
- **Negative:** Deno runtime for edge functions (smaller ecosystem than Node.js), cold start latency on infrequently-called functions
- **Trade-offs:** Supabase free/pro tier limits may require migration to paid tier as usage grows

---

# ADR-002: Google Gemini as Exclusive AI Provider

**Date:** 2025 (estimated)
**Status:** Accepted

## Context

The system requires: text generation, image generation, video generation, and real-time voice. No single AI provider offered all four capabilities at the time of development.

## Decision

Use Google Gemini and Veo exclusively:
- Gemini 2.0 Flash for text generation
- Gemini image generation models (+ Imagen via Vertex AI for specialized tasks)
- Veo 3 for video generation
- Gemini Live API for real-time voice (WebSocket)

**Evidence:** `src/services/brand-agent/brandAgentGeminiService.ts`, `supabase/functions/generate-creative-image/index.ts`, `supabase/functions/generate-creative-video/index.ts`, `src/services/brand-agent/brandAgentLiveService.ts`

## Alternatives Considered

1. **OpenAI (GPT-4o, DALL-E 3, Sora)**
   - Pros: Mature API, broad ecosystem, strong text quality
   - Cons: No real-time voice WebSocket equivalent to Gemini Live at comparable quality; Sora not publicly available as API at time of decision; DALL-E 3 produces different image aesthetics
   - Why Rejected: Gemini Live is the only production real-time voice API with tool-calling support

2. **Anthropic Claude + separate image provider**
   - Pros: Strong reasoning for brand context
   - Cons: No native image or video generation; would require multiple vendors and integration complexity
   - Why Rejected: Vendor fragmentation; no voice API

3. **Multi-vendor (best-of-breed)**
   - Pros: Best model for each task
   - Cons: Multiple API keys, billing, SDKs, rate limits to manage; inconsistent interfaces
   - Why Rejected: Complexity and maintenance burden exceed benefit at current scale

## Consequences

- **Positive:** Single SDK, single billing relationship, tighter integration between modalities
- **Negative:** Vendor lock-in to Google; pricing changes or API deprecations affect all capabilities simultaneously
- **Trade-offs:** Gemini image quality trade-offs vs. specialized providers (Midjourney, Stable Diffusion) accepted in favor of system simplicity

---

# ADR-003: Three-Surface Monorepo (Web + Extension + Mobile)

**Date:** 2025 (estimated)
**Status:** Accepted

## Context

Vince needed to run on web browsers, as a Chrome extension sidebar, and as a native iOS/Android app. Building three independent codebases would triple maintenance burden.

## Decision

All three surfaces share the same `src/` React component tree via a path alias `@/`. Each surface has its own entry point and vite config. Surfaces override only what differs (auth client, layout shell).

**Evidence:** `vite.config.ts`, `extension/vite.config.ts`, `mobile/vite.config.ts` (all alias `@/` to root `src/`), `extension/src/supabaseExtClient.ts` (override pattern), `mobile/src/MobileApp.tsx`

## Alternatives Considered

1. **Three fully independent codebases**
   - Pros: No cross-surface coupling, teams can move independently
   - Cons: Every feature must be built 3×; bugs must be fixed 3×
   - Why Rejected: Not viable for a small team

2. **React Native for mobile (instead of Capacitor)**
   - Pros: Native performance, better mobile-specific UX primitives
   - Cons: Separate codebase — no code sharing with web; React Native components are not the same as React DOM components
   - Why Rejected: Would eliminate code sharing benefit; Capacitor allows exact web components on mobile

3. **Progressive Web App (PWA) instead of native mobile**
   - Pros: No native build toolchain
   - Cons: Limited access to native APIs (camera, biometrics, deep OS integration); app store distribution not possible
   - Why Rejected: App store presence and native feel required

## Consequences

- **Positive:** Single source of truth for all business logic and UI components; bug fixes propagate to all surfaces simultaneously
- **Negative:** Surface-specific behavior (e.g., `source="mobile"` prop, `deriveMobileBrandTheme()`) adds conditional logic complexity; mobile build process has more steps than web-only
- **Trade-offs:** Capacitor web-view has performance ceiling vs. native; accepted given the chat/generation UI pattern

---

# ADR-004: Brand Context Injection via Parallel Query Aggregation

**Date:** 2025 (estimated)
**Status:** Accepted

## Context

Every AI generation must be conditioned on the brand's visual DNA, tone of voice, directives, and reference images. This data is spread across multiple tables. Options ranged from storing it denormalized in a single column to fetching it in parallel at request time.

## Decision

At generation time, `fetchBrandContext()` executes parallel Supabase queries to load brand profile, directives, prompt templates, and reference images, then assembles a structured system prompt.

**Evidence:** `src/services/brand-agent/brandAgentGeminiService.ts:fetchBrandContext()` — parallel queries confirmed by function structure

## Alternatives Considered

1. **Denormalized brand context JSONB column**
   - Pros: Single query at generation time, simpler
   - Cons: Updates to brand data require regenerating the denormalized column; consistency complexity
   - Why Rejected: Normalization is maintained; parallel queries are fast enough given Supabase co-location

2. **Materialized view or caching layer**
   - Pros: Pre-aggregated, faster
   - Cons: Cache invalidation complexity; adds Redis or similar dependency
   - Why Rejected: YAGNI — parallel queries from edge functions are acceptably fast without caching

## Consequences

- **Positive:** Brand data is always fresh at generation time; normalized schema is easier to maintain
- **Negative:** Each AI request incurs 4+ database round-trips; partial brand profile data silently degrades output quality without error (shadow dependency — see [04-data-architecture.md](04-data-architecture.md))
- **Trade-offs:** Accepted latency trade-off; generation is already bottlenecked by Gemini API response time

---

# ADR-005: Edge Functions Deploy with `verify_jwt: false`

**Date:** 2025 (estimated)
**Status:** Accepted

## Context

Supabase Edge Functions have a default behavior of validating the caller's JWT before the function runs. This caused 401 errors in this project.

## Decision

All edge functions are deployed with `verify_jwt: false`. Auth is implemented inside each function by reading and validating the `Authorization` header.

**Evidence:** `CLAUDE.md` (explicit project rule), deployment pattern in all `supabase/functions/*/index.ts`

## Alternatives Considered

1. **Keep default `verify_jwt: true`**
   - Pros: Supabase handles auth validation automatically; functions can trust the caller
   - Cons: Was causing 401 errors in this project's configuration; root cause not fully documented
   - Why Rejected: Was blocking functionality

## Consequences

- **Positive:** Functions work reliably; developers have full control over auth logic
- **Negative:** Each function must implement its own auth check; if a function omits the check, it becomes an unauthenticated public endpoint
- **Trade-offs:** Security responsibility shifted from platform to each function author

---

# ADR-006: Client-Side Gemini API Key for Voice

**Date:** 2025–2026 (estimated)
**Status:** Accepted (with mitigation)

## Context

Gemini Live API requires a WebSocket connection with the API key provided by the client. Unlike REST APIs, the Live API cannot be proxied through a server because the WebSocket must be established directly from the browser (latency and connection requirements). This means the API key must be available in the browser at runtime.

**Important clarification on implementation:** The key is NOT compiled into the JavaScript bundle. It is stored in Supabase Vault and fetched at runtime via an authenticated `get_secret` RPC call (`BrandAgentApp.tsx:318-331`, `useVinceVoice.ts:131-140`). The key is then held in React component state and passed to the GoogleGenAI SDK (`brandAgentLiveService.ts:setApiKey()`). The risk is in-memory key exposure to authenticated users with DevTools, not static bundle extraction.

## Decision

Store the Gemini API key in Supabase Vault. Fetch it at runtime after user authentication and pass it to the Gemini Live WebSocket client. Accept the residual in-memory exposure risk in exchange for functional real-time voice.

**Evidence:** `src/components/creative-studio/BrandAgentApp.tsx:318-331`, `src/services/brand-agent/brandAgentLiveService.ts:setApiKey()`

## Alternatives Considered

1. **Server-side WebSocket proxy**
   - Pros: API key never reaches the browser
   - Cons: Adds significant latency to real-time audio (each audio chunk routes through proxy); requires persistent server (not serverless-compatible); technically complex to implement with acceptable audio quality
   - Why Rejected: Real-time voice quality is unacceptable through a proxy given current Gemini Live API design

2. **Disable voice feature**
   - Pros: No key exposure
   - Cons: Voice is a core product differentiator
   - Why Rejected: Product requirement

3. **Short-lived token exchange**
   - Pros: API key never leaves server; token expires quickly
   - Cons: ⚠️ REQUIRES VERIFICATION — Gemini Live API may not support ephemeral tokens at time of implementation
   - Status: Should be re-evaluated as Gemini Live API evolves

## Consequences

- **Positive:** Voice feature works as designed; key is not statically extractable from the bundle
- **Negative:** Key is in browser memory after the RPC call and visible to authenticated users via DevTools network inspection; risk of quota theft from authenticated sessions
- **Mitigations required:** Key should be restricted to production domain in Google Cloud Console; budget alerts should be configured; key should be rotated if abuse is detected. See [05-security-compliance.md — Key Rotation](05-security-compliance.md#key-rotation).

## References

- Code location: `src/services/brand-agent/brandAgentLiveService.ts`, `src/components/creative-studio/BrandAgentApp.tsx`
- Security analysis: [05-security-compliance.md — Gemini API Key Exposure](05-security-compliance.md#gemini-api-key-exposure)
