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
> "Use the product reference collection for the BMT sandwich."
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

## Competitive Intelligence

> "Here's a competitor's ad: [YouTube URL]. Analyze it."
> "Beat this Apple ad: [URL]"

Vince analyzes the video and returns: competitor summary, key messages, visual style, target audience, weaknesses, and three counter-campaign directions.

**Pick a direction before asking for assets:**
> "Let's go with direction 2."

Then Vince generates the counter-campaign.

---

## Brand Knowledge & Governance

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

- **Check the status of a video render in progress** — videos are fire-and-forget; check the library for completion
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
| Edit an image | "Make it [change]" |
| Find past work | "Show me what we made this week" |
| Iterate on past work | "Find that [description] — I want to refine it" |
| Video | "Create a [duration]-second video — [scene description]" |
| Competitive counter | "Beat this ad: [YouTube URL]" |
| Brand rules | "What are our rules for [topic]?" |
| Save a prompt | "Save that prompt as [name]" |
