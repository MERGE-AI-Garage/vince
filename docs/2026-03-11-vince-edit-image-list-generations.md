# Vince: edit_image + list_generations

Two new tools added 2026-03-11 that let Vince edit existing images conversationally and recall past generations.

---

## What problem do these solve?

Previously, Vince could generate images but couldn't touch them afterward. If you wanted to refine a shot — warmer light, different background, adjusted composition — you had to re-prompt from scratch and hope for the same result. There was also no way to ask Vince what had been generated in a previous session.

These two tools fix both gaps.

---

## edit_image

Lets Vince make targeted changes to an existing image, one instruction at a time, while maintaining visual context across multiple refinements.

**How it works:** Vince sends the image and your instruction to Gemini 3.1 Flash Image. Gemini edits the image and returns both the result and a "thought signature" — an encrypted snapshot of its reasoning state. On the next edit, Vince passes that signature back so Gemini picks up exactly where it left off.

**Model used:** Gemini 3.1 Flash Image Preview — faster than Pro Image, purpose-built for iterative editing.

### Example conversation

> **User:** Generate a hero shot of the MERGE office entrance.
>
> **Vince:** *(generates image)*
>
> **User:** Make the lighting warmer — more golden hour.
>
> **Vince:** *(calls edit_image → returns warmer version)*
>
> **User:** Now add a subtle lens flare from the upper left.
>
> **Vince:** *(calls edit_image with thought signature → continues from previous edit)*
>
> **User:** Perfect. Load it to the canvas.
>
> **Vince:** *(loads to canvas)*

Each edit builds on the last. Vince doesn't restart — it knows the full edit history.

### What Vince needs to call it

| Parameter | Required | What it is |
|-----------|----------|------------|
| input_image_url | Yes | URL of the image to edit |
| instruction | Yes | What to change ("make it darker", "remove the text") |
| thought_signature | No | From the previous edit — enables continuity |
| aspect_ratio | No | Output ratio, defaults to match input |

### What it returns

The edited image URL, a new thought signature for the next turn, Gemini's text response describing what it changed, and the generation ID for the record.

---

## list_generations

Lets Vince look up past image and video generations for the current brand, so the user can find, review, and iterate on previous work.

**How it works:** Queries the generation history database filtered to the current brand and user, returns thumbnails with prompts and metadata.

### Example conversations

> **User:** Show me what we generated this week.
>
> **Vince:** *(calls list_generations → thumbnail grid appears in chat)*

> **User:** Find that product shot we made yesterday — I want to iterate on it.
>
> **Vince:** *(calls list_generations with since="yesterday" → user clicks Iterate on the thumbnail → edit_image session begins)*

> **User:** What have we made for video so far?
>
> **Vince:** *(calls list_generations with generation_type="video")*

### What Vince needs to call it

| Parameter | Required | What it is |
|-----------|----------|------------|
| limit | No | How many results (default 10, max 20) |
| generation_type | No | Filter: text_to_image, multi_turn_edit, video, or all |
| since | No | Date filter — e.g. "2026-03-10" for anything after that date |

### What it returns

A grid of past generations, each showing: thumbnail, prompt snippet, model used, date, and estimated cost.

---

## Iterate Flow (end to end)

The two tools chain together to enable a complete "find and refine" workflow entirely inside Vince — no switching to a separate editor.

**Step 1 — Find it:**
> "Show me what we made last Tuesday"
> Vince calls list_generations → thumbnail grid in chat

**Step 2 — Pick it:**
> User clicks "Iterate" on a thumbnail
> Vince receives the image URL and asks what to change

**Step 3 — Refine it:**
> "Make the background darker and more dramatic"
> Vince calls edit_image → edited result in chat

**Step 4 — Keep going:**
> "Now shift it to golden hour"
> Vince calls edit_image again with the thought signature — continues from exactly where it left off

**Step 5 — Use it:**
> User clicks "Load to Canvas" on the final result
> Image loads into the Creative Studio canvas

---

## UI Changes in BrandAgentApp

| What changed | Detail |
|---|---|
| Edited image display | Renders as image card with Load to Canvas + Open full size on hover |
| Generation history display | 2-column thumbnail grid; hover reveals prompt snippet, Canvas button, and Iterate button |
| Load to Canvas on single images | Was missing from generate_image results — now matches packages and videos |
| Voice tool indicators | "Editing image..." and "Loading past generations..." added |

---

## Files Changed

| File | What changed |
|------|-------------|
| supabase/functions/brand-prompt-agent/index.ts | Tool definitions, editImage() executor, listGenerations() executor, switch cases |
| src/components/creative-studio/BrandAgentApp.tsx | EditedImage + GenerationRecord types, text and voice result handlers, rendering for both tools |
