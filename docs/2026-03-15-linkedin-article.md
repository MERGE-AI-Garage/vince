# I Had This Idea for Years. I Finally Had the Tools to Build It.

*#GeminiLiveAgentChallenge #BuildWithGemini #GoogleCloud*

---

700 people. 50+ AI tools.
Every prompt is a different version of our brand.
Nobody's writing the same one.

One person grabs a hex code from memory. Another copies a paragraph from the website. Someone else writes their own version of the voice. Multiply that across the org — the outputs look close enough. But consistent? Not even close.

That's not an AI problem. That's a brand intelligence problem. And it's happening everywhere.

I'm the Director of AI Enablement at MERGE, a large advertising and marketing technology agency. My job is figuring out how AI actually fits into creative work — not in a demo, but in the real, deadline-driven world of agencies. I've watched this problem get more expensive with every new tool we hand people.

So I built Vince.

---

## Where I Come From

I came up in IT. Not as a developer — as the person who understood systems and figured out how to make things work. I think in systems, not in code. Which means I've had ideas for a long time that I couldn't execute fast enough on my own. The idea that became Vince is one of them.

In the early days of generative AI, everyone was obsessing over the perfect two-sentence prompt, trading templates like baseball cards. I threw the mic on and started talking. Not because I was being clever — because that's how creative direction actually works. You talk through what you need. You react. You refine in conversation.

That was a year before context engineering became the buzzword. A year before everyone started saying "you have to give it your story." And I was already annoyed that every time you went to prompt, you had to re-explain your brand from scratch — grab a snippet from the guidelines, tell it what website you work at, hope you remembered the right hex code.

The problem was that AI had no memory of who you are.

---

## The Walk That Started It

About a year ago, I was testing a voice agent I'd built — Mitch, a conversational AI for our internal IT systems. I'd take walks in my neighborhood and just talk to it.

During one of those walks, it clicked: *What if a creative director could do this? Walk around, think out loud, and have an AI that already knows the brand produce it?*

Not a chatbot. A creative director with your brand's DNA already internalized — the color story, the photography style, the tone of voice, the compliance rules — that could translate a casual request into something that could actually run. Without you having to explain the brand first.

When Google announced the Gemini Live Agent Challenge, I had three weeks. Nights and weekends.

---

## The Brand Travels With the Prompt

Before I started, I knew one thing: this couldn't be another platform. Creatives are already in too many tools. They don't need another tab.

The answer was a Chrome extension side panel. You click the icon and the brand slides in alongside whatever you're already doing — Gemini, Claude, Firefly, Midjourney, wherever. The brand intelligence is there when you need it, invisible when you don't.

**The brand travels with the prompt.**

---

## What Vince Does

Vince is a voice-driven AI creative director. You speak to him, he asks the right questions, and generates complete campaigns — copy and images together in a single API response — all grounded in your brand's DNA automatically.

Tell Vince your brand name and website. He crawls it, extracts your visual identity, color palette, typography, photography style, and tone. Upload brand guidelines, a 10-K, a product brief — he reads them. Reference images and logos get analyzed at the art-director level: camera settings, lighting setup, composition rules, color story. Everything synthesizes into a unified Brand DNA with a fully generated prompt that travels into every image generation call as the system instruction.

From that DNA, Vince generates six sets of agent directives — visual identity, photography and composition, tone and messaging, typography, product representation, and compliance. These aren't just notes. They're active governance rules that run against every generation, retrieved via semantic search against a pgvector store. The relevant rules for the brief in front of you. Not a 10,000-token system prompt dump — intelligent retrieval that gets more precise as the brand profile deepens.

The user never touches any of it. They just talk.

Here's what that actually looks like in practice:

**Brand onboarding:** "Hey Vince, analyze Subway's brand." He crawls the site, extracts the visual DNA, reads whatever documents you upload, synthesizes the Brand DNA, generates all six directive sets, and builds the generation prompt. One conversation. Done.

**Creative package:** "I need a LinkedIn campaign for the new product launch — something that stands out against what Coca-Cola is running right now." Paste the competitor's ad URL. Vince analyzes it — key messages, visual strategy, weaknesses, openings. Confirms the brief. Calls `generate_creative_package`. A few seconds later: headline, image, body copy, supporting visual, call to action — all in one interleaved response, all on-brand, all grounded in the directives that were already there.

**Video:** "Can you make a 6-second Instagram version of that shot?" Vince queues the Veo 3 job and keeps talking. The video shows up in History when it's ready.

**Governance:** "Generate photography guardrails for the brand." Vince builds the directive set from the DNA and stores it. It's active on the next generation. No form. No panel. Just a sentence.

---

## The Architecture (And Why the Constraint Was the Design)

The stack: Gemini Live API for real-time voice, 26 tools with real backend execution, 19 Supabase Edge Functions, PostgreSQL with RLS, Supabase Realtime for async job completion, and a Chrome extension in Manifest V3. Deployed on Google Cloud Run.

The central architectural decision: **image generation models don't support function calling.**

Gemini Live handles bidirectional audio, tool calling, and conversation management. But `gemini-2.5-flash-native-audio` and `gemini-3.1-flash-image-preview` are separate models. You can't have one do both. When I hit that constraint, I had two choices: fight it or design around it.

Designing around it produced something cleaner than what I would have built by choice. The Live session became pure orchestration — gathering brand context, managing conversation, calling tools mid-voice. The image model became pure creative execution — receiving a fully-loaded brief with brand intelligence already injected via system instruction, returning `responseModalities: ['TEXT', 'IMAGE']` — alternating copy blocks and images in a single call. That's the interleaved output that makes a creative package feel like a presentation, not a file dump.

The hardest part: keeping the voice session alive during long operations. Veo 3 video generation takes 1–3 minutes. The Gemini Live API expects tool results in seconds — a slow tool call stalls the WebSocket. The fix: fire-and-forget. Vince acknowledges the request immediately, returns a stub result, the job runs async, and a Supabase Realtime subscription pushes completion to the History panel when it's done. The conversation never stops. While generation runs, Vince keeps talking — *"Love that direction, sketching concepts now..."* — latency masking built into the voice layer.

---

## The Market Exists. The Gap Is Still Open.

Adobe GenStudio is real. Jasper is real. The holding companies — WPP, Publicis, IPG — are all spending hundreds of millions building their own closed platforms. We know. We work in this industry.

Here's what none of them do:

GenStudio lives inside the Adobe ecosystem. Jasper and Writer handle text brand voice — they have no concept of visual DNA. The agency platforms are proprietary, closed, not accessible outside their networks. And every single one of them is reactive — they check compliance *after* you generate something. They're the compliance officer reviewing your work, not the creative director sitting next to you while you prompt.

Vince guides the input. The brand intelligence is already there before you start.

The market for AI governance software is projected at $15.8 billion by 2030. The gap is accessible brand intelligence that works wherever AI works — not locked to one platform, one ecosystem, one enterprise contract.

---

## What This Moment Actually Is

I'm not a developer. Every decision in this product came from years of understanding how creative work happens at agencies — not from computer science training.

Two years ago, the gap between what I could see in my head and what I could actually execute was enormous. Three weeks of nights and weekends ago, I described the system I'd been building in my head to an AI pair programmer. We built it together.

That's not a productivity story. That's a capability story.

The people who understand the problem deeply can now build the solution directly — without the years-long translation layer between insight and execution. The ideas I've had forever are real now.

---

**Try it:** https://vince-359575203061.us-central1.run.app
**Demo login:** demo@vince.ai

If you're working on brand intelligence, voice agents, or AI for creative teams — I'd like to compare notes.

*Kurt Miller | Director of AI Enablement, MERGE*

#GeminiLiveAgentChallenge #GoogleCloud #GeminiAPI #BuildWithGemini #GenerativeAI #AIEnablement
