# DevPost Submission — Vince

## Project Name
Vince

## Tagline
Doesn't reference your brand guidelines. Becomes them.

## Category
Creative Storytellers

---

## Project Story

### Inspiration

I love walking. And I love brain-dumping into Gemini while I do it — thirty minutes of unfiltered thinking, just talking out loud. Architecture problems. Things that should exist but don't. No filter, no keyboard. Just talking.

One day it clicked: *what if an art director could do this?*

Not write a prompt. Not open a tool and fill in fields. Just walk, talk — "hero campaign for the product launch, bold tone, targeting CMOs" — and have a creative director who already knows the brand take it from there. Assets waiting at the desk when they get back.

That was the seed. Everything else grew from it.

I'm the Director of AI Enablement at a marketing agency. Not a developer — an IT and systems person who moved into AI strategy. 700 people. 50+ AI tools. Every prompt is a different version of our brand. Nobody writing the same one. I'd watched it for years: someone builds a cheat sheet, shares a prompt template, loads the guidelines into a context window. People love it for a week. Then they go back to winging it — because a document you paste in isn't intelligence that lives inside the tool.

The voice-control idea and the brand consistency problem fed each other. You can't have a creative director who directs on the go if they don't already know the brand. So the brand intelligence system had to come first. And once that existed, the voice layer made it real. And once you had voice and brand and generation, you needed the campaigns archive. And competitive intelligence was obvious. Each piece unlocked the next.

The whole system grew out of one idea: what if talking to your creative director felt like talking to Gemini on a walk?

When the Gemini Live Agent Challenge opened, I had three weeks.

### What it does

Vince starts from nothing. No preloaded brands. No templates. Everything gets built through conversation.

You tell Vince your brand name and website. He crawls it — extracts visual identity, color profile, photography style, tone of voice. You upload guidelines, annual reports, style guides — he reads them. You drop in reference images — he analyzes them at an art director's level: camera setup, lighting, composition, film stock. He synthesizes all of it into a living brand profile. From that moment on, every generation is brand-aware. Automatically. Without asking.

Vince doesn't reference your brand guidelines. He becomes them.

Then you brief him.

**"Build a LinkedIn campaign for the product launch."** One voice command. Vince calls out to Gemini 3.1 Flash Image — a single `generateContent` call with `responseModalities: ['TEXT', 'IMAGE']` — and gets back strategy, headline copy, and a designed image in a single interleaved response. Not assembled from separate requests. Not a text response with an attached file. Woven together. While Vince keeps talking.

**"Put me in this campaign."** Upload a headshot. Your actual face gets placed into a brand-aligned scene — Google office, stage at a conference, whatever you describe — using Gemini's image editing model with face preservation. Then Vince wraps a full creative package around that specific image. Your face. On brand. In one conversation.

**"Beat this ad — here's the link."** Paste a competitor's YouTube URL. Vince hands it to Gemini 2.0 Flash for multimodal video analysis while the voice session stays open — emotional hooks, messaging strategy, creative weaknesses. An orange Competitive Intel card lands in the conversation. Three counter-campaign directions, ready to brief.

Everything Vince generates is permanently archived in the Campaigns tab — copy, images, brand alignment score, a link back to the original brief. One click to download a ZIP organized by deliverable, ready for handoff.

It runs everywhere. Chrome extension as a side panel on any browser tab. iOS app for briefing on the go. Android in beta. The brand travels with you.

Every generated image carries SynthID provenance metadata — model ID, timestamp, watermark detection. Built in from the start, not bolted on.

### How I built it

The central technical discovery: image generation models don't support function calling.

The Gemini Live API handles real-time bidirectional voice and tool calling — that's what makes Vince a conversation instead of a form. But when I tried to have that same session produce interleaved copy and images, it couldn't. Different model. Different capability surface. You can't have one do both.

When I hit that wall I had two choices: fight it or design around it. Designing around it produced something cleaner than anything I would have built by choice. The Live session became a pure orchestration layer. The generation call became pure creative execution. Each model does exactly what it's built for — and neither is in the other's way.

That split is why the whole thing works.

**Three Gemini models, one workflow.** The Live API (`gemini-2.5-flash-native-audio`) handles voice, context, and all 26 tool calls. Gemini 2.0 Flash handles multimodal video analysis when a competitor URL comes in. Gemini 3.1 Flash Image Preview handles interleaved copy and image output. Each routed to what it does best.

**Why the GenAI SDK directly, not ADK.** The Live API requires precise control: audio resampling to 16kHz PCM in the audio worklet before bytes hit the WebSocket, tool injection timing, session resumption across reconnects. ADK abstracts these in ways that would have cost us control over the voice experience. More code, but we own the session lifecycle completely.

**Invisible RAG.** Before any generation runs, a semantic search retrieves the relevant brand rules from pgvector memory and injects them automatically — visual identity standards for image briefs, tone constraints for copy, compliance guardrails always. The user never asks for brand context. It's always already there. Rules are vectorized using `text-embedding-004`.

**The async tool problem.** The Live API expects tool results fast. Brand website analysis takes 30–60 seconds. The fix: fire-and-forget. Vince acknowledges the call immediately, returns a stub so the WebSocket stays alive, and pushes the real result to the frontend via Supabase Realtime when the operation completes. The voice session never waits.

**Five-layer brand intelligence stack.** Raw sources (website, images, documents) → unified Brand DNA → governance directives (6 domains, activatable mid-conversation) → synthesized generation prompt → quick starters. Each layer builds on the last. The intelligence that drives every generation invisibly is built by the layers beneath it.

**Infrastructure.** 19 Deno edge functions on Supabase handle all AI operations. PostgreSQL with pgvector handles brand memory. Supabase Storage holds brand assets, reference images, and generated output. Cloud Run serves the React frontend. Chrome Extension via Manifest V3.

### Challenges

**The face preservation problem.** Standard `TEXT+IMAGE` interleaved mode silently drops image generation when inline image data is in the request — returns a text response in ~2 seconds, zero images. This took a while to figure out because there's no error — it just doesn't generate. The fix: `IMAGE`-only modality for the headshot scene step, with a prompt pattern that preserves the subject's features while changing the environment around them. Then the generated scene URL passes into the creative package call, which runs in copy-only mode and attaches the preserved image.

**Long-running tools over a live WebSocket.** Brand analysis takes 30–60 seconds. The Live API isn't designed to wait that long for a tool result. The fire-and-forget pattern solved this — acknowledge immediately, push the real result through Supabase Realtime when done. But getting the timing and stub response structure right so the Live session didn't drop or confuse state took real iteration.

**Audio resampling.** Browser microphone audio comes in at inconsistent sample rates. The Live API requires 16kHz PCM. Doing that resampling in the audio worklet — before bytes leave the client — was the only approach that didn't introduce audible artifacts or latency.

**Brand context at scale.** A full brand profile can exceed 10,000 tokens. Dumping the whole thing into every generation call isn't viable. The pgvector semantic search solves this: only the rules relevant to the current generation type get injected. Photography standards for image briefs. Tone constraints for copy. Compliance rules always.

### Accomplishments

- **Five-layer brand intelligence pipeline** — website crawl → document import → image analysis → unified DNA → vector memory, all built through conversation
- **Three Gemini models in one workflow** — Live API for orchestration, Gemini 2.0 Flash for video analysis, Gemini 3.1 Flash Image for interleaved output
- **Interleaved creative packages** — a single `generateContent` call returns alternating copy and images, grounded in brand context retrieved automatically
- **Person-in-scene campaign chain** — face-preserving headshot editing feeding directly into campaign generation
- **Competitive intelligence** — multimodal video analysis of competitor ads mid-voice-conversation
- **Campaigns archive** — permanent record of every creative package with full copy, images, brand alignment scores, and ZIP export
- **26 tools callable mid-conversation** — including async tools that return results via Realtime without blocking the voice session
- **Chrome Extension** — Vince's full capability in a browser side panel on any page
- **iOS mobile app** — brief a campaign in the field, assets waiting at the desk
- **SynthID provenance** on every generated image

### What I learned

The constraint was the architecture. Image models don't support function calling — that's not a limitation to route around, it's a design signal. The moment I stopped fighting it and split the models deliberately, the whole thing got cleaner. Voice session as pure orchestration. Generation call as pure creative execution. I wouldn't have designed it that way by choice. The constraint made it better.

Voice-first is different from chat-first. You can't bolt a microphone onto a text interface and call it voice. When you design for voice from the start — how Vince greets, how he narrates latency, how he handles interruption, how tool calls speak their own progress — you get a conversation. The UI is almost invisible.

Brand intelligence is the product. Any tool can generate an image from a prompt. The value is in what wraps every generation automatically — visual identity rules, photography standards, tone constraints, compliance guardrails — retrieved without asking and applied without thinking. Building that pipeline is where the actual work is.

I'm not a developer. The code was the last step, not the first. I take walks and think out loud into Gemini — raw architecture, problems, what should exist. Those ideas go into NotebookLM alongside the API docs and developer references for synthesis, then into a Gemini Gem I keep extending as the project evolves. Deep Research pressure-tested architectural decisions against the full LLM landscape. Connecting my GitHub repo to Gemini and chatting with my own codebase — while walking — compressed weeks of context-building into hours. Stitch turned UI concepts into real designs before any code existed. AI Studio and Vertex tested prompt patterns against real model behavior. Cloud Run hosts the whole thing.

The people who understand the problem deeply can now build the solution directly. That gap — between what you can see and what you can execute — is gone. That's what this is actually about.

Vince doesn't reference your brand guidelines. He becomes them. And I didn't reference my limitations as a non-developer. I became the builder the problem needed.

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

- **Live Demo:** https://vince-359575203061.us-central1.run.app/showcase
- **GitHub:** https://github.com/MERGE-AI-Garage/vince
- **Chrome Extension:** https://github.com/MERGE-AI-Garage/vince/tree/main/extension

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
