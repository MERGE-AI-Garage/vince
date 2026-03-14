# DevPost Submission — Vince

## Project Name
Vince

## Tagline
Your AI creative director who already knows your brand — brief by voice, get campaigns back in seconds.

## Category
Creative Storytellers

---

## Project Story

### Inspiration

Brand teams lose weeks to briefing cycles. A creative director has to absorb brand guidelines before they can produce anything useful — and with agencies, that knowledge transfer is slow, leaky, and has to happen again every time someone new touches the project. AI image tools made generation fast, but they didn't fix this: you still have to explain your brand every time, still have to correct outputs that are technically impressive but brand-wrong.

When I saw the Gemini Live Agent Challenge, the Creative Storyteller category described exactly what I'd been building toward: a creative intelligence that lives inside your brand, not outside it. Vince is what happens when you stop bolting AI onto creative workflows and start designing the workflow around the AI.

### What it does

Vince is a voice-driven AI creative director for brand teams. You speak to him in real time, he listens, asks the right questions, and generates complete campaigns — headlines, body copy, and images woven together in a single response — all automatically grounded in your brand's DNA.

The system starts with nothing. No preloaded brands. Everything is built live through conversation. Tell Vince your brand name and website; he crawls it, extracts your visual identity, color profile, typography, imagery style, and tone. Upload brand guidelines, annual reports, or style guides; he reads them and integrates that knowledge. Vince synthesizes all of this into a unified brand profile — and from that point on, every generation is brand-aware without you having to ask.

The "beyond text box" moment: when you brief a campaign by voice, Vince calls tools mid-conversation to build brand-precise generation prompts. The Live API fires a `generate_creative_package` tool call; the backend makes a separate `generateContent` call with `responseModalities: ['TEXT', 'IMAGE']`; and the response comes back as alternating copy blocks and images — a complete creative package in one shot, while Vince keeps talking. You hear him say "Love that direction, sketching concepts now" and a few seconds later you're looking at a campaign.

### How I built it

**The two-model architecture** is the central technical insight. The Gemini Live API (`ai.live.connect()`) handles real-time bidirectional voice and tool calling — it's what makes Vince a conversational agent instead of a form. But image models don't support function calling. You can't have one model do both. So the architecture deliberately splits them: the Live session orchestrates; a separate `generateContent` call with `responseModalities: ['TEXT', 'IMAGE']` handles interleaved output. The Live API fires a tool call, the backend executes it, and results render on the frontend while the voice session continues. These aren't two models competing — they're two models doing what each does best.

**Why the GenAI SDK directly, not ADK.** The Gemini Live API requires precise control over audio resampling (16kHz PCM), tool injection timing, and session resumption across WebSocket reconnects. ADK abstracts these in ways that would have cost us control over the user experience. Using the SDK directly meant writing more code, but it meant we owned the session lifecycle completely.

**Invisible RAG for brand context.** Brand guidelines are never far from any generation. When Vince generates a creative package, `recall_brand_guidelines` runs a semantic search against the brand's vector memory and injects the relevant rules into the generation prompt automatically — visual identity standards, photography directives, tone constraints, compliance guardrails. The user never asks for brand rules. They're always already there.

**26 tools across 8 categories.** The full tool surface covers: brand analysis (website crawl, image analysis, document import), synthesis (brand DNA, guardrail generation, playbook orchestration), generation (single images, creative packages, video via Veo 3), brand setup (create brand, header/card generation), reference collections, camera presets, prompt library, and session management. Tool calls chain — `create_brand` auto-triggers website analysis; `generate_brand_playbook` orchestrates synthesis, all six guardrail domains, prompt generation, and UI card creation as a single operation.

**Infrastructure.** Supabase (PostgreSQL, Auth, Edge Functions, Storage, Realtime) handles the data layer, brand intelligence pipeline, and file storage. Cloud Run serves both the React frontend and the backend generation service. A Chrome Extension (Manifest V3) adds Vince's voice and chat to any browser tab via a side panel — browse a client's site, open the panel, brief a campaign in context.

### Challenges

**WebSocket timing with long-running tool calls.** The Gemini Live API expects tool results back quickly. Brand website analysis takes 30-60 seconds. The pattern that worked: fire-and-forget for async operations. Vince acknowledges the tool call immediately, returns a stub result so the WebSocket stays alive, and pushes the real result to the frontend via Supabase Realtime when the operation completes. The voice session never stalls waiting for a slow tool.

**Image models don't support function calling.** This wasn't a bug to work around — it was a constraint that forced a better architecture. Trying to do everything in one model would have meant compromising the voice experience or the generation quality. Splitting them cleanly meant each model operates at its ceiling.

**Audio resampling for the Live API.** Browser microphone audio comes in at various sample rates. The Live API requires 16kHz PCM. Getting this right without latency meant handling resampling in the audio worklet before bytes hit the WebSocket — not in the main thread, not on the server.

**Brand context at scale.** A full brand profile can exceed 10,000 tokens. Injecting all of it into every generation call is wasteful and dilutes the prompt. The semantic search against vector memory solves this: only the relevant rules for the current generation type get injected. Visual identity rules for image generation. Tone directives for copy. Compliance guardrails always.

### Accomplishments

- **Complete brand intelligence pipeline** — website crawl → document import → image analysis → unified DNA → vector memory, all built through conversation
- **Interleaved creative packages** — a single `generateContent` call returns alternating copy and images, grounded in brand context retrieved automatically
- **Voice tool calling mid-conversation** — 26 tools callable during a live voice session, including async tools that don't block the WebSocket
- **Fully conversational brand governance** — compliance guardrails generated, stored, and applied without the user interacting with any settings panel
- **Chrome Extension** that brings Vince's full capability to any browser context

### What I learned

Gemini's multimodal constraints are features, not limitations. The fact that image models don't support function calling forced a cleaner separation of concerns than I would have designed intentionally. The voice session became a pure orchestration layer; the generation call became a pure creative execution layer. The architecture is better because of the constraint.

Voice-first is fundamentally different from chat-first. When you design for voice from the start — greeting protocols, filler speech that masks generation latency, tool calls that narrate their own progress, interruption handling — you get a conversation. When you bolt a microphone onto a chatbot, you get a chatbot you talk at.

Brand intelligence is the actual product. Any tool can generate images from prompts. The value is in what wraps every generation — visual identity rules, photography standards, tone constraints, compliance guardrails, all retrieved automatically, all applied invisibly. The pipeline that builds that context is where the work is.

### What's next

- **Multi-brand workspaces** — agency teams managing multiple client brands in a single Vince session
- **Collaborative brand reviews** — multiple team members in one voice session, briefing and iterating together in real time
- **Export to ad platforms** — send approved creative packages directly to Meta Ads, Google Ads, and LinkedIn Campaign Manager
- **Video in creative packages** — Veo 3 campaign videos alongside static assets in a single package

---

## Built With

- Gemini Live API (Gemini 2.5 Flash Native Audio)
- Gemini 3.1 Flash Image Preview
- Gemini 3 Flash
- Google GenAI SDK
- Veo 3
- Google Cloud Run
- Google Search Grounding
- TypeScript
- React
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase (PostgreSQL, Auth, Edge Functions, Storage, Realtime)
- Chrome Extension (Manifest V3)
- Zustand

## Try It Out

- **Live Demo:** https://vince-359575203061.us-central1.run.app
- **Demo credentials:** demo@vince.ai / BrandLens2026!
- **GitHub:** (repo URL)
- **Chrome Extension:** (link to extension directory in repo)

## Video Demo Link

- YouTube: (unlisted URL — record on Day 10)

## Image Gallery

- Screenshot of Creative Studio with generated creative package (interleaved copy + images)
- Screenshot of Brand DNA dialog showing synthesized visual identity
- Screenshot of Vince voice mode with audio visualizer
- Two-model architecture diagram
- Chrome Extension side panel in context
