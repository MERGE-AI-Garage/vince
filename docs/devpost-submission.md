# DevPost Submission — Vince

## Project Name
Vince

## Elevator Pitch (200 chars max)
Meet Vince, your AI creative director. He lives and breathes your brand. Brief him by voice, get complete creative packages — copy and images woven together.

## Category
Creative Storyteller

---

## Project Story

### Inspiration

I work with brands and creative teams every day. The gap between generic AI image tools and what agencies actually need is enormous — brand consistency, photography-grade controls, compliance guardrails, and creative direction that understands the difference between a brand's visual DNA and a stock photo prompt.

When I saw the Gemini Live Agent Challenge, the Creative Storyteller category described exactly the product I wanted to build: a "marketing asset generator" that blends text, images, and audio into one seamless experience. I'd been thinking about brand-intelligent AI for months. The hackathon was the push to make it real.

The core idea: what if you could talk to a creative director who already knows your brand — who's studied your website, absorbed your brand guidelines, read your annual report — and brief a campaign through conversation instead of filling out forms? And what if, instead of getting images and copy separately, you got them woven together in one response, like a creative director presenting a deck?

That's Vince.

### What it does

Vince is a voice-driven AI creative director that takes campaign briefs by natural conversation and generates complete creative packages — headlines, body copy, and images woven together in a single response — all grounded in brand intelligence the system built itself.

Vince doesn't just generate images from prompts. He:
- **Creates brands by voice** and crawls their websites to extract visual DNA
- **Processes uploaded documents** — brand guidelines, annual reports, style guides — to build a complete brand profile
- **Synthesizes all intelligence sources** into unified brand DNA: visual identity, photography style, color profile, typography, tone of voice, corporate narrative
- **Generates complete creative packages** via Gemini's interleaved output — copy and images together in one API call
- **Operates with photography-grade camera controls** — aperture, focal length, film stock, lighting direction, composition, color temperature, depth of field
- **Enforces brand compliance** through agent directives and guardrails
- **Works from a Chrome extension** side panel alongside any website

The system starts empty. No brands, no data. Everything is built live through conversation with Vince.

### How I built it

The build was nights and weekends across February and into March. The stack:

**Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui, deployed on Cloud Run.

**Backend:** Supabase (PostgreSQL, Edge Functions, Auth, Storage) + Cloud Run backend service for interleaved generation.

**AI:** Three Gemini models working together:
- **Gemini 2.5 Flash Native Audio** — the Live API powers real-time voice interaction with tool calling. Vince listens, understands, and calls tools mid-conversation.
- **Gemini 3.1 Flash Image Preview** — interleaved output via `responseModalities: ['TEXT', 'IMAGE']`. One API call returns text and images woven together.
- **Gemini 3 Flash** — text chat mode and the brand intelligence extraction pipeline (website analysis, document processing, profile synthesis).

**The two-model architecture** is the key technical insight. The Live API handles voice and tool calling, but image models don't support function calling. So when Vince decides to generate a creative package, the Live session fires a tool call, the backend makes a separate `generateContent` call with interleaved output, and the results render on the frontend while Vince keeps talking.

**The brand intelligence pipeline:**
1. Website crawl — Gemini analyzes a brand's website and extracts visual DNA (colors, typography, imagery style, tone)
2. Document import — PDFs, annual reports, and style guides are processed into structured brand data
3. Profile synthesis — all intelligence sources are aggregated into a unified brand profile
4. Guardrail generation — compliance rules and agent directives are auto-generated from the brand profile
5. Generation prompt synthesis — a "Brand Lens" prompt is created that injects brand context into every generation

**The admin panel** has 11 tabs: brands, brand DNA, camera presets, model registry, generation history, analytics dashboards, user quotas, audit trail, prompt history, extension settings, and global configuration. This isn't scaffolding — every tab is functional with real CRUD operations, charts, and data.

**The Chrome extension** (Manifest V3) adds a side panel with Vince's voice and chat capabilities alongside any website. Browse a client's site, open the panel, tell Vince to create a brand and analyze what he sees.

### Challenges

**Image models don't support function calling.** This was the biggest architectural constraint. I couldn't have Vince generate images mid-conversation using the same model that handles voice. The solution: a two-model architecture where the Live API (voice + tools) orchestrates the image model (interleaved output) through tool calls. All brand context has to be gathered and injected before the generation call — it's a terminal operation, not a conversational one.

**Latency masking.** Interleaved generation takes 4-6 seconds. That's dead air in a voice conversation. Vince speaks filler while generation runs asynchronously — "Love that direction. Sketching concepts now..." — maintaining conversational flow while the backend works. The frontend renders results as soon as they arrive.

**Brand context at scale.** A full brand profile — visual DNA, photography style, color profile, composition rules, brand standards, agent directives, prompt templates — can exceed 10,000 tokens. Injecting all of it into every generation call is wasteful and can dilute the prompt. I had to be surgical about what context matters for each type of generation.

**Camera controls that actually work.** Google's own Nano Banana prompting guide says to "prompt like a creative director" — control lighting, lens, film stock, materiality. Building a UI that translates photography terminology into effective Gemini prompts required mapping every aperture, focal length, and film stock to the language the model actually responds to.

### What I learned

- **Interleaved output changes creative workflows.** Sequential text-then-image generation feels disconnected — like getting a brief and mood board separately. Interleaved output feels like a creative director presenting a deck. Copy and images together, in context, telling a story.

- **Voice-first is fundamentally different from chat-first.** When you bolt a microphone onto a chatbot, you get a chatbot you talk at. When you design for voice from the start — greeting protocols, filler speech, interruption handling, tool calls that narrate their own progress — you get a conversation.

- **Brand intelligence is the moat.** Any tool can generate images from prompts. The value is in the brand context that wraps every generation — making sure the output looks like *your* brand, not generic AI art. The pipeline that builds that context (crawl, extract, synthesize, guard) is where the real work happens.

- **Google's own guidance validates this architecture.** The Nano Banana prompting guide describes our camera controls. The "Data Strategy = AI Strategy" blog describes our database-grounded agent architecture. We arrived at the same conclusions independently.

### What's next

- **Multi-agent orchestration** — Vince delegates to specialized agents for copywriting, art direction, and compliance review
- **Video generation** integrated into creative packages — campaign videos alongside static assets
- **Real-time collaborative sessions** — multiple team members in one voice session with Vince, briefing and iterating together
- **Expanded brand intelligence** — social media analysis, competitor visual benchmarking, trend detection

---

## Built With

- Gemini 2.5 Flash (Live API)
- Gemini 3.1 Flash (Image Generation)
- Gemini 3 Flash
- Google GenAI SDK
- Google Cloud Run
- TypeScript
- React
- Vite
- Tailwind CSS
- Supabase
- PostgreSQL
- Chrome Extension (Manifest V3)
- Zustand
- Three.js

## Try It Out Links

- GitHub: (repo URL)
- Live Demo: (Cloud Run URL)
- Chrome Extension: (link to extension directory in repo)

## Video Demo Link

- YouTube: (unlisted URL — record on Day 10)

## Image Gallery

- Screenshot of Creative Studio with generated creative package
- Screenshot of Brand DNA dialog
- Screenshot of Vince voice mode with visualizer
- Architecture diagram
- (Replace with actual screenshots once app is running)
