# How Vince Came to Be

## The Idea

The seed was planted while testing an early voice agent on neighborhood walks. Talking to an AI assistant hands-free, it became obvious: a creative director should be able to work this way. Walk around, describe what they need, and have an agent that already knows the brand produce it — no prompt engineering, no reference uploads, no guesswork.

The problem wasn't AI's ability to generate images. That was solved. The problem was that AI had no idea what your brand is. Creative teams spend enormous energy writing and rewriting prompts, adding modifiers, correcting outputs that are technically good but brand-wrong. The constraint wasn't the model. It was the absence of brand intelligence.

## The Evolution

**Vertex image generation** — The first experiment was a Google Workspace add-on that surfaced Vertex AI image generation directly inside Google Docs and Slides, before Google natively supported this. First proof that Google's generative AI could connect meaningfully to a creative workflow.

**Conversational voice agent** — A Vertex CX conversational agent with a voice interface, tested by walking around the neighborhood talking into a phone. This proved real-time voice agent interaction was viable on Google's stack — and planted the creative director idea.

**The brand engine concept** — As the image generation workflow developed, the core problem came into focus: you can't think about prompts from scratch every time. A brand engine that ingests brand DNA and handles prompt grounding automatically would let any team member generate on-brand content without prompt engineering expertise.

**The Chrome extension angle** — The creative director shouldn't be confined to a dedicated app. A Chrome extension side panel means Vince can work alongside the user on any website — browsing a client's site, watching a competitor's ad, reading a brief — while remaining connected to the brand intelligence system.

## Why the Timing Was Right

Years of experimentation with Google's generative AI stack — Vertex AI, Gemini, Workspace add-ons, conversational agents — meant the architectural decisions were already well-considered. When the Gemini Live Agent Challenge launched, the pieces were ready to assemble.

Modern Gemini made the target experience achievable in a way that wasn't possible when the idea first formed:

- **Gemini Live API** — real-time bidirectional voice with function calling in the same session
- **Gemini 3.1 Flash Image Preview** — interleaved `TEXT + IMAGE` output in a single API call
- **Veo 3** — production-quality video generation
- **Google Search grounding** — real-time brand context enrichment

The hackathon-specific features — interleaved creative packages, competitor video analysis, voice-driven brand onboarding, and the brand playbook generation chain — were built during the contest period (February 16 – March 16, 2026).

## Why This Problem

The gap between generic AI image tools and what creative teams actually need is enormous. Brand consistency, photography-grade controls, compliance guardrails, creative direction that understands the difference between a brand's visual DNA and a stock photo prompt — these aren't solved by a better prompt. They're solved by a system that knows the brand.

Vince was built to close that gap.
