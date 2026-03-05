# Gemini Live Agent Challenge — Project PRD

**Project:** Voice-Driven Creative Director Agent
**Category:** Creative Storyteller
**Hackathon:** Google Gemini Live Agent Challenge
**Deadline:** March 16, 2026 @ 5:00 PM PDT
**Team:** Kurt Miller (Director of AI Enablement, MERGE)
**Origin:** Extracted and refactored from MERGE AI Garage platform

---

## 1. Vision

A voice-driven AI creative director that takes campaign briefs by natural conversation, generates complete creative packages using Gemini's native interleaved output (text + images in a single response), and operates within a full-featured brand-aware creative production platform — with a Chrome extension that brings the agent alongside any website.

This is not a chatbot that generates images. This is an enterprise creative production system with a voice-activated AI art director embedded inside it — brand DNA injection, photography-grade camera controls, compliance guardrails, cost tracking, a complete admin backend, and a Chrome side panel extension that lets the creative director work alongside you while you browse.

The judges will see the tip of the iceberg (a voice conversation that produces brand-consistent creative packages) and then discover the full iceberg underneath (an 11-tab admin panel, brand intelligence system, prompt library, model management, analytics, audit trail, and a Chrome extension that extends the agent beyond the app).

### The Demo Story

The system starts empty — no brands, no data. Everything is built live:

1. **Chrome extension:** Browsing Google's website, open the side panel, tell Vince by voice to create a new brand. He creates it, runs the website analysis, starts building the DNA — all while you're still browsing Google's site.
2. **Main app:** Switch to the creative studio. The Google brand is there, DNA populating. Drop in brand guidelines PDF and annual report through Vince's chat. Three DNA cards fill out — Visual DNA, Brand Standards, Corporate DNA.
3. **Voice generation:** Activate Vince voice mode. Brief a campaign by conversation. Vince generates a complete creative package via interleaved output — copy and images woven together, all brand-aware from the DNA just built.
4. **Iteration:** Refine by voice. New package generated with adjustments.

From zero to brand-aware creative production in one continuous demo. No pre-seeded data. No fake setup.

---

## 2. What Exists (Source: MERGE AI Garage)

The creative studio and Vince (AI creative director agent) are production features built over a 90-day sprint (December 2025 — March 2026). The following will be extracted into a standalone project.

### Creative Studio (User-Facing)
- Full-bleed canvas-first design (Midjourney/ChatGPT-inspired layout)
- 7 generation modes: Generate, Edit, Video, Upscale, Recontext, Try-On, Conversation
- Camera controls panel (aperture, focal length, film stock, lighting, composition, color temp, DOF)
- Multi-image reference staging (up to 14 images)
- Masking canvas for inpainting/outpainting
- Generation history drawer
- Media library browser
- Brand selector with Visual DNA context
- Quota system with cost awareness
- Brand compliance pre-check (directive-based forbidden combinations)

### Brand System
- Brand creation/editing with full identity (logo, colors, palette, visual identity, brand voice)
- Brand Vision Intelligence — AI learns visual DNA from:
  - Website analysis (crawl + Gemini extraction)
  - Reference image analysis (art-director-level metadata per image)
  - Document import (PDF, PPTX, DOCX → structured brand data)
  - Profile synthesis (aggregates all analyses into unified DNA)
- Brand DNA dialog (bento-grid showcase of colors, typography, identity, tone, visual DNA)
- Corporate DNA dialog (8-section corporate narrative: mission, heritage, sustainability, innovation, culture, community, customer focus, competitive position)
- Brand standards editor
- Agent directives (governance rules with personas, forbidden combinations, required elements)
- Prompt template library with camera presets and variable fields
- Multi-variant logo library (full_color, reversed, mono; horizontal, vertical, stacked, mark_only)
- Reference image collections (product, character, style, environment)

### Vince — AI Creative Director
- 7 tools: save_prompt_template, search_prompt_library, analyze_brand_image, get_brand_profile, list_available_models, check_generation_quota, generate_image
- Text chat mode with tool calling loop (multi-turn conversation via edge function)
- Voice mode via Gemini Live API (real-time bidirectional audio)
  - Remote tool calling (voice session → edge function → tool execution → response)
  - Reference image injection during voice sessions
  - Bidirectional transcription with filler-word cleanup
  - START_SESSION kickstart protocol for immediate greeting
  - Session resumption support
  - 4 audio-reactive visualizers (Classic Wave, Codrops 3D Orb, Light Pillar, Hyperspeed)
- Full brand context injection into system prompt:
  - Brand name, voice, visual identity
  - Visual DNA, photography style, color profile, composition rules
  - Product catalog, brand identity, tone of voice, typography
  - Brand standards (filtered to prescriptive sections)
  - Active agent directives with personas and rules
  - Top 20 prompt templates by usage
- Camera preset recommendations on every prompt
- Logo injection gating (branded content only, scene-aware variant selection)
- Brand name hallucination prevention (describe visually, never include text)
- Cost awareness (routine = just generate, expensive = flag, very expensive = gate)

### Admin Panel (11 Tabs)
1. **Brands** — CRUD with visual cards showing logo, colors, DNA badges
2. **Brand DNA** — Per-brand intelligence status, confidence scores
3. **Camera** — Camera preset management
4. **Models** — Model registry with capabilities, cost, active/default flags
5. **Generations** — Full generation browser with filters, card/list view, detail drill-down
6. **Analytics** — Usage dashboards (cost trends, generation types, top users)
7. **User Quotas** — Per-user quota limits (image/video separate)
8. **Audit Trail** — Activity log with filtering
9. **Prompt History** — Prompt version history
10. **Extension** — Extension/plugin configuration
11. **Settings** — Global configuration

### Vince Control Panel (5 Tabs)
1. **Voice** — Voice picker (30 voices), model, speed, system prompt, visualizer settings
2. **Chat** — Text model, feature toggles, system prompt, quick prompts
3. **Prompts** — Greeting templates, test greeting, brand health callouts
4. **Brand Intel** — Default brand context display
5. **Conversations** — Conversation browser with delete/export

---

## 3. What's New (Hackathon-Specific)

### Interleaved Output Mode
The centerpiece new feature. When Vince triggers image generation during a voice session, instead of calling the existing `generate-creative-image` pipeline (separate text + image calls), we add a new path that uses Gemini's native interleaved output:

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-3.1-flash-image-preview',
  contents: enrichedBrief,
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: { aspectRatio: inferredRatio },
    systemInstruction: { parts: [{ text: brandContext }] }
  }
});
```

Returns a `parts[]` array with interleaved text (copy, headlines, descriptions) and base64 images (hero shots, social variants, campaign visuals) — rendered inline on the frontend as a cohesive creative package.

### Architecture Constraints
- **Image models do NOT support function calling.** The interleaved generation call is a terminal operation — all brand context must be gathered first and injected as system instruction / prompt text.
- **Live API cannot produce images.** Architecture must be: Live voice session → tool call → separate generateContent with interleaved output → return mixed content to frontend.
- **Latency masking required.** The interleaved call takes 4-6 seconds. During that time, the Live voice session speaks a filler acknowledgment ("I'm sketching that out now...") to maintain conversational flow.

### New Tool: `generate_creative_package`
Added to Vince's tool set alongside the existing `generate_image`:

```typescript
{
  name: 'generate_creative_package',
  description: 'Generate a complete creative package with interleaved text and images',
  parameters: {
    brief: string,           // Campaign brief
    deliverables: string[],  // e.g., ['hero_image', 'social_square', 'story_vertical']
    aspect_ratios: string[], // Per-deliverable aspect ratios
    brand_context: string,   // Injected automatically from brand DNA
  }
}
```

### New Vince Tools (Brand Onboarding by Voice)
Three new tools added to Vince's tool set, enabling brand creation and intelligence building by voice:

```typescript
{
  name: 'create_brand',
  description: 'Create a new brand in the system',
  parameters: {
    name: string,          // Brand name
    website_url: string,   // Brand website
    primary_color: string, // Hex color code
    category: string,      // e.g., "Technology"
  }
}

{
  name: 'analyze_brand_website',
  description: 'Crawl a brand website and extract visual DNA (colors, fonts, imagery, tone)',
  parameters: {
    brand_id: string,      // Injected from active brand context
  }
}

{
  name: 'import_brand_document',
  description: 'Process uploaded documents to extract brand intelligence',
  parameters: {
    brand_id: string,      // Injected from active brand context
    document_type_hint: string, // e.g., 'brand_style_guide', 'annual_report', 'csr_report'
  }
}
```

These call existing edge functions (`analyze-brand-website`, `analyze-brand-documents`) — no new backend needed.

### Google Brand — Built Live (No Seed Data)
The demo builds the Google brand from scratch using the system's own pipelines:
1. **Voice creation** via `create_brand` tool (name, website, primary color)
2. **Website analysis** via `analyze_brand_website` → populates Visual DNA card
3. **Document import** via `import_brand_document`:
   - Google Marketing Platform Brand Guidelines PDF → Brand Standards card
   - Alphabet 10-K Annual Report → Corporate DNA card
4. **Auto-generated content** after synthesis:
   - Generation prompt (Brand Lens)
   - Agent directives
   - Prompt templates / quick prompts
   - Brand reference collections

### Cloud Run Deployment
- React frontend served from Cloud Run (satisfies GCP requirement)
- Supabase backend (new project, separate from AI Garage)
- Proof of deployment via Cloud Run console screenshot

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Cloud Run (GCP)                       │
│                                                         │
│  React + TypeScript + Vite + Tailwind + shadcn/ui       │
│  ├── Creative Studio (canvas, prompt bar, history)      │
│  ├── Brand System (selector, DNA, directives)           │
│  ├── Vince Chat (text mode with tool calling)           │
│  ├── Vince Voice (Gemini Live with visualizer)          │
│  ├── Interleaved Output Renderer (NEW)                  │
│  └── Admin Panel (11 tabs)                              │
│                                                         │
└──────────┬──────────────────────┬───────────────────────┘
           │                      │
           │ Supabase SDK         │ @google/genai (client)
           │                      │
           ▼                      ▼
┌──────────────────┐   ┌─────────────────────────────────┐
│  Supabase        │   │  Google Gemini API               │
│                  │   │                                   │
│  PostgreSQL      │   │  gemini-2.5-flash-native-audio   │
│  ├── 11+ tables  │   │  (Live voice — direct from       │
│  │   (brands,    │   │   browser via WebSocket)          │
│  │    profiles,  │   │                                   │
│  │    models,    │   │  gemini-3.1-flash-image-preview   │
│  │    etc.)      │   │  (Interleaved output — via        │
│  │               │   │   Cloud Run or edge function)     │
│  Edge Functions  │   │                                   │
│  ├── brand-      │   │  gemini-3-flash-preview           │
│  │   prompt-     │   │  (Text chat — via edge function)  │
│  │   agent       │   │                                   │
│  ├── generate-   │   └─────────────────────────────────┘
│  │   creative-   │
│  │   image       │
│  ├── analyze-*   │
│  ├── synthesize-*│
│  └── 10+ more    │
│                  │
│  Storage         │
│  (media, logos)  │
│                  │
│  Auth            │
└──────────────────┘
```

### Voice → Interleaved Output Flow

```
1. User speaks brief into microphone
   └── Browser streams 16kHz PCM → Gemini Live WebSocket

2. Gemini Live processes speech, emits tool_call
   └── { name: 'generate_creative_package', args: { brief, deliverables } }

3. Client intercepts tool_call
   ├── Sends filler text back to Live session
   │   └── Live speaks: "Love that direction. Sketching concepts now..."
   │
   └── Fires async POST to backend
       └── Backend calls generateContent with responseModalities: ['TEXT', 'IMAGE']
           └── Brand context injected as systemInstruction

4. Backend receives interleaved response
   └── parts[]: text, image, text, image, text, image...
       └── Returns JSON { textParts[], imageParts[] } to frontend

5. Frontend renders creative package
   └── Inline display: copy blocks + images woven together

6. Client sends tool_response back to Live session
   └── Live speaks: "I've pushed the concepts to your screen..."
```

---

## 5. Demo Script (4 Minutes)

### Act 1: Chrome Extension — Brand from Zero (0:00 — 0:50)
- Chrome open to google.com
- Open Vince side panel extension — empty, no brands
- Voice: "Vince, create a new brand called Google. Website is google.com. Primary color is Google Blue, #4285F4."
- Vince calls `create_brand` → brand created instantly
- Voice: "Analyze the website and build the visual DNA."
- Vince calls `analyze_brand_website` → crawl starts
- While crawl runs, narrate: "Building brand intelligence by voice, from a Chrome extension, while browsing the client's site."
- Meanwhile, navigate to download Google brand guidelines PDF and Alphabet 10-K (pre-bookmarked)

### Act 2: Documents + Full Pipeline (0:50 — 1:40)
- Switch to main Creative Studio app
- Google brand visible — Visual DNA card already populating from website analysis
- Open Vince chat sidebar, upload the PDFs via paperclip
- Vince processes documents, then chains: synthesize profile → generate guardrails → generate starters → synthesize generation prompt → generate card images
- Vince narrates progress as each step completes
- Flash DNA dialog: bento grid with all 3 cards — Visual DNA (website), Brand Standards (guidelines PDF), Corporate DNA (annual report)
- "Three intelligence sources synthesized into one brand profile. Visual identity, brand standards, corporate narrative — all extracted automatically."

### Act 3: Director Mode + Camera Controls (1:40 — 2:10)
- Show Director Mode settings in the right panel — camera controls panel open
- Quick tour: aperture, focal length, film stock, lighting direction, composition presets, color temperature, DOF
- "Google's own Nano Banana prompting guide says 'prompt like a creative director' — control lighting, lens, film stock, materiality. We built the UI for that."
- Select a camera preset, show how it injects into the prompt

### Act 4: Voice Generation — Interleaved Creative Package (2:10 — 3:00)
- Activate Vince voice mode — visualizer animates, greeting fires
- Voice: "I need a social campaign for Google AI Studio. Developer audience. Technical but approachable. Give me a hero image, an Instagram square, and a vertical story."
- Vince responds, confirms direction, triggers interleaved generation
- Speaks filler while generating: "Love that direction. Sketching concepts now..."
- Creative package appears: headline copy + hero image + social copy + square image + story copy + vertical image
- "One API call. Text and images woven together, all grounded in the brand DNA we just built."
- Voice iteration: "Push the palette cooler. More blue. Make the hero wider for a web banner."
- Regeneration with adjusted parameters

### Act 5: Video + Admin Reveal (3:00 — 3:40)
- Generate a short video: "Google Pixel phone rotating on a clean white surface, cinematic studio lighting, shallow depth of field"
- While video generates, quick admin tour: brand management, model registry, generation stats, cost tracking
- Show the auto-generated agent directives, prompt templates, generation prompt (Brand Lens)
- Video result appears

### Close (3:40 — 4:00)
- Show Cloud Run console (GCP deployment proof)
- "Gemini Live for voice. Gemini 3.1 Flash for interleaved output. Full brand intelligence pipeline. Camera controls. Video generation. Chrome extension. Deployed on Cloud Run."
- "From zero brands to brand-aware creative production — built live in four minutes."

---

## 6. Extraction Manifest

### Files to Extract

**Pages (2)**
- `src/pages/CreativeStudio.tsx`
- `src/pages/CreativeStudioAdmin.tsx`
- `src/pages/VinceControlPanel.tsx`

**Components (~50)**
- `src/components/creative-studio/` (37 files)
- `src/components/vince-control-panel/` (5 tab components)
- Shared visualizer components (4 styles)

**Services (3)**
- `src/services/brand-agent/brandAgentSettings.ts`
- `src/services/brand-agent/brandAgentGeminiService.ts`
- `src/services/brand-agent/brandAgentLiveService.ts`

**Hooks (8)**
- `useCreativeStudioBrands.ts`
- `useCreativeStudioBrandIntelligence.ts`
- `useCreativeStudioModels.ts`
- `useCreativeStudioGenerations.ts`
- `useCreativeStudioQuota.ts`
- Plus 3 supporting hooks

**Types (1)**
- `src/types/creative-studio.ts` (680 lines)

**Stores (2)**
- Zustand stores for creative studio state

**Edge Functions (15+)**
- brand-prompt-agent
- generate-creative-image
- generate-creative-video
- analyze-brand-website
- analyze-brand-images
- analyze-brand-documents
- synthesize-brand-profile
- enhance-image-prompt
- enhance-director-prompt
- generate-brand-guardrails
- generate-brand-prompt
- validate-brand-compliance
- generate-brand-starters
- generate-brand-card-images
- synthesize-generation-prompt

**Database Tables (11+)**
- creative_studio_brands
- creative_studio_brand_profiles
- creative_studio_brand_analyses
- creative_studio_brand_references
- creative_studio_brand_prompts
- creative_studio_brand_logos
- creative_studio_agent_directives
- creative_studio_models
- creative_studio_generations
- creative_studio_audit_log
- creative_studio_cost_settings
- brand_agent_settings
- chatbot_conversations

**Chrome Extension**
- `extension-brand-ai/` (entire directory — MV3 side panel with Vince voice + chat)

### New Files to Create

- Interleaved output renderer component
- `generate_creative_package` tool handler (edge function addition)
- `create_brand`, `analyze_brand_website`, `import_brand_document` tool handlers (added to brand-prompt-agent)
- Cloud Run Dockerfile + deploy config
- Simplified auth wrapper (single-user for demo)
- README with spin-up instructions

---

## 7. Timeline

### Phase 1: Foundation (Days 1-2)
- [ ] Create new repo
- [ ] Set up new Supabase project
- [ ] Run database migrations (all 11+ tables)
- [ ] Extract and refactor frontend components (remove AI Garage dependencies)
- [ ] Deploy edge functions to new Supabase project
- [ ] Verify creative studio loads with empty data

### Phase 2: Brand & Data (Days 3-4)
- [ ] Seed Google brand data (brand record, visual profile, directives, templates)
- [ ] Upload Google logo variants
- [ ] Verify Vince loads with Google brand context
- [ ] Test text chat mode with tool calling
- [ ] Test voice mode connection and greeting

### Phase 3: Interleaved Output (Days 5-7)
- [ ] Prototype `responseModalities: ['TEXT', 'IMAGE']` call
- [ ] Build `generate_creative_package` tool
- [ ] Build interleaved output renderer (frontend)
- [ ] Wire voice → tool call → interleaved generation → render flow
- [ ] Implement latency masking (filler audio during generation)
- [ ] Test full voice → package → iteration loop

### Phase 4: Deployment & Polish (Days 8-9)
- [ ] Dockerfile + Cloud Run deployment
- [ ] Verify all features work on deployed instance
- [ ] UI polish pass (remove AI Garage branding, add project branding)
- [ ] Test on mobile / different browsers

### Phase 5: Submission (Days 10-11)
- [ ] Record demo video (< 4 minutes)
- [ ] Create architecture diagram
- [ ] Write README with spin-up instructions
- [ ] Write DevPost submission text
- [ ] Record Cloud Run deployment proof video
- [ ] Submit

---

## 8. Submission Checklist (DevPost Requirements)

- [ ] Text description (features, technologies, learnings)
- [ ] Public code repository with spin-up instructions in README
- [ ] Proof of Google Cloud deployment (screen recording of Cloud Run console)
- [ ] Architecture diagram (system connections visual)
- [ ] Demo video (< 4 minutes, real-time functionality, no mockups)

### Bonus Points
- [ ] Publish content (blog/video) with #GeminiLiveAgentChallenge
- [ ] Automate Cloud Run deployment with scripts/IaC in repo
- [ ] Sign up for Google Developer Group + link profile

---

## 9. Technical Constraints

| Constraint | Impact | Mitigation |
|-----------|--------|------------|
| Image models don't support function calling | Can't chain tools during interleaved generation | Two-model architecture: Live for voice + tool calling, image model for terminal generation |
| Live API is audio-only output | Can't stream images through voice WebSocket | Separate data channel for visual output to frontend |
| Interleaved generation takes 4-6 seconds | Dead air during voice session | Latency masking: Live speaks filler while generation runs async |
| Max ~4 images per interleaved response (token budget) | Can't generate a 20-image storyboard in one call | Design packages around 3 deliverables per generation |
| `imageSize` parameter may be ignored by SDK | Could get 1K images when expecting 2K | Design frontend for 1K output, treat higher res as bonus |
| SynthID watermark on all generated images | Minimal impact | Acknowledged, not a problem |

---

## 10. Success Criteria

**Minimum viable submission:**
- Creative studio with Google brand loaded
- Vince voice mode working (Gemini Live)
- At least one interleaved generation (text + images in single response)
- Deployed on Cloud Run
- Demo video under 4 minutes

**Competitive submission (target):**
- Full admin panel with all 11 tabs functional
- Brand DNA dialog showcasing Google's visual intelligence
- Voice-driven iteration loop (brief → generate → refine → regenerate)
- Latency masking during generation
- Clean architecture diagram
- Polished demo with clear narrative arc

**Win condition:**
- All of the above, plus:
- The demo makes judges stop scrolling
- The admin backend demonstrates production depth nobody else has
- The voice interaction feels natural, not scripted
- The interleaved output is genuinely useful (brand-aware, not generic)
- The writeup tells the story of 7 agents in 90 days

---

## 11. Market Validation — Google's Own Guidance Matches Our Architecture

Two recent Google publications validate both pillars of this system — the creative direction engine and the data-grounded agent architecture.

### "The Ultimate Nano Banana Prompting Guide" (March 5, 2026)
**Source:** Google Cloud AI & ML Blog
**URL:** https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana/

Section 5, "Prompting like a Creative Director," tells users to control four dimensions:
1. **Lighting** — three-point softbox, chiaroscuro, golden hour backlighting
2. **Camera, lens, and focus** — specific hardware (GoPro, Fujifilm), f-stops, wide-angle vs macro
3. **Color grading and film stock** — 1980s grain, cinematic teal, analog textures
4. **Materiality and texture** — fabric types, surface finishes, physical properties

**Our system automates all four.** The camera controls panel exposes aperture, focal length, film stock, lighting direction, composition, color temperature, and depth of field. Brand DNA captures photography style and composition rules from brand documents. The Brand Lens injects these into every generation automatically — users don't need to know camera terminology.

Additional alignment:
- Google's prompting formula: `[Subject] + [Action] + [Location/context] + [Composition] + [Style]` — our Brand Lens provides Composition + Style automatically
- Up to 14 reference images per prompt — we support multi-image staging (up to 14)
- Conversational editing workflow — we have a dedicated Conversation mode
- Nano Banana + Veo keyframe pipeline — we support image-to-video and keyframe video generation

### "Data Strategy = AI Strategy: Transforming Developers into AI Architects" (March 3, 2026)
**Source:** Google Cloud Blog
**URL:** https://cloud.google.com/blog/topics/developers-practitioners/data-strategy-ai-strategy-series-transforming-developers-into-ai-architects-with-google-cloud/

Core thesis: **"Your agent is only as good as your data grounding."** The database should be a "context engine," not a storage layer. Agents must be grounded in structured data with row-level security.

Three pillars they define:
1. **Speed** — real-time processing, Gemini 3 Flash for streaming data
2. **Scale** — database-level vector embeddings, batch processing
3. **Security** — RLS, zero-trust agents, per-user data boundaries

**Our system is this architecture.** Supabase (PostgreSQL) serves as the context engine — brand profiles, agent directives, photography rules, generation prompts, cost settings, and audit logs all live in structured database tables. Vince queries the database for brand context before every generation. RLS scopes all brand data to users/organizations. Edge Functions handle the AI processing layer. Cloud Run serves the frontend.

### Why This Matters for the Hackathon

Google is publicly telling developers to build exactly what we already built:
- **Creative direction through camera/photography terminology** → our camera controls panel + brand photography DNA
- **Database-grounded agents with augmented RAG** → our brand intelligence pipeline feeding Vince
- **Cloud Run + PostgreSQL + Gemini** → our exact deployment architecture

The judges will see a submission that implements Google's own published best practices — not because we read the articles first, but because we arrived at the same architecture independently over 90 days of production development
