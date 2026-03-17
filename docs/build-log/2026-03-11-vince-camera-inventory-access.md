# Vince Camera Inventory Access

**Date:** 2026-03-11
**Status:** Complete ✓
**Hackathon context:** Gemini Live Agent Challenge

---

## Problem

Vince had no way to browse the Creative Studio's camera equipment inventory. The `creative_studio_camera_options` table holds camera bodies, lenses, film stocks, lighting setups, composition rules, color grades, and more — each with a hand-crafted `prompt_fragment` for direct injection into generation prompts. Vince knew none of it.

When a user asked to use specific equipment ("let's shoot this on the ZENZA Bronica"), Vince couldn't look it up, couldn't get its prompt fragment, and couldn't evaluate whether it fit the brand. He also never proactively selected equipment from inventory — he free-formed his own camera language, bypassing the curated options entirely.

**What Vince had:**
- `photography_style` from the synthesized brand profile
- Active brand directives / photography guardrails
- Brand visual DNA and composition rules

**What Vince was missing:**
- The camera/lens/film stock inventory from `creative_studio_camera_options`
- Instructions to behave like a creative director: pick cameras proactively, apply prompt fragments verbatim

---

## Context: Why Camera Choice Matters

Google's prompting guide for Nano Banana 2 (Gemini 3.1 Flash Image) is explicit: *camera choice changes the visual DNA of the image, not just metadata.* Specifying a GoPro, Fujifilm X100, or ARRI Alexa produces fundamentally different output. Prompts should read like a photography brief — camera, lens, lighting, film stock, and color grade specified together.

Vince is the creative director. He should make these calls, not wait to be asked.

---

## Solution

### `list_camera_options` tool

New tool added to `VINCE_TOOLS`. Queries `creative_studio_camera_options` filtered by category and/or media type, grouped by category with `prompt_fragment` for each option.

**Parameters:**
- `category` (optional): Filter to `camera_body`, `film_stock`, `focal_length`, `aperture`, `lighting`, `composition`, `depth_of_field`, `color_grade`, `film_effect`, `shot_type`, `print_process`, `color_temperature`, `frame_rate`
- `media_type` (optional): Filter to `still`, `video`, or `both`

**Returns:** `{ categories: { [category]: [{ name, slug, description, prompt_fragment, media_type }] }, total }`

### System prompt: CAMERA & EQUIPMENT section

New behavioral section added to `buildSystemPrompt` establishing Vince as the one who picks cameras:

- Before any generation, check inventory with `list_camera_options` and select equipment that serves the brief AND fits brand standards
- State the choice naturally — "Going with the ARRI Alexa here, the tonal range suits this brand's clean look"
- Only ask the user when there's a genuine creative fork worth weighing in on
- When the user requests specific equipment: look it up, apply the `prompt_fragment` if it fits guidelines
- When equipment conflicts: push back with concrete creative reasoning, not policy language — "The Bronica is gorgeous for medium format work, but this brand is built around crisp digital aesthetics"
- Use `prompt_fragment` from inventory verbatim in generation prompts, not a paraphrase

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/brand-prompt-agent/index.ts` | `list_camera_options` tool declaration in `VINCE_TOOLS`; `listCameraOptions()` executor function; `list_camera_options` case in `executeTool` switch; CAMERA & EQUIPMENT section in `buildSystemPrompt`; updated BEHAVIORAL RULES item 1 |

---

## Key Implementation Notes

- **`prompt_fragment` is the source of truth** — each equipment option has a hand-crafted prompt fragment. Vince uses it verbatim to ensure prompt consistency with what the UI camera controls would produce.
- **Brand guidelines take precedence** — Vince evaluates equipment against `photography_style` standards and active directives. A camera in inventory is not automatically approved for use; it still has to fit the brand.
- **No UI changes needed** — this is purely an agent capability change. The `creative_studio_camera_options` table already existed and was fully populated; we just exposed it to Vince.
- **Deploy requires `--no-verify-jwt`** — `brand-prompt-agent` is client-called and must always be deployed with this flag.

---

## Demo Talking Points

> "Vince knows our entire equipment room. He picks cameras the way a creative director would — based on the brief, the brand's visual DNA, and what he knows about what the model responds to."

**In-demo voice interaction:**
> "Vince, what cameras do we have to work with?"

Vince calls `list_camera_options()` and walks through the inventory — camera bodies, film stocks, lighting setups.

> "Let's try the ZENZA Bronica on this one."

Vince looks it up, evaluates it against brand guidelines, and either:
- Applies it: "The Bronica works here — medium format suits this editorial brief. Shooting at f/5.6 with Kodak Portra 400."
- Pushes back: "The Bronica is '80s medium format film — gorgeous camera, but this brand is built around clean contemporary digital. The grain would fight the look. Want to try the Contax T2 instead?"

---

## Testing Checklist

- [ ] "What cameras do we have?" → Vince calls `list_camera_options` (no filter) and describes the inventory
- [ ] "Generate a product shot" → Vince proactively calls `list_camera_options`, picks equipment, states his choice in the response
- [ ] "Let's use the ZENZA Bronica" → Vince looks it up and evaluates against brand guidelines
- [ ] "Shoot this on the ARRI Alexa" → Vince uses the Alexa's `prompt_fragment` verbatim in the generation prompt
- [ ] Equipment that violates brand photography standards → Vince pushes back with a creative reason, not policy language
