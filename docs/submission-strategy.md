# Brand Lens — Hackathon Submission Strategy

## Context

Submitting Brand Lens to the **Gemini Live Agent Challenge** (deadline March 16, 2026 @ 5:00 PM PDT). Category: **Creative Storyteller**. The challenge video literally names "marketing asset generator" as a Category 2 example — Brand Lens is that, plus voice control, brand intelligence, admin depth, and a Chrome extension.

---

## Judging Criteria Alignment

### 1. Innovation & Multimodal UX — 40% (BIGGEST WEIGHT)

**What they want:** "Breaking the text box paradigm, seamless experience"

**What we have:**
- Voice-driven creative direction (Gemini Live API) — no typing
- Interleaved output (text + images woven together in one response)
- Camera controls panel (prompt like a creative director — matches Google's own Nano Banana guide)
- Brand DNA injection (AI learns your brand from websites, PDFs, annual reports)
- Chrome extension side panel (agent alongside you while you browse)
- 4 audio-reactive visualizers during voice sessions
- Multi-image reference staging (up to 14 images)

**Story to tell:** "The user never types a prompt. They speak to an AI creative director who already knows their brand — and gets back complete creative packages with copy and images woven together. The text box is gone."

### 2. Technical Implementation & Agent Architecture — 30%

**What they want:** "SDK/ADK usage, GCP robustness, error handling"

**What we have:**
- Google GenAI SDK (client-side Live API + server-side interleaved generation)
- Two-model architecture: `gemini-2.5-flash-native-audio` (Live voice + tool calling) -> `gemini-3.1-flash-image-preview` (interleaved output)
- 7+ agent tools with real backend execution (not mocked)
- Brand intelligence pipeline: website crawl -> document extraction -> profile synthesis -> guardrail generation
- 15+ Supabase Edge Functions
- 11+ database tables with RLS
- Latency masking (Live speaks filler while image generation runs async)
- Cloud Run deployment (TBD: static frontend only vs. backend service for interleaved generation)

**Story to tell:** "This isn't a weekend prototype. It's an 11-tab admin panel, 15 edge functions, and a brand intelligence pipeline — built on nights and weekends by a creative director who works with brands every day."

**GCP backend decision (deferred):** The requirement says "backend running on Google Cloud." Options: (a) Cloud Run backend service handling interleaved generation, (b) Cloud Run static + argue it counts, (c) Vertex AI endpoints. Decide after extraction is complete and we know what the architecture looks like.

### 3. Demo & Presentation — 30%

**What they want:** "Problem definition, architecture clarity, deployment proof, working software"

**Story to tell:** The demo starts from zero — no pre-seeded data. Everything built live:
1. Chrome extension: create brand by voice while browsing their website
2. Main app: upload PDFs, watch DNA populate
3. Voice generation: brief a campaign, get interleaved creative package
4. Admin reveal: 11 tabs of production depth underneath

---

## Submission Checklist (from DevPost + Video)

### Required (Must Have)

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| 1 | Text description (features, tech, learnings) | NOT STARTED | Write on DevPost |
| 2 | Public code repository with README + spin-up instructions | IN PROGRESS | brand-lens repo exists, needs README |
| 3 | Google Cloud deployment proof (screen recording or live URL) | NOT STARTED | Cloud Run deploy |
| 4 | Architecture diagram | NOT STARTED | PRD has ASCII version, need visual |
| 5 | Demo video (< 4 minutes, real-time, no mockups) | NOT STARTED | One take, raw |
| 6 | Hosted project URL | NOT STARTED | Cloud Run URL |
| 7 | Uses Gemini model | YES | 3 models: Live audio, image preview, text chat |
| 8 | Uses GenAI SDK or ADK | YES | @google/genai SDK |
| 9 | At least one Google Cloud service | PLANNED | Cloud Run |
| 10 | Proof backend runs on Google Cloud (dashboard or live URL) | NOT STARTED | Screenshot of Cloud Run console |

### Bonus Points

| # | Bonus | Status | Notes |
|---|-------|--------|-------|
| 1 | Publish blog/video with #GeminiLiveAgentChallenge | DECIDE LATER | If timeline allows |
| 2 | Automation scripts for cloud deployment | NOT STARTED | Dockerfile + deploy script in repo |
| 3 | Google Developer Group profile link | NOT STARTED | Quick signup |

---

## DevPost Text Description — Draft

### What It Does
Brand Lens is a voice-driven AI creative director that takes campaign briefs by natural conversation and generates complete creative packages — headlines, body copy, and images woven together in a single response — all grounded in brand intelligence the system built itself.

The agent (Vince) doesn't just generate images from prompts. He:
- Creates brands by voice and crawls their websites to extract visual DNA
- Processes uploaded brand guidelines and annual reports to build corporate DNA
- Synthesizes all intelligence sources into a unified brand profile
- Generates complete creative packages via Gemini's interleaved output — copy and images together
- Operates with photography-grade camera controls (aperture, focal length, film stock, lighting)
- Enforces brand compliance through agent directives and guardrails
- Works from a Chrome extension side panel alongside any website

### How We Built It
I'm the Director of AI Enablement at MERGE, a full-service advertising and marketing technology agency. As someone who works with brands and creative teams daily, I'd been exploring brand-intelligent AI generation for months — the gap between generic AI image tools and what agencies actually need (brand consistency, photography-grade controls, compliance guardrails) was obvious.

When I saw the Gemini Live Agent Challenge, the Creative Storyteller category described exactly the product I wanted to build. Brand Lens is where those ideas became real.

The build was nights and weekends across February and into March:
- **Creative Studio** — 7 generation modes, camera controls panel, multi-image reference staging
- **Brand Intelligence pipeline** — website crawling, document import (PDFs, annual reports), profile synthesis
- **Vince (AI creative director)** — text chat + voice mode via Gemini Live, 7 tools, brand context injection
- **Interleaved output** — Gemini's native text + image generation for complete creative packages
- **Admin panel** — 11 tabs: brands, DNA, cameras, models, generations, analytics, quotas, audit trail, prompts, extension, settings
- **Chrome extension** — MV3 side panel with voice + chat agent alongside any website
- **Cloud Run deployment**

### Technologies
- **Gemini 2.5 Flash Native Audio** — Live API for real-time voice interaction with tool calling
- **Gemini 3.1 Flash Image Preview** — Interleaved output (responseModalities: ['TEXT', 'IMAGE'])
- **Gemini 3 Flash** — Text chat and brand intelligence extraction
- **Google GenAI SDK** (@google/genai) — client-side Live API + server-side generation
- **Cloud Run** — Frontend hosting (GCP requirement)
- **Supabase** — PostgreSQL database, Edge Functions, Auth, Storage
- **React + TypeScript + Vite** — Frontend
- **Chrome Extension (MV3)** — Side panel with voice + chat agent

### Challenges
- **Image models don't support function calling.** We designed a two-model architecture: Live API handles voice + tool calling, then fires a separate interleaved generation call with all brand context pre-injected.
- **Latency masking.** Interleaved generation takes 4-6 seconds. The Live voice session speaks filler ("Sketching concepts now...") while generation runs async, maintaining conversational flow.
- **Brand context injection at scale.** A full brand profile (visual DNA, photography style, color profile, composition rules, brand standards, agent directives, prompt templates) can be 10,000+ tokens. We had to be surgical about what context to inject and when.

### What We Learned
- Google's own Nano Banana prompting guide says "prompt like a creative director" — control lighting, lens, film stock. We built the UI for that independently, arriving at the same architecture.
- Interleaved output changes the game for creative workflows. Sequential text-then-image generation feels disconnected. Interleaved output feels like a creative director presenting a deck.
- Voice-driven brand creation (crawl -> extract -> synthesize) creates a dramatically different onboarding experience than forms and uploads.

### What's Next
- Multi-agent orchestration (Vince delegates to specialized agents for copywriting, art direction, compliance review)
- Video generation integrated into creative packages
- Real-time collaborative sessions (multiple users in one voice session with the agent)

---

## Architecture Diagram — Content Outline

Need a clean visual showing:

```
User (Voice/Text/Chrome Extension)
    |
    v
[Gemini Live API] <---> [Tool Calling Layer]
    |                          |
    v                          v
[Gemini 3.1 Flash]    [Supabase Edge Functions]
(Interleaved Output)   (Brand Intel Pipeline)
    |                          |
    v                          v
[Frontend Renderer]    [PostgreSQL + Storage]
    |
    v
[Cloud Run (GCP)]
```

Key elements to highlight:
- Two-model architecture (Live for voice, Image for generation)
- Brand context flow (DB -> Edge Function -> System Instruction -> Generation)
- Chrome extension as alternate entry point
- The "no text box" flow: voice -> tool call -> generation -> render

---

## Demo Video — Narrative Arc (< 4 minutes)

**Style:** One take, raw. Authenticity > production value.

**Opening hook (first 10 seconds matter):** "What if your AI creative director already knew your brand — and you never had to type a prompt?"

**Must show:**
1. Real-time voice interaction (judges need to SEE the "beyond text box" experience)
2. Interleaved output rendered inline (this is the Category 2 differentiator)
3. Brand intelligence building from zero (shows the pipeline depth)
4. Cloud Run dashboard or live URL (required proof)
5. Architecture diagram (flash it briefly)

**Must NOT do:**
- Pre-seed data (build everything live — this is the story)
- Use mockups (judges explicitly say "no mockups")
- Go over 4 minutes (hard cutoff)

---

## Timeline — Submission Deliverables

| Day | Date | Code Work | Submission Work |
|-----|------|-----------|----------------|
| 1-4 | Mar 6-9 | Extraction + DB setup | -- |
| 5-7 | Mar 10-12 | Interleaved output + new tools | Architecture diagram |
| 8 | Mar 13 | Cloud Run deployment | DevPost text draft |
| 9 | Mar 14 | Polish + Chrome extension | GDG signup (bonus) |
| 10 | Mar 15 | Demo dry runs | Record demo video, finalize text |
| 11 | Mar 16 | Final fixes | Submit before 5 PM PDT |

---

## Competitive Edge

6,799 registered participants. Most will build weekend prototypes. Our advantages:

1. **Production depth.** Nights-and-weekends production development vs. a weekend hack. The admin panel alone is more than most submissions.
2. **Domain expertise.** Built by a Director of AI Enablement at an actual advertising agency. The brand intelligence system solves a real problem.
3. **They named our exact use case.** "Marketing asset generator" is literally in their Category 2 description.
4. **Google's own guidance validates our architecture.** The Nano Banana prompting guide describes our camera controls. The "Data Strategy = AI Strategy" blog describes our database-grounded agent architecture.
5. **Chrome extension.** Most submissions will be web apps. Extending the agent into a browser side panel is a differentiator.
6. **Voice-first, not voice-bolted-on.** Vince was designed for voice from the start — not a chatbot with a microphone button added.

---

## Decisions Made

- **Primary category:** Creative Storyteller (Category 2)
- **Prize targets:** Creative Storyteller $10K + Grand Prize $25K + cross-category prizes (Multimodal UX $5K, Innovation $5K, Technical Execution $5K)
- **Blog post:** Skip unless timeline allows. Focus on demo and polish.
- **Demo video:** One take, raw. No edits, no cuts. Narrate through any generation wait times.
- **Narrative framing:** "As Director of AI Enablement at an ad agency, I'd been exploring brand-intelligent AI for months. When I saw the Creative Storyteller category, it described exactly what I wanted to build. Brand Lens is where those ideas became a real product."
- **Timeline language:** Nights and weekends across February/March. No mention of internal platform.
- **GCP backend:** Deferred until extraction is complete.

## Remaining Action Items

1. Google Developer Group signup — easy bonus, should just do it
2. Architecture diagram — need a clean visual (not ASCII art) for submission
3. README with spin-up instructions
4. Cloud Run deploy script (counts as bonus: "automation scripts for cloud deployment")
