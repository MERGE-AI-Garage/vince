# LinkedIn Post — March 15, 2026

---

I just shipped Vince for the Gemini Live Agent Challenge. Here's what I actually learned building it.

**The problem:** Brand teams spend days briefing agencies because AI has no idea what your brand is. Generic image tools generate things that look great and are completely off-brand. The issue isn't generation quality — it's the absence of brand intelligence.

**Vince:** A voice-driven AI creative director who already knows your brand. Brief him by voice. Get complete campaigns — copy and images together — in a single response.

---

**The technical insight that drove everything:**

Gemini Live API handles real-time voice and tool calling. Gemini 3.1 Flash Image handles interleaved output — one API call that returns alternating text blocks and images. These are deliberately two separate models, and that separation isn't a compromise. It's the architecture.

Image models don't support function calling. I couldn't have one model do both. When I hit that constraint, I had two choices: fight it or design around it. Designing around it meant the voice session became a pure orchestration layer and the generation call became a pure creative execution layer. Cleaner than anything I would have designed if I'd had the choice.

The flow: Vince is listening via Live API → you brief a campaign → he calls `generate_creative_package` mid-conversation → a separate `generateContent` call with `responseModalities: ['TEXT', 'IMAGE']` runs on the backend → interleaved copy and images render on the frontend while Vince keeps talking.

---

**Invisible RAG:**

Every generation is brand-aware without the user asking for it. Before any creative package runs, `recall_brand_guidelines` does a semantic search against the brand's vector memory and injects the relevant rules — visual identity standards, photography directives, tone constraints — directly into the generation prompt. The user never touches a settings panel. Brand context is always already there.

---

**The hardest engineering problem:**

The Gemini Live API expects tool results back fast. Brand website analysis takes 30-60 seconds. A slow tool call stalls the WebSocket.

The fix: fire-and-forget for async operations. Vince acknowledges the call immediately, returns a stub result so the session stays alive, and pushes the real result to the frontend via Supabase Realtime when the operation completes. The voice session never waits.

I used the GenAI SDK directly (not ADK) for exactly this kind of control — audio resampling to 16kHz PCM, tool injection timing, session resumption. More code, but we own the session lifecycle.

---

**What I'd do differently:**

Start with the constraint inventory. I spent time early trying to make the Live API do image generation before I understood why that can't work. Reading the model capability docs first would have saved days.

---

Try Vince: https://vince-359575203061.us-central1.run.app
DevPost: [link]

#GeminiLiveAgentChallenge #GoogleCloud #GeminiAPI #BuildWithGemini
