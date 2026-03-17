# Vince: Playbook Tools, Voice Fixes, and Demo Prep
**Date:** Mar 7, 2026

---

## Overview

### Voice Mode — Bug Fix + UX
**Problem:** Clicking the exit button (X) while a voice connection was still being established didn't fully close the session. The UI correctly switched to text mode, but the pending `connectVinceLiveSession()` call would resolve afterward and set up an active live session in the background — microphone running, audio callbacks firing — with no visible UI. This created a ghost session that sounded like "exit didn't work."

**Fix:** Each connection attempt now gets a numeric token. `handleCloseVoice` sets the token to `-1` before disconnecting. When `connectVinceLiveSession` resolves, the token mismatch causes the session to self-abort (`control.disconnect()` called immediately). No ghost sessions.

**Voice-first startup:** Not implemented — browser `AudioContext` requires a direct user gesture to resume. An auto-start `useEffect` fires outside the gesture window, which means the WebSocket connects (transcripts work) but audio playback stays silenced. Voice must be started by clicking the mic button.

**Compact inline voice bar:** Replaced the full-screen `VoiceOverlay` with an inline bar at the bottom of the chat panel — matches the compact voice bar pattern used in the main Creative Studio. Shows:
- Live transcript (up to 3 lines, cyan italic for user, white for Vince)
- URL input field — paste a competitor or video URL and press Enter to send it to the live session
- `CompactAudioIndicator` (5-bar animated waveform, emerald=model, cyan=user)
- Status text — shows active tool name when Vince is working (`analyze_competitor_content`, `generate_creative_package`, `generate_video`)
- "Chat" exit button with X icon

**File upload in voice mode:** Paperclip button visible during voice mode. Files are routed to `liveControlRef.current.sendFile()` instead of the chat message pipeline.

---

### New Vince Tools

#### `synthesize_brand_profile`
Calls the `synthesize-brand-profile` edge function, which aggregates all raw intelligence (website analysis, document imports, image analysis) into the unified Brand DNA profile. Source weighting is built into the edge function — logos carry the highest authority for colors, brand guidelines PDFs for rules.

Use this after any analysis step before generating guardrails or the generation prompt.

#### `generate_brand_playbook`
Runs the full brand preparation sequence in one Vince command:
1. Synthesize Brand DNA profile from all intelligence sources
2. Generate all 6 focused governance directive sets (parallel)
3. Synthesize the brand-aware generation prompt
4. Generate brand card images

Returns a step-by-step report. Supports `skip_synthesis: true` (if profile is fresh) and `skip_cards: true` (faster run).

Trigger phrases: "get this brand ready", "prepare the full playbook", "set up brand governance", etc.

---

## Vince Tool Inventory (Full)

| Tool | What it does |
|------|-------------|
| `generate_prompt` | Craft a brand-aware image generation prompt |
| `generate_image` | Generate an image via Imagen/Gemini with brand context |
| `generate_creative_package` | Interleaved text + images (hackathon centerpiece) — supports 5 deliverable types |
| `save_prompt_template` | Save a prompt as a reusable template |
| `list_prompt_templates` | List saved prompt templates |
| `list_available_models` | Show available image generation models |
| `check_generation_quota` | Check remaining generation quota |
| `list_brand_references` | List reference images for the active brand |
| `create_brand` | Create a new brand (name + website URL) |
| `analyze_brand_website` | Crawl brand site, extract visual DNA |
| `import_brand_document` | Extract brand intelligence from uploaded PDF/DOCX/PPTX |
| `generate_brand_header` | Generate a header image for the brand |
| `generate_brand_cards` | Generate brand card images (welcome screen) |
| `generate_brand_guardrails` | Generate focused or general governance directives |
| `synthesize_brand_profile` | Merge all intelligence into unified Brand DNA |
| `generate_brand_playbook` | Full 4-step brand preparation sequence |
| `analyze_competitor_content` | Fetch + analyze a competitor video/ad URL; returns strategic openings + counter brief |
| `generate_video` | Queue a Veo video generation; fire-and-forget, appears in History when ready |

---

## Demo Strategy

### Voice-First Flow (Recommended for Hackathon Demo)
1. Open Vince → click mic button → Vince greets by name
2. "Hey Vince, let's build out the [brand] profile. Synthesize the playbook."
   → Vince calls `generate_brand_playbook`, reports each step as it completes
3. "Great. Now create me a LinkedIn post for their Q2 campaign launch."
   → Vince calls `generate_creative_package` with `deliverable_type: linkedin_post`
   → Interleaved text + 4:3 image returns, showing Gemini rendering headline INTO the image
4. "Analyze this competitor ad" → paste URL into the URL field in the voice bar → Vince calls `analyze_competitor_content` → Competitive Intel card appears in chat with strategic openings + counter brief
5. Show brand governance enforcement: attempt off-brand request → Vince refuses

### Document Ingestion (Voice)
File upload works in voice mode via the paperclip button in the Vince header. The file is sent through `liveControlRef.current.sendFile()`, which streams it to the Gemini Live session. Vince can then call `import_brand_document` with the file data.

For a ZIP of brand assets: not directly supported in a single voice upload. Recommended flow: upload the brand guidelines PDF directly, let Vince analyze it, then upload logos separately.

---

## What's Still Missing

### Document Upload (Voice Demo Path)
Voice mode sends single files via `sendFile`. For a ZIP containing logos + PDFs, the user would need to upload them individually. Consider a pre-demo prep step where assets are already loaded.

### Configurable Quick Prompts
Quick prompts are static strings. A "Subway-style" configurator with dropdowns (campaign type, product, format) baked into the prompt template is not yet built. This would require:
- A `QuickPromptTemplate` type with `fields: { id, label, type: 'select'|'text', options? }[]`
- A template string with `{field_id}` placeholders
- UI in Vince's quick prompt bar to resolve fields before send
- Could be generated by Gemini when creating brand-specific quick prompts

### Vince Tools Gap Analysis
Tools Vince is currently missing that would strengthen the demo:
- `check_brand_compliance` — run a text/image against active directives and return a pass/fail with specific violations (currently Vince does this implicitly via system prompt, not as a discrete tool)
- `generate_brand_playbook_status` — poll the status of any running analysis jobs
- `list_brand_directives` — show the user what governance rules are currently active
- `update_brand_voice` — let the user dictate brand voice updates directly to Vince
- `get_brand_analytics` — generation count, quota remaining, most-used prompts

---

## Hackathon Submission Critical Path
1. [x] Deploy brand-prompt-agent with new tools
2. [ ] E2E test: voice → `generate_brand_playbook` → `generate_creative_package`
3. [ ] Verify interleaved output renders in chat (text + image alternating)
4. [ ] Test competitor analysis flow: paste URL in voice bar → Competitive Intel card
5. [ ] Record demo video
6. [ ] DevPost writeup
