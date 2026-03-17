# I Had This Idea for Years. I Finally Had the Tools to Build It.

*#GeminiLiveAgentChallenge #BuildWithGemini #GoogleCloud*

---

700 people. 50+ AI tools.
Every prompt is a different version of our brand.
Nobody's writing the same one.

One person grabs a hex code from memory. Another copies a paragraph from the
website. Someone else invents the voice from scratch. Multiply that across
the org — and you don't have AI-powered creativity. You have 700 individual
interpretations of a brand, all slightly wrong, all adding up.

That's not an AI problem. That's a brand intelligence problem.

And it doesn't get better on its own. It gets more expensive with every
new tool you hand people.

So I built Vince.

---

## I'm Not a Brand Person

I want to be clear about something upfront.

I'm not a brand strategist. I don't write copy or art direct campaigns.
My background is IT — systems, infrastructure, connecting technology to
business problems.

Creative work has always been reshaped by tools. Print production. Desktop
publishing. Digital. Social. Mobile. Cloud. SaaS. Now AI. Every wave rewired
how creative teams worked. And every wave created a new version of the same
problem: the tools moved faster than the people using them could keep up.

I'm the Director of AI Enablement at MERGE — a marketing and technology
agency, Built Different, that unites people with brands to inspire health,
wellness, and happiness. My job is figuring out how AI actually fits into
creative work. Not in a demo. In the real, deadline-driven world of agencies.

And I'll tell you something: I did what everyone does.

I built a cheat sheet. A project file in Claude, formatted specifically for
AI prompting, loaded with MERGE's brand guidelines — colors, voice, typography,
photography rules. I shared it with the team. People loved it. It spread.

And then everyone still did it differently.

Because it's a document. You have to find it, open it, copy from it, paste it
in, remember to update it when the brand evolves. Some people used it
religiously. Others made their own versions. Others ignored it entirely.
The prompts still drifted. The outputs still varied. The inconsistency didn't
go away — it just had a better starting point.

I saw this across every client we worked with. Brand after brand, team
after team. The problem wasn't effort. The problem was architecture.

Brand intelligence isn't a document you share. It's context that needs to
live inside every tool, every session, invisibly — without asking.

I think in systems. And I saw a system that was broken.

---

## The Idea

Not a smarter prompt template.
Not a brand guidelines PDF you paste in.

An AI creative director who already knows your brand — the color story, the
photography style, the tone, the compliance rules — and never needs to be told
again.

You walk in with a brief. You leave with a campaign.

That was the idea. The question was: could I build it?

---

## The Walk That Started It

About a year ago, I was testing a voice agent I'd built — Mitch, a conversational
AI for our internal IT systems. I'd take walks in my neighborhood and just talk to it.

During one of those walks, it clicked: *What if a creative director could do this?
Walk around, think out loud, and have an AI that already knows the brand produce it?*

Not a chatbot. A creative director with your brand's DNA already internalized —
the color story, the photography style, the tone of voice, the compliance rules —
that could translate a casual request into something that could actually run.
Without you having to explain the brand first.

When Google announced the Gemini Live Agent Challenge, I had three weeks.
Nights and weekends.

---

## What Vince Does

Vince is a voice-driven AI creative director. He learns your brand once —
crawls your website, reads your guidelines, analyzes your photography — and
synthesizes all of it into a living brand intelligence layer. From that moment
on, every generation is brand-aware. Automatically. Without asking.

You speak a brief. He asks the right questions. Copy and images come back
together, woven in a single response, grounded in your brand's DNA.

**Vince doesn't reference brand guidelines. He becomes them.**

---

## The Engine Nobody Sees

The generation model isn't the product. The brand intelligence pipeline
feeding it is.

After onboarding, Vince synthesizes a generation layer that captures not just
colors and fonts — photography direction, lighting setup, composition rules,
tone constraints, the visual story the brand is actually telling. One source
gives you a hypothesis. Ten sources give you a fact.

When a brief comes in, a semantic search retrieves exactly the right brand
rules for that generation type. Photography standards for image briefs. Tone
directives for copy. Compliance guardrails always. It happens invisibly.

No settings panel. No copying from the style guide. The brand is already there.

---

## The Architecture: Two Models, One Conversation

Here's something that surprised me when I built this: image generation models
don't support function calling.

Gemini Live handles real-time voice — bidirectional audio, tool calling,
conversation flow. But the model that returns interleaved text and images
in a single response is a different model. You can't have one do both.

When I hit that constraint, I had two choices: fight it or design around it.

Designing around it produced something cleaner than what I would have built
by choice. The Live session became a pure orchestration layer. The generation
call became a pure creative execution layer. Each model does exactly what
it's built for.

**The constraint was the architecture.**

---

## It Goes Everywhere You Go

An idea hits while you're walking the dog. You pull out your phone. Open Vince.
"Hey Vince, let's riff on that campaign we ran last month — warmer tone,
more street-level." You talk for two minutes. You put the phone away.

You come back to your desk. The campaigns are there. Waiting. Exactly on brand.

That's iOS. That's Android. That's the Chrome extension that slides in alongside
wherever you already work — Gemini, Claude, Firefly, Midjourney. The brand
travels with the prompt. No new tab. No login. No context switch.

**The brand travels with the prompt.**

---

## The Market Exists. The Gap Is Still Open.

Adobe GenStudio is real. Jasper is real. The holding companies — WPP, Publicis,
IPG — are all spending hundreds of millions building their own closed platforms.
We know. We work in this industry.

Here's what none of them do:

GenStudio lives inside the Adobe ecosystem. Jasper and Writer handle text brand
voice — they have no concept of visual DNA. The agency platforms are proprietary,
closed, not accessible outside their networks. And every single one of them is
reactive — they check compliance *after* you generate something. They're the
compliance officer reviewing your work, not the creative director sitting next
to you while you prompt.

Vince guides the input. The brand intelligence is already there before you start.

---

## What This Moment Actually Is

I'm not a developer. I think in systems. I know what the brief-to-output cycle
feels like for real teams under real deadlines. That knowledge shaped every
decision in this product.

Three weeks of nights and weekends. After work until dinner, back at the
keyboard at 10, sometimes until 3 AM. I described the system I had in my head
to an AI pair programmer. We built it together.

That's not a productivity story. That's a capability story.

But here's the part worth naming clearly: the code generator was the last step,
not the first.

---

### The workflow before the code

I take a lot of walks. I'll open Gemini on my phone, hit the microphone, and
just talk — thirty minutes of unfiltered thinking about what I'm trying to
build, what the problems are, what the architecture might look like. Stream
of consciousness. No filter. Gemini becomes a sounding board that goes with me.

Those brain dumps don't stay in my head or scatter across a dozen apps. They
go into **NotebookLM** — I pull in the raw Gemini API documentation, the code
lab notebooks, the developer reference pages, and let it synthesize. Then I
take that output and build a **Gemini Gem** from it: a focused, persistent
knowledge base I can return to, query, and keep extending as the project evolves.

**Gemini Deep Research** was where I pressure-tested ideas against the full
landscape — not just Google's docs, but cross-stack comparison across GPT, Grok,
the whole ecosystem — so I understood Gemini's specific constraints and advantages
in context, not in isolation.

**Gemini Canvas** helped draft and extend content iteratively. **Google Colab**
gave me working examples I could run and modify before integrating anything into
the actual codebase. **Stitch** translated UI concepts into actual screen designs.
**AI Studio** and Vertex AI Studio were where prompt patterns got tested against
real model behavior, not assumptions.

One capability I kept coming back to: connecting my GitHub repo to Gemini and
chatting with my own codebase. Walking, talking out loud, asking questions about
what I'd already built — and having an AI that already knew the code answer back.
That feedback loop compressed weeks of context-building into hours.

**Jules** was part of that thinking layer too — bouncing architecture decisions,
pressure-testing approaches before committing to a direction.

Only after all of that did the implementation start. **Claude** as the primary
engineering partner — the one I described the full, already-researched
architecture to, worked through WebSocket edge cases with, and wrote the
production code alongside.

---

The team breakdown:

- **Gemini (voice, walks)** — thinking partner, raw ideation
- **Gemini + GitHub** — codebase-aware conversation, walking and talking to my own repo
- **NotebookLM** — synthesis, reasoning across docs and raw ideas
- **Gemini Gems** — persistent knowledge bases; the running research layer
- **Deep Research** — validation, cross-stack comparison, constraint mapping
- **Canvas** — content drafting and extension
- **Colab + Developer Docs** — working examples, API surface understanding
- **Stitch** — UI design before code
- **AI Studio / Vertex AI Studio** — prompt pattern testing against real models
- **Jules** — architecture thinking, best practices, sounding board
- **Claude** — engineering partnership

Each specialized. None interchangeable. And critically — most of the work
happened before anyone wrote code.

Two years ago, the gap between what I could see in my head and what I could
execute was enormous. That gap is closed now — not because any single tool is
magic, but because the right combination of them covers every phase of the work:
thinking, researching, designing, testing, building.

The people who understand the problem deeply can now build the solution directly.
The translation layer between insight and execution is gone.

---

Those 700 people and their 50 different versions of the brand — that's the
problem Vince exists to solve. Not by restricting what AI they use, but by
making sure the brand DNA travels with them wherever they go.

The gap between what I could see and what I could build is gone. So is the gap
between your brand standards and what your team actually generates.

The ideas I've had forever are real now.

---

**Try it:** https://vince-359575203061.us-central1.run.app/showcase

If you're working on brand intelligence, voice agents, or AI for creative teams — I'd like to compare notes.

*Kurt Miller | Director of AI Enablement, MERGE*

#GeminiLiveAgentChallenge #GoogleCloud #GeminiAPI #BuildWithGemini #GenerativeAI #AIEnablement
