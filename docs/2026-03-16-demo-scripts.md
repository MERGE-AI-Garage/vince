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

> "Brand teams spend days briefing agencies. Every asset goes through rounds of approval. What if your AI creative director already knew your brand — and could put a real person into a campaign in seconds?"

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
> "This isn't just dropping a photo into a template. Vince is placing this face into a professional Google-aligned environment using Gemini's image editing model — face preserved exactly. Then generate_creative_package wraps designed copy around it. Google brand colors, headline text rendered on the image, Google logo placed in the composition. One conversation."

When the result appears:
> "Notice it's a designed marketing asset — not just a photo. Text, logo, brand treatment, all generated together. The person's face is preserved. We used their actual headshot as a reference ingredient."

---

### 2:15–2:45 — Video

Say:
> "Now make a video of them presenting on stage at Google Next — blazer, dramatic stage lighting, large audience."

While the video queues:
> "This goes directly to Veo 3 with the headshot as a native reference image. Not a workaround — Veo's first-class API for subject consistency. The person from the headshot appears in the video."

Video appears in History panel. Show it.

---

### 2:45–3:30 — Architecture (switch to diagram tab)

> "Three Gemini models in one workflow. The Live API handles voice and all 26 tool calls — it's what makes this a conversation instead of a form. Gemini 3.1 Flash Image handles interleaved copy and image output — one API call, alternating blocks of text and images. Veo handles video with the subject as a reference ingredient."

Pause. Then:

> "Image generation models don't support function calling. That's not a limitation — it's a design signal. The moment I stopped fighting it, the architecture got cleaner. Voice session as pure orchestration. Generation call as pure creative execution. The constraint made it better."

---

### 3:30–4:00 — Close

> "Vince. Doesn't reference your brand guidelines. Becomes them."

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

> "Brand teams lose days briefing agencies. What if your creative director already knew your brand before the first conversation — and never needed to be told again?"

---

### 0:30–1:30 — Brand onboarding by voice

Activate voice mode. Say:
> "Hey Vince, set up Google as a brand — the website is google.com."

Website crawl starts. Narrate the wait:
> "Vince is crawling the website, extracting visual identity, color profile, photography style, tone of voice. This takes about 30 seconds. He's not reading a style guide — he's synthesizing it."

When synthesis completes, show the Brand DNA result briefly.
> "From this point on, every generation knows this brand. Automatically. Without asking."

---

### 1:30–2:30 — Creative package (THE MONEY SHOT)

Say:
> "Build a LinkedIn campaign for the Google AI Champion launch. Executive tone."

While it generates:
> "One voice command. Vince fires a tool call to generate_creative_package. A separate generateContent call with responseModalities TEXT and IMAGE runs on the backend — one API call returning alternating copy blocks and images. Strategy. Headline. LinkedIn post. Product shot. Woven together. While Vince keeps talking."

When the result appears — slow down and show it:
> "This is the interleaved output. Copy and image alternating in a single response. Not assembled from separate requests. Not a text response with an attachment. One call."

---

### 2:30–3:00 — Brand governance

Say:
> "Generate photography guardrails for the brand."

Narrate:
> "Brand compliance isn't a settings panel in Vince. It's conversational. He generates governance directives from the brand DNA — you activate them in the AI Guidelines panel. The brand IS the guardrails."

---

### 3:00–3:40 — Architecture (switch to diagram tab)

> "Two models. One conversation. Gemini Live API handles voice and tool orchestration. Gemini 3.1 Flash Image handles creative execution — interleaved copy and images in a single call. Image models don't support function calling. That constraint produced a cleaner architecture than anything I would have designed intentionally."

---

### 3:40–4:00 — Close

> "Vince. Doesn't reference your brand guidelines. Becomes them."

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
