# Person-in-Scene: Headshots & Video with a Real Person

How to place a specific person's face and likeness into AI-generated images and videos using Vince.

---

## The Problem This Solves

Standard image/video generation tools create fictional people. When you upload a headshot and ask Vince to "put me in this scene," the default generation tools (`generate_image`, `generate_creative_package`, `generate_video`) cannot reproduce a specific real person's face — they generate a plausible stand-in.

`generate_headshot_scene` exists specifically to solve this using Gemini's image editing model with face-preservation constraints.

---

## Tool: `generate_headshot_scene`

**Model:** `gemini-3.1-flash-image-preview` with `responseModalities: ['IMAGE']`

**What it does:** Takes a reference photo and a scene description, returns a new image with the same face placed into the described scene. Background, clothing context, environment, and lighting change; facial features, skin tone, eye color, and hair style are preserved.

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `photo_url` | Yes | URL of the reference photo (Supabase storage or public URL) |
| `scene_description` | Yes | Vivid description of the target environment, setting, lighting, mood |
| `aspect_ratio` | No | Default `4:5`. Supports standard ratios. |

### Example prompt to Vince

> "Put me in a modern conference room in business casual attire, soft window lighting, professional headshot style"

> "Place me at a rooftop event in NYC at golden hour, wearing a blazer, candid style"

### Auto-injection

If you have uploaded a reference photo in the conversation (the chat shows `[Reference images uploaded by user: ...]`), Vince will automatically use that URL as `photo_url` — you don't need to paste the URL manually.

---

## Video With a Real Person: Two-Step Flow

Veo cannot directly accept a face reference and preserve identity. The workaround is a two-step chain:

```
generate_headshot_scene(photo_url, scene_description)
  → [returns output_url: a generated still with your face in it]

generate_video(generation_type="image_to_video", input_image_url=<output_url>)
  → [animates the still — your face is preserved because it was in the starting frame]
```

Vince is instructed to perform this chain automatically when you ask to appear in a video and have a headshot uploaded. You can also trigger it explicitly:

> "Make a video of me walking into that conference room — use my headshot"

---

## Reference Images in Video (`referenceImages`)

`generate_video` also supports a `reference_images` parameter, which passes images to Veo as reference subjects via the `referenceImages` API field (placed in the `instances` payload, not `parameters`). This is a secondary approach — useful for brand ingredients (logos, products) but less reliable for face preservation than the two-step headshot flow.

When `reference_image_url` is set, Vince passes it to `generate-creative-video` which converts the URL to base64 and includes it as a `referenceType: "asset"` in the Veo request.

---

## Known Limitations & Behavior

| Issue | Status |
|-------|--------|
| Face preservation is best-effort — Gemini safety filters may block images with prominent faces if the prompt or image triggers a safety threshold | Active; see Supabase logs for `finishReason`/`blockReason` |
| Gemini may return `SAFETY` finish reason with no image even for benign professional portraits | Mitigated by clear professional prompts; avoid ambiguous language |
| Headshot filename matters — uploading a file named `klm.jpg` may cause Vince to interpret "KLM" as an airline brand name | Rename headshot files to `headshot.jpg`, `portrait.jpg`, or your name |
| `generate_creative_package` cannot place a specific person's face — Vince warned via tool description | Tool description includes a WARNING to prefer `generate_headshot_scene` when a reference photo is in context |
| Large photos (phone camera JPEGs, ~4–8MB) previously caused timeout in base64 conversion | Fixed 2026-03-14: switched to chunked 8192-byte conversion |

---

## Prompting Tips

**For best face preservation:**
- Keep the scene description professional and clear
- Mention lighting style (soft, natural, studio, golden hour)
- Mention clothing context (business casual, blazer, casual) — this guides the model without instructing it to change the face
- Avoid language that could be interpreted as altering facial features ("make me look younger", "change my expression")

**For video:**
- Let Vince do the two-step chain — don't try to pass a headshot URL directly to `generate_video`
- The scene description for `generate_headshot_scene` should match the environment you want in the video
- Use 8-second duration for video; the first ~2 seconds are often the clearest frame

---

## Debugging

If `generate_headshot_scene` fails, Vince will say something like "I ran into an issue generating that headshot scene." Check Supabase edge function logs (`brand-prompt-agent`) for a line matching:

```
[generateHeadshotScene] No image returned. finishReason: ... | blockReason: ...
```

Common values:
- `finishReason: SAFETY` — Gemini safety filter triggered; try rephrasing the scene description
- `finishReason: MAX_TOKENS` — response too long (unlikely for image-only mode)
- `blockReason: SAFETY` — prompt itself was blocked; simplify the scene description
- HTTP 400/500 — API key, model name, or request format issue

---

## Implementation Notes

- Function: `brand-prompt-agent/index.ts` → `generateHeadshotScene()`
- Photo download: Uses Supabase service-role storage client for `creative-studio` bucket URLs; bare `fetch()` fallback for external URLs
- Base64 conversion: Chunked 8192-byte loop (avoids O(n²) string concatenation on large images)
- Output storage path: `creative-studio/headshot-scenes/{user_id}/{timestamp}-{random}.{ext}`
- Gemini endpoint: `gemini-3.1-flash-image-preview:generateContent`
- Response modality: `IMAGE` only (text disabled — required for reliable face reproduction)
