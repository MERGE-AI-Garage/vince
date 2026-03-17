# Vince — Submission Sprint Plan

**Created:** March 12, 2026 (Thursday night)
**Deadline:** March 16, 2026 @ 5:00 PM PDT
**Competition:** Gemini Live Agent Challenge — $80K prize pool, 9,712 participants

---

## Status Snapshot

The app is working. API key is in vault. Tests passing. No public deployment yet.

Vince is a legitimate, strong submission. The Gemini Live API integration is real — `brandAgentLiveService.ts` does actual bidirectional audio streaming, microphone capture, 16kHz PCM resampling, and mid-conversation tool calling over WebSocket. The interleaved output pipeline is real. The two-model architecture (Live API for voice/tools + Gemini 3.1 Flash Image for generation) is genuinely clever and judges will notice it.

---

## 🚨 Tonight Only

**Cloud Credits form (deadline March 13 @ 12PM PT):** https://forms.gle/rKNPXA1o6XADvQGb7

**GDG signup (+0.2 bonus points, 15 min):** https://developers.google.com/community

**Competitor to study:** Nano Banana Pro — Google's own inspiration pick for marketing ad creation with Vertex AI:
https://www.linkedin.com/posts/katiemn_nanobananapro-googlecloud-vertexai-activity-7397313402643181568-2hlW

---

## Competition Category

**Enter: Creative Storytellers**

Vince is hybrid — voice Live Agent + Creative Storyteller interleaved output. The submission story is strongest framed as Creative Storytellers: a brand-aware creative director that generates complete campaigns (copy + images) in a single conversation, driven by voice. The Live voice is the UX differentiator. Creative Storytellers judges will be blown away by it on top.

---

## Rules Compliance Checklist

| Requirement | Status | Action |
|-------------|--------|--------|
| Gemini model | ✅ | Live API + Gemini 3.1 Flash Image |
| Google GenAI SDK or ADK | ✅ | `@google/genai` SDK (`ai.live.connect()`) |
| Google Cloud service | ⚠️ | Gemini API counts; Cloud Run makes it explicit |
| Public code repo + README | ❌ | Write spin-up instructions Friday |
| Architecture diagram | ❌ | Mermaid diagram — Saturday |
| Demo video (MAX 4 MIN) | ❌ | Record Sunday morning |
| DevPost text description | ⚠️ | Draft exists, needs polish |
| GCP deployment proof | ❌ | Screen recording of Cloud Run — tonight or Friday |

---

## Scoring (How Judges Actually Weight This)

### Innovation & Multimodal UX — 40%
Vince's strongest area. The "beyond text box" narrative is real:
- Voice → tool calls → interleaved copy+image in a single API response
- Brand governance via conversation, not form filling
- "Invisible RAG" — brand rules auto-fetched before every generation, user never thinks about it

**Demo strategy:** Start in voice mode. Never touch the keyboard until after a full campaign package is generated.

### Technical Implementation — 30%
Solid. Two-model architecture is a genuine technical story. 26 tools. 19 edge functions.

**Current gap:** Supabase runs on Deno/AWS, not GCP. The Gemini API calls satisfy "at least one Google Cloud service" but it's thin. Cloud Run deployment closes this cleanly.

**In submission text:** Explicitly name the GenAI SDK choice and why — judges are ADK-fluent and will wonder if we know it exists. Frame it: "We used `@google/genai` SDK's Live API directly (`ai.live.connect()`) because the bidirectional audio + tool injection pipeline required control that ADK's abstractions don't expose at this level."

### Demo & Presentation — 30%
Currently the weakest area. No video, no diagram, no README = 30% of score at zero. Fix this before adding any more features.

---

## Bonus Points (Max +1.0 added to 1–5 score)

| Bonus | Points | Effort |
|-------|--------|--------|
| Publish blog/podcast/video about the build | **+0.6** | 2–3 hrs |
| Automated cloud deployment (IaC scripts) | +0.2 | 1–2 hrs |
| GDG membership with public profile link | +0.2 | 15 min |

**The LinkedIn blog post is the highest-leverage action after the app itself.** Write it Saturday, publish with #GeminiLiveAgentChallenge and tag @GoogleCloud. Cover the two-model architecture, the invisible RAG pattern, how tool calling works mid-voice-session. Technical builders eat this up and Google is actively amplifying this content.

---

## What to Build (Priority Order)

### Must-do before recording the demo
1. **`check_job_status` tool** — the fire-and-forget video silence is the worst moment in a demo. Vince goes quiet and looks broken. This is a DB query: `select status, output_url from creative_studio_generations where id = ?`. Vince calls it after kicking off a video and reports back when it's done. ~2–3 hours.

2. **Cloud Run deployment** — required for GCP proof of deployment. Tonight if possible, Friday at latest. Budget 2 hours including env var debugging on first deploy.

3. **README** — spin-up instructions for judges to reproduce. ~1 hour Friday.

4. **Architecture diagram** — Mermaid. Saturday. Show: Browser → Gemini Live (WebSocket), Browser → brand-prompt-agent → Gemini API, generate-creative-package → Gemini 3.1 Flash Image, Supabase DB/Storage.

### High-value, medium effort
5. **`manage_guardrails` tools** — `list_guardrails`, `activate_guardrail`, `deactivate_guardrail`. Brand governance is the core value prop. Not being able to manage it through Vince is a credibility hole in front of judges. ~2–3 hours.

6. **If `check_job_status` isn't built in time** — cut video generation from the demo script entirely. Do not demo fire-and-forget silence.

### Quick wins (under 30 min each)
7. Remove `analyze_self_demo` from VINCE_TOOLS — internal tool that doesn't belong in user-facing tool list
8. Add to system prompt: "You MUST call `list_camera_options` before every image generation. Never invent equipment."
9. Add GDG profile link to DevPost submission

### Skip entirely
- Playbook progress streaming — high effort, narrate the wait instead
- ConversationalEditPanel wiring — not in demo flow
- Cost visibility
- `update_brand_profile` patch tool
- `list_brand_documents`

---

## Demo Script (4-minute hard cap)

**0:00–0:30 — Hook**
"Brand teams spend days briefing agencies. Every asset goes through 5 rounds of approval. What if your AI creative director already knew your brand before the first conversation?"

**0:30–1:30 — Brand onboarding via voice**
Activate voice mode. "Hey Vince, analyze Nike's brand." → website crawl → synthesis → playbook. Narrate the wait. Show the brand DNA result.

**1:30–2:30 — Creative package (the money shot)**
"Create a LinkedIn campaign for the new Air Max launch." → Vince calls `generate_creative_package` → interleaved copy blocks and images render alternately. This is the Gemini interleaved output moment — make it the centerpiece.

**2:30–3:15 — Governance in action**
"Generate photography guardrails for the brand." → Shows brand compliance is conversational, not a settings panel.

**3:15–3:45 — Architecture**
Mermaid diagram on screen. Narrate the two-model split: Live API for voice + tool orchestration, separate `generateContent` call with `responseModalities: ['TEXT', 'IMAGE']` for the creative package. 30 seconds.

**3:45–4:00 — Close**
Stack: Gemini Live API · Gemini 3.1 Flash Image · Veo 3 · Supabase · Cloud Run

**Do not demo video generation unless `check_job_status` is working.** The silent wait looks broken.

---

## Execution Schedule

### Thursday March 12 (tonight)
- [ ] Fill out GCP credits form: https://forms.gle/rKNPXA1o6XADvQGb7
- [ ] Sign up for GDG: https://developers.google.com/community
- [ ] Study Nano Banana Pro
- [ ] Cloud Run deployment (if energy allows — don't skip sleep for this)

### Friday March 13 (all day)
- [ ] Cloud Run deployment confirmed end-to-end
- [ ] Build `check_job_status` tool
- [ ] Build `manage_guardrails` (list/activate/deactivate)
- [ ] README with spin-up instructions
- [ ] Remove `analyze_self_demo` from user tools
- [ ] Enforce `list_camera_options` in system prompt

### Saturday March 14
- [ ] Architecture diagram (Mermaid)
- [ ] Write + publish LinkedIn blog post (#GeminiLiveAgentChallenge)
- [ ] IaC deploy script if time allows (+0.2 bonus)
- [ ] Polish DevPost submission text — category, two-model architecture explanation, GenAI SDK rationale
- [ ] 5+ full demo rehearsals with timer — must land ≤4:00
- [ ] Fix anything broken in rehearsal

### Sunday March 15
- [ ] Record demo video before noon
- [ ] Final DevPost submission review
- [ ] **Submit by 2PM PDT** — not at the deadline

---

## Pre-Recording Verification

Before hitting record:
1. Cloud Run URL loads the app cleanly
2. Voice mode connects and Vince greets within 3 seconds
3. Brand analysis + synthesis chain succeeds 3/3 attempts
4. Creative package renders interleaved output (copy + images both visible)
5. `check_job_status` closes the video loop (or video is cut from script)
6. Full demo run clocks ≤4:00
