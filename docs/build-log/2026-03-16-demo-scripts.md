# Vince Demo Scripts — March 16, 2026

**Deadline:** 7 PM CST
**Max video length:** 4 minutes
**Recording tool:** QuickTime screen + mic, or Loom
**Architecture diagram:** `docs/2026-03-15-architecture-diagram.md` — open in a tab before recording

---

## Pre-Recording Checklist

Before hitting record on ANY take:

- [ ] `headshot.jpg` on Desktop (neutral background, clear face — NOT named after a brand)
- [ ] Chrome extension loaded and working
- [ ] demo account logged in at the app URL
- [ ] Google brand selected and loaded in Vince
- [ ] Fresh conversation open (no previous context)
- [ ] Architecture diagram open in a separate tab
- [ ] Notifications silenced
- [ ] Timer running — must land under 4:00

---

## SCRIPT A — Person-in-Scene (RECOMMENDED)

**Why this one:** Most visual. Most surprising. The face preservation moment is undeniable. Ends on video. Hardest to fake.

---

### 0:00–0:20 — Hook (voiceover, hold on app logo or dark screen)

> "I'm the Director of AI Enablement at a marketing agency. 700 people. 50 AI tools. Every single person prompting our brand slightly differently. I've watched that problem for years. This is what I built to fix it."

---

### 0:20–0:40 — Show the surfaces (quick cuts, no narration needed)

Show in this order:
1. Chrome extension open as side panel on any webpage
2. iOS app — brand picker, tap into chat
3. Web studio — Campaigns tab visible

Let it land visually. Don't narrate.

---

### 0:40–1:15 — Upload the headshot

Open Chrome extension or iOS. Drag/upload `headshot.jpg`.

Say:
> "Hey Vince. I want to create a campaign featuring this person as a Google AI champion."

Vince confirms the upload. Show his response on screen.

---

### 1:15–2:15 — LinkedIn creative package (THE MONEY SHOT)

Say:
> "Generate a LinkedIn post celebrating them as a Google AI power user."

While it generates, narrate:
> "What's happening right now: Vince is placing that face into a Google-aligned scene — using Gemini's image editing model with face preservation. Then a second call wraps designed copy around that specific image. Google brand colors, headline, logo — all generated together. The brand was already loaded. I didn't brief it. It was just there."

When the result appears:
> "That's a designed asset. Not a photo with a caption. Text rendered on the image, brand treatment applied, face intact. One conversation. No tools switched. No separate requests."

---

### 2:15–2:45 — Video

Say:
> "Now make a video of them presenting on stage at Google Next — blazer, dramatic stage lighting, large audience."

While the video queues:
> "That goes straight to Veo 3. The headshot is a native reference image — subject consistency is built into Veo's API. This isn't a workaround. That's how it's supposed to work."

Video appears in History panel. Show it.

---

### 2:45–3:30 — Architecture (switch to diagram tab)

> "Three Gemini models. The Live API handles voice and all 26 tool calls — that's what makes this a conversation instead of a form. Gemini 3.1 Flash Image handles interleaved copy and images — one API call, alternating text and image blocks. Veo handles video with the subject reference."

Pause. Then:

> "Here's the thing I didn't expect: image generation models don't support function calling. I hit that wall and had two choices — fight it or design around it. Designing around it gave me something cleaner than what I would have built on purpose. Voice session handles orchestration. Generation call handles output. Each model doing exactly what it's built for. The constraint made it better."

---

### 3:30–4:00 — Close

> "I'm not a developer. I'm an IT systems guy who moved into AI strategy. I built this in three weeks — nights and weekends — because I understood the problem. Vince doesn't reference your brand guidelines. He becomes them."

Hold on the app or showcase URL. Fade.

---

### Recovery Table — Script A

| What happens | Recovery |
|-------------|----------|
| LinkedIn post is a plain headshot (no design) | Start a fresh conversation, don't say "headshot scene" first |
| Headshot scene returns no image | Retry with slightly different scene: "modern open-plan Google office, natural light" |
| Video doesn't show the person | Retry; add "the person from the reference image, wearing a navy blazer" in the prompt |
| Vince says he'll "first generate a headshot scene" for video | Hard refresh extension; that's the old path |
| Voice doesn't connect | Refresh, wait 5 seconds, try again |

---

---

## SCRIPT B — Brand Onboarding → Creative Package (ALTERNATIVE)

**Why this one:** Shows more system depth. Better if person-in-scene has been flaky. Shows brand intelligence pipeline.

---

### 0:00–0:30 — Hook

> "I manage AI across a 700-person marketing agency. The brand consistency problem is real — and every new tool makes it worse, not better. This is what I built to fix it."

---

### 0:30–1:30 — Brand onboarding by voice

Activate voice mode. Say:
> "Hey Vince, set up Google as a brand — the website is google.com."

Website crawl starts. Narrate the wait:
> "Right now Vince is crawling google.com. Pulling visual identity, color profile, photography style, tone of voice. This takes about 30 seconds. He's not storing a document — he's building a model of the brand. When this is done, every generation just knows it. You don't ask. It's already there."

When synthesis completes, show the Brand DNA result briefly.
> "That's the brand profile. That's what gets injected automatically before every generation from this point forward."

---

### 1:30–2:30 — Creative package (THE MONEY SHOT)

Say:
> "Build a LinkedIn campaign for the Google AI Champion launch. Executive tone."

While it generates:
> "One voice command. On the backend, Vince fires a tool call to generate_creative_package. That triggers a single generateContent call — responseModalities TEXT and IMAGE — and what comes back is alternating copy blocks and images in one response. Strategy, headline, LinkedIn post, product shot. Not assembled from separate requests. Woven together in a single call. While Vince keeps talking."

When the result appears — slow down and show it:
> "That's what interleaved output looks like. Copy and image alternating. One API call. The brand DNA was already in the brief — retrieved automatically from vector memory before the call ran."

---

### 2:30–3:00 — Brand governance

Say:
> "Generate photography guardrails for the brand."

Narrate:
> "This is the part that matters operationally. Brand compliance isn't a settings panel. Vince generates governance directives from the brand DNA — photography rules, tone constraints, usage guidelines. You activate them in the AI Guidelines panel and they inject into every subsequent generation. The brand becomes the guardrails."

---

### 3:00–3:40 — Architecture (switch to diagram tab)

> "Three Gemini models. Live API handles voice and the 26 tool calls — that's what makes this feel like a conversation instead of a form. Gemini 3.1 Flash Image handles creative execution — interleaved copy and images in a single call. Gemini 2.0 Flash handles video analysis when you drop in a competitor URL."

Pause. Then:

> "Image models don't support function calling. I hit that wall and had to design around it. That constraint gave me something cleaner than I would have built on purpose — voice session as pure orchestration, generation call as pure execution. I wouldn't have separated them by choice. The constraint made it better."

---

### 3:40–4:00 — Close

> "I'm not a developer. I'm a systems person who understood the problem deeply enough to build the solution. Three weeks. Nights and weekends. Vince doesn't reference your brand guidelines. He becomes them."

Hold on URL. Fade.

---

### Recovery Table — Script B

| What happens | Recovery |
|-------------|----------|
| Brand analysis takes too long | Narrate: "This is the fire-and-forget pattern — Vince stays live while the analysis runs in the background" |
| Creative package returns only text | Say "Let me show you that again" and re-brief — mention specific deliverables: "LinkedIn post and a product shot" |
| Voice drops mid-session | Switch to text chat — same tools, same results |

---

---

## SCRIPT C — Extension-First (SHORT VERSION, if pressed for time)

**Why this one:** If you need to keep it tight and want to show the Chrome extension prominently.

**0:00–0:20** — Hook (same as Script A)

**0:20–1:00** — Open extension on a real webpage. Show brand already loaded.
> "Vince is a side panel. No new tab. No context switch. The brand travels with the browser."

**1:00–2:30** — Brief a campaign by voice in the extension.
> "Build a LinkedIn campaign for the product launch — Google brand, executive tone."
Show interleaved output appearing.

**2:30–3:00** — Person-in-scene via extension.
Upload headshot.
> "Put this person in the campaign."
Show the designed LinkedIn card.

**3:00–3:40** — Architecture (30 seconds)

**3:40–4:00** — Close

---

---

## Key Phrases to Practice Out Loud

These are the lines that need to sound natural, not read:

| Moment | What to say |
|--------|------------|
| After headshot upload | *"I want to create a campaign featuring this person as a Google AI champion."* |
| Triggering the package | *"Generate a LinkedIn post celebrating them as a Google AI power user."* |
| While image generates | *"Notice it's a designed marketing asset — not just a photo."* |
| Triggering video | *"Now make a video of them presenting on stage at Google Next."* |
| Architecture moment | *"Image generation models don't support function calling. That constraint made the architecture better."* |
| The close | *"Doesn't reference your brand guidelines. Becomes them."* |

---

## The One Thing That Kills Demos

Silence with no narration while Vince is generating.

**Every wait has a line.** If Vince is working, you're talking. Narrate what's happening, what the technical move is, what the judge should be paying attention to. Never let the screen sit quiet.

---

## Timing Reference

| Section | Target time |
|---------|------------|
| Hook | 0:20 |
| Surfaces tour | 0:40 |
| Upload + brief | 1:15 |
| Package generates + narrate | 2:15 |
| Video | 2:45 |
| Architecture | 3:30 |
| Close | 4:00 |

If you're running long, cut the surfaces tour (go straight to upload) or compress the architecture section to 20 seconds.

---

## What to Do After Each Take

1. Check the clock — did you land under 4:00?
2. Did the LinkedIn card show a DESIGNED asset (not a plain headshot)?
3. Did the video queue and show the person?
4. Was there any dead air longer than 5 seconds?

If yes to 1 and 2, that's your take. Stop recording.
