# Vince — Testing Guide

**Updated:** Mar 8, 2026
**Purpose:** End-to-end testing checklist for all features before demo recording and submission

Work through this document top to bottom. Each section has a prerequisite. Don't skip ahead — a blocked prerequisite means everything below it will also fail.

---

## Prerequisites Checklist

Before running any tests, confirm:

- [ ] `GEMINI_API_KEY` added to Supabase vault (`foolpmhiedplyftbiocb`)
- [ ] All edge functions deployed (see Section 1)
- [ ] App running locally (`npm run dev`) or deployed
- [ ] Logged in as `demo@vince.ai` (admin role)
- [ ] At least one brand exists in the database (or plan to create one in tests)

---

## Section 1 — Edge Function Deployment

Verify all 19 functions are deployed to `foolpmhiedplyftbiocb`.

```bash
npx supabase functions list --project-ref foolpmhiedplyftbiocb
```

Expected: All functions listed with status `active` or equivalent.

**Functions to confirm deployed:**

| Function | Critical Path |
|----------|--------------|
| `brand-prompt-agent` | ✅ Yes — Vince's brain |
| `generate-creative-package` | ✅ Yes — interleaved output centerpiece |
| `generate-creative-image` | ✅ Yes — single image generation |
| `generate-creative-video` | ✅ Yes — Veo 3 fire-and-forget |
| `analyze-brand-website` | ✅ Yes — brand DNA from URL |
| `analyze-brand-documents` | ✅ Yes — PDF/DOCX import |
| `analyze-competitor-video` | ✅ Yes — competitive intelligence |
| `synthesize-brand-profile` | ✅ Yes — brand DNA synthesis |
| `synthesize-generation-prompt` | ✅ Yes — generation prompt |
| `generate-brand-guardrails` | ✅ Yes — governance directives |
| `generate-brand-playbook` | 🔶 Demo path |
| `generate-brand-starters` | 🔶 Demo path |
| `generate-brand-card-images` | 🔶 Welcome screen |
| `analyze-brand-images` | 🔶 Reference images |
| `generate-brand-prompt` | 🟡 Nice to have |
| `enhance-director-prompt` | 🟡 Nice to have |
| `generate-header-image` | 🟡 Nice to have |
| `generate-studio-welcome-images` | 🟡 Nice to have |
| `generate-brand-cards` | 🟡 Nice to have |

**Pass:** All ✅ functions are active.
**Fail:** Any ✅ function missing — redeploy before continuing.

---

## Section 2 — Auth & Navigation

### 2.1 Login
1. Open the app
2. Confirm login page shows pre-filled credentials (`demo@vince.ai`)
3. Click Sign In

**Pass:** Redirected to Creative Studio. Welcome screen visible.
**Fail:** Error message or blank screen → check Supabase anon key in `.env`.

### 2.2 Navigation
1. Confirm nav bar shows: Vince (home), Creative Studio Admin, Vince Control Panel
2. Confirm all nav labels, headings, and greetings are consistent with Vince

**Pass:** Navigation clean, all copy consistent with Vince identity.
**Fail:** Any unexpected product names or labels visible → check nav components and seed data.

---

## Section 3 — Brand Creation (Text Chat)

### 3.1 Create a brand via Vince text chat
1. Open Creative Studio
2. Open Vince chat panel (bottom of screen)
3. Type: `Create a new brand called Google with website https://google.com`
4. Wait for response

**Pass:** Vince responds with confirmation. Brand "Google" appears in brand selector. Vince calls `create_brand` (visible as tool action card in chat).
**Fail:** Vince says it can't do that, or no brand appears → check `brand-prompt-agent` is deployed and `create_brand` tool is in the tool definitions.

### 3.2 Confirm brand selector updates
1. After brand creation, check the brand selector (top-left of Creative Studio)
2. "Google" should appear in the list

**Pass:** Brand visible and selectable.
**Fail:** Brand missing → may need a page refresh; check `useCreativeStudioBrands` hook.

---

## Section 4 — Brand Website Analysis

### 4.1 Analyze brand website via Vince
1. Select the Google brand
2. In Vince chat: `Analyze the Google website and extract the brand DNA`
3. Wait — this takes 15–30 seconds (website crawl)

**Pass:** Vince calls `analyze_brand_website` (tool action visible). Response includes visual identity details: colors, typography, tone. Brand DNA section in brand editor shows populated data.
**Fail:** Timeout or error → check `analyze-brand-website` edge function logs. Common issue: URL hallucination (function tries to crawl a URL it invented). Look for `[analyze-brand-website]` prefixed log lines.

### 4.2 Verify data persisted
1. Open Creative Studio Admin → Brands → select Google
2. Check Visual Identity tab

**Pass:** Color palette, typography fields populated from analysis.
**Fail:** Fields empty → edge function ran but didn't write back. Check `creative_studio_brand_analyses` table for the row.

---

## Section 5 — Document Import

### 5.1 Import a brand document via Vince (text chat)
1. Have a PDF ready (brand guidelines, any PDF works for testing)
2. In Vince chat, attach the file using the paperclip button
3. Type: `Import this brand document and extract the brand intelligence`

**Pass:** File uploads. Vince calls `import_brand_document` tool. Response confirms attributes extracted. Check `creative_studio_brand_analyses` for a new row with `analysis_type: 'document'`.
**Fail:** File doesn't upload → check file type (PDF/DOCX/PPTX/TXT supported). File uploads but tool doesn't fire → check Vince system prompt for document import trigger phrases.

---

## Section 6 — Brand DNA Synthesis & Playbook

### 6.1 Synthesize brand profile
1. After website analysis (and optionally document import)
2. In Vince chat: `Synthesize the brand profile`

**Pass:** Vince calls `synthesize_brand_profile`. Response confirms synthesis complete. Check `creative_studio_brands` — `brand_voice` and `visual_identity` columns should be updated with synthesized content. A new row in `brand_generation_prompts` should exist.
**Fail:** Tool fires but no data in columns → check `synthesize-brand-profile` edge function logs.

### 6.2 Generate full brand playbook
1. In Vince chat: `Generate the full brand playbook`

**Pass:** Vince calls `generate_brand_playbook`. Step-by-step progress report:
- Step 1: Brand profile synthesized
- Step 2: 6 governance directive sets generated (visual_identity, photography_and_composition, tone_and_messaging, typography_and_text, product_representation, compliance)
- Step 3: Generation prompt synthesized
- Step 4: Brand card images generated

Check Creative Studio Admin → Brands → Google → Directives tab: 6 directive rows visible.

**Fail (partial):** Some steps succeed, some fail. Note which step failed and check that edge function's logs. The playbook uses `Promise.allSettled` for directives so partial success is expected — all 6 should succeed in a healthy deployment.

---

## Section 7 — Creative Package Generation (Interleaved Output)

This is the hackathon centerpiece. Test this multiple times and note latency.

### 7.1 Generate a creative package via text chat
1. Select Google brand (with brand DNA populated)
2. In Vince chat: `Create a LinkedIn post campaign for Google's new AI features`

**Pass:**
- Vince calls `generate_creative_package` (tool action card visible)
- Response renders in `CreativePackageDisplay` component: alternating copy blocks and images
- Copy appears first (headline + body), then image, repeating for each deliverable
- "Use in Canvas" button visible on each image
- Generation appears in History panel (right side)

**Fail (no output):** Tool card shows but no `CreativePackageDisplay` renders → check `generate-creative-package` edge function. Look for Gemini API errors in logs.
**Fail (text only, no images):** Edge function returned text but not images → verify `GEMINI_API_KEY` is in vault and the model ID is `gemini-3.1-flash-image-preview`.
**Fail (images only, no text):** `responseModalities` configuration issue.

### 7.2 Note and record actual latency
Start a timer when you send the message. Stop it when the full package renders.

**Record:**
- First deliverable latency: _____ seconds
- Full package (3 deliverables) latency: _____ seconds

This is the number to use in the DevPost submission. Update the blog post if it differs from the "12–56s" range in the build status doc.

### 7.3 Test different deliverable types
1. `Create a product shot with text overlay for Google Search`
2. `Create a social story for Google Photos`
3. `Create a display banner for Google Workspace`

**Pass:** Each returns with appropriate aspect ratio:
- LinkedIn post → 4:3
- Product shot with text → 1:1
- Social story → 9:16
- Display banner → 16:9

**Fail:** Wrong aspect ratio or Vince defaults to generic type → check deliverable type mapping in `brand-prompt-agent` tool definition.

### 7.4 "Use in Canvas" button
1. After a creative package renders, click "Use in Canvas" on any image

**Pass:** Image loads into the main canvas editor area. Toast notification: "Loaded to canvas".
**Fail:** Nothing happens → check `onSetImage` prop chain from `CreativeStudio.tsx` through `BrandAgentApp.tsx` to `CreativePackageDisplay`.

---

## Section 8 — Competitive Intelligence

### 8.1 Analyze a competitor ad (text chat)
1. Find a real YouTube ad URL (e.g., a Bing or Apple Search ad)
2. In Vince chat: `Analyze this competitor ad: [URL]`

**Pass:**
- Vince calls `analyze_competitor_content`
- Orange "COMPETITIVE INTEL" card renders in chat
- Card shows: competitor summary, Strategic Openings (weakness list), Counter Brief
- Vince narrates findings and **asks** before generating counter-campaign ("Want me to build a counter-campaign?")

**Critical:** Vince must NOT auto-chain into `generate_creative_package` without asking. This is an explicit rule in the system prompt. If it auto-generates, the system prompt rule has been lost — check the deployed brand-prompt-agent.

**Fail (no card):** Tool fires but card doesn't render → check `CompetitiveIntelCard` component and `onToolResult` handler in `BrandAgentApp`.
**Fail (wrong URL):** Edge function fails on the URL → try a known-good YouTube URL. Some URLs (TikTok, Instagram) may not work with Gemini's URL understanding.

### 8.2 Generate counter-campaign from analysis
1. After competitive intel card appears: `Yes, build the counter-campaign`

**Pass:** Vince calls `generate_creative_package` with the counter brief injected. Creative package renders. Deliverables are noticeably differentiated from the competitor's style.
**Fail:** Generic package with no relationship to the counter brief → brand context or counter brief not flowing through to `generate-creative-package` edge function parameters.

---

## Section 9 — Video Generation

### 9.1 Queue a video via text chat
1. In Vince chat: `Generate a 6-second 16:9 video for Google AI features`

**Pass:**
- Vince calls `generate_video`
- Response returns immediately (within 2-3 seconds): "Video is rendering — check History in 1-2 minutes"
- Elapsed-time counter appears in chat thread ("● Video rendering / 42s elapsed")
- After 1-3 minutes, video appears in History panel
- Vince does NOT appear frozen or waiting

**Fail (timeout/hang):** Vince appears to be waiting → `generate_video` may be awaiting the Veo job. Check `brand-prompt-agent` — the video call must be fire-and-forget (no await).
**Fail (API error on duration):** `durationSeconds out of bound` → snapping logic in `generate-creative-video` not deployed. Verify deployed version has the `validDurations.reduce()` fix.
**Fail (`generateAudio` error):** Remove `generateAudio` parameter from edge function — it's not a valid Veo API field.

### 9.2 Verify video in History panel
1. Wait 1-3 minutes after queuing
2. Check History panel (right side of Creative Studio)

**Pass:** Video entry appears with thumbnail or video player. Real-time subscription delivered the completion event.
**Fail (never appears):** Check `creative_studio_generations` table — does a completed row exist? If yes, real-time subscription issue. If no, `generate-creative-video` worker failed silently.

### 9.3 Test fast vs. quality model
1. `Generate a fast 4-second 9:16 video for Google Chrome`
2. `Generate a quality 8-second video for Google Maps with this reference image: [URL]`

**Pass (fast):** Returns quickly, no reference image error logged.
**Pass (quality + reference):** Reference image accepted, video generates at 8 seconds.
**Fail (reference on fast model):** Warning in logs is acceptable (silently skips) — UI should still work.

---

## Section 10 — Voice Mode (Gemini Live)

Voice mode requires `GEMINI_API_KEY` in the browser environment (`VITE_GEMINI_API_KEY` in `.env`). This is a client-side key — confirm it's set before this section.

### 10.1 Basic voice connection
1. Open Vince in Creative Studio
2. Click the microphone button (do NOT use auto-start — requires manual gesture)

**Pass:**
- Compact inline voice bar appears at the bottom of chat panel
- 5-bar animated waveform visible (CompactAudioIndicator)
- Status text shows "Connected" or similar
- Vince speaks a greeting within 2-3 seconds

**Fail (no audio):** WebSocket connects (transcripts may work) but no audio playback → AudioContext not resumed. Check that mic button click is triggering `audioContext.resume()` before session connect.
**Fail (no connection):** WebSocket fails → check `VITE_GEMINI_API_KEY` in `.env`. Check browser console for WebSocket error messages.
**Fail (ghost session):** Exit and re-enter voice mode rapidly → should never create a ghost session. Connection token pattern should prevent this.

### 10.2 Basic voice conversation
1. Connected to voice mode
2. Say: "Hey Vince, what brand are we working with?"

**Pass:** Vince responds by voice, naming the active brand. Transcript appears in the compact voice bar (3-line limit, cyan for user, white for Vince).
**Fail:** No transcript → Gemini Live not receiving audio. Check microphone permissions in browser.

### 10.3 Interruption / barge-in
*(This is explicitly judged in the Live Agent category)*
1. Start Vince speaking (ask a question that generates a long response)
2. Interrupt mid-sentence: "Actually, never mind — let's talk about something else"

**Pass:** Vince stops speaking and responds to the interruption naturally. Does not finish the previous thought.
**Fail:** Vince continues speaking over the interruption → barge-in may not be configured. Check Gemini Live session config for `barge_in_disabled: false` (default should allow barge-in).

### 10.4 Voice brand playbook
1. In voice mode, say: "Let's get the Google brand ready. Generate the full playbook."

**Pass:**
- Status bar in voice bar shows each tool being called
- Vince narrates progress as each step completes
- Brand directives visible in admin after completion

**Fail:** Vince doesn't call the tool → check system prompt trigger phrases for `generate_brand_playbook`.

### 10.5 Voice → creative package (interleaved output)
1. In voice mode with brand DNA loaded
2. Say: "Create me a LinkedIn post for Google's new AI features"

**Pass:**
- Status bar shows "⏳ Generating creative package..."
- Vince speaks filler ("I'm sketching that out now...") during the 12-56 second wait
- `CreativePackageDisplay` renders in the chat panel with copy + images
- Vince speaks about the results after they appear

**Fail (Vince goes silent):** Filler speech not firing → check `activeToolName === 'generate_creative_package'` condition in voice bar status text.
**Fail (package never renders):** Tool returned results but UI didn't update → check `onToolResult` handler for voice mode in `BrandAgentApp`.

### 10.6 Voice competitor analysis flow
1. In voice mode, say: "Analyze this competitor ad"
2. Paste a YouTube URL into the URL input field in the voice bar → press Enter

**Pass:**
- URL sent to live session via `sendText()`
- Status bar shows "⏳ Analyzing competitor video..."
- Competitive Intel card (orange) appears in chat thread
- Vince narrates findings by voice
- Vince asks before building counter-campaign

**Fail (URL not received):** Paste into URL field, URL appears in text box but Vince doesn't receive it → Enter key not triggering `sendText()`. Check `onKeyDown` handler on the URL input.

### 10.7 Voice video generation
1. In voice mode, say: "Generate a 6-second video for Google Search"

**Pass:**
- Status bar shows "⏳ Rendering video (1-2 min)..."
- Vince returns quickly: "Video is rendering, I'll let you know when it's ready"
- Voice session stays alive — continue conversing
- Video appears in History within 1-3 minutes

**Fail (session dies):** Gemini Live session drops → Veo 3 call is being awaited somewhere. The fire-and-forget must complete before returning from the tool handler.

### 10.8 Voice exit
1. Click the "Chat" button with X icon in the voice bar

**Pass:** Voice session closes cleanly. Returns to text chat mode. No ghost session (mic not running in background).
**Fail (ghost session):** Mic icon still shows active indicator after exit → connection token bug. Check `brandAgentLiveService.ts` for the token mismatch pattern.

---

## Section 11 — Director Mode

### 11.1 Select a quick starter
1. In Creative Studio, switch to Director Mode
2. Confirm quick starter pills are visible (brand-specific or generic)
3. Click a starter

**Pass:** 6 structured fields populate (Scene, Lighting, Lens, Subject, Camera Movement, Brand Preset). Fields show readable labels, not raw slugs.
**Fail (empty fields):** Fuzzy matching isn't converting Gemini's natural language output to UI slugs → check `CAMERA_MOVEMENTS`, `LIGHTING_PRESETS`, `LENS_PRESETS` keyword maps in director mode component.

### 11.2 Generate via Director Mode
1. With fields populated, click Generate

**Pass:** Image generates. Brand voice injected (Step 7b). Image appears in History.
**Fail:** Error on generation → check `generate-creative-image` edge function. Verify brand voice injection is present in Step 7 logic.

---

## Section 12 — History Panel & Real-Time

### 12.1 Real-time subscription
1. Generate any image (text chat, voice, or director mode)

**Pass:** Generation appears in History panel without page refresh. Check timestamp — should appear within 2-3 seconds of generation completing.
**Fail:** History only updates on refresh → `useRealtimeGenerations` subscription not active. Check Supabase real-time is enabled on `creative_studio_generations` table.

### 12.2 Creative package in History
1. Generate a creative package via Vince

**Pass:** Single History entry with `generation_type: creative_package`. All image URLs visible in history card. Not one entry per image.
**Fail (multiple entries):** `generate-creative-package` is creating one record per deliverable → should create one record with all `output_urls` in the array.
**Fail (no entry):** Fire-and-forget insert not completing → check `generate-creative-package` for the awaited insert with error logging.

---

## Section 13 — Chrome Extension

### 13.1 Extension loads
1. Open Chrome → Extensions (chrome://extensions)
2. Load unpacked from `extension/` directory
3. Navigate to `google.com`
4. Open the extension side panel

**Pass:** Extension opens without errors. Vince UI visible in side panel. Dark theme matching Creative Studio.
**Fail (auth error):** Extension is pointed at wrong Supabase project → check extension's config/supabase client for `foolpmhiedplyftbiocb`.
**Fail (blank panel):** Manifest or side panel path issue → check `extension/manifest.json` for correct `side_panel.default_path`.

---

## Section 14 — Known Issues & Workarounds

| Issue | Workaround |
|-------|-----------|
| Voice auto-start silenced | Always click mic button manually — do not rely on auto-start |
| Interleaved latency varies 12–56s | Have filler speech ready; don't interpret long wait as failure |
| Competitive analysis: some URLs fail | YouTube URLs work reliably; avoid TikTok/Instagram |
| Video generation: 1-3 min render | Keep voice session active; don't exit while waiting |
| 17 TypeScript type errors | Non-blocking — Vite builds fine, ignore during testing |
| counter_deliverables not clickable | Known gap — doesn't affect core demo flow |

---

## Demo Day Final Checks

Run these immediately before recording the demo video:

- [ ] Fresh browser profile (no saved session state, no dev tools cached data)
- [ ] Microphone permissions granted
- [ ] `VITE_GEMINI_API_KEY` in `.env` (for voice mode)
- [ ] At least one complete brand with DNA, directives, and generation prompt loaded
- [ ] History panel visible and working (test with one image)
- [ ] Voice connection tested (greeting fires)
- [ ] One complete creative package generated successfully
- [ ] Video render confirmed (one queued, appears in History)
- [ ] Competitor analysis tested with real URL
- [ ] All UI copy, labels, and demo data look clean and product-ready

---

## Test Results Log

Use this to record results and notes during testing:

| Test | Date | Result | Notes |
|------|------|--------|-------|
| 1 — Edge functions deployed | | ⬜ | |
| 2.1 — Login | | ⬜ | |
| 2.2 — Navigation clean | | ⬜ | |
| 3.1 — Create brand | | ⬜ | |
| 4.1 — Website analysis | | ⬜ | |
| 5.1 — Document import | | ⬜ | |
| 6.1 — Brand synthesis | | ⬜ | |
| 6.2 — Brand playbook | | ⬜ | |
| 7.1 — Creative package | | ⬜ | Latency: |
| 7.3 — Deliverable types | | ⬜ | |
| 7.4 — Use in Canvas | | ⬜ | |
| 8.1 — Competitive intel | | ⬜ | |
| 8.2 — Counter-campaign | | ⬜ | |
| 9.1 — Video queue | | ⬜ | |
| 9.2 — Video in History | | ⬜ | |
| 10.1 — Voice connect | | ⬜ | |
| 10.2 — Voice conversation | | ⬜ | |
| 10.3 — Barge-in | | ⬜ | |
| 10.4 — Voice playbook | | ⬜ | |
| 10.5 — Voice → package | | ⬜ | |
| 10.6 — Voice competitor | | ⬜ | |
| 10.7 — Voice video | | ⬜ | |
| 10.8 — Voice exit | | ⬜ | |
| 11.1 — Director mode starters | | ⬜ | |
| 12.1 — Real-time History | | ⬜ | |
| 13.1 — Chrome extension | | ⬜ | |
