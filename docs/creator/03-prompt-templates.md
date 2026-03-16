# Prompt Templates and Quick Prompts

Vince gives you two ways to start quickly without writing a prompt from scratch: **Quick Prompts** on the welcome screen, and a full **Prompt Template Library** with pre-built, variable-filled templates.

---

## Quick Prompts

Quick Prompts are the fastest way to start. They appear as buttons on the welcome screen when you first load a brand.

<ScreenshotCard title="Welcome Screen" route="/" imagePath="/visual-manual/screenshots/02-homepage.png" />

Each quick prompt is a pre-written direction specific to your selected brand. Click one to instantly fill the prompt bar with that prompt — then hit Generate or edit it first.

**Examples of what you might see:**
- *"Product hero shot, clean white background"*
- *"Lifestyle campaign, warm tones, people in scene"*
- *"Bold social post, on-brand colors"*

> **CONFIRMED** — `src/components/creative-studio/WelcomeScreen.tsx`; `quick_prompts` field on brand object in `src/types/creative-studio.ts`

---

## Prompt Template Library

The Template Library is a searchable collection of detailed, reusable prompts. Unlike quick prompts, templates can include **variable fields** so you customize them before generating.

### How to Open the Template Library

1. Click the **Templates** button in the prompt bar area (book/library icon)
2. The Template Library panel slides in from the side

<ScreenshotCard title="Prompt Library" route="/vince" imagePath="/visual-manual/screenshots/07-vince-tab-prompts.png" />

> **CONFIRMED** — `src/components/creative-studio/PromptLibraryPanel.tsx`

---

### How to Browse Templates

- **Search:** Type keywords in the search bar to filter by name or description
- **Category filter:** Click a category chip to show only templates of that type (e.g., product, lifestyle, campaign)
- **Scroll** through the grid to browse all available templates



---

### How to Use a Template

1. Click a template card to see its details
2. If the template has **variable fields**, fill them in:
   - **Text fields** — type a value (e.g., product name, color)
   - **Select fields** — choose from a dropdown list
   - **Number fields** — enter a number (e.g., number of people)
3. Click **Apply** (or similar confirm button)



**What happens when you apply a template:**
- The prompt bar fills with the expanded, complete prompt
- If the template has a **camera preset**, those photography settings load automatically
- If the template has **reference images**, they are linked to your generation
- If the template recommends a specific model, that model is pre-selected

> **CONFIRMED** — `BrandPromptTemplate` interface in `src/types/creative-studio.ts` (variable_fields, locked_parameters, camera_preset_id, reference_collection_ids, recommended_model_id)

---

### Template Variable Fields

| Field Type | What it looks like | Example |
|------------|-------------------|---------|
| **Text** | A text input box | Product name: *"Alpine Boot"* |
| **Select** | A dropdown list | Season: *Summer / Fall / Winter / Spring* |
| **Number** | A number input | Number of people: *2* |

Fill in all required fields before applying — required fields are marked.

---

### Camera Presets in Templates

Some templates include a **camera preset** — a pre-configured set of photography settings. When the template loads, these settings apply automatically to your generation:

- Aperture
- Focal length
- Lighting setup
- Film stock
- Color temperature
- Composition style

You can adjust these after applying the template if needed — they're not locked.

> **CONFIRMED** — `src/components/creative-studio/CameraControlsPanel.tsx`; `camera_preset_id` field on `BrandPromptTemplate`

---

### Locked Parameters

Some templates include **locked parameters** — generation settings that the template author has fixed (such as aspect ratio or resolution) because they're important to the template's intended use.

Locked parameters appear grayed out or read-only in the Parameters panel.

> **CONFIRMED** — `locked_parameters` field on `BrandPromptTemplate` in `src/types/creative-studio.ts`

---

## Saving a New Template

You can save any prompt you've written as a template for future use.

1. Write a prompt you're happy with in the prompt bar
2. While in the voice interface with Vince Agent, you can ask:
   > *"Save this as a prompt template called [name]"*
3. Vince will save it to the template library for your brand

> **CONFIRMED** — `save_prompt_template` tool registered for the Vince agent in `src/components/creative-studio/BrandAgentApp.tsx`

---

## Template Library vs. Quick Prompts: Which to Use?

| | Quick Prompts | Template Library |
|---|---|---|
| **Speed** | Instant, one click | A few clicks + fill variables |
| **Customization** | Limited — prompt is fixed | High — fill in your own values |
| **Guidance** | Basic | Detailed, with presets and references |
| **Best for** | Fast starting point | Consistent, repeatable creative work |

---

## Tips for Writing Good Prompts

Even when not using templates, these principles help:

**Be specific about:**
- Subject (what is shown)
- Mood or feeling (energetic, calm, luxurious)
- Lighting (natural, studio, golden hour)
- Composition (centered, rule of thirds, close-up)
- Format (square, portrait, widescreen)

**Avoid:**
- Vague descriptions like "nice photo" or "good campaign"
- Contradictory instructions (e.g., "minimalist but complex")

**Reference the brand:**
- Vince already knows your brand's visual DNA — you don't need to repeat brand colors or fonts
- Say things like "on-brand" or "matching brand guidelines" to activate that knowledge
