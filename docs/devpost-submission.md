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

The system starts with nothing. No preloaded brands. Everything is built live through conversation. Tell Vince your brand name and website; he crawls it, extracts your visual identity, color profile, typography, imagery style, and tone. Upload brand guidelines, annual reports, or style guides; he reads them and integrates that knowledge. Reference images get analyzed at the art-director level — camera settings, lighting setup, composition rules, film stock. Vince synthesizes all of this into a unified Brand DNA profile, and from that point on, every generation is brand-aware without you having to ask.

**Competitive Intelligence.** Paste a competitor's YouTube ad URL mid-conversation. Vince fires a background tool call to Gemini 2.0 Flash for multimodal video analysis — extracting emotional hooks, messaging strategy, and creative weaknesses — while the Live session stays open. An orange Competitive Intel card appears in the conversation when it's done. Brief your counter-campaign in one sentence.

**Interleaved Creative Packages.** Brief a campaign by voice. Vince calls `generate_creative_package` mid-conversation. The Gemini image model — running as the execution partner to the Live API's orchestration — responds with `responseModalities: ['TEXT', 'IMAGE']`: one call, alternating copy blocks and images. Strategy, copy, and photography woven together. Not assembled from separate requests. While Vince keeps talking.

**Person-in-Scene.** Upload a headshot. Say "put me in this campaign." Vince runs a two-step chain: `generate_headshot_scene` places your face into the described scene using Gemini's image editing model, then `generate_creative_package` wraps the campaign copy around that specific image. Your actual face, in an on-brand scene, with production-ready copy. The image model never regenerates your face — it's preserved exactly through the campaign build.

**Campaigns Archive.** Every creative package Vince generates is permanently stored in the Campaigns tab — complete interleaved output (copy + images), brand alignment score, generation time, and a conversation link back to the brief that created it. One click to download a ZIP organized by deliverable: `01-linkedin-post.txt`, `01-linkedin-post.jpg`, and so on. Built for agency handoff.

**Brand Coaching.** Say "walk me through this brand." Vince acts as a creative director briefing a new team member — narrating the visual DNA, photography standards, color story, tone of voice, and active governance rules. Not reading back a style guide. Interpreting it. RAG-powered brand memory serving as institutional knowledge in conversation.

**Chrome Extension.** Vince's full voice and chat capability lives in a Chrome side panel — open it on any page, brief in context. Browse a competitor's site, open the panel, paste the YouTube URL without switching windows.

**Mobile.** iOS app brings Vince's full voice interface to the field — brief a campaign on a walk, assets sync to your library and are waiting when you get back to your desk. Android in beta.

**SynthID Provenance.** Every AI-generated image is tagged at insert time — `synthid_detected: true`, model ID, generation timestamp. The media library surfaces this in a Watermark Detection panel. Built for agency compliance, not as an afterthought.

### How I built it

**The two-model architecture** is the central technical insight. The Gemini Live API (`ai.live.connect()`) handles real-time bidirectional voice and tool calling — it's what makes Vince a conversational agent instead of a form. But image models don't support function calling. You can't have one model do both. So the architecture deliberately splits them: the Live session orchestrates; the Gemini image model — the execution partner — handles interleaved output via `responseModalities: ['TEXT', 'IMAGE']`, returning copy and images woven together in one response. The Live API fires a tool call, the backend executes it, and results render on the frontend while the voice session continues. These aren't two models competing — they're two models doing what each does best.

**Three Gemini models in one workflow.** When a user pastes a competitor ad URL, Gemini 2.0 Flash handles multimodal video analysis (extracting emotional strategy from the raw MP4). When they brief a campaign, Gemini 3.1 Flash Image Preview handles interleaved copy + image output. The Live API (`gemini-2.5-flash-native-audio`) orchestrates both — routing the brief, injecting brand context, calling the right model for the right job.

**Why the GenAI SDK directly, not ADK.** The Gemini Live API requires precise control over audio resampling (16kHz PCM), tool injection timing, and session resumption across WebSocket reconnects. ADK abstracts these in ways that would have cost us control over the user experience. Using `@google/genai` SDK directly meant writing more code, but it meant we owned the session lifecycle completely.

**Invisible RAG for brand context.** Brand guidelines are never far from any generation. When Vince generates a creative package, `recall_brand_guidelines` runs a semantic search against the brand's pgvector memory and injects the relevant rules automatically — visual identity standards, photography directives, tone constraints, compliance guardrails. The user never asks for brand rules. They're always already there. Brand rules are vectorized using `text-embedding-004`.

**Five-layer brand intelligence stack.** Raw sources (website, images, documents) → Brand DNA profile (visual, photography, composition, tone, product catalog) → Agent Directives (6 governance domains, activate/deactivate) → Synthesized Generation Prompt (9 sections, section toggles) → Quick Starters (pre-built creative recipes). Each layer builds on the last. The Art Direction dialog surfaces the photography and composition intelligence — aperture preferences, focal length, film stock — that drives every generation invisibly.

**26 tools across 8 categories.** Brand analysis (website crawl, image analysis, document import), synthesis (brand DNA, guardrail generation), generation (single images, creative packages, headshot scenes, video via Veo 3), brand setup, reference collections, camera presets, prompt library, and session management. Tool calls chain — `generate_headshot_scene` auto-feeds into `generate_creative_package` when a headshot is in context.

**Infrastructure.** Supabase (PostgreSQL, Auth, Edge Functions, Storage, Realtime) handles the data layer, brand intelligence pipeline, and file storage. Cloud Run serves the React frontend. 19 Deno Edge Functions handle all AI operations. A Chrome Extension (Manifest V3) adds Vince's voice and chat to any browser tab via a side panel.

### Challenges

**WebSocket timing with long-running tool calls.** The Gemini Live API expects tool results back quickly. Brand website analysis takes 30-60 seconds. The pattern that worked: fire-and-forget. Vince acknowledges the tool call immediately, returns a stub result so the WebSocket stays alive, and pushes the real result to the frontend via Supabase Realtime when the operation completes. The voice session never stalls waiting for a slow tool.

**Image models don't support function calling.** This wasn't a bug to work around — it was a constraint that forced a better architecture. The Live session became pure orchestration; the generation call became pure creative execution. Splitting them cleanly meant each model operates at its ceiling.

**Person-in-scene with face preservation.** Standard `TEXT+IMAGE` interleaved mode drops image generation entirely when inline image data is passed (~2s response, 0 images). The fix: `IMAGE`-only modality for `generate_headshot_scene`, with a face-preservation prompt pattern that maintains the subject's features while changing background, environment, and lighting. Then `pre_generated_image_url` passes the output URL into `generate_creative_package`, which switches to copy-only mode (`gemini-2.0-flash`, TEXT modality) and attaches the preserved image.

**Audio resampling for the Live API.** Browser microphone audio comes in at various sample rates. The Live API requires 16kHz PCM. Handling resampling in the audio worklet before bytes hit the WebSocket — not in the main thread, not on the server.

**Brand context at scale.** A full brand profile can exceed 10,000 tokens. The semantic search against pgvector memory solves this: only the relevant rules for the current generation type get injected. Visual identity rules for image generation. Tone directives for copy. Compliance guardrails always.

### Accomplishments

- **Five-layer brand intelligence pipeline** — website crawl → document import → image analysis → unified DNA → vector memory, all built through conversation
- **Three Gemini models in one workflow** — Live API for orchestration, Gemini 2.0 Flash for video analysis, Gemini 3.1 Flash Image for interleaved output
- **Interleaved creative packages** — a single `generateContent` call returns alternating copy and images, grounded in brand context retrieved automatically
- **Person-in-scene campaign chain** — face-preserving headshot editing feeding directly into campaign generation
- **Competitive intelligence** — multimodal video analysis of competitor ads mid-voice-conversation
- **Campaigns archive** — permanent record of every creative package with full copy, images, brand alignment scores, and ZIP export
- **Voice tool calling mid-conversation** — 26 tools callable during a live voice session, including async tools that don't block the WebSocket
- **Chrome Extension** that brings Vince's full capability to any browser context
- **iOS mobile app** — brief a campaign in the field, assets ready at the desk
- **SynthID provenance** on every generated image

### What I learned

Gemini's multimodal constraints are features, not limitations. The fact that image models don't support function calling forced a cleaner separation of concerns than I would have designed intentionally. The voice session became a pure orchestration layer; the generation call became a pure creative execution layer. The architecture is better because of the constraint.

Voice-first is fundamentally different from chat-first. When you design for voice from the start — greeting protocols, filler speech that masks generation latency, tool calls that narrate their own progress, interruption handling — you get a conversation. When you bolt a microphone onto a chatbot, you get a chatbot you talk at.

Brand intelligence is the actual product. Any tool can generate images from prompts. The value is in what wraps every generation — visual identity rules, photography standards, tone constraints, compliance guardrails, all retrieved automatically, all applied invisibly. The pipeline that builds that context is where the work is.

I'm not a developer. The Google AI ecosystem is what enabled me to build this — and that distinction matters. The code was the last step, not the first. I take walks and brain-dump into Gemini for 30 minutes at a time — raw thinking about architecture and problems. Those ideas go into NotebookLM alongside the Gemini API docs and code lab notebooks for synthesis — then I take that output and build a Gemini Gem: a persistent knowledge base I can keep querying and extending as the project evolves. Gemini Deep Research validated architectural decisions against the full LLM landscape before any implementation. Connecting my GitHub repo to Gemini and chatting with my own codebase — while walking — let me ask architecture questions against code that already existed. Canvas drafted content and UI narrative. Colab gave me working examples to run before integrating. Stitch turned screen concepts into real designs. AI Studio and Vertex AI Studio tested prompt patterns against actual model behavior. Jules was a thinking partner for architecture and best practices. Cloud Run hosts the whole thing.

What I learned about Gemini — the multimodal constraints, the WebSocket session lifecycle, the two-model architecture — I learned by building this, using Google's tools to research and understand it first. That's the capability shift that matters: people who understand the problem deeply can now build the solution directly, with an ecosystem that covers every phase of the work.

### What's next

- **Multi-brand workspaces** — agency teams managing multiple client brands in a single Vince session
- **Collaborative brand reviews** — multiple team members in one voice session, briefing and iterating together in real time
- **Export to ad platforms** — send approved creative packages directly to Google Ads, Meta Ads, and LinkedIn Campaign Manager
- **Video in creative packages** — Veo 3 campaign videos alongside static assets in a single package

---

## Built With

- Gemini Live API (`gemini-2.5-flash-native-audio`) — voice + tool orchestration
- Gemini 2.0 Flash — multimodal video analysis (competitive intelligence)
- Gemini 3.1 Flash Image Preview — interleaved TEXT + IMAGE generation
- Gemini `text-embedding-004` — brand memory vectorization
- Google GenAI SDK (`@google/genai`)
- Veo 3 — video generation
- Google Cloud Run
- Google Search Grounding
- TypeScript / React / Vite
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + pgvector, Auth, Edge Functions, Storage, Realtime)
- Chrome Extension (Manifest V3)
- Zustand

## Try It Out

- **Live Demo:** https://vince-359575203061.us-central1.run.app
- **Demo credentials:** demo@vince.ai / Vince2026!
- **GitHub:** (repo URL)
- **Chrome Extension:** (link to extension directory in repo)

## Video Demo Link

- YouTube: (unlisted URL)

## Image Gallery

- Screenshot: Creative Studio with generated creative package (interleaved copy + images)
- Screenshot: Competitive Intel card with competitor video analysis
- Screenshot: Campaigns tab archive with mosaic thumbnails and brand alignment scores
- Screenshot: Person-in-scene — headshot placed in professional scene with campaign copy
- Screenshot: Brand DNA dialog — synthesized visual identity
- Screenshot: Vince voice mode with audio visualizer active
- Screenshot: Chrome Extension side panel in browser context
- Architecture diagram: Two-model split + RAG + Realtime async
