# API Reference

All backend logic runs as Supabase Edge Functions (Deno runtime). There are no traditional REST routes in the frontend — the React app calls these functions directly via the Supabase client or `fetch`.

**Base URL:** `https://<project-ref>.supabase.co/functions/v1/`

**Authentication:** All functions deploy with `verify_jwt: false`. Authentication is handled by passing the Supabase anon key as a Bearer token in the `Authorization` header (standard Supabase JS client behavior). `user_id` is passed in the request body for attribution.

**All functions accept:** `Content-Type: application/json`, `POST` method unless noted.

---

## Image Generation

### POST `/generate-creative-image`

**Purpose:** Generate images via text-to-image, image editing, upscaling, virtual try-on, or product recontext.

**Code Location:** `supabase/functions/generate-creative-image/index.ts`

**Request Body:**
```json
{
  "generation_type": "text_to_image | image_edit | inpainting | upscaling | virtual_try_on | product_recontext | multi_turn_edit",
  "prompt": "string",
  "prompt_strength": 0.8,
  "negative_prompt": "string",
  "image_url": "https://...",
  "mask": "base64-or-url",
  "reference_images": [
    {
      "image": "https://...",
      "media_resolution": "string",
      "reference_intent": "subject | style | structure | logo",
      "reference_type": "product | character | style | environment"
    }
  ],
  "brand_id": "uuid",
  "model_id": "string",
  "aspect_ratio": "1:1 | 16:9 | 9:16 | 4:3",
  "seed": 12345,
  "num_images": 1,
  "safety_filter_level": "string",
  "thinking_enabled": false,
  "grounding_metadata": { "places": [], "things": [], "people": [] },
  "raw_parameter": {},
  "user_id": "uuid"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "image_urls": ["https://..."],
  "image_count": 1,
  "latency_ms": 4200,
  "model": "imagen-3.0-generate-002",
  "cost": 0.04
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

**Business Rules:**
- `generation_type` determines which Gemini/Vertex AI model and API path is used
- `upscaling`, `virtual_try_on`, and `product_recontext` use Vertex AI; all others use Gemini API
- `brand_id` triggers brand DNA injection into the prompt context
- `num_images` defaults to 1 if not specified

---

### POST `/generate-creative-video`

**Purpose:** Generate video via text-to-video, image-to-video, keyframe, scene extension, or reference image methods.

**Code Location:** `supabase/functions/generate-creative-video/index.ts`

**Request Body:**
```json
{
  "generation_type": "text_to_video | image_to_video | keyframe | scene_extension | reference_image",
  "prompt": "string",
  "image_url": "https://...",
  "aspect_ratio": "16:9 | 9:16 | 1:1",
  "duration": 5,
  "reference_images": [{ "image": "https://...", "reference_intent": "subject" }],
  "brand_id": "uuid",
  "model_id": "string",
  "raw_parameter": {},
  "user_id": "uuid"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "video_url": "https://...",
  "latency_ms": 45000,
  "model": "veo-3.0-generate-preview"
}
```

**Notes:** Video generation is long-running. Latency is typically 30–90 seconds.

---

### POST `/generate-header-image`

**Purpose:** Generate hero/header images for the Creative Studio interface.

**Code Location:** `supabase/functions/generate-header-image/index.ts`

**Request Body:**
```json
{
  "brand_id": "uuid",
  "style": "string",
  "user_id": "uuid"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "image_url": "https://..."
}
```

---

### POST `/generate-brand-card-images`

**Purpose:** Generate stylized 3D icon images for brand welcome cards in the Creative Studio UI.

**Code Location:** `supabase/functions/generate-brand-card-images/index.ts`

**Request Body:**
```json
{
  "brand_id": "uuid",
  "card_key": "brand_dna | ai_guidelines | generation_prompt | templates | brand_agent | art_direction",
  "primary_color": "#hex",
  "secondary_color": "#hex"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "image_url": "https://..."
}
```

---

### POST `/generate-studio-welcome-images`

**Purpose:** Generate editorial-quality images for the system welcome cards shown on the Creative Studio main screen.

**Code Location:** `supabase/functions/generate-studio-welcome-images/index.ts`

**Notes:** Reads prompts from the `studio_welcome_image_prompts` Supabase table. Supports both Gemini and Imagen models.

---

## Brand Analysis

### POST `/analyze-brand-website`

**Purpose:** Crawl a brand's website, extract visual and messaging identity, and return structured brand analysis.

**Code Location:** `supabase/functions/analyze-brand-website/index.ts`

**Request Body:**
```json
{
  "brand_id": "uuid",
  "website_url": "https://brand.com",
  "analysis_directives": "optional extra instructions",
  "user_id": "uuid",
  "include_subpages": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "analysis": {
    "brand_identity": {
      "tagline": "string",
      "brand_values": ["string"],
      "messaging": "string",
      "logo_description": "string"
    },
    "color_profile": {
      "dominant_colors": ["#hex"],
      "accent_colors": ["#hex"],
      "overall_tone": "warm | cool | neutral",
      "saturation_level": "vibrant | muted | desaturated"
    },
    "typography": {
      "heading_font": "string",
      "body_font": "string",
      "style_description": "string"
    },
    "tone_of_voice": {
      "formality": "string",
      "personality": "string",
      "energy": "string",
      "dos": ["string"],
      "donts": ["string"]
    },
    "visual_identity": "string",
    "key_pages_content": ["string"],
    "metadata": {}
  },
  "total_pages_crawled": 5
}
```

---

### POST `/analyze-brand-images`

**Purpose:** Extract structured visual metadata from brand images — camera settings, lighting, composition, color, subject, and mood. Also supports logo analysis.

**Code Location:** `supabase/functions/analyze-brand-images/index.ts`

**Request Body:**
```json
{
  "brand_id": "uuid",
  "image_urls": ["https://..."],
  "analysis_directives": "optional extra instructions",
  "brand_category": "food | outdoor-apparel | healthcare | ...",
  "user_id": "uuid",
  "image_category_overrides": { "https://logo.png": "logo" },
  "add_to_logo_library": false
}
```

**Success Response (200) — Photo analysis:**
```json
{
  "success": true,
  "analyses": [
    {
      "image_url": "https://...",
      "camera_settings": {
        "estimated_aperture": "f/2.8",
        "focal_length": "85mm",
        "depth_of_field": "shallow",
        "shutter_speed_feel": "frozen"
      },
      "lighting": {
        "direction": "side",
        "quality": "soft",
        "color_temperature": "warm",
        "key_fill_ratio": "3:1",
        "lighting_type": "natural"
      },
      "composition": {
        "rule_of_thirds": true,
        "leading_lines": false,
        "framing": "environmental",
        "symmetry": false,
        "negative_space": "heavy"
      },
      "color_palette": {
        "dominant_colors": ["#hex"],
        "accent_colors": ["#hex"],
        "overall_tone": "warm",
        "saturation_level": "vibrant"
      },
      "subject": {
        "category": "product",
        "position": "center-left",
        "styling_details": "string",
        "textures": ["matte", "wood"],
        "materials": ["ceramic"]
      },
      "mood": {
        "overall_mood": "calm",
        "energy_level": "low",
        "formality": "casual"
      },
      "tags": ["outdoor", "lifestyle"]
    }
  ]
}
```

**Success Response (200) — Logo analysis:**
```json
{
  "logo_type": "wordmark | lettermark | icon | combination | emblem | abstract",
  "brand_colors": [{ "hex": "#hex", "role": "primary | secondary | accent", "name": "Cobalt" }],
  "color_count": 2,
  "background": "transparent | white | dark | colored",
  "composition": { "orientation": "horizontal", "complexity": "simple", "symmetry": true },
  "typography_in_logo": { "has_text": true, "font_style": "sans-serif", "weight": "bold", "case": "uppercase" }
}
```

---

### POST `/analyze-brand-documents`

**Purpose:** Analyze brand documents (PDFs, PPTX, text) to extract brand story, standards, and identity guidelines.

**Code Location:** `supabase/functions/analyze-brand-documents/index.ts`

**Request Body:**
```json
{
  "brand_id": "uuid",
  "document_urls": ["https://..."],
  "user_id": "uuid",
  "analysis_directives": "optional extra instructions"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "analysis": {
    "brand_story": {
      "narrative_summary": "string",
      "mission_vision": "string",
      "heritage": "string"
    },
    "brand_standards": {
      "color_system": "string",
      "typography_system": "string",
      "logo_system": "string"
    },
    "brand_identity": {},
    "tone_of_voice": {}
  },
  "documents_processed": 2
}
```

---

### POST `/analyze-competitor-video`

**Purpose:** Analyze a video for competitive intelligence or self-critique. Supports YouTube URLs and direct video URLs.

**Code Location:** `supabase/functions/analyze-competitor-video/index.ts`

**Request Body:**
```json
{
  "video_url": "https://youtube.com/... or direct video URL",
  "brand_id": "uuid",
  "analysis_context": "optional context string",
  "mode": "competitor | self_critique"
}
```

**Success Response (200) — `competitor` mode:**
```json
{
  "success": true,
  "analysis": {
    "competitor_summary": "string",
    "key_messages": ["string"],
    "visual_style": "string",
    "target_audience": "string",
    "emotional_hooks": ["string"],
    "weaknesses": ["string"],
    "scenes": [
      {
        "timestamp": "0:12",
        "scene_type": "product demo",
        "emotional_signal": "excitement",
        "marketing_intent": "awareness"
      }
    ],
    "campaign_directions": [
      {
        "title": "Campaign Name",
        "concept": "string",
        "emotional_angle": "string",
        "tagline": "string"
      }
    ],
    "counter_brief": "string",
    "counter_deliverables": [
      {
        "name": "Hero Video",
        "description": "string",
        "deliverable_type": "video",
        "aspect_ratio": "16:9"
      }
    ]
  },
  "latency_ms": 8200,
  "model": "gemini-2.0-flash"
}
```

**Success Response (200) — `self_critique` mode:**
```json
{
  "success": true,
  "mode": "self_critique",
  "analysis": {
    "product_summary": "string",
    "ux_observations": ["string"],
    "missed_opportunities": ["string"],
    "demo_narrative_issues": ["string"],
    "recommended_improvements": ["string"],
    "demo_score": 7
  },
  "latency_ms": 6100
}
```

---

### POST `/analyze-expansion-direction`

**Purpose:** Recommend the best direction (left/right/top/bottom) to expand an image for outpainting, based on composition analysis.

**Code Location:** `supabase/functions/analyze-expansion-direction/index.ts`

**Request Body:**
```json
{
  "image_url": "https://...",
  "brand_id": "uuid"
}
```

**Success Response (200):**
```json
{
  "direction": "left | right | top | bottom",
  "reasoning": "string"
}
```

---

## Brand Intelligence

### POST `/synthesize-brand-profile`

**Purpose:** Merge website, image, and document analysis results into a unified brand DNA profile and persist it to the `brand_profiles` table.

**Code Location:** `supabase/functions/synthesize-brand-profile/index.ts`

**Request Body:**
```json
{
  "brand_id": "uuid"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "profile": {
    "visual_dna": {
      "signature_style": "string",
      "key_differentiators": ["string"],
      "visual_principles": ["string"],
      "dos": ["string"],
      "donts": ["string"]
    },
    "photography_style": {
      "preferred_aperture": "f/2.8",
      "focal_length": "85mm",
      "lighting": "natural side",
      "color_temperature": "warm",
      "depth_of_field": "shallow",
      "film_stock": "Kodak Portra 400"
    },
    "color_profile": {
      "mandatory_colors": ["#hex"],
      "forbidden_colors": ["#hex"],
      "palette_relationships": "string",
      "overall_tone": "string"
    },
    "composition_rules": {},
    "product_catalog": {},
    "brand_identity": {},
    "tone_of_voice": {},
    "typography": {},
    "brand_story": {},
    "brand_standards": {}
  },
  "latency_ms": 3400
}
```

---

### POST `/extract-product-catalog`

**Purpose:** Extract structured product catalog from a URL and merge it into the brand profile's `product_catalog` field.

**Code Location:** `supabase/functions/extract-product-catalog/index.ts`

**Request Body:**
```json
{
  "brand_id": "uuid",
  "catalog_url": "https://brand.com/products",
  "user_id": "uuid"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "product_count": 12,
  "products": [
    {
      "name": "Product Name",
      "category": "string",
      "description": "string",
      "use_case": "string",
      "styling_rules": "string"
    }
  ]
}
```

**Business Rules:**
- Only updates `product_catalog` in the brand profile — does not overwrite other fields.

---

### POST `/generate-brand-guardrails`

**Purpose:** Generate brand guardrails (rules, dos, don'ts) from the brand intelligence profile.

**Code Location:** `supabase/functions/generate-brand-guardrails/index.ts`

**Request Body:**
```json
{
  "brand_id": "uuid"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "guardrails": {
    "rules": ["string"],
    "forbidden_combinations": ["string"],
    "required_elements": ["string"],
    "dos": ["string"],
    "donts": ["string"]
  }
}
```

---

### POST `/generate-brand-starters`

**Purpose:** Generate 8–15 brand-specific Director Mode quick starters from the brand DNA.

**Code Location:** `supabase/functions/generate-brand-starters/index.ts`

**Request Body:**
```json
{
  "brand_id": "uuid"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "starters": [
    {
      "name": "Hero Product Shot",
      "description": "string",
      "category": "product",
      "prompt_template": "string with {{variable}} tokens",
      "variable_fields": [
        {
          "key": "product_name",
          "label": "Product Name",
          "type": "text",
          "options": null,
          "default_value": "",
          "required": true
        }
      ],
      "camera_preset": {
        "aperture": "f/2.8",
        "focal_length": "85mm",
        "color_temperature": "warm",
        "lighting_setup": "natural window",
        "depth_of_field": "shallow",
        "film_stock": "Kodak Portra 400",
        "composition": "rule of thirds",
        "shot_type": "medium"
      }
    }
  ]
}
```

---

## Agent & Prompt Functions

### POST `/brand-prompt-agent`

**Purpose:** Conversational AI agent with tool calling. Handles chat messages, brand analysis requests, image/video generation, and prompt library management.

**Code Location:** `supabase/functions/brand-prompt-agent/index.ts`

**Request Body:**
```json
{
  "message": "string",
  "brand_id": "uuid",
  "conversation_id": "uuid",
  "user_id": "uuid",
  "image_urls": ["https://..."],
  "raw_tool_use": false,
  "conversation_history": [
    { "role": "user", "content": "string" },
    { "role": "assistant", "content": "string" }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "response": "Assistant message text",
  "tool_calls": [
    {
      "toolName": "generate_image",
      "args": { "prompt": "...", "aspect_ratio": "16:9" },
      "result": { "image_urls": ["https://..."] },
      "success": true
    }
  ],
  "usage": {
    "promptTokens": 1200,
    "completionTokens": 340
  }
}
```

**Available Tools (Gemini function calling):**

| Tool | Description |
|------|-------------|
| `save_prompt_template` | Save a prompt to the brand's library |
| `search_prompt_library` | Find templates by name or category |
| `analyze_brand_image` | Extract visual metadata from image URLs |
| `get_brand_profile` | Retrieve current brand DNA |
| `list_available_models` | Get model list with capabilities and costs |
| `generate_image` | Create image (delegates to `generate-creative-image`) |
| `generate_creative_package` | Create copy + image package |
| `analyze_competitor_content` | Video analysis for competitive intelligence |
| `generate_video` | Create video |
| `check_generation_quota` | Verify remaining generation quota |

---

### POST `/generate-brand-prompt`

**Purpose:** Generate a single on-brand prompt from live Creative Studio Brand DNA using Gemini.

**Code Location:** `supabase/functions/generate-brand-prompt/index.ts`

**Request Body:**
```json
{
  "description": "A lifestyle shot of our hiking boots",
  "category": "image | text | presentation | general",
  "platform": "Instagram",
  "brand_id": "uuid",
  "tone": "adventurous"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "prompt": "Full generated prompt string",
  "tone_applied": "adventurous",
  "brand_context": "string summary of brand context used"
}
```

---

### POST `/enhance-director-prompt`

**Purpose:** One-shot Gemini enhancement of Director Mode prompts using brand DNA.

**Code Location:** `supabase/functions/enhance-director-prompt/index.ts`

**Request Body:**
```json
{
  "brand_id": "uuid",
  "camera_preset": { "aperture": "f/5.6", "focal_length": "50mm" },
  "art_direction": "string",
  "mood": "string",
  "lighting": "string",
  "style": "string",
  "aspect_ratio": "16:9"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "enhanced": {
    "camera_preset": { "aperture": "f/2.8", "focal_length": "85mm" },
    "art_direction": "enhanced string",
    "mood": "enhanced string",
    "lighting": "enhanced string",
    "style": "enhanced string",
    "aspect_ratio": "16:9"
  }
}
```

---

### POST `/generate-creative-package`

**Purpose:** Generate a complete creative package (headline + body copy + image) using Gemini interleaved output (TEXT and IMAGE modalities in a single response).

**Code Location:** `supabase/functions/generate-creative-package/index.ts`

**Request Body:**
```json
{
  "prompt": "Campaign concept description",
  "brand_id": "uuid",
  "num_images": 1,
  "aspect_ratio": "16:9",
  "include_copy": true,
  "headline_style": "punchy | descriptive | question",
  "body_copy_style": "short | paragraph",
  "user_id": "uuid"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "package": {
    "parts": [
      { "type": "headline", "content": "Headline text" },
      { "type": "body_copy", "content": "Body copy text" },
      { "type": "image", "content": { "url": "https://...", "width": 1920, "height": 1080 } }
    ],
    "image_urls": ["https://..."],
    "text_content": "Combined text",
    "latency_ms": 6200
  }
}
```

---

### POST `/synthesize-generation-prompt`

**Purpose:** Synthesize a structured generation prompt from all brand intelligence data.

**Code Location:** `supabase/functions/synthesize-generation-prompt/index.ts`

**Request Body:**
```json
{
  "brand_id": "uuid",
  "user_input": "optional user description"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "generation_prompt": "Full synthesized prompt string",
  "structured_data": {
    "subject": "string",
    "style": "string",
    "mood": "string",
    "technical": "string",
    "brand_requirements": "string"
  }
}
```

---

## Type Definitions

Core types used across API requests and responses are defined in `src/types/creative-studio.ts`.

Key types:
```typescript
// src/types/creative-studio.ts
type GenerationType =
  | 'text_to_image' | 'image_to_image' | 'image_edit' | 'inpainting'
  | 'outpainting' | 'upscaling' | 'product_recontext' | 'virtual_try_on'
  | 'multi_turn_edit' | 'object_remove' | 'object_insert' | 'background_swap'
  | 'text_to_video' | 'image_to_video' | 'keyframe_video' | 'ingredients_to_video'
  | 'json_prompt_video' | 'scene_extension' | 'creative_package' | 'brand_card';

type BrandCategory =
  | 'food' | 'outdoor-apparel' | 'healthcare' | 'automotive'
  | 'beauty' | 'retail' | 'financial' | 'technology';

interface CreativeStudioModel {
  id: string;
  name: string;
  model_id: string;
  model_type: 'image' | 'video';
  provider: string;
  capabilities: ModelCapability[];
  parameters: ModelParameters;
  cost_per_generation: number;
  is_active: boolean;
  is_default: boolean;
}
```
