# How to Work with Vince

Vince is your AI Creative Director. He knows your brand's visual DNA, governance rules, and generation history, and can take real actions — generating images, editing shots, building campaigns, and analyzing competitors — entirely through conversation.

This guide covers everything you can do with Vince and how to talk to him effectively.

---

## Starting a Conversation

Vince works in two modes: **text chat** and **voice**. Both have the same capabilities. Voice is faster for creative direction; text is better for detailed prompts and reviewing results.

You don't need to use special commands or syntax. Talk to Vince the way you'd talk to a creative director on a shoot.

**Good opening lines:**
- "Let's make a hero shot for the new campaign."
- "Show me what we generated this week."
- "I want to beat this Apple ad — here's the YouTube link."
- "Set up Google as a new brand."

---

## Setting Up a New Brand

Vince needs a brand loaded before he can generate anything on-brand.

### Add a brand
> "Add Nike to the system."
> "Set up a brand called MERGE — the website is mergeworld.com."

Vince creates the brand record and immediately starts analyzing the website. This takes 30–60 seconds in the background.

### Upload brand documents
After uploading a PDF, PPTX, or DOCX in the chat:
> "This is our brand guidelines doc — process it."
> "Import this brand standards PDF."

Vince extracts visual identity, tone of voice, color rules, and photography standards from the document.

### Synthesize brand intelligence
Once you've uploaded documents and let the website analysis finish:
> "Synthesize the brand profile."
> "Merge everything we've loaded."

This combines all sources into a unified Brand DNA with intelligent weighting (logos have highest authority for colors; guidelines PDFs have highest authority for rules).

### Run the full playbook
> "Set up the full playbook for this brand."
> "Get this brand ready to create."

Runs everything at once: synthesis → 6 governance directive sets → generation prompt → brand cards → conversation starters. Takes 2–3 minutes. Best used after all brand materials are uploaded.

---

## Generating Images

### Single image
> "Create a hero shot of our flagship product on a dark background."
> "Generate a LinkedIn post image — warm tones, editorial feel."
> "Make a lifestyle photo of the product in use, outdoor, golden hour."

Vince will check your brand references, consult the camera inventory, recall relevant brand rules, and check quota before generating. You don't need to ask him to do any of this — it's automatic.

### Specify aspect ratio
> "Make it 16:9 for a hero banner."
> "9:16 for Instagram stories."
> "Square for social."

### Request multiple variations
> "Give me two versions — one product-focused, one lifestyle."
> "Generate four options so we can compare."

### Include the brand logo
> "Add the logo — this is going on a social post."
> "Include our logo mark in the upper left."

### Use reference images
> "Use the product reference collection for the hero product."
> "Make sure the character matches our brand spokesperson."

First ask what's available:
> "What reference collections do we have?"

### Save a prompt you like
> "Save that prompt as 'Summer Hero Shot'."
> "Bookmark this one under editorial."

---

## Editing Images

Once an image exists — from this session or a previous one — Vince can edit it directly.

### Start an edit
> "Make the background darker and more dramatic."
> "Shift the color grade to golden hour."
> "Remove the text overlay."
> "Add more depth of field — blur the background more."

Vince calls the edit and returns the result in chat. Each edit builds on the last — he remembers where you are in the refinement.

### Keep refining
> "Now add a subtle lens flare from the upper right."
> "A bit warmer. And lift the shadows slightly."
> "Perfect — load it to the canvas."

Vince maintains full editing context across turns. You can do as many refinements as you need.

### Iterate on a past generation
> "Show me what we generated this week."
> "Find that hero shot we made last Tuesday."

Vince shows a thumbnail grid. Click **Iterate** on any image to start an edit session on it.

---

## Generating Campaigns

For multiple deliverables at once — copy and images together:

> "Build a LinkedIn campaign for the product launch. I need a hero image, two social posts, and a story."
> "Create a full creative package for the summer sale. Target audience is 25–40, upscale lifestyle."
> "Make a set of deliverables for the email campaign — header image, social banner, product shot."

Vince generates all copy and images interleaved in a single call, with brand rules applied automatically. This is faster than generating pieces one at a time.

### Specify deliverable types
> "I need a LinkedIn post, a product shot with text, and a social story."

Vince has pre-built branded templates for: linkedin_post, product_shot_with_text, social_story, display_banner, email_header.

---

## Generating Video

> "Create a 6-second brand video — the product emerging from darkness into warm studio light."
> "Make a social story video, vertical, showing the product in motion."
> "Animate this image." *(after loading an image to canvas)*

Vince queues the render (1–3 minutes) and the video appears in the Creative Studio library when ready.

**Duration options:** 4, 6, or 8 seconds only — no other values.
**Quality:** Vince defaults to Fast (~$0.80). Ask for Quality (~$2.00) for better cinematic output.

> "Use the quality model for this one — it's for the hero reel."

---

## Person-in-Scene

Put a real person into a campaign — headshot preserved, scene changed.

**Step 1: Upload the headshot**
Drag a photo into the chat (or use the upload button). Then:
> "Put me in this campaign."
> "Place this person in a professional environment — natural light, office backdrop."
> "Use this headshot — I want a LinkedIn hero shot, editorial feel."

Vince places the face into the described scene using Gemini's image editing model. Your actual face is preserved exactly — not regenerated. The background, lighting, and environment change around it.

**Step 2: Wrap a campaign around it**
Once the headshot scene is generated, Vince automatically builds a creative package using that image:
> "Now build a LinkedIn campaign around this shot."

The package comes back with the preserved headshot as the anchor image, with campaign copy written around it.

**Things that work well:**
- Professional headshots with clear face, neutral background
- "Put me in a boardroom, warm light, shallow depth of field"
- "Studio product shoot environment — make it feel like a tech brand hero"

**Things that don't work:**
- Group photos (Vince focuses on one face)
- Very low-resolution source photos
- Requesting both a new headshot scene AND a full interleaved package in one voice command — Vince handles these as two sequential steps

---

## Campaigns Archive

Every creative package Vince generates is permanently saved in the **Campaigns tab**.

**Browse past campaigns:**
> "Show me the campaigns we've generated."

Or click the Campaigns tab directly — it shows a mosaic of all generated packages with brand name, timestamp, and alignment score.

**Download a campaign:**
Click any campaign → **Download ZIP**. The ZIP is organized by deliverable:
```
01-linkedin-post.txt
01-linkedin-post.jpg
02-product-shot.txt
02-product-shot.jpg
03-social-story.txt
03-social-story.jpg
```
Ready for handoff to a client or production team.

**Find the conversation that created a campaign:**
Each campaign card links back to the original conversation brief. Click **View Brief** to see what was said.

---

## Competitive Intelligence

> "Here's a competitor's ad: [YouTube URL]. Analyze it."
> "Beat this Apple ad: [URL]"

Vince analyzes the video and returns: competitor summary, key messages, visual style, target audience, weaknesses, and three counter-campaign directions with taglines.

The orange Competitive Intel card appears in the conversation when analysis is complete. Each direction is clickable — selecting one hands the brief directly to Vince.

**Pick a direction before asking for assets:**
> "Let's go with direction 2."

Then Vince generates the counter-campaign package.

**While Vince is analyzing (30–60 seconds):** the voice session stays open. Keep talking — Vince will update you when the analysis is complete.

---

## Brand Knowledge & Governance

### Brand coaching
Get Vince to brief you on a brand the way a creative director would brief a new team member:
> "Walk me through this brand."
> "Give me the full brand story — visual identity, photography rules, tone."
> "Brief me on the photography standards before we shoot."

Vince narrates the brand DNA from memory — not reading back the style guide verbatim, but interpreting it. Use this before a new campaign or when onboarding someone to a brand.

### Check brand profile status
> "What's in our brand DNA?"
> "Show me our photography standards."
> "What does our brand profile say about LinkedIn?"

### Recall specific rules
> "What are the rules for product photography?"
> "Are there any color restrictions I should know about?"
> "What's our tone of voice for social media?"

### Generate or refresh guardrails
> "Generate brand guardrails for photography."
> "Build governance directives for all six areas."

These are saved as inactive for review. Activate them in the AI Guidelines panel.

---

## Using Vince on Mobile (iOS / Android)

The iOS app gives you Vince's full voice interface in the field.

**The workflow:**
1. Open the app, pick your brand
2. Tap the mic — voice session starts immediately
3. Brief a campaign out loud while you're walking, commuting, or between meetings
4. Say "I'll review it at my desk" — Vince queues the generation
5. Open the web app later — the campaign is in your Campaigns tab, already synced

**What works well on mobile:**
- Starting brand conversations and briefings on the go
- Pasting a competitor YouTube URL mid-conversation
- Triggering campaign generation while away from a desk

**iOS note:** Screen recording and live WebRTC audio can't be captured simultaneously (iOS hardware restriction). If you need to record a demo, record your voice externally and capture screen separately.

---

## Using Vince in the Chrome Extension

Install the Chrome extension and Vince is available as a side panel on any page.

**Open it:** Click the Vince icon in your browser toolbar. The panel slides in without leaving your current page.

**The "brand travels with the prompt" workflow:**
1. Open the extension alongside Gemini, Claude, Firefly, or any AI tool
2. Ask Vince to generate a brand-compliant prompt for what you're about to do
3. Copy the prompt from the extension panel
4. Paste it into whatever AI tool you're using
5. Your brand DNA is now in the prompt — without you having to write it from scratch

**Good extension use cases:**
> "Generate a brand-compliant prompt for a LinkedIn post about our product launch."
> "What's our photography style guide in two sentences?"
> "Give me a quick copy prompt for a campaign headline — upscale, editorial tone."

The extension has full voice mode and full chat mode. Brand context is always live from your loaded brand.

---

## Finding Past Work

> "Show me what we generated this week."
> "What images did we make yesterday?"
> "Show me only video generations."
> "Find the last hero shot we made."

Results appear as a thumbnail grid in chat. From there:
- **Canvas** — loads the image to the canvas
- **Iterate** — starts an edit session on that image

---

## Tips for Better Results

**Be specific about the feeling, not just the subject.**
"A hero shot of the sandwich" is okay. "A hero shot of the sandwich — dramatic side lighting, dark background, steam rising, shallow depth of field, editorial food photography feel" is much better.

**Tell Vince the channel.**
"This is for LinkedIn" or "Instagram story" changes composition, aspect ratio, and how much negative space Vince leaves for text.

**Let Vince check references first.**
If you're generating a known product, ask "what product references do we have?" before generating. This ensures faithful reproduction.

**For campaigns, give a brief — not a list of specs.**
"Build a campaign for the product launch targeting premium consumers who value quality over price, feeling of exclusivity and craft" gives Vince room to make creative decisions. A list of specs produces mechanical output.

**Iterate conversationally.**
Don't restart the prompt when you want a change. Say what you want changed. Vince holds context and makes targeted edits.

**Save prompts that work.**
When Vince generates something you love, say "save that prompt." It goes into the template library for reuse.

---

## What Vince Can't Do (Yet)

- **Tell you which brand guardrails are currently active** — use the AI Guidelines panel in the UI
- **Add a reference image mid-conversation** — use the brand reference manager in the UI
- **Give a cost estimate before generating** — quota remaining is available, dollar cost is not

---

## Quick Reference: Things to Say

| Goal | Say this |
|------|----------|
| Set up a brand | "Add [Brand] to the system — website is [url]" |
| Import guidelines | Upload file, then "Process this brand doc" |
| Full brand setup | "Run the full playbook" |
| Single image | "Generate a [description] for [channel]" |
| Campaign | "Build a creative package for [brief]" |
| Person-in-scene | Upload headshot, then "Put me in this campaign" |
| Edit an image | "Make it [change]" |
| Find past work | "Show me what we made this week" |
| Browse campaigns | Open the Campaigns tab |
| Download campaign | Campaigns tab → any card → Download ZIP |
| Iterate on past work | "Find that [description] — I want to refine it" |
| Video | "Create a [duration]-second video — [scene description]" |
| Competitive counter | "Beat this ad: [YouTube URL]" |
| Brand coaching | "Walk me through this brand" |
| Brand rules | "What are our rules for [topic]?" |
| Save a prompt | "Save that prompt as [name]" |
| Brand-compliant prompt (extension) | "Generate a prompt for [task]" → copy → paste anywhere |
