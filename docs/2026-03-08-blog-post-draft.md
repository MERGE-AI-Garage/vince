# Breaking the Text Box: How I Built a Voice-Driven AI Creative Director for the Gemini Live Agent Challenge

*#GeminiLiveAgentChallenge — Built with Gemini Live API, Gemini interleaved output, Veo 3, and deployed on Google Cloud Run*

---

I'm not a software engineer.

I'm the Director of AI Enablement at a large advertising and marketing technology agency, which means my job is to figure out how AI actually fits into creative work — not in a demo, not in a press release, but in the real, messy, deadline-driven world of advertising. I've been computing since 1978, when my family had an Apple II. I helped run a printing and publishing business through the desktop publishing revolution. I built thousands of web pages by hand in the late 90s. But I've never worked at a software company. I think in systems, not in code.

So when I built Brand Lens for the Gemini Live Agent Challenge, I wasn't trying to demonstrate technical sophistication. I was trying to solve a problem I watch people struggle with every day.

---

## The Walk That Started It

About a year ago, I was testing an early voice agent I'd built — Mitch, an AI tutor for our internal learning platform. I'd take walks in my neighborhood and just talk to it. At some point during one of those walks, I had a thought:

*What if a creative director could do this? Just walk around, talk through what they need, and have an AI that already knows the brand produce it?*

Not a chatbot. Not a prompt box. An actual creative director that understands your brand's visual DNA — the fonts, the color story, the photography style, the tone of voice, the compliance guardrails — and can translate a casual request into something that could actually run.

The problem wasn't "can AI generate images." That was solved. The problem was: **AI has no idea what your brand is.**

You can prompt Midjourney for a thousand years and never get a consistently on-brand image, because the model has no idea what "on-brand" means for your client. Creative teams at agencies spend enormous energy writing and re-writing prompts, adding modifiers, uploading reference images, and still producing outputs that need heavy revision. The constraint wasn't the model. It was the absence of brand intelligence.

That insight sat in my head for months while I built out an internal AI platform for our agency — AI Garage, a 786-commit, 25-day sprint in February that shipped agents, a learning platform, a compliance center, and a creative studio. The creative studio had a brand intelligence pipeline. Vince, our AI creative director agent, could analyze websites and documents and build a working brand DNA. But it lived inside an enterprise platform with a lot of other things happening around it.

When Google announced the Gemini Live Agent Challenge, I had nine days.

---

## The Extraction

The honest version of how Brand Lens came to be: I didn't build it from scratch. I extracted it.

The brand intelligence pipeline, the creative package generation, the voice interface, the director mode — months of thinking and building had already happened. The hackathon became the forcing function to isolate the core insight and build specifically for the demo scenario: a voice-driven AI creative director, starting from zero, producing campaign-quality creative in a single conversation.

What made the extraction feel right was that the hackathon centerpiece — Gemini's interleaved output — was something I hadn't fully exploited yet. `responseModalities: ['TEXT', 'IMAGE']` returns alternating text blocks and generated images in a single API call. Instead of generating copy, then generating an image, then assembling them, you get a creative director presenting a deck: headline, image, body copy, supporting visual, call to action. All in one shot.

That's the kind of thing that makes people put down their phones.

---

## What Brand Lens Does

Here's the flow that the demo shows:

**1. Voice-activated brand onboarding.** The session starts with Vince asking about your brand. You describe it — or you hand it a website URL, a PDF of brand guidelines, a 10-K filing. Vince crawls the website, extracts the visual DNA (color palette, typography, photography style, tone of voice), and reads the documents. It synthesizes everything into a Brand DNA: a structured intelligence layer with confidence scoring based on how many sources contributed.

**2. Voice-driven creative generation.** You describe what you need — "I need a LinkedIn campaign for our new product launch, something that stands out against Coca-Cola's current summer push." Vince asks what you know about the Coca-Cola campaign. You paste the URL of their latest ad. Vince analyzes it: key messages, visual style, target audience, weaknesses, strategic openings. Then it asks what you want to do. You confirm. Vince builds the counter-brief and generates a complete creative package.

**3. Interleaved creative packages.** The package comes back as a narrative — copy block, image, copy block, image — each deliverable formatted for its format (LinkedIn 4:3, product shot 1:1, social story 9:16). It's not a list of files. It's a presentation. Vince structured the story.

**4. Voice video generation.** "Can you make a 6-second version of that product shot for Instagram?" Vince queues the Veo 3 job and tells you it'll be in your History in a couple minutes. The voice session stays alive. You keep talking. The video appears when it's ready.

All of this happens in natural conversation. No prompt engineering required.

---

## The Architecture (And Why It's Two Models)

Here's the part that surprised me when I first dug into the Gemini Live API: **the Live API does not support function calling with image generation models**.

Gemini Live handles voice — the real-time bidirectional audio, the transcription, the interruption handling. But when you call `responseModalities: ['TEXT', 'IMAGE']`, you're using `gemini-3.1-flash-image-preview`, which doesn't support function calling at all.

So the architecture is necessarily split:

```
Gemini Live (voice session)
  ├── Tool calls: brand analysis, playbook generation, competitive intelligence
  ├── generate_creative_package tool → routes to edge function
  └── generate_video tool → fire-and-forget to Veo 3

Gemini 3.1 Flash Image Preview (interleaved generation)
  └── Single API call with responseModalities: ['TEXT', 'IMAGE']
      └── Returns: alternating text blocks + base64 images
```

The Live session gathers brand context, frames the brief, and calls the edge function. The edge function injects all the brand intelligence — visual identity, photography style, agent directives, compliance guardrails — as a system instruction to the image model. The image model generates the package. The results come back to the Live session as tool output.

Brand intelligence is the bridge between the two models.

---

## The Fire-and-Forget Breakthrough

Video generation was the hardest problem to solve — not because Veo 3 is hard to call, but because it takes 1–3 minutes.

My first attempt: `await` the Veo 3 generation call inside the edge function. Result: the Deno function times out at 60 seconds. The Gemini Live voice session also dies waiting for tool output. Two failures for the price of one.

The solution was architecturally obvious once I stopped trying to fight the latency: don't await it.

```typescript
// Fire the Veo job — do NOT await
fetch(videoWorkerUrl, {
  method: 'POST',
  body: JSON.stringify(videoParams),
  headers: { Authorization: `Bearer ${serviceKey}` }
})
// No .then(), no await — intentional

// Return immediately
return { queued: true, message: "Video is rendering. Check History in 1-2 minutes." }
```

The pg_net trigger fires the worker. The worker runs in the background. When Veo 3 finishes, it inserts a row into `creative_studio_generations`. The frontend has a real-time Supabase subscription on that table — the History panel updates automatically when the video appears.

The voice session returns in under a second. Vince tells you the video is rendering and asks what else you need. The conversation continues. The video shows up when it's ready.

This is actually the better UX anyway. No reasonable person sits staring at a progress bar for 90 seconds. You keep working.

---

## The Brand DNA Pipeline

The thing that makes all of this possible is what I call the brand intelligence pipeline:

1. **Website analysis**: Gemini crawls the brand URL, extracts color palette, typography, visual identity, tone of voice, and brand story. URL hallucination was a real problem early on — the model would invent URLs that don't exist. Fixed with explicit output constraints and URL validation before crawling.

2. **Document import**: PDFs, DOCX, PPTX — brand guidelines, 10-Ks, product sheets. Gemini extracts structured brand data: rules, positioning, product catalog, compliance requirements.

3. **Reference image analysis**: Art-director-level metadata per image. Not just "this is a photo of a burger." Camera settings (f/2.8, 85mm, 5500K), lighting setup, composition rules, color story, mood/positioning. Category-specific: food brands need different extraction schema than healthcare brands.

4. **Profile synthesis**: Everything merges into a unified Brand DNA with confidence scoring. One source gives you a hypothesis. Ten sources give you a fact.

5. **Playbook generation**: From the DNA, Vince generates six focused governance directive sets (visual identity, photography and composition, tone and messaging, typography, product representation, compliance), a brand-calibrated generation prompt, and quick-start prompts pre-populated with the brand's actual products.

When a generation request comes in, the brand's visual DNA, agent directives, and generation prompt all inject into the system instruction. The image model doesn't need to guess what "on-brand" means. It knows.

---

## What I Actually Learned

**Brand intelligence is the moat.** Anybody can call the Gemini image API. The constraint isn't generation quality — it's knowing what to generate. The brand DNA pipeline is what makes outputs usable without revision.

**Latency is a design constraint, not a bug.** Interleaved generation takes 12–56 seconds depending on package size. I used to think that was a problem. Now I think it's an opportunity: it's the AI presenting creative work, not just returning a file. The latency is the thinking time. You don't apologize for a designer who takes 10 minutes to comp a concept.

**Fire-and-forget is a first-class pattern.** Any operation that takes longer than a voice session's tool call timeout (roughly 30 seconds) should not be awaited. Background jobs with real-time completion notifications are the right model for AI workloads with variable latency.

**The two-model architecture isn't a limitation — it's a feature.** Having a fast, function-calling model manage conversation and orchestration, and a separate model handle creative generation, means each model operates in its area of strength. The Live session stays responsive. The creative session gets the full system instruction context it needs.

**Non-engineers can build real AI systems.** I want to be direct about this: I think in systems, not in code. I've built everything in this project with an AI pair programmer. The architecture decisions, the product vision, the UX choices, the brand intelligence design — those came from experience thinking about how creative work actually happens in agencies, not from computer science training. The tools exist now for people who think in systems to build things that work.

---

## The Demo

The demo shows a four-minute session starting with an empty brand — no seed data, no pre-loaded brand DNA. By the end: a Brand DNA built from a live website crawl and document import, a competitive analysis of a real competitor ad, and a complete three-deliverable creative package with copy and images, all generated from voice.

I'm genuinely not sure if it'll win. The competition is 6,799 teams. Some of them are probably engineers who've been building for Gemini since day one.

But I built something I actually use. Something that solves a real problem I watch people struggle with every day at work. Something that wouldn't have been possible without Gemini's interleaved output — a capability that lets AI present creative work the way a creative director does, not the way a file server does.

That feels like the right thing to submit.

---

## Tech Stack

- **Gemini Live API** — real-time voice conversation, function calling, brand onboarding
- **Gemini 3.1 Flash Image Preview** — interleaved TEXT + IMAGE output (`responseModalities`)
- **Gemini 2.0 Flash** — competitor video analysis, brand intelligence synthesis
- **Veo 3** — video generation (fire-and-forget architecture)
- **Google Search Grounding** — brand context enrichment during website analysis
- **Google Cloud Run** — frontend hosting (Vite + React + TypeScript)
- **Supabase Edge Functions** — 19 serverless functions, `_shared/` module pattern
- **Supabase Postgres** — brand intelligence storage, real-time subscriptions for History panel

---

*Built for the [Gemini Live Agent Challenge](https://geminiliveagentchallenge.devpost.com). #GeminiLiveAgentChallenge*

*If you're building in this space, I'd genuinely like to compare notes — find me on LinkedIn.*
