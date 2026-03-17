# LinkedIn Post — Vince Launch

---

I'm not a developer. I'm an IT systems guy who became the Director of AI Enablement at a marketing agency. My job is teaching people how to actually use AI tools — not in demos, in the real deadline-driven world of creative work.

For a long time I've been walking around with an idea I couldn't shake.

I take walks. I hit record on Gemini and just think out loud — raw architecture, what should exist but doesn't. And the thing I kept coming back to: what if a creative director could direct on the go? Voice-brief a campaign. Brand-aware from the first word. Assets waiting when you get back to your desk.

That became Vince. Built for the Gemini Live Agent Challenge.

---

**What he does:**

- *"Hey Vince, set up Google as a brand."* He crawls the website, extracts the visual DNA, synthesizes it. Knows the brand.
- *"Build a LinkedIn campaign for the AI Champion launch."* One voice command. Strategy, copy, and designed images — interleaved in a single response. Not assembled from separate requests.
- *"Put me in this campaign."* Upload a headshot. Your actual face, placed in a brand-aligned scene, wrapped in campaign copy. One conversation.
- *"Beat this Apple ad — here's the link."* Vince analyzes the video, surfaces the weaknesses, proposes three counter-campaign directions. While the voice session stays open.

---

**The architecture insight:**

Gemini Live API handles voice and tool calling. Gemini 3.1 Flash Image handles interleaved output — one call returning alternating copy blocks and images. Two models, deliberately separated.

Image models don't support function calling. That constraint forced a cleaner split than I would have designed intentionally. Voice session = pure orchestration. Generation call = pure creative execution. Each at its ceiling.

The hardest problem: brand website analysis takes 30–60 seconds. The Live API wants results fast. Fix: fire-and-forget — Vince acknowledges immediately, pushes the real result via Supabase Realtime when done. Voice session never waits.

---

Try Vince: https://vince-359575203061.us-central1.run.app/showcase
DevPost: [link]

#GeminiLiveAgentChallenge #GoogleCloud #GeminiAPI #BuildWithGemini
