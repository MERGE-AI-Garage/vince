# Vince Voice Mode — Testing Guide
**Date:** Mar 7, 2026

---

## Setup

- Open the app and log in as the demo user
- Select a brand with existing DNA (e.g. a brand that's had `analyze_brand_website` run)
- Open Vince (sidebar or panel)
- Open browser DevTools → Console tab — keep it visible throughout testing

---

## Test 1: Voice Start

**What to verify:** Mic button starts a voice session and the compact bar appears.

Steps:
1. Click the mic button in the Vince header
2. Grant microphone permission if prompted

Expected:
- [ ] Compact voice bar appears at the bottom of the chat panel (replaces text input)
- [ ] Status shows "Connecting..." briefly, then transitions to "Waiting..."
- [ ] LIVE badge appears in the header (red, pulsing)
- [ ] No console errors

---

## Test 2: Audio Playback

**What to verify:** You can actually hear Vince respond.

Steps:
1. Start voice (Test 1)
2. Wait for "Waiting..." status
3. Say: "Hey Vince, who are you?"

Expected:
- [ ] The waveform animator (5 bars) animates while Vince speaks — bars go emerald/green
- [ ] You can **hear** Vince's voice response through speakers
- [ ] Status changes to "Vince is speaking..." while audio plays
- [ ] Vince's response transcript appears in the voice bar (white text, up to 3 lines)
- [ ] When Vince finishes, transcript flushes to the chat thread as a message

If audio is silent but transcripts appear: AudioContext issue — check console for `AudioContext` warnings. Voice was likely started outside a browser gesture window. Close and re-open Vince, click mic again.

---

## Test 3: User Speech Display

**What to verify:** Your voice shows live in the bar while speaking.

Steps:
1. Start voice (Test 1)
2. Say something slowly: "Tell me about this brand's visual identity"

Expected:
- [ ] Your words appear in the voice bar in **cyan italic** as you speak
- [ ] Waveform bars shift to cyan while you're speaking
- [ ] Status shows "Listening..."
- [ ] After you stop, your transcript flushes to chat as a user message

---

## Test 4: Exit Voice — Fast (Ghost Session Test)

**What to verify:** Clicking Chat immediately after starting voice doesn't create a ghost session.

Steps:
1. Click the mic button
2. **Within 1 second**, before "Waiting..." appears, click the **Chat** button in the voice bar

Expected:
- [ ] Voice bar disappears, text input returns immediately
- [ ] LIVE badge gone from header
- [ ] Microphone icon is not active (check browser tab — no microphone indicator)
- [ ] No "Voice session ended" message appears (connection was abandoned before it started)
- [ ] Console shows `[Vince] Voice connection aborted — token mismatch` (not an error)

---

## Test 5: Exit Voice — Normal

**What to verify:** Chat button exits a fully connected session cleanly.

Steps:
1. Start voice, wait for "Waiting..."
2. Say something, wait for Vince to respond
3. Click **Chat**

Expected:
- [ ] Voice bar disappears immediately
- [ ] Text input returns
- [ ] "Voice session ended" pill appears in the chat thread
- [ ] No ghost microphone activity
- [ ] Can immediately type and send a text message

---

## Test 6: File Upload in Voice Mode

**What to verify:** Paperclip button works during voice mode, routes to live session.

Steps:
1. Start voice
2. Click the paperclip icon in the Vince header
3. Select a JPEG image

Expected:
- [ ] No "Uploaded: filename.jpg" text message in chat (that's the text-mode path)
- [ ] Console shows `[Vince] sendFile called` (or similar) — NOT `[Vince] Voice file upload failed`
- [ ] Vince's transcription includes acknowledgment of the image

---

## Test 7: URL Injection in Voice Mode

**What to verify:** Pasting a URL in the voice bar sends it to the live session.

Steps:
1. Start voice
2. In the voice bar, click the URL input field (shows link icon + "Paste a URL and press Enter...")
3. Paste any URL (e.g. a YouTube video URL)
4. Press **Enter**

Expected:
- [ ] Input field clears
- [ ] Vince's transcript shows it received a URL to analyze
- [ ] If it's a valid video URL, Vince starts competitor analysis (see Test 9)

Repeat using the **Send** button instead of Enter — same result expected.

---

## Test 8: Synthesize Brand Profile

**What to verify:** `synthesize_brand_profile` tool runs and reports back.

Steps (text or voice):
1. Say or type: "Synthesize the brand profile"

Expected:
- [ ] Green tool action pill in chat: "synthesize_brand_profile completed"
- [ ] Vince's text response mentions confidence score and which sections were updated (e.g. "color_system", "photography_style")
- [ ] No error pill

---

## Test 9: Generate Brand Playbook

**What to verify:** `generate_brand_playbook` runs all 4 steps and reports each one.

Steps (text or voice):
1. Say or type: "Run the full brand playbook"

Expected:
- [ ] Vince narrates each step as it completes:
  - Step 1: Brand DNA synthesis
  - Step 2: All 6 governance directive sets
  - Step 3: Generation prompt synthesis
  - Step 4: Brand card images
- [ ] Green tool action pill for `generate_brand_playbook`
- [ ] Takes ~60–90 seconds — this is expected
- [ ] If a step fails, Vince reports which step and continues (partial success is handled)

---

## Test 10: Competitor Analysis — Beat This Ad Card (Text Mode)

**What to verify:** `analyze_competitor_content` renders the full orange Beat This Ad card.

Steps:
1. In text chat, type: "Analyze this competitor video: [paste a YouTube URL]"

Expected:
- [ ] Green tool pill: "Competitor analyzed — N strategic openings found"
- [ ] Orange "Beat This Ad" card appears (Target icon in header) with:
  - Competitor summary paragraph
  - **Scene Breakdown** table (timestamp | scene type | emotional signal)
  - **Strategic Openings** bullet list
  - **3 Ways to Beat It** — up to 3 clickable campaign direction cards, each showing title, concept, and tagline
  - **Build These** — clickable counter-deliverable buttons with aspect ratio labels
  - **Full Counter Brief** — collapsed `<details>` element, expandable
- [ ] Clicking a campaign direction card sends Vince a pre-filled message — check it arrives in chat
- [ ] Clicking a "Build These" button sends a full creative brief — Vince should start generating
- [ ] Vince asks "Want to build a counter-campaign?" — does NOT auto-generate images on its own

---

## Test 11: Competitor Analysis (Voice + URL Injection)

**What to verify:** Full voice flow — speak + paste URL → analysis card.

Steps:
1. Start voice
2. Say: "I want to analyze a competitor ad"
3. Paste a YouTube URL into the voice bar URL field, press Enter
4. Wait for analysis

Expected:
- [ ] Status bar shows "⏳ Analyzing competitor video..." while running
- [ ] Competitive Intel orange card appears in the chat thread (not just a text response)
- [ ] Vince verbally summarizes the findings

---

## Test 12: Video Generation

**What to verify:** `generate_video` queues a render and shows the elapsed timer.

Steps:
1. Type: "Generate a 6-second 16:9 video of [brand product] on a clean white surface, cinematic lighting"

Expected:
- [ ] Green tool pill for `generate_video`
- [ ] **Video rendering indicator** appears in the chat area:
  - Purple pulsing dot
  - "Video rendering"
  - "Xs elapsed · appears in History when ready"
  - `×` dismiss button
- [ ] Counter ticks up every second
- [ ] After 1–3 minutes, video appears in the History panel (real-time subscription)
- [ ] Dismiss button removes the indicator without breaking anything

---

## Test 13: Active Tool Status in Voice Bar

**What to verify:** Named tool status appears in the voice bar status text during voice mode.

Steps:
1. Start voice
2. Ask Vince to generate a creative package: "Create a LinkedIn post for the brand launch"

Expected:
- [ ] Status text in voice bar changes to: "⏳ Generating creative package..."
- [ ] When done, reverts to "Waiting..." or "Vince is speaking..."

Repeat with competitor analysis URL (see Test 11):
- [ ] Status shows "⏳ Analyzing competitor video..." during analysis

---

## Test 14: Quick Prompts Hidden During Voice

**What to verify:** Quick prompt chips don't show during voice mode (they'd be dead anyway).

Steps:
1. Note quick prompts are visible above the text input
2. Start voice

Expected:
- [ ] Quick prompt row disappears when voice mode starts
- [ ] Returns when you exit back to chat

---

## Test 15: Analyzing Video Indicator

**What to verify:** Orange elapsed indicator appears immediately when a video URL is sent.

Steps:
1. In text chat, type any message containing a YouTube URL (e.g. "Analyze this: https://youtube.com/watch?v=xxx")

Expected:
- [ ] **Orange indicator** appears in the chat area as soon as Send is pressed (before the response):
  - Orange pulsing dot
  - "Analyzing video"
  - "Xs · Gemini is watching the video..."
- [ ] Counter ticks up every second while analysis runs
- [ ] After 60s, message changes to "Xm Xs · almost there..."
- [ ] Indicator disappears when the response arrives (success or error)

---

## Test 16: Self-Demo Analysis

**What to verify:** `analyze_self_demo` tool renders the violet Self Analysis card.

Steps:
1. In text chat, type: "Analyze my demo recording: [paste a video URL of your own demo]"

Expected:
- [ ] Green tool pill for `analyze_self_demo`
- [ ] **Violet** Self Analysis card appears with:
  - "SELF ANALYSIS" header and "Demo Score: N/100" on the right
  - Product summary paragraph
  - UX Observations list
  - Missed Opportunities list
  - Narrative Issues list
  - Recommended Improvements list
- [ ] Score is a number 0–100

---

## Test 17: Voice Session Saved to DB

**What to verify:** Voice conversations are persisted to `chatbot_conversations` on exit.

Steps:
1. Start voice
2. Have a multi-turn conversation (at least 4 messages)
3. Click **Chat** to exit

Expected:
- [ ] In Supabase → `chatbot_conversations` table, a row appears with:
  - `metadata.assistant = 'vince'` (or similar)
  - `metadata.brand_id` matching the active brand
  - `metadata.tool_calls_count` showing how many tools were used
  - Messages array containing the substantive turns (no "Reconnecting voice..." etc.)

Also verify save fires on session drop (not just manual exit):
1. Start voice, say something
2. Kill the browser tab and reopen — check the DB for the partial session

---

## Test 18: History Refreshes After Creative Package (Text Mode)

**What to verify:** `invalidateGenerations()` fires after a creative package, refreshing the History panel without needing a manual reload.

Steps:
1. Open the History panel
2. Ask Vince (text chat): "Create a LinkedIn post for the brand"
3. Wait for the creative package card to appear in chat

Expected:
- [ ] History panel updates automatically within ~2s of the package appearing
- [ ] No manual refresh needed

---

## Known Limitations

- **No auto-start**: Voice does not start automatically when Vince opens. This is intentional — the browser AudioContext requires a direct user gesture or audio stays silenced.
- **Single file uploads**: Voice mode only supports one file at a time via the paperclip. ZIP files are not supported in voice mode.
- **URL input is voice-only**: The URL inject field only appears in the compact voice bar. In text mode, just type or paste the URL into the chat input directly.
