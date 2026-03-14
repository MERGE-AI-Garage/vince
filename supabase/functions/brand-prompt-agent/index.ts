// ABOUTME: Conversational Brand Agent with tool calling — generates and saves prompts, analyzes images
// ABOUTME: Uses Gemini function calling to take real actions: save templates, search library, analyze brands

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';
import { trackUsage } from '../_shared/ai-usage-tracker.ts';
import { getEmbedding } from '../_shared/embedding-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Tool Declarations ──────────────────────────────────────────────────────
const VINCE_TOOLS = [
  {
    name: 'save_prompt_template',
    description: 'Save a prompt as a reusable brand template in the prompt library. Use when the user asks to save, bookmark, or remember a prompt, or when you create a prompt the user approves.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Short descriptive name (e.g., "Italian BMT Hero Shot")' },
        category: {
          type: 'string',
          enum: ['product', 'lifestyle', 'campaign', 'social', 'hero', 'editorial', 'cinematography'],
          description: 'Template category',
        },
        prompt_template: { type: 'string', description: 'The full prompt text to save' },
        description: { type: 'string', description: 'When and how to use this template' },
        camera_preset: {
          type: 'object',
          properties: {
            aperture: { type: 'number' },
            focal_length: { type: 'number' },
            shutter_speed: { type: 'string' },
            film_stock: { type: 'string' },
            lighting_setup: { type: 'string' },
            color_temperature: { type: 'number' },
            composition: { type: 'string' },
            depth_of_field: { type: 'string' },
          },
          description: 'Camera settings for this template',
        },
        recommended_model: { type: 'string', description: 'Recommended generation model' },
      },
      required: ['name', 'prompt_template'],
    },
  },
  {
    name: 'search_prompt_library',
    description: 'Search existing prompt templates by name, category, or keyword. Use to find templates before creating new ones, or when the user asks what prompts exist.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term to match against names and templates' },
        category: { type: 'string', description: 'Filter by category' },
        limit: { type: 'integer', description: 'Max results (default 10)', minimum: 1, maximum: 50 },
      },
    },
  },
  {
    name: 'analyze_brand_image',
    description: 'Analyze a reference image to extract visual metadata (camera settings, lighting, composition, color, mood). Use when the user provides an image URL for brand analysis or asks to analyze a photo.',
    parameters: {
      type: 'object',
      properties: {
        image_urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs of images to analyze',
        },
        context: { type: 'string', description: 'Additional context about what to look for in the images' },
      },
      required: ['image_urls'],
    },
  },
  {
    name: 'get_brand_profile',
    description: 'Retrieve the current brand visual DNA profile, including photography style, color profile, composition rules, product catalog, brand identity, tone of voice, and typography. Use when the user asks about brand profile status or visual DNA details.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_available_models',
    description: 'List available image generation models with their capabilities and costs. Use when models may have changed, or when the user explicitly asks what models are available. You already have model knowledge in your context — use this tool only when you need a fresh list.',
    parameters: {
      type: 'object',
      properties: {
        model_type: {
          type: 'string',
          enum: ['image', 'video'],
          description: 'Filter by model type. Defaults to image.',
        },
      },
    },
  },
  {
    name: 'check_generation_quota',
    description: 'Check the user\'s remaining generation quota. Use before generating to confirm quota is available, or when the user asks how many generations they have left.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'generate_image',
    description: 'Generate an image using the Creative Studio pipeline. Only call this AFTER the user has confirmed the prompt and you have checked quota. The generated images are saved to the user\'s library automatically.',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The full image generation prompt with all visual details, camera settings, and composition.',
        },
        model_id: {
          type: 'string',
          description: 'Model ID to use (e.g., "gemini-3-pro-image-preview"). If omitted, uses the system default.',
        },
        aspect_ratio: {
          type: 'string',
          enum: ['1:1', '16:9', '9:16', '4:3', '3:4'],
          description: 'Image aspect ratio. Infer from context (Instagram → 1:1, stories → 9:16, hero banner → 16:9). Default 1:1.',
        },
        num_outputs: {
          type: 'integer',
          description: 'Number of images to generate (1-4). Default 1. Use 2 when exploring looks.',
          minimum: 1,
          maximum: 4,
        },
        negative_prompt: {
          type: 'string',
          description: 'Things to avoid in the generated image.',
        },
        camera_preset: {
          type: 'object',
          properties: {
            aperture: { type: 'number' },
            focal_length: { type: 'number' },
            shutter_speed: { type: 'string' },
            film_stock: { type: 'string' },
            lighting_setup: { type: 'string' },
            color_temperature: { type: 'number' },
            composition: { type: 'string' },
            depth_of_field: { type: 'string' },
          },
          description: 'Camera settings for the generation.',
        },
        include_logo: {
          type: 'boolean',
          description: 'Set to true to inject the brand\'s official logo as a reference image. Use for social media posts, branded collateral, signage, packaging — any image that should display the logo. Do NOT use for lifestyle photography, product hero shots, food photography, or other images where the logo would be unnatural.',
        },
        reference_collections: {
          type: 'array',
          items: { type: 'string' },
          description: 'Collection names from brand reference library to include as reference images. Use list_brand_references to discover available collections. Character collections maintain person consistency across scenes. Product collections ensure faithful product reproduction.',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'list_brand_references',
    description: 'List available reference image collections for the current brand. Returns collections with their types (product, character, style, environment), image counts, and descriptions. Use when the user mentions a specific product, person, or wants consistent characters.',
    parameters: {
      type: 'object',
      properties: {
        reference_type: {
          type: 'string',
          enum: ['product', 'character', 'style', 'environment'],
          description: 'Filter by reference type. Omit to return all collections.',
        },
      },
    },
  },
  {
    name: 'generate_creative_package',
    description: 'Generate a complete creative package with interleaved text and images in a single call. Use this when the user asks for a campaign, a set of deliverables, or multiple assets at once. This generates ALL copy AND images together — much faster than generating images one by one. Returns alternating text blocks (headlines, body copy, strategy notes) and images. PREFER this over generate_image when the user wants a creative campaign or multiple deliverables. Use deliverable_type for common named formats (linkedin_post, product_shot_with_text, social_story, display_banner, email_header) — these include pre-built instructions for branded typography and layout rendered directly into the image. WARNING: Do NOT use this tool when the conversation contains "[Reference images uploaded by user: ...]" and the user wants their own face/likeness to appear in the output — use generate_headshot_scene instead, as this tool cannot reproduce a specific real person\'s face.',
    parameters: {
      type: 'object',
      properties: {
        brief: {
          type: 'string',
          description: 'The creative brief describing what to generate. Include target audience, deliverable types, tone, and any specific requirements.',
        },
        deliverables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Deliverable name (e.g., "Hero Banner"). Optional when deliverable_type is set — defaults to the type\'s standard name.' },
              description: { type: 'string', description: 'Additional context for what this deliverable should show. Optional when deliverable_type is set.' },
              aspect_ratio: {
                type: 'string',
                enum: ['1:1', '16:9', '9:16', '4:3', '3:4', '4:5', '8:1', '1:4'],
                description: 'Image format. Optional when deliverable_type is set — each type has a sensible default.',
              },
              deliverable_type: {
                type: 'string',
                enum: ['linkedin_post', 'product_shot_with_text', 'social_story', 'display_banner', 'email_header', 'tiktok_reel', 'instagram_feed_portrait', 'print_full_page', 'print_ooh_billboard', 'print_ooh_transit', 'print_direct_mail', 'print_collateral', 'banner_leaderboard', 'banner_skyscraper'],
                description: 'ALWAYS set this for any standard marketing format — it controls branded typography, layout, and naming. linkedin_post (4:3), product_shot_with_text (1:1), social_story (9:16 generic vertical), display_banner (16:9 ad banner), email_header (3:4 masthead), tiktok_reel (9:16 TikTok/Reels-native with hook text), instagram_feed_portrait (4:5 highest-reach Instagram format), print_full_page (3:4 magazine/newspaper full page), print_ooh_billboard (16:9 outdoor billboard), print_ooh_transit (2:3 bus shelter/transit vertical), print_direct_mail (4:3 postcard/mailer), print_collateral (3:4 brochure/sell sheet cover), banner_leaderboard (8:1 IAB 728x90), banner_skyscraper (1:4 IAB 160x600). Only omit if the deliverable is truly custom and none of these formats apply.',
              },
            },
          },
          description: 'Specific deliverables to generate. ALWAYS set deliverable_type for standard marketing formats — this is how deliverables get proper names, branded layout, and typography. Only use name+aspect_ratio without deliverable_type for truly custom formats not in the type list.',
        },
        reference_image_urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs of reference images the user uploaded (headshots, logos, products). Pass these when the user has shared images in the conversation to use as subjects or visual references in the creative package. The images will be given to the image generation model.',
        },
        pre_generated_image_url: {
          type: 'string',
          description: 'URL of an already-generated image to use as the visual deliverable. When set, the package skips image generation entirely and generates only the written copy, attaching this image as the deliverable photo. Use this after generate_headshot_scene to get the branded copy alongside the headshot scene output.',
        },
      },
      required: ['brief'],
    },
  },
  {
    name: 'generate_headshot_scene',
    description: 'Place a specific person (from their uploaded headshot) into a new scene or environment using image-to-image transformation. Use this when the user has uploaded a headshot and wants to appear in a generated image. The person\'s face and likeness are preserved while the scene, background, and environment are changed. ALWAYS use this instead of generate_image when the user has provided a headshot URL and wants to appear in the scene.',
    parameters: {
      type: 'object',
      properties: {
        photo_url: {
          type: 'string',
          description: 'URL of the uploaded headshot. Use the URL from "[Reference images uploaded by user: ...]" in the conversation.',
        },
        scene_description: {
          type: 'string',
          description: 'Description of the scene to place the person in. Be specific: setting, lighting, activity, background, other people, props, attire if different.',
        },
        aspect_ratio: {
          type: 'string',
          enum: ['1:1', '4:5', '16:9', '9:16', '4:3', '3:4'],
          description: 'Output aspect ratio. Default 4:5 for LinkedIn/Instagram portrait. Use 16:9 for banners.',
        },
      },
      required: ['photo_url', 'scene_description'],
    },
  },
  {
    name: 'generate_brand_guardrails',
    description: 'Generate AI brand governance directives (guardrails) from the brand\'s DNA profile. Use this when the user asks to generate guardrails, create agent directives, build brand rules, or set up brand governance. Can generate a single focused set for one domain, or all 6 focused sets at once. Each generated directive is saved as inactive for the user to review and activate.',
    parameters: {
      type: 'object',
      properties: {
        focus_area: {
          type: 'string',
          enum: ['visual_identity', 'photography_and_composition', 'tone_and_messaging', 'typography_and_text', 'product_representation', 'compliance'],
          description: 'Generate guardrails focused on a specific brand domain. visual_identity=colors/logos/marks, photography_and_composition=shot types/lighting/framing, tone_and_messaging=voice/copy direction, typography_and_text=font usage/text overlays, product_representation=product shots/faithful reproduction, compliance=legal/regulatory restrictions. Omit for a general overview across all areas.',
        },
        all_areas: {
          type: 'boolean',
          description: 'Set to true to generate all 6 focused directive sets at once — one per domain. Use when the user asks to "generate all guardrails", "set up all brand governance", or similar. Each area runs in parallel and replaces any existing directive for that area.',
        },
      },
    },
  },
  {
    name: 'synthesize_brand_profile',
    description: 'Synthesize all raw brand intelligence (website analysis, uploaded documents, image analysis) into a unified Brand DNA profile. Run this after any combination of analyze_brand_website, import_brand_document, or analyze_brand_images — it merges all sources with intelligent weighting (logos have highest authority for colors, brand guidelines PDFs have highest authority for rules). Should be run before generating guardrails or the generation prompt for best results.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'generate_brand_playbook',
    description: 'Run the full brand playbook preparation sequence in one shot: (1) synthesize all intelligence into a unified Brand DNA profile, (2) generate all 6 focused governance directive sets, (3) generate the brand-aware generation prompt, (4) generate brand card images. Use this when the user says "prepare the brand", "set up the full playbook", "get this brand ready to create", or similar. Takes 2-3 minutes.',
    parameters: {
      type: 'object',
      properties: {
        skip_synthesis: {
          type: 'boolean',
          description: 'Skip the synthesis step if a profile already exists and is up to date.',
        },
        skip_cards: {
          type: 'boolean',
          description: 'Skip card image generation to run faster.',
        },
      },
    },
  },
  {
    name: 'analyze_competitor_content',
    description: 'Analyze a competitor\'s video (YouTube URL or direct video URL) to extract strategic intelligence. Use when the user shares a competitor video. Returns a competitor summary, key messages, visual style, weaknesses, scene breakdown, and 3 campaign directions. Present the analysis and the 3 directions — the user will pick one before you call generate_creative_package. Do NOT automatically generate assets.',
    parameters: {
      type: 'object',
      properties: {
        video_url: {
          type: 'string',
          description: 'YouTube URL (youtube.com/watch?v=... or youtu.be/...) or direct video file URL to analyze',
        },
        analysis_context: {
          type: 'string',
          description: 'Optional context about the competitive situation (e.g., "This is Apple\'s latest iPhone ad. We want to counter with our AI features story.")',
        },
      },
      required: ['video_url'],
    },
  },
  {
    name: 'analyze_self_demo',
    description: 'Watch a screen recording of a Vince / Vince demo and analyze it as a product designer and UX critic. Use when the user shares a YouTube link to a Vince demo recording and wants feedback on the product experience, demo flow, or workflow improvements. Returns a demo score and structured feedback.',
    parameters: {
      type: 'object',
      properties: {
        video_url: {
          type: 'string',
          description: 'YouTube URL of the Vince demo screen recording to analyze',
        },
      },
      required: ['video_url'],
    },
  },
  {
    name: 'generate_video',
    description: 'Generate a brand-aligned video using Veo 3. Use when the user asks for a video, motion concept, or moving campaign asset. Defaults to Veo 3 Fast for quick turnaround. Use Quality model when the user wants better cinematic output or is supplying reference images. Both models generate audio natively — audio is always included, no special parameter needed. Generates a 4, 6, or 8 second video clip. The prompt should describe the scene, motion, mood, lighting, and brand visual direction — draw on the brand color palette, visual style, and photography DNA. Video takes 1-3 minutes to render and appears in the History panel when ready.',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed scene description for the video. Include motion direction, lighting, mood, color palette, subject behavior, camera movement (e.g., slow push in, aerial drift, handheld energy). More detail = better results.',
        },
        model: {
          type: 'string',
          enum: ['fast', 'quality'],
          description: 'fast = Veo 3.1 Fast ($0.80, ~1-2 min render). quality = Veo 3.1 Quality ($2.00+, better cinematic output, supports reference images). Default: fast. Use quality when the user asks for the best output or provides reference images. Both models include audio automatically.',
        },
        aspect_ratio: {
          type: 'string',
          enum: ['16:9', '9:16'],
          description: 'Video format. 16:9 for hero/cinematic (default), 9:16 for social stories/reels.',
        },
        duration: {
          type: 'number',
          description: 'Duration in seconds. Must be exactly 4, 6, or 8 — no other values are valid. Default: 8.',
        },
        generation_type: {
          type: 'string',
          enum: ['text_to_video', 'image_to_video'],
          description: 'text_to_video (default) generates from the prompt alone. image_to_video animates an existing image — only use this when the user explicitly wants to animate a specific image.',
        },
        input_image_url: {
          type: 'string',
          description: 'URL of an image to animate. Only used when generation_type is image_to_video.',
        },
        reference_image_url: {
          type: 'string',
          description: 'URL or base64 data URI of a reference image to guide the video output (e.g., brand logo, product, character). Quality model only. Good for brand consistency — if the brand has a logo or hero product, include it.',
        },
        resolution: {
          type: 'string',
          enum: ['720p', '1080p'],
          description: 'Output resolution. 720p (default, faster), 1080p (higher quality, requires 8s duration). Default: 720p.',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'create_brand',
    description: 'Create a new brand in the system. Use this whenever the user says "create a new brand", "add a brand", "new client", "set up a brand", or gives you a brand name to onboard — even while working with another brand. Requires a name and website URL. For well-known brands, infer the URL (e.g., "Google" → "google.com"). Call this immediately — do NOT ask about colors, mood, tone, or creative direction.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Brand name (e.g., "Google", "Nike")' },
        website_url: { type: 'string', description: 'Brand website URL (e.g., "google.com"). Required — infer for well-known brands, ask the user if unknown.' },
      },
      required: ['name', 'website_url'],
    },
  },
  {
    name: 'analyze_brand_website',
    description: 'Crawl a brand website and extract visual DNA — colors, fonts, imagery style, messaging tone. This populates the Brand DNA profile. Requires a brand to already exist (use create_brand first if needed). The analysis runs asynchronously and may take 30-60 seconds.',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Website URL to analyze (e.g., "https://google.com"). If omitted, uses the brand\'s stored website_url.' },
      },
    },
  },
  {
    name: 'import_brand_document',
    description: 'Process an uploaded brand document (PDF, PPTX, DOCX) to extract brand intelligence — guidelines, standards, tone of voice, visual identity. The document must already be uploaded to storage. Returns extracted brand data sections.',
    parameters: {
      type: 'object',
      properties: {
        document_url: { type: 'string', description: 'Storage URL or public URL of the document to analyze' },
        filename: { type: 'string', description: 'Original filename (e.g., "Google_Brand_Guidelines.pdf")' },
        content_type: {
          type: 'string',
          enum: ['pdf', 'pptx', 'docx', 'text'],
          description: 'Document type',
        },
        document_type_hint: { type: 'string', description: 'What kind of document this is (e.g., "brand guidelines", "annual report", "style guide")' },
      },
      required: ['document_url', 'filename', 'content_type'],
    },
  },
  {
    name: 'generate_brand_header',
    description: 'Generate the brand header/hero image using the brand\'s visual DNA, colors, and identity. This is a brand-building tool — use it as the final step of brand setup, or when the user asks to generate/regenerate the brand header image. The image is saved as the brand\'s header_image_url automatically.',
    parameters: {
      type: 'object',
      properties: {
        custom_prompt: { type: 'string', description: 'Optional custom prompt override. If omitted, uses the brand\'s stored hero image template with brand DNA interpolated.' },
      },
    },
  },
  {
    name: 'generate_brand_cards',
    description: 'Generate the brand card images — the 5 stylized 3D icons (Brand DNA, AI Guidelines, Generation Prompt, Templates, Brand Agent) using the brand\'s primary and secondary colors. This is a brand-building tool — use it as the final step of brand setup after DNA is loaded, or when the user asks to generate/regenerate card images. Card keys: brand_dna, ai_guidelines, generation_prompt, templates, brand_agent.',
    parameters: {
      type: 'object',
      properties: {
        card_keys: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific card keys to generate. If omitted, generates all 5 cards.',
        },
      },
    },
  },
  {
    name: 'recall_brand_guidelines',
    description: "Search the brand's memory for specific photography rules, visual DNA, or compliance restrictions. Call this before generating assets if you need to know exact styling rules for a deliverable type or channel.",
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: "Semantic search query, e.g., 'LinkedIn post photography rules' or 'color restrictions and forbidden elements'",
        },
        category: {
          type: 'string',
          enum: ['photography_style', 'compliance', 'tone_of_voice', 'visual_dna', 'color_profile', 'composition_rules', 'brand_identity', 'typography'],
          description: 'Optional category filter to narrow results',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_camera_options',
    description: "List available camera equipment, film stocks, lighting setups, lenses, and other photography options from the Creative Studio inventory. Use when: (1) picking camera equipment for a generation — always check inventory before deciding, (2) the user asks what cameras/lenses/film stocks are available, (3) the user requests specific equipment and you need its prompt fragment, (4) you want to suggest equipment options. Returns options grouped by category with prompt_fragment for each — use these fragments verbatim in generation prompts.",
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['camera_body', 'film_stock', 'focal_length', 'aperture', 'lighting', 'composition', 'depth_of_field', 'color_grade', 'film_effect', 'shot_type', 'print_process', 'color_temperature', 'frame_rate'],
          description: 'Filter to a specific equipment category. Omit to return all categories.',
        },
        media_type: {
          type: 'string',
          enum: ['still', 'video', 'both'],
          description: 'Filter by media type. Omit to return all.',
        },
      },
    },
  },
  {
    name: 'edit_image',
    description: 'Edit an existing image conversationally using AI. Use when the user says "make it darker", "change the background", "adjust the lighting", "warm it up", "iterate on this", or any instruction to modify an existing image. Pass thought_signature from a previous edit_image response to maintain visual editing context across multiple refinements.',
    parameters: {
      type: 'object',
      properties: {
        input_image_url: {
          type: 'string',
          description: 'URL of the image to edit. Use the output_url from a previous generate_image, edit_image, or list_generations result.',
        },
        instruction: {
          type: 'string',
          description: 'What to change about the image. Be specific: "make the background darker and more dramatic", "shift the color grade to golden hour warm tones", "remove the text overlay".',
        },
        thought_signature: {
          type: 'string',
          description: 'Thought signature returned by a previous edit_image call on this image. Pass this to maintain editing context across multiple refinements. Omit on the first edit.',
        },
        aspect_ratio: {
          type: 'string',
          enum: ['1:1', '16:9', '9:16', '4:3', '3:4'],
          description: 'Output aspect ratio. Default matches input.',
        },
      },
      required: ['input_image_url', 'instruction'],
    },
  },
  {
    name: 'list_generations',
    description: 'List past image and video generations for this brand. Use when the user asks to see what was made, wants to find a previous shot to iterate on, or says "show me what we generated" or "find that image from yesterday".',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          description: 'Max results to return (default 10, max 20).',
          minimum: 1,
          maximum: 20,
        },
        generation_type: {
          type: 'string',
          enum: ['text_to_image', 'multi_turn_edit', 'video', 'all'],
          description: 'Filter by generation type. Omit or use "all" for everything.',
        },
        since: {
          type: 'string',
          description: 'ISO date string to filter results after this date (e.g. "2026-03-10"). Use to find "yesterday\'s" or "last week\'s" generations.',
        },
      },
    },
  },
  {
    name: 'check_job_status',
    description: 'Check the status of a video or image analysis job. Call this after generate_video or analyze_brand_image to check if the job completed. Poll until status is \'completed\' or \'failed\'. Returns status, output_urls, error_message, and created_at.',
    parameters: {
      type: 'object',
      properties: {
        job_id: { type: 'string', description: 'The generation job ID to check (returned by generate_video).' },
      },
      required: ['job_id'],
    },
  },
  {
    name: 'list_guardrails',
    description: 'List brand governance directives (guardrails) for the current brand. Returns id, focus_area, name, is_active, and created_at for each. Use when the user asks what guardrails exist, which are active, or wants to manage brand governance.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'activate_guardrail',
    description: 'Activate a brand governance directive by its ID, making it enforceable for this brand. Use when the user wants to turn on a guardrail.',
    parameters: {
      type: 'object',
      properties: {
        directive_id: { type: 'string', description: 'The UUID of the directive to activate.' },
      },
      required: ['directive_id'],
    },
  },
  {
    name: 'deactivate_guardrail',
    description: 'Deactivate a brand governance directive by its ID, suspending enforcement without deleting it. Use when the user wants to turn off a guardrail.',
    parameters: {
      type: 'object',
      properties: {
        directive_id: { type: 'string', description: 'The UUID of the directive to deactivate.' },
      },
      required: ['directive_id'],
    },
  },
];

// ── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  timestamp: string;
}

interface ToolCall {
  toolName: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  error?: string;
  success: boolean;
}

// ── Tool Executors ──────────────────────────────────────────────────────────

async function executeTool(
  toolName: string,
  parameters: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
  geminiApiKey?: string,
): Promise<unknown> {
  switch (toolName) {
    case 'save_prompt_template':
      return await savePromptTemplate(parameters, context, supabase);
    case 'search_prompt_library':
      return await searchPromptLibrary(parameters, context, supabase);
    case 'analyze_brand_image':
      return await analyzeBrandImage(parameters, context, supabase);
    case 'get_brand_profile':
      return await getBrandProfile(context, supabase);
    case 'list_available_models':
      return await listAvailableModels(parameters, supabase);
    case 'check_generation_quota':
      return await checkGenerationQuota(context, supabase);
    case 'generate_image':
      return await generateImage(parameters, context, supabase);
    case 'list_brand_references':
      return await listBrandReferences(parameters, context, supabase);
    case 'generate_creative_package':
      return await generateCreativePackage(parameters, context, supabase);
    case 'generate_headshot_scene':
      return await generateHeadshotScene(parameters, context, supabase);
    case 'create_brand':
      return await createBrand(parameters, context, supabase);
    case 'analyze_brand_website':
      return await analyzeBrandWebsite(parameters, context, supabase);
    case 'import_brand_document':
      return await importBrandDocument(parameters, context, supabase);
    case 'generate_brand_header':
      return await generateBrandHeader(parameters, context, supabase);
    case 'generate_brand_cards':
      return await generateBrandCards(parameters, context, supabase);
    case 'generate_brand_guardrails':
      return await generateBrandGuardrails(parameters, context, supabase);
    case 'synthesize_brand_profile':
      return await synthesizeBrandProfile(context, supabase);
    case 'generate_brand_playbook':
      return await generateBrandPlaybook(parameters, context, supabase);
    case 'analyze_competitor_content':
      return await analyzeCompetitorContent(parameters, context, supabase);
    case 'analyze_self_demo':
      return await analyzeSelfDemo(parameters, context, supabase);
    case 'generate_video':
      return await generateVideo(parameters, context, supabase);
    case 'recall_brand_guidelines':
      return await recallBrandGuidelines(parameters, context, supabase, geminiApiKey);
    case 'list_camera_options':
      return await listCameraOptions(parameters, supabase);
    case 'edit_image':
      return await editImage(parameters, context, supabase);
    case 'list_generations':
      return await listGenerations(parameters, context, supabase);
    case 'check_job_status':
      return await checkJobStatus(parameters, supabase);
    case 'list_guardrails':
      return await listGuardrails(context, supabase);
    case 'activate_guardrail':
      return await setGuardrailActive(parameters, true, supabase);
    case 'deactivate_guardrail':
      return await setGuardrailActive(parameters, false, supabase);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function listCameraOptions(
  params: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
) {
  const query = supabase
    .from('creative_studio_camera_options')
    .select('category, slug, display_name, description, prompt_fragment, media_type')
    .eq('is_active', true)
    .order('category')
    .order('sort_order');

  if (params.category) query.eq('category', params.category as string);
  if (params.media_type && params.media_type !== 'both') {
    query.in('media_type', [params.media_type as string, 'both']);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const grouped: Record<string, unknown[]> = {};
  for (const option of (data || [])) {
    if (!grouped[option.category]) grouped[option.category] = [];
    grouped[option.category].push({
      name: option.display_name,
      slug: option.slug,
      description: option.description,
      prompt_fragment: option.prompt_fragment,
      media_type: option.media_type,
    });
  }

  return { categories: grouped, total: data?.length || 0 };
}

async function recallBrandGuidelines(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
  geminiApiKey?: string,
): Promise<unknown> {
  if (!geminiApiKey) {
    return { message: 'Brand memory search is not available in this context.' };
  }
  const { query, category } = params as { query: string; category?: string };

  const queryVector = await getEmbedding(geminiApiKey, query, 'RETRIEVAL_QUERY');

  const { data, error } = await supabase.rpc('match_brand_memory', {
    query_embedding: queryVector,
    match_threshold: 0.5,
    match_count: 4,
    p_brand_id: context.brand_id,
    p_category: category ?? null,
  });

  if (error || !data?.length) {
    return { message: 'No specific guidelines found in memory. Proceed with general best practices.' };
  }

  return {
    guidelines: data.map((d: { content: string }) => d.content),
    instruction: 'Apply these rules strictly to your next generation step.',
  };
}

async function savePromptTemplate(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const { data, error } = await supabase
    .from('creative_studio_brand_prompts')
    .insert({
      brand_id: context.brand_id,
      name: params.name as string,
      description: (params.description as string) || null,
      category: (params.category as string) || null,
      prompt_template: params.prompt_template as string,
      camera_preset: params.camera_preset || null,
      recommended_model: (params.recommended_model as string) || null,
      locked_parameters: {},
      variable_fields: [],
      created_by: context.user_id,
      is_auto_generated: true,
    })
    .select('id, name, category')
    .single();

  if (error) throw new Error(`Failed to save template: ${error.message}`);
  return { saved: true, id: data.id, name: data.name, category: data.category };
}

async function searchPromptLibrary(
  params: Record<string, unknown>,
  context: { brand_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  let query = supabase
    .from('creative_studio_brand_prompts')
    .select('id, name, category, prompt_template, usage_count, camera_preset, description')
    .eq('brand_id', context.brand_id)
    .order('usage_count', { ascending: false })
    .limit((params.limit as number) || 10);

  if (params.query) {
    query = query.or(`name.ilike.%${params.query}%,prompt_template.ilike.%${params.query}%`);
  }
  if (params.category) {
    query = query.eq('category', params.category as string);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Search failed: ${error.message}`);
  return { templates: data || [], count: (data || []).length };
}

async function analyzeBrandImage(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Fire-and-forget: analyze-brand-images saves results to the DB independently.
  // Awaiting it would cause brand-prompt-agent to timeout (~17s for Gemini vision).
  fetch(`${supabaseUrl}/functions/v1/analyze-brand-images`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({
      brand_id: context.brand_id,
      image_urls: params.image_urls,
      directives: params.context ? [params.context] : undefined,
      user_id: context.user_id,
    }),
  }).catch(err => console.error('[Vince] analyze-brand-images fire-and-forget error:', err.message));

  return {
    message: `Queued ${(params.image_urls as string[])?.length || 0} image(s) for brand visual profile analysis. Results will be saved automatically.`,
  };
}

async function getBrandProfile(
  context: { brand_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const { data: profile } = await supabase
    .from('creative_studio_brand_profiles')
    .select('visual_dna, photography_style, color_profile, composition_rules, product_catalog, brand_identity, tone_of_voice, typography, total_images_analyzed, confidence_score, last_analysis_run')
    .eq('brand_id', context.brand_id)
    .single();

  if (!profile) {
    return { exists: false, message: 'No visual DNA profile exists yet. Upload reference images to build one.' };
  }

  return {
    exists: true,
    total_images_analyzed: profile.total_images_analyzed,
    confidence_score: profile.confidence_score,
    last_analysis_run: profile.last_analysis_run,
    photography_style: profile.photography_style,
    color_profile: profile.color_profile,
    composition_rules: profile.composition_rules,
    product_catalog: profile.product_catalog,
    brand_identity: profile.brand_identity,
    tone_of_voice: profile.tone_of_voice,
    typography: profile.typography,
  };
}

async function listAvailableModels(
  params: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
) {
  const modelType = (params.model_type as string) || 'image';
  const { data, error } = await supabase
    .from('creative_studio_models')
    .select('model_id, name, model_type, capabilities, cost_per_generation, is_default')
    .eq('is_active', true)
    .eq('model_type', modelType)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Model lookup failed: ${error.message}`);

  return {
    models: (data || []).map(m => ({
      model_id: m.model_id,
      name: m.name,
      capabilities: m.capabilities,
      cost_per_generation: m.cost_per_generation,
      is_default: m.is_default,
    })),
    count: (data || []).length,
  };
}

async function checkGenerationQuota(
  context: { user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const { data, error } = await supabase
    .rpc('can_user_generate_creative', {
      p_user_id: context.user_id,
      p_generation_type: 'text_to_image',
    });

  if (error) throw new Error(`Quota check failed: ${error.message}`);

  const quota = Array.isArray(data) ? data[0] : data;
  if (!quota) throw new Error('No quota data returned');

  return {
    can_generate: quota.can_generate,
    remaining: quota.remaining,
    limit: quota.limit_value,
    reset_date: quota.period_end,
  };
}

async function listBrandReferences(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  let query = supabase
    .from('creative_studio_brand_references')
    .select('*')
    .eq('brand_id', context.brand_id)
    .order('collection')
    .order('is_primary', { ascending: false })
    .order('sort_order', { ascending: true });

  if (params.reference_type) {
    query = query.eq('reference_type', params.reference_type as string);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch references: ${error.message}`);

  // Group by collection
  const collections = new Map<string, {
    name: string;
    reference_type: string;
    reference_intent: string;
    image_count: number;
    images: Array<{ label?: string; url: string; media_resolution: string }>;
  }>();

  for (const ref of data || []) {
    if (!collections.has(ref.collection)) {
      collections.set(ref.collection, {
        name: ref.collection,
        reference_type: ref.reference_type,
        reference_intent: ref.reference_intent,
        image_count: 0,
        images: [],
      });
    }
    const coll = collections.get(ref.collection)!;
    coll.image_count++;
    coll.images.push({
      label: ref.label || ref.filename,
      url: ref.url,
      media_resolution: ref.media_resolution,
    });
  }

  return {
    collections: Array.from(collections.values()),
    total_images: (data || []).length,
  };
}

async function generateImage(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-creative-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({
      generation_type: 'text_to_image',
      prompt: params.prompt as string,
      model_id: params.model_id || undefined,
      brand_id: context.brand_id,
      aspect_ratio: (params.aspect_ratio as string) || '1:1',
      num_outputs: (params.num_outputs as number) || 1,
      negative_prompt: (params.negative_prompt as string) || undefined,
      camera_preset: params.camera_preset || undefined,
      include_logo: params.include_logo || undefined,
      reference_images: params.reference_images || undefined,
      reference_collections: params.reference_collections || undefined,
      user_id: context.user_id,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Generation failed (${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.details || errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText.slice(0, 200);
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.details || result.error || 'Generation failed');
  }

  return {
    generated: true,
    generation_id: result.generation_id,
    output_urls: result.output_urls,
    image_count: (result.output_urls || []).length,
    generation_time_ms: result.generation_time_ms,
    quota_remaining: result.quota?.remaining,
  };
}

async function editImage(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // If a thought_signature is provided, pass it as a model turn so Gemini can
  // resume its internal reasoning state across edit turns.
  const conversation_history = params.thought_signature
    ? [{ role: 'model', text: '', thought_signature: params.thought_signature as string }]
    : undefined;

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-creative-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({
      generation_type: 'multi_turn_edit',
      prompt: params.instruction as string,
      model_id: 'gemini-3.1-flash-image-preview',
      brand_id: context.brand_id,
      user_id: context.user_id,
      aspect_ratio: (params.aspect_ratio as string) || '1:1',
      input_image: params.input_image_url as string,
      ...(conversation_history ? { conversation_history } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Edit failed (${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.details || errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText.slice(0, 200);
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.details || result.error || 'Edit failed');
  }

  return {
    output_url: (result.output_urls || [])[0] || null,
    thought_signature: result.thought_signature || null,
    text_response: result.text_response || null,
    generation_id: result.generation_id || null,
  };
}

async function listGenerations(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const limit = Math.min((params.limit as number) || 10, 20);
  const generationType = params.generation_type as string | undefined;
  const since = params.since as string | undefined;

  let query = supabase
    .from('creative_studio_generations')
    .select('id, output_urls, prompt_text, model_used, generation_type, created_at, estimated_cost_usd')
    .eq('brand_id', context.brand_id)
    .eq('user_id', context.user_id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (generationType && generationType !== 'all') {
    query = query.eq('generation_type', generationType);
  }

  if (since) {
    query = query.gte('created_at', new Date(since).toISOString());
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch generations: ${error.message}`);

  return {
    generations: (data || []).map(g => ({
      id: g.id,
      output_urls: (g.output_urls || []) as string[],
      prompt_text: g.prompt_text ? (g.prompt_text as string).slice(0, 150) : null,
      model_used: g.model_used,
      generation_type: g.generation_type,
      created_at: g.created_at,
      estimated_cost_usd: g.estimated_cost_usd,
    })),
    count: (data || []).length,
  };
}

async function checkJobStatus(
  params: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
) {
  const { data, error } = await supabase
    .from('creative_studio_generations')
    .select('id, status, output_urls, error_message, created_at, completed_at, generation_type, model_used')
    .eq('id', params.job_id as string)
    .single();

  if (error) throw new Error(`Job lookup failed: ${error.message}`);
  if (!data) return { found: false, message: `No job found with id ${params.job_id}` };

  return {
    found: true,
    id: data.id,
    status: data.status,
    output_urls: (data.output_urls || []) as string[],
    error_message: data.error_message || null,
    created_at: data.created_at,
    completed_at: data.completed_at || null,
    generation_type: data.generation_type,
    model_used: data.model_used,
  };
}

async function listGuardrails(
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const { data, error } = await supabase
    .from('creative_studio_agent_directives')
    .select('id, focus_area, name, is_active, created_at')
    .eq('brand_id', context.brand_id)
    .order('focus_area');

  if (error) throw new Error(`Failed to fetch guardrails: ${error.message}`);

  return {
    guardrails: data || [],
    count: (data || []).length,
    active_count: (data || []).filter(d => d.is_active).length,
  };
}

async function setGuardrailActive(
  params: Record<string, unknown>,
  is_active: boolean,
  supabase: ReturnType<typeof createClient>,
) {
  const { data, error } = await supabase
    .from('creative_studio_agent_directives')
    .update({ is_active })
    .eq('id', params.directive_id as string)
    .select('id, name, focus_area, is_active')
    .single();

  if (error) throw new Error(`Failed to update guardrail: ${error.message}`);
  if (!data) throw new Error(`No directive found with id ${params.directive_id}`);

  return {
    success: true,
    id: data.id,
    name: data.name,
    focus_area: data.focus_area,
    is_active: data.is_active,
    message: `"${data.name}" is now ${is_active ? 'active' : 'inactive'}.`,
  };
}

async function generateHeadshotScene(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const photoUrl = params.photo_url as string;
  const sceneDescription = params.scene_description as string;
  const aspectRatio = (params.aspect_ratio as string) || '4:5';

  // Download the photo via service role storage client to handle private/authenticated buckets
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  let photoBase64: string;
  let photoMimeType: string;

  const publicPrefix = `${supabaseUrl}/storage/v1/object/public/creative-studio/`;
  if (photoUrl.startsWith(publicPrefix)) {
    const bucketPath = photoUrl.slice(publicPrefix.length);
    const { data: blobData, error: downloadError } = await supabase.storage
      .from('creative-studio')
      .download(bucketPath);
    if (downloadError || !blobData) throw new Error(`Failed to download reference photo: ${downloadError?.message}`);
    const photoBuffer = await blobData.arrayBuffer();
    const photoBytes = new Uint8Array(photoBuffer);
    const chunkSize = 8192;
    let binary = '';
    for (let i = 0; i < photoBytes.length; i += chunkSize) {
      binary += String.fromCharCode(...photoBytes.subarray(i, Math.min(i + chunkSize, photoBytes.length)));
    }
    photoBase64 = btoa(binary);
    photoMimeType = blobData.type || 'image/jpeg';
  } else {
    // Fallback: direct fetch for URLs outside our storage (e.g., external images)
    const photoRes = await fetch(photoUrl);
    if (!photoRes.ok) throw new Error(`Failed to fetch reference photo: HTTP ${photoRes.status}`);
    const photoBuffer = await photoRes.arrayBuffer();
    const photoBytes = new Uint8Array(photoBuffer);
    const chunkSize = 8192;
    let binary = '';
    for (let i = 0; i < photoBytes.length; i += chunkSize) {
      binary += String.fromCharCode(...photoBytes.subarray(i, Math.min(i + chunkSize, photoBytes.length)));
    }
    photoBase64 = btoa(binary);
    photoMimeType = photoRes.headers.get('content-type') || 'image/jpeg';
  }

  const prompt = `Take the first image (a reference photo of a person) and place that exact person into the following scene: ${sceneDescription}.

REQUIREMENTS:
- The person's face, facial features, skin tone, eye color, hair color, and hair style must remain COMPLETELY UNCHANGED
- Only the background, environment, clothing context, and lighting should change to match the scene
- The person should appear naturally integrated into the described setting
- Professional quality, photorealistic result`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent`;
  const requestBody = {
    contents: [{
      parts: [
        { inline_data: { mime_type: photoMimeType, data: photoBase64 } },
        { text: prompt },
      ],
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} — ${err.slice(0, 300)}`);
  }

  const data = await response.json();
  const imagePart = data.candidates?.[0]?.content?.parts?.find((p: { inlineData?: unknown }) => p.inlineData);
  if (!(imagePart as { inlineData?: { data?: string } })?.inlineData?.data) {
    const finishReason = data.candidates?.[0]?.finishReason;
    const safetyRatings = data.candidates?.[0]?.safetyRatings;
    const blockReason = data.promptFeedback?.blockReason;
    console.error('[generateHeadshotScene] No image returned. finishReason:', finishReason, '| blockReason:', blockReason, '| safetyRatings:', JSON.stringify(safetyRatings), '| full response:', JSON.stringify(data).slice(0, 500));
    throw new Error(`No image returned from Gemini (finishReason: ${finishReason || 'unknown'}, blockReason: ${blockReason || 'none'})`);
  }

  const base64Image = (imagePart as { inlineData: { data: string; mimeType?: string } }).inlineData.data;
  const mimeType = (imagePart as { inlineData: { mimeType?: string } }).inlineData.mimeType || 'image/jpeg';
  const ext = mimeType.split('/')[1] || 'jpg';

  // Upload to Supabase Storage
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const filename = `headshot-scene-${timestamp}-${random}.${ext}`;
  const path = `headshot-scenes/${context.user_id}/${filename}`;
  const imageBuffer = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));

  const { error: uploadError } = await supabase.storage
    .from('creative-studio')
    .upload(path, imageBuffer, { contentType: mimeType, upsert: false });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const { data: pub } = supabase.storage.from('creative-studio').getPublicUrl(path);

  // Record in generation history
  await supabase.from('creative_studio_generations').insert({
    user_id: context.user_id,
    brand_id: context.brand_id || null,
    generation_type: 'headshot_scene',
    model_used: 'gemini-3.1-flash-image-preview',
    prompt_text: sceneDescription,
    input_image_url: photoUrl,
    output_urls: [pub.publicUrl],
    status: 'completed',
    parameters: { aspect_ratio: aspectRatio },
    completed_at: new Date().toISOString(),
  });

  // Register in media library
  await supabase.from('media').insert({
    filename,
    title: `Headshot Scene — ${sceneDescription.slice(0, 60)}`,
    description: sceneDescription,
    url: pub.publicUrl,
    storage_path: `creative-studio/${path}`,
    mime_type: mimeType,
    file_type: 'image',
    size_bytes: imageBuffer.byteLength,
    created_by: context.user_id,
    auto_tags: ['headshot', 'ai-generated', 'person'],
    ai_provenance: { model: 'gemini-3.1-flash-image-preview', brand_id: context.brand_id },
    synthid_detected: true,
    synthid_confidence: 1.0,
    synthid_generated_by: 'gemini-3.1-flash-image-preview',
    synthid_details: 'AI-generated by Vince — face placement via Gemini image editing',
  });

  return {
    success: true,
    output_url: pub.publicUrl,
    message: 'Scene generated with the person placed in the requested environment.',
  };
}

async function generateCreativePackage(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-creative-package`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      brand_id: context.brand_id,
      brief: params.brief as string,
      deliverables: params.deliverables || undefined,
      reference_image_urls: params.reference_image_urls || undefined,
      pre_generated_image_url: params.pre_generated_image_url || undefined,
      user_id: context.user_id,
    }),
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Creative package generation failed');
  }

  return {
    success: true,
    brand_name: result.brand_name,
    parts: result.parts,
    image_urls: result.image_urls,
    latency_ms: result.latency_ms,
    model: result.model,
    brief: result.brief,
    deliverable_names: result.deliverable_names,
    brand_alignment: result.brand_alignment,
    message: `Generated creative package with ${result.image_urls?.length || 0} images in ${(result.latency_ms / 1000).toFixed(1)}s`,
  };
}

// ── Competitive Intelligence ─────────────────────────────────────────────────

async function analyzeCompetitorContent(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-competitor-video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      video_url: params.video_url as string,
      brand_id: context.brand_id,
      analysis_context: (params.analysis_context as string) || undefined,
    }),
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Competitor video analysis failed');
  }

  const { analysis } = result;

  return {
    success: true,
    video_url: result.video_url,
    competitor_summary: analysis.competitor_summary,
    key_messages: analysis.key_messages,
    visual_style: analysis.visual_style,
    target_audience: analysis.target_audience,
    emotional_hooks: analysis.emotional_hooks,
    weaknesses: analysis.weaknesses,
    scenes: analysis.scenes || [],
    campaign_directions: analysis.campaign_directions || [],
    counter_brief: analysis.counter_brief,
    counter_deliverables: analysis.counter_deliverables,
    latency_ms: result.latency_ms,
    message: `Competitor analysis complete. I found ${analysis.weaknesses?.length || 0} strategic openings and generated 3 campaign directions. Pick the direction that resonates most and I'll build the creative package.`,
  };
}

async function analyzeSelfDemo(
  params: Record<string, unknown>,
  _context: { brand_id: string; user_id: string },
  _supabase: ReturnType<typeof createClient>,
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-competitor-video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      video_url: params.video_url as string,
      mode: 'self_critique',
    }),
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Self-demo analysis failed');
  }

  const { analysis } = result;

  return {
    success: true,
    video_url: result.video_url,
    product_summary: analysis.product_summary,
    demo_score: analysis.demo_score,
    ux_observations: analysis.ux_observations,
    missed_opportunities: analysis.missed_opportunities,
    demo_narrative_issues: analysis.demo_narrative_issues,
    recommended_improvements: analysis.recommended_improvements,
    latency_ms: result.latency_ms,
    message: `Demo analysis complete. Overall demo score: ${analysis.demo_score}/100. I found ${analysis.recommended_improvements?.length || 0} specific improvements.`,
  };
}

// ── Video Generation ─────────────────────────────────────────────────────────

async function generateVideo(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  _supabase: ReturnType<typeof createClient>,
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const referenceImages: string[] = [];
  if (params.reference_image_url) {
    referenceImages.push(params.reference_image_url as string);
  }

  const modelParam = (params.model as string) || 'fast';
  const modelId = modelParam === 'quality' ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview';

  const body = JSON.stringify({
    generation_type: (params.generation_type as string) || 'text_to_video',
    prompt: params.prompt as string,
    model_id: modelId,
    brand_id: context.brand_id,
    user_id: context.user_id,
    aspect_ratio: (params.aspect_ratio as string) || '16:9',
    duration: (params.duration as number) || 8,
    resolution: (params.resolution as string) || '720p',
    input_image: (params.input_image_url as string) || undefined,
    ...(referenceImages.length > 0 ? { reference_images: referenceImages } : {}),
  });

  // Fire and forget — video generation takes 1-3 minutes via polling.
  // Returning immediately keeps the voice session alive. The video will
  // appear in the History panel when the generation completes.
  fetch(`${supabaseUrl}/functions/v1/generate-creative-video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body,
  }).catch(err => console.error('[generate_video] Background generation failed:', err));

  return {
    success: true,
    queued: true,
    message: 'Video is rendering now — Veo 3 Fast, usually 1-2 minutes. It will appear in your History panel when ready.',
  };
}

// ── Brand Onboarding Tools ───────────────────────────────────────────────────

async function createBrand(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const name = params.name as string;
  if (!name) throw new Error('Brand name is required');

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Check for existing slug
  const { data: existing } = await supabase
    .from('creative_studio_brands')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const websiteUrl = params.website_url as string | undefined;
  const normalizedUrl = websiteUrl
    ? (websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`)
    : undefined;

  const { data, error } = await supabase
    .from('creative_studio_brands')
    .insert({
      name,
      slug: finalSlug,
      website_url: normalizedUrl || null,
      primary_color: (params.primary_color as string) || null,
      secondary_color: (params.secondary_color as string) || null,
      brand_category: (params.brand_category as string) || null,
      description: (params.description as string) || null,
      created_by: context.user_id,
      is_active: true,
    })
    .select('id, name, slug, website_url, primary_color')
    .single();

  if (error) throw new Error(`Failed to create brand: ${error.message}`);

  return {
    success: true,
    brand_id: data.id,
    name: data.name,
    slug: data.slug,
    website_url: data.website_url,
    primary_color: data.primary_color,
    message: `Brand "${data.name}" created successfully. You can now analyze their website or import brand documents.`,
  };
}

async function analyzeBrandWebsite(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  // Always prefer the brand's stored website_url over what Gemini passes
  // (Gemini sometimes hallucinates wrong URLs from system prompt examples)
  const { data: brand } = await supabase
    .from('creative_studio_brands')
    .select('website_url')
    .eq('id', context.brand_id)
    .single();
  let url = brand?.website_url || (params.url as string | undefined);

  if (!url) throw new Error('No website URL provided and no website_url stored on the brand. Pass a url parameter.');

  // Normalize URL
  if (!url.startsWith('http')) url = `https://${url}`;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Fire-and-forget: kick off the analysis and return immediately.
  // The analyze-brand-website function saves results to the DB when done.
  // This prevents voice sessions from timing out during the 15-20s crawl.
  fetch(`${supabaseUrl}/functions/v1/analyze-brand-website`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      brand_id: context.brand_id,
      url,
      user_id: context.user_id,
    }),
  }).then(async (response) => {
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      console.error(`[Vince] Background website analysis failed (${response.status}):`, result.error || 'unknown');
    } else {
      console.log(`[Vince] Background website analysis completed for ${url}`);
    }
  }).catch((err) => {
    console.error(`[Vince] Background website analysis fetch error:`, err.message);
  });

  return {
    success: true,
    url,
    message: `Website analysis started for ${url}. This takes about 30 seconds — the brand's colors, fonts, imagery style, and messaging will be extracted automatically. You can continue chatting while it runs.`,
  };
}

async function importBrandDocument(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const documentUrl = params.document_url as string;
  const filename = params.filename as string;
  const contentType = params.content_type as string;

  if (!documentUrl || !filename || !contentType) {
    throw new Error('document_url, filename, and content_type are required');
  }

  // Determine MIME type
  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    text: 'text/plain',
  };

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-brand-documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      brand_id: context.brand_id,
      documents: [{
        content: documentUrl,
        content_type: contentType,
        mime_type: mimeMap[contentType] || 'application/octet-stream',
        filename,
        document_type_hint: (params.document_type_hint as string) || undefined,
      }],
    }),
  });

  const result = await response.json();
  if (!response.ok || result.error) {
    throw new Error(result.error || `Document analysis failed (${response.status})`);
  }

  const docs = result.documents || result.results || [];
  const firstDoc = docs[0];

  return {
    success: true,
    filename,
    document_type: firstDoc?.classified_as || contentType,
    sections_extracted: firstDoc?.sections_count || Object.keys(firstDoc?.extracted || {}).length,
    message: `Document "${filename}" analyzed and brand profile updated with extracted intelligence.`,
    summary: firstDoc?.summary || null,
  };
}

async function generateBrandHeader(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  // Fetch brand data for the prompt
  const { data: brand, error: brandErr } = await supabase
    .from('creative_studio_brands')
    .select('name, primary_color, secondary_color, brand_category, visual_identity')
    .eq('id', context.brand_id)
    .single();

  if (brandErr || !brand) throw new Error(`Brand not found: ${brandErr?.message}`);

  // Build prompt — use custom override or construct from brand DNA
  let prompt = params.custom_prompt as string | undefined;
  if (!prompt) {
    // Try to load the stored hero image template
    const { data: template } = await supabase
      .from('ai_prompt_templates')
      .select('content')
      .eq('slug', 'brand-hero-image')
      .eq('is_active', true)
      .single();

    if (template?.content) {
      prompt = template.content
        .replace(/\{\{brand_name\}\}/g, brand.name || '')
        .replace(/\{\{brand_category\}\}/g, brand.brand_category || '')
        .replace(/\{\{primary_color\}\}/g, brand.primary_color || '')
        .replace(/\{\{secondary_color\}\}/g, brand.secondary_color || '')
        .replace(/\{\{visual_identity\}\}/g, brand.visual_identity || '');
    } else {
      prompt = `Professional editorial photograph for ${brand.name}. Modern, premium brand header image. Color palette: ${brand.primary_color || '#333'} and ${brand.secondary_color || '#666'}. ${brand.visual_identity || 'Clean, sophisticated aesthetic.'}. Wide cinematic composition, no text, no logos.`;
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-header-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      prompt,
      aspectRatio: '16:9',
      style: 'cinematic',
      contentType: 'custom',
      brand_id: context.brand_id,
      title: brand.name,
      description: brand.visual_identity || brand.brand_category || '',
    }),
  });

  const result = await response.json();
  if (!response.ok || result.error) {
    throw new Error(result.error || `Header image generation failed (${response.status})`);
  }

  // Update brand's header_image_url
  const imageUrl = result.imageUrl || result.url || result.publicUrl;
  if (imageUrl) {
    await supabase
      .from('creative_studio_brands')
      .update({ header_image_url: imageUrl })
      .eq('id', context.brand_id);
  }

  return {
    success: true,
    url: imageUrl,
    message: `Brand header image generated and saved for ${brand.name}.`,
  };
}

async function generateBrandCards(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-brand-card-images`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      brand_id: context.brand_id,
      card_keys: params.card_keys || undefined,
    }),
  });

  const result = await response.json();
  if (!response.ok || result.error) {
    throw new Error(result.error || `Card image generation failed (${response.status})`);
  }

  const results = result.results || {};
  const succeeded = Object.entries(results).filter(([, r]: [string, any]) => r.status === 'success');
  const failed = Object.entries(results).filter(([, r]: [string, any]) => r.status !== 'success');

  return {
    success: succeeded.length > 0,
    generated: succeeded.length,
    failed: failed.length,
    cards: Object.fromEntries(succeeded.map(([k, r]: [string, any]) => [k, r.url])),
    errors: failed.length > 0 ? Object.fromEntries(failed.map(([k, r]: [string, any]) => [k, r.error])) : undefined,
    message: `Generated ${succeeded.length} of ${succeeded.length + failed.length} brand card images.`,
  };
}

async function generateBrandGuardrails(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const focusAreas = params.all_areas
    ? ['visual_identity', 'photography_and_composition', 'tone_and_messaging', 'typography_and_text', 'product_representation', 'compliance']
    : [params.focus_area as string | undefined];

  const results = await Promise.allSettled(
    focusAreas.map(async (focus_area) => {
      // Delete existing directive for this focus_area to replace it
      if (focus_area) {
        await (supabase.from('creative_studio_agent_directives') as any)
          .delete()
          .eq('brand_id', context.brand_id)
          .eq('focus_area', focus_area);
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-brand-guardrails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          brand_id: context.brand_id,
          focus_area: focus_area || null,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Guardrails generation failed for ${focus_area || 'general'}`);
      }
      return { focus_area: focus_area || 'general', summary: result.summary, name: result.directive?.name };
    })
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<any>).value);
  const failed = results.filter(r => r.status === 'rejected').map(r => (r as PromiseRejectedResult).reason?.message || 'unknown error');

  if (params.all_areas) {
    return {
      success: succeeded.length > 0,
      generated: succeeded.length,
      failed: failed.length,
      directives: succeeded,
      message: failed.length === 0
        ? `Generated all 6 focused directive sets. Each is saved as inactive — activate them in the Brand DNA admin tab after reviewing.`
        : `Generated ${succeeded.length} of 6 directive sets. ${failed.length} failed: ${failed.join(', ')}`,
    };
  }

  if (succeeded.length === 1) {
    const d = succeeded[0];
    return {
      success: true,
      directive: d,
      message: `Generated "${d.name}" (${d.summary.rules} rules, ${d.summary.forbidden_combinations} forbidden combinations). Saved as inactive — activate it in the Brand DNA admin tab after reviewing.`,
    };
  }

  throw new Error(failed[0] || 'Guardrails generation failed');
}

async function synthesizeBrandProfile(
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const response = await fetch(`${supabaseUrl}/functions/v1/synthesize-brand-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ brand_id: context.brand_id }),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || `Brand profile synthesis failed (${response.status})`);
  }

  const sections = result.updated_sections || [];
  const { source_breakdown, confidence_score, images_analyzed } = result;
  const sourcesSummary = source_breakdown
    ? `${source_breakdown.websites || 0} website(s), ${source_breakdown.documents || 0} document(s), ${source_breakdown.images || 0} image(s)`
    : 'available intelligence';

  return {
    success: true,
    updated_sections: sections,
    confidence_score,
    images_analyzed,
    message: sections.length > 0
      ? `Brand DNA profile synthesized from ${sourcesSummary} (confidence: ${Math.round((confidence_score || 0) * 100)}%). Sections updated: ${sections.join(', ')}. The brand is ready for guardrail generation and campaign work.`
      : 'Brand profile synthesis completed but no sections were updated — run analyze_brand_website or import_brand_document first to build the intelligence base.',
  };
}

async function generateBrandPlaybook(
  params: Record<string, unknown>,
  context: { brand_id: string; user_id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const steps: string[] = [];
  const errors: string[] = [];

  // Step 1: Synthesize brand profile
  if (!params.skip_synthesis) {
    try {
      const synthResult = await synthesizeBrandProfile(context, supabase);
      steps.push(`✓ Brand DNA synthesized (${synthResult.updated_sections?.length || 0} sections)`);
    } catch (err: any) {
      errors.push(`Synthesis: ${err.message}`);
      steps.push(`⚠ Brand synthesis skipped — ${err.message}`);
    }
  } else {
    steps.push('→ Synthesis skipped');
  }

  // Step 2: Generate all 6 focused guardrail sets
  try {
    const guardrailResult = await generateBrandGuardrails({ all_areas: true }, context, supabase);
    steps.push(`✓ ${guardrailResult.generated || 0} governance directive sets created`);
  } catch (err: any) {
    errors.push(`Guardrails: ${err.message}`);
    steps.push(`⚠ Guardrails: ${err.message}`);
  }

  // Step 3: Generate brand-aware generation prompt
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const promptRes = await fetch(`${supabaseUrl}/functions/v1/synthesize-generation-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({ brand_id: context.brand_id }),
    });
    const promptData = await promptRes.json();
    if (promptRes.ok && promptData.success) {
      steps.push('✓ Brand generation prompt synthesized');
    } else {
      steps.push(`⚠ Generation prompt: ${promptData.error || 'failed'}`);
    }
  } catch (err: any) {
    steps.push(`⚠ Generation prompt: ${err.message}`);
  }

  // Step 4: Generate brand card images (optional) — fire-and-forget to avoid timeout
  // Each card is a Gemini image generation (~15s each × 5 = 75s+), so we don't await
  if (!params.skip_cards) {
    generateBrandCards({}, context, supabase)
      .then(cardResult => console.log(`[playbook] Cards done: ${cardResult.generated || 0} generated`))
      .catch(err => console.error(`[playbook] Cards failed: ${err.message}`));
    steps.push('→ Brand card images queued (generating in background)');
  } else {
    steps.push('→ Card images skipped');
  }

  // Step 5: Generate quick starters (Director Mode templates)
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const startersRes = await fetch(`${supabaseUrl}/functions/v1/generate-brand-starters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({ brand_id: context.brand_id }),
    });
    const startersData = await startersRes.json();
    if (startersRes.ok && startersData.success && startersData.starters?.length) {
      // Replace existing auto-generated starters
      await supabase
        .from('creative_studio_brand_prompts')
        .delete()
        .eq('brand_id', context.brand_id)
        .eq('is_auto_generated', true);
      await supabase.from('creative_studio_brand_prompts').insert(
        startersData.starters.map((s: Record<string, unknown>) => ({
          brand_id: context.brand_id,
          name: s.name,
          description: s.description,
          category: s.category,
          content_type: 'image',
          prompt_template: s.prompt_template,
          variable_fields: (s.variable_fields as unknown[]) ?? [],
          camera_preset: s.camera_preset ?? null,
          locked_parameters: {},
          is_auto_generated: true,
        }))
      );
      steps.push(`✓ ${startersData.starters.length} Director Mode starters generated`);
    } else {
      steps.push(`⚠ Starters: ${startersData.error || 'no starters returned'}`);
    }
  } catch (err: any) {
    errors.push(`Starters: ${err.message}`);
    steps.push(`⚠ Starters: ${err.message}`);
  }

  return {
    success: errors.length < 5,
    steps,
    errors: errors.length > 0 ? errors : undefined,
    message: errors.length === 0
      ? `Brand playbook complete! All 5 steps finished:\n${steps.join('\n')}\n\nThe brand is fully configured and ready for creative work.`
      : `Brand playbook done with ${errors.length} issue(s):\n${steps.join('\n')}`,
  };
}

// ── System Prompt Builder ───────────────────────────────────────────────────

function buildSystemPrompt(
  brand: Record<string, unknown> | null,
  profile: Record<string, unknown> | null,
  directives: Array<Record<string, unknown>>,
  models: Array<Record<string, unknown>>,
): string {
  const sections: string[] = [];

  sections.push(`You are Vince, the creative director for ${brand?.name || 'this brand'}. You help creative professionals translate ideas into precise, technical image generation prompts while maintaining brand consistency. You can also generate images directly.

PERSONALITY:
- Knowledgeable, creative, direct. Like a seasoned photographer who knows exactly what they want.
- Use natural, conversational language. No exclamation marks. No "I'd be happy to help!"
- When you create a prompt, explain your creative choices briefly.
- Build on the conversation — remember what the user liked and didn't like across turns.

CAPABILITIES:
You have tools to take real actions:
- create_brand: Create a new brand from scratch. Use when onboarding a new client.
- analyze_brand_website: Crawl a brand's website to extract visual DNA (colors, fonts, imagery, tone). Populates the brand profile automatically.
- import_brand_document: Process uploaded brand documents (PDFs, guidelines, reports) to extract brand intelligence.
- save_prompt_template: Save prompts to the brand library for reuse.
- search_prompt_library: Search existing templates before creating new ones.
- analyze_brand_image: Analyze reference images for brand visual DNA.
- get_brand_profile: Check current brand visual DNA status and details.
- list_available_models: Refresh the list of available models (you already have them below — use this only if you need a fresh check).
- check_generation_quota: Check if the user has quota remaining before generating.
- generate_image: Generate an image using the Creative Studio pipeline. Images are saved to the user's library automatically. Pass reference_collections to include brand reference images.
- list_brand_references: List available reference image collections for the brand (products, characters, styles, environments).
- generate_brand_header: Generate the brand's hero/header image using its visual DNA and colors. Saves directly to the brand record.
- generate_brand_cards: Generate the 5 brand card icons (DNA, Guidelines, Prompts, Templates, Agent) using the brand's color palette.
- list_camera_options: Browse available camera bodies, lenses, film stocks, lighting setups, and other equipment in the Creative Studio inventory. Returns options with their prompt_fragment — use these verbatim when building generation prompts. MANDATORY before every generate_image or generate_video call — never invent equipment.
- check_job_status: Check if a video or image analysis job has completed. Poll after generate_video to tell the user when their video is ready.
- list_guardrails: List all brand governance directives with their active/inactive status.
- activate_guardrail: Turn on a specific brand governance directive by directive ID.
- deactivate_guardrail: Turn off a specific brand governance directive by directive ID without deleting it.

BRAND ONBOARDING FLOW:
When a user says "create a new brand", "add a brand", "I need a new brand", "new client", or gives you a brand name to onboard — even if you are currently working with another brand — this is a SYSTEM ACTION, not a creative request. Do NOT ask about colors, mood, tone, visual style, or personality. Do NOT say the brand already exists unless create_brand returns an error — never assume or guess. Instead:
1. If the user gives you a brand name WITHOUT a website URL, infer it for well-known brands (e.g., "Google" → "google.com", "Nike" → "nike.com"). If you can't infer it, ask only for the website URL.
2. Call create_brand immediately with the name and website_url. Do NOT call it without a website URL.
3. Website analysis is triggered AUTOMATICALLY after brand creation — you do NOT need to call analyze_brand_website yourself. The system chains it for you. Tell the user: "I've created the brand and kicked off the website analysis — it takes about 30 seconds to extract colors, fonts, and visual identity."
4. If they provide documents (PDFs, brand guidelines, style guides), call import_brand_document for each one.
   After ALL documents are imported, ALWAYS call synthesize_brand_profile to merge the intelligence,
   then call generate_brand_playbook to generate directives, generation prompt, starters, and cards.
   Tell the user: "I've imported your documents and rebuilt the brand intelligence — running the full playbook now."
5. After DNA is loaded and profile looks solid, offer to generate the brand visuals: "Want me to build out the brand visuals? I'll generate the header image and card icons using your brand colors."
6. When the user confirms (or says "build it out", "finish the brand", "generate the brand images"), call generate_brand_header and generate_brand_cards to complete the brand setup.

BRAND VISUAL BUILDOUT:
- generate_brand_header creates a cinematic 16:9 hero image using the brand's color palette and visual identity. It pulls the stored hero image prompt template and interpolates brand variables.
- generate_brand_cards creates the 5 stylized 3D icons that represent brand sections. Each icon uses the brand's primary and secondary colors.
- Both tools save results directly to the brand record — no manual linking needed.
- If the user asks to regenerate specific cards, pass the card_keys parameter (e.g., ["brand_dna", "templates"]).
- These are brand-building tools, NOT creative studio image generation. Use them for brand setup and maintenance.

CAMERA & EQUIPMENT:
Camera choice is a creative decision — it changes the visual DNA of the image, not just metadata. A GoPro, a Fujifilm X100, and an ARRI Alexa produce fundamentally different looks. Treat every prompt like a photography brief: camera, lens, lighting, film stock, and color grade are always specified together.

You are the creative director. Pick the camera. Don't wait to be asked.

1. Before any generation, call list_camera_options to check the inventory. Pick equipment that serves the brief AND fits the brand's photography standards.
2. State your choice naturally: "Going with the ARRI Alexa here — the tonal range suits this brand's clean contemporary look."
3. Only ask when there's a genuine creative fork: "I could go Contax T2 for an editorial 35mm feel, or keep it digital. The brand leans contemporary but both could work. What's your instinct?"
4. When the user requests specific equipment: look it up with list_camera_options, get its prompt_fragment, apply it if it fits the brand.
5. When equipment conflicts with brand guidelines, push back with a concrete creative reason — not just "it violates policy." E.g., "The Bronica is gorgeous for medium format work, but this brand is built around crisp digital aesthetics — the grain and tonal softness would fight the look. Want to try the Contax T2? Similar indie feel, less at odds with the DNA."
6. Use the prompt_fragment from inventory verbatim in generation prompts — don't paraphrase it.

BEHAVIORAL RULES:
1. When generating a prompt, always include camera equipment selected from inventory.
2. Before creating a new template, search the library to avoid duplicates.
3. When the user asks to save something, use the save_prompt_template tool — don't just say you'll save it.
4. Respond conversationally. Don't wrap everything in JSON. Include prompts naturally in your response.
5. When you use a tool, briefly explain what you did and the result.
6. NEVER include brand names, product model names, or any text you want rendered onto the image in generation prompts. Describe products by their visual characteristics instead: "brushed chrome commercial flushometer" rather than "SLOAN ROYAL flushometer". Image generation models will hallucinate text onto images if you mention brand/product names.
7. ALWAYS call list_camera_options before every image generation. Never invent camera equipment — only use equipment names and prompt_fragments that exist in the inventory.`);

  // Inject available models so Vince can pick the right one without tool calls
  if (models.length > 0) {
    sections.push('\nAVAILABLE GENERATION MODELS:');
    for (const m of models) {
      const defaultLabel = m.is_default ? ' [DEFAULT]' : '';
      const caps = Array.isArray(m.capabilities) ? (m.capabilities as string[]).join(', ') : '';
      sections.push(`- ${m.name} (${m.model_id}): $${m.cost_per_generation}/generation. Capabilities: ${caps}${defaultLabel}`);
    }
  }

  sections.push(`
MODEL SELECTION:
You know your tools. Pick the right model based on the task:
- For photorealistic food/product photography, prefer Imagen models.
- For creative/stylized imagery or text rendering, prefer Gemini Pro Image.
- For quick iterations and exploration, prefer Gemini Flash.
- State your choice naturally: "I'll use Gemini Pro Image for this — handles the lighting nuances better."
- Only discuss model choice when there's a real tradeoff the user should weigh in on.

COST AWARENESS:
Every model has a cost per generation. Multiply by num_outputs for total cost.
- For routine single-image generations, just generate. Don't mention cost.
- For expensive operations (high-cost model × multiple outputs), flag it: "That's 4 on Imagen — runs about $X total. Want me to go ahead, or start with 1-2?"
- For very expensive operations, gate it: "Heads up — 4 renders at this quality is a big run. ~$X. Want to do 1 first to nail the look?"
- Never be annoying about cost on cheap operations.

GENERATION FLOW:
1. When the user describes a shot, compose the prompt and present it with your camera recommendations.
2. STOP. Wait for explicit confirmation before generating. Do NOT call generate_image or generate_video in the same turn you present the prompt.
3. Valid confirmations: "go ahead", "make it", "shoot it", "generate", "yes", "do it", "let's go". Describing a shot is NOT a confirmation.
   IMPORTANT: Keep your conversational text brief when calling synthesize_generation_prompt — one or two sentences max (e.g. "Golden hour with the ARRI Alexa — generating now."). The UI displays the full prompt and camera specs in structured cards below your message; do NOT repeat those details in your text response.
4. On confirmation: check quota with check_generation_quota, then generate immediately with generate_image.
5. Pick aspect ratio from context (Instagram → 1:1, stories → 9:16, hero banner → 16:9). State it, don't ask.
6. Default to 1 image. Generate 2 when exploring looks or when you want to give options.
7. After generation, present the results and offer to save the prompt to the library if it's a keeper.
8. If quota is exhausted, inform the user of the reset date and offer to save the prompt for later.

UPLOADED REFERENCE IMAGES:
- When the user uploads images (headshots, logos, products), you will see "[Reference images uploaded by user: url1, url2]" in their message.
- ALWAYS include those URLs as reference_image_urls when calling generate_creative_package or generate_image.
- These images become the actual subjects in the generated output — a headshot means that person appears, a logo means that logo appears.
- Never claim to use an uploaded image unless you actually passed its URL to the generation tool.

HEADSHOT SCENE GENERATION — TWO-STEP PATTERN (MANDATORY):
When the conversation contains "[Reference images uploaded by user: ...]" AND the user wants to appear in a generated image or creative package:

STEP 1 — Call generate_headshot_scene:
- Extract the photo URL from "[Reference images uploaded by user: url]" and pass it as photo_url exactly.
- Write a detailed scene_description: exact setting, lighting, who else is present, what the person is doing, background.
- Use aspect_ratio matching the deliverable (4:3 for LinkedIn, 9:16 for stories, 1:1 for square).

STEP 2 — Call generate_creative_package with pre_generated_image_url:
- After generate_headshot_scene returns output_url, immediately call generate_creative_package.
- Pass pre_generated_image_url: <output_url from step 1>.
- Pass the full brief and deliverables as normal.
- This generates only the written copy (headlines, body, CTAs) and attaches the headshot scene as the image — no duplicate image generation.

NEVER skip step 2 when the user asked for a creative package or LinkedIn post. The user needs both the scene photo AND the branded copy.
- Complete deliverable = generate_headshot_scene (image) + your text response (copy). No creative package needed.

REFERENCE IMAGE COLLECTIONS:
- When the user mentions a specific product, person, or character by name, use list_brand_references to check if reference collections exist.
- For "show our CEO at a conference" requests, include the character collection for that person via reference_collections.
- For product shots ("shoot the valve", "show our product"), include the relevant product collection.
- Don't check for references on every generation — only when the prompt clearly involves a specific recognizable subject.
- When using character references, briefly explain: "I'll include the reference photos for consistency."
- Character collections maintain the exact likeness of a person across different scenes and backgrounds.
- Product collections ensure the generated product looks like the real thing.
- Style collections match the brand's photography aesthetic without copying specific subjects.
- When a prompt involves both a person AND a product (e.g., "CEO holding our valve"), include both the character and product collections. Character references maintain likeness; product references maintain appearance. List both collection names in reference_collections.

LOGO USAGE:
- Set include_logo: true when the user asks for branded content where the logo should appear — social media posts, branded collateral, signage, packaging, branded banners, Instagram posts with the logo, etc.
- If the user says "include the logo", "add the brand logo", "put the logo on it", or similar — set include_logo: true.
- Do NOT set include_logo for lifestyle photography, product hero shots, food photography, mood boards, or other images where a logo would be unnatural.
- When unsure, ask: "Want the brand logo included in this one?"

VIDEO GENERATION:
Use generate_video when the user asks for a video, motion concept, or moving campaign asset.
- Duration must be exactly 4, 6, or 8 seconds — never 5 or 7.
- aspect_ratio supports only "16:9" (cinematic/hero) or "9:16" (stories/reels) — no 1:1 for video.
- Default: fast model, 8 seconds, 720p, 16:9.
- Audio is automatic on both models — always included, no parameter needed.
- Use model: "quality" when the user wants the best cinematic output or provides reference images. Costs more but looks better.
- Use reference_image_url when the user wants consistent subject/logo/product in the video — quality model only.
- Video renders in 1-3 minutes and appears in the History panel automatically.
- NEVER narrate generating a video without calling generate_video — text descriptions do nothing.

VIDEO WITH HEADSHOT — MANDATORY TWO-STEP RULE:
When the user wants to appear in a video (has uploaded a headshot AND wants to be placed in a scene), you MUST chain two tool calls:
1. Call generate_headshot_scene with photo_url=<headshot URL> and a vivid scene_description (location, action, lighting, what they're wearing, who else is present).
2. When generate_headshot_scene returns output_url, immediately call generate_video with generation_type="image_to_video" and input_image_url=<output_url from step 1>.
   - The prompt for generate_video should describe camera motion and action (e.g., "slow push-in, applause from audience, dramatic stage lighting").
   - Model can be fast or quality — both support image_to_video.
3. NEVER call generate_video with text_to_video when the user wants to appear in it — that generates a fictional person, not them.
Example: user says "put me on stage at Google Next" →
  Step 1: generate_headshot_scene(photo_url=<headshot>, scene_description="person in blazer on stage at Google Next, dramatic stage lighting, large audience, Google branding visible on backdrop")
  Step 2: generate_video(generation_type="image_to_video", input_image_url=<step1 output_url>, prompt="slow cinematic push-in, audience clapping, celebratory atmosphere")

CRITICAL — TOOL USAGE FOR GENERATION:
- NEVER say "I've generated", "here are your images", or "I created the image" unless you have ACTUALLY called the generate_image tool.
- Describing image generation in text is NOT the same as generating. You MUST call the generate_image tool to produce images.
- If the user asks you to generate, your response MUST include a generate_image function call. Text alone does nothing.
- Do not skip the tool call. Do not narrate generating instead of doing it.`);

  if (brand?.brand_voice) {
    sections.push(`\nBRAND VOICE: ${brand.brand_voice}`);
  }

  if (brand?.visual_identity) {
    sections.push(`\nVISUAL IDENTITY: ${brand.visual_identity}`);
  }

  if (profile?.visual_dna) {
    sections.push(`\nVISUAL DNA (${profile.total_images_analyzed || 0} images analyzed):\n${JSON.stringify(profile.visual_dna, null, 1)}`);
  }

  if (profile?.photography_style) {
    sections.push(`\nPHOTOGRAPHY STANDARDS:\n${JSON.stringify(profile.photography_style, null, 1)}`);
  }

  if (profile?.color_profile) {
    sections.push(`\nCOLOR PROFILE:\n${JSON.stringify(profile.color_profile, null, 1)}`);
  }

  if (profile?.composition_rules) {
    sections.push(`\nCOMPOSITION RULES:\n${JSON.stringify(profile.composition_rules, null, 1)}`);
  }

  if (profile?.product_catalog) {
    sections.push(`\nPRODUCT CATALOG:\n${JSON.stringify(profile.product_catalog, null, 1)}`);
  }

  if (profile?.brand_identity) {
    sections.push(`\nBRAND IDENTITY:\n${JSON.stringify(profile.brand_identity, null, 1)}`);
  }

  if (profile?.tone_of_voice) {
    sections.push(`\nTONE OF VOICE:\n${JSON.stringify(profile.tone_of_voice, null, 1)}`);
  }

  if (profile?.typography) {
    sections.push(`\nTYPOGRAPHY:\n${JSON.stringify(profile.typography, null, 1)}`);
  }

  for (const directive of directives) {
    sections.push(`\nDIRECTIVE — ${directive.name}:`);
    sections.push(`Persona: ${directive.persona}`);
    if (directive.rules) sections.push(`Rules: ${JSON.stringify(directive.rules)}`);
    if (directive.forbidden_combinations) sections.push(`Forbidden: ${JSON.stringify(directive.forbidden_combinations)}`);
    if (directive.required_elements) sections.push(`Required: ${JSON.stringify(directive.required_elements)}`);
    if (directive.tone_guidelines) sections.push(`Tone: ${directive.tone_guidelines}`);
  }

  return sections.join('\n');
}

// ── Main Handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const genAI = new GoogleGenerativeAI(geminiApiKey);

    const body = await req.json();

    // Tool declarations are not sensitive — always serve them regardless of auth state
    if (body.mode === 'get_tools') {
      return new Response(JSON.stringify({ success: true, tools: VINCE_TOOLS }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Authenticate all other requests
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.mode === 'tool_call') {
      if (!body.tool_name) {
        return new Response(JSON.stringify({ success: false, error: 'tool_name is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const brandlessTools = ['create_brand', 'analyze_competitor_content', 'analyze_self_demo', 'check_job_status'];
      if (!body.brand_id && !brandlessTools.includes(body.tool_name)) {
        return new Response(JSON.stringify({ success: false, error: 'brand_id is required for tool calls' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      try {
        const result = await executeTool(
          body.tool_name,
          body.parameters || {},
          { brand_id: body.brand_id, user_id: user.id },
          supabase,
          geminiApiKey,
        );

        // Website analysis after create_brand is triggered client-side (brandAgentLiveService)
        // to avoid edge function lifecycle issues in voice mode

        return new Response(JSON.stringify({ success: true, result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (toolError) {
        console.error(`[Vince] Tool call error (${body.tool_name}):`, toolError);
        return new Response(JSON.stringify({ success: false, error: toolError.message || 'Tool execution failed' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── Standard chat mode ───────────────────────────────────────────────
    let { brand_id } = body;
    const { user_message, parts, conversation_id, user_context } = body;

    if (!user_message && !parts) {
      return new Response(JSON.stringify({ success: false, error: 'user_message is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Vince] Message from ${user.email}: "${(user_message ?? '[multimodal]').slice(0, 80)}"`);

    // Load brand context and available models
    let brand: Record<string, unknown> | null = null;
    let profile: Record<string, unknown> | null = null;
    let directives: Array<Record<string, unknown>> = [];
    let models: Array<Record<string, unknown>> = [];

    if (brand_id) {
      const [brandResult, profileResult, directivesResult, modelsResult] = await Promise.all([
        supabase.from('creative_studio_brands').select('*').eq('id', brand_id).single(),
        supabase.from('creative_studio_brand_profiles').select('*').eq('brand_id', brand_id).single(),
        supabase.from('creative_studio_agent_directives').select('*').eq('brand_id', brand_id).eq('is_active', true),
        supabase.from('creative_studio_models').select('model_id, name, model_type, capabilities, cost_per_generation, is_default').eq('is_active', true).order('sort_order', { ascending: true }),
      ]);

      brand = brandResult.data;
      profile = profileResult.data;
      directives = directivesResult.data || [];
      models = modelsResult.data || [];

      if (!brand) {
        return new Response(JSON.stringify({ success: false, error: 'Brand not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // No brand selected — load just models for onboarding mode
      const modelsResult = await supabase
        .from('creative_studio_models')
        .select('model_id, name, model_type, capabilities, cost_per_generation, is_default')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      models = modelsResult.data || [];
    }

    // Load conversation history
    let messages: ChatMessage[] = [];
    let toolCallsCount = 0;
    if (conversation_id) {
      const { data: conversation } = await supabase
        .from('chatbot_conversations')
        .select('messages, tool_calls_count')
        .eq('id', conversation_id)
        .single();

      if (conversation) {
        messages = (conversation.messages as ChatMessage[]) || [];
        toolCallsCount = conversation.tool_calls_count || 0;
      }
    }

    // Add current user message to history
    messages.push({
      role: 'user',
      content: user_message ?? '[multimodal message]',
      timestamp: new Date().toISOString(),
    });

    // Build Gemini history from prior messages (exclude current)
    const historyParts = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }],
    }));

    // Build system prompt with model knowledge
    const systemPrompt = buildSystemPrompt(brand, profile, directives, models);

    // Initialize Gemini with tools
    const chatStart = Date.now();
    const modelName = body.model_override || 'gemini-3-flash-preview';
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: VINCE_TOOLS }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 4096,
      },
    });

    const chat = model.startChat({ history: historyParts });

    // Extract inline image data URIs from parts for tool call injection
    const inlineImageDataUris: string[] = [];
    if (parts && Array.isArray(parts)) {
      for (const part of parts) {
        if (part.inlineData?.mimeType && part.inlineData?.data) {
          inlineImageDataUris.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
        }
      }
    }

    // Send message — use parts[] for multimodal, plain text otherwise
    const sendContent = parts || user_message;
    let result: Awaited<ReturnType<typeof chat.sendMessage>>;
    try {
      result = await chat.sendMessage(sendContent);
    } catch (geminiErr) {
      const msg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
      console.error('[Vince] Gemini sendMessage failed:', msg);
      return new Response(JSON.stringify({ success: true, message: "I ran into a problem processing that request. Could you try rephrasing or try again?" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    let response = result.response;

    const toolCalls: ToolCall[] = [];
    let functionCallsResult: ReturnType<typeof response.functionCalls>;
    try {
      functionCallsResult = response.functionCalls();
    } catch (fcErr) {
      console.error('[Vince] response.functionCalls() threw — treating as no tool calls:', fcErr instanceof Error ? fcErr.message : String(fcErr));
      functionCallsResult = undefined;
    }

    while (functionCallsResult && functionCallsResult.length > 0) {
      const functionCall = functionCallsResult[0];
      const toolName = functionCall.name;
      const parameters = (functionCall.args || {}) as Record<string, unknown>;

      // Gemini hallucinates URLs for inline images — always use the actual inline data
      if (toolName === 'analyze_brand_image' && inlineImageDataUris.length > 0) {
        parameters.image_urls = inlineImageDataUris;
      }

      // Auto-inject uploaded reference image into video/headshot tools when Gemini omits it.
      // Gemini frequently ignores the system prompt rule about passing reference_image_url.
      // Scan current message and conversation history for the uploaded image marker.
      if ((toolName === 'generate_video' || toolName === 'generate_headshot_scene') && !parameters.input_image_url && !parameters.reference_image_url && !parameters.photo_url) {
        const allContent = [user_message || '', ...messages.slice(0, -1).map(m => m.content)];
        for (const content of allContent) {
          const match = content.match(/\[Reference images uploaded by user: ([^\]]+)\]/);
          if (match) {
            const urls = match[1].split(',').map(u => u.trim()).filter(Boolean);
            if (urls.length > 0) {
              if (toolName === 'generate_headshot_scene') {
                parameters.photo_url = urls[0];
                console.log(`[Vince] Auto-injected photo_url into generate_headshot_scene: ${urls[0]}`);
              }
              // generate_video: only auto-inject when explicitly image_to_video; don't force it for text_to_video
              break;
            }
          }
        }
      }

      console.log(`[Vince] Executing tool: ${toolName}`, JSON.stringify(parameters).slice(0, 200));

      try {
        const toolResult = await executeTool(
          toolName,
          parameters,
          { brand_id, user_id: user.id },
          supabase,
          geminiApiKey,
        );
        toolCalls.push({ toolName, parameters, result: toolResult, success: true });
        toolCallsCount++;

        // After create_brand, update brand_id and auto-chain website analysis
        if (toolName === 'create_brand' && toolResult?.brand_id) {
          brand_id = toolResult.brand_id;

          // Deterministic chaining: automatically run website analysis if brand has a URL
          const newBrandUrl = (toolResult as Record<string, unknown>).website_url as string | undefined;
          if (newBrandUrl) {
            console.log(`[Vince] Auto-chaining: analyze_brand_website for ${newBrandUrl}`);
            try {
              const analysisResult = await executeTool(
                'analyze_brand_website',
                { url: newBrandUrl },
                { brand_id, user_id: user.id },
                supabase,
                geminiApiKey,
              );
              toolCalls.push({ toolName: 'analyze_brand_website', parameters: { url: newBrandUrl }, result: analysisResult, success: true });
              toolCallsCount++;

              // Send both results to Gemini so it can compose a unified response
              result = await chat.sendMessage([
                { functionResponse: { name: toolName, response: toolResult } },
                { functionResponse: { name: 'analyze_brand_website', response: analysisResult } },
              ]);
            } catch (analysisError) {
              const analysisErrorMsg = analysisError instanceof Error ? analysisError.message : String(analysisError);
              console.error(`[Vince] Auto-chain analyze_brand_website failed:`, analysisErrorMsg);
              toolCalls.push({ toolName: 'analyze_brand_website', parameters: { url: newBrandUrl }, error: analysisErrorMsg, success: false });

              // Send create_brand result + analysis error to Gemini
              result = await chat.sendMessage([
                { functionResponse: { name: toolName, response: toolResult } },
                { functionResponse: { name: 'analyze_brand_website', response: { error: analysisErrorMsg } } },
              ]);
            }
            response = result.response;
            functionCallsResult = response.functionCalls();
            continue; // Skip the normal sendMessage below — we already sent both responses
          }
        }

        result = await chat.sendMessage([{
          functionResponse: { name: toolName, response: toolResult },
        }]);
        response = result.response;
        functionCallsResult = response.functionCalls();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Vince] Tool failed: ${toolName}`, errorMessage);
        toolCalls.push({ toolName, parameters, error: errorMessage, success: false });

        try {
          result = await chat.sendMessage([{
            functionResponse: { name: toolName, response: { error: errorMessage } },
          }]);
          response = result.response;
          functionCallsResult = response.functionCalls();
        } catch (recoveryErr) {
          console.error('[Vince] Recovery sendMessage failed:', recoveryErr);
          functionCallsResult = undefined;
        }
      }
    }

    let assistantContent: string;
    try {
      assistantContent = response.text();
    } catch {
      // Gemini may return empty/blocked response with no text parts
      console.warn('[Vince] response.text() threw — no text in final response');
      assistantContent = '';
    }

    // Extract structured data from tool call results
    let extractedPrompt: string | undefined;
    let extractedCameraPreset: Record<string, unknown> | undefined;
    let extractedModel: string | undefined;
    let generatedImages: Array<{ url: string; generation_id?: string }> | undefined;

    for (const tc of toolCalls) {
      if (tc.toolName === 'save_prompt_template' && tc.success) {
        extractedPrompt = tc.parameters.prompt_template as string;
        extractedCameraPreset = tc.parameters.camera_preset as Record<string, unknown>;
        extractedModel = tc.parameters.recommended_model as string;
      }
      if (tc.toolName === 'generate_image' && tc.success) {
        const result = tc.result as Record<string, unknown>;
        const urls = result.output_urls as string[];
        if (urls?.length) {
          generatedImages = urls.map(url => ({
            url,
            generation_id: result.generation_id as string,
          }));
        }
        // Also extract the prompt and camera preset from the generation call
        if (!extractedPrompt) {
          extractedPrompt = tc.parameters.prompt as string;
          extractedCameraPreset = tc.parameters.camera_preset as Record<string, unknown>;
          extractedModel = tc.parameters.model_id as string;
        }
      }
    }

    // Detect when Vince intended to generate: either called the tool, or claimed generation without calling it
    const claimsGeneration = assistantContent && /\b(generat(ed|ing)|creat(ed|ing)\s+(the\s+)?image|here\s+(are|is)\s+(your|the)\s+image)/i.test(assistantContent);
    const hasGenerateToolCall = toolCalls.some(tc => tc.toolName === 'generate_image');
    const generationRequested = hasGenerateToolCall || (claimsGeneration && !generatedImages?.length);

    // When Vince claims generation without calling the tool, recover the prompt for the frontend
    if (claimsGeneration && !hasGenerateToolCall && !extractedPrompt) {
      console.warn('[Vince] Detected generation claim without tool call — extracting prompt for UI pipeline');
      // Search conversation history for the most recent saved prompt
      for (let i = messages.length - 2; i >= 0; i--) {
        const msg = messages[i];
        if (msg.role === 'assistant' && msg.toolCalls) {
          const saveCall = msg.toolCalls.find(tc => tc.toolName === 'save_prompt_template' && tc.success);
          if (saveCall?.parameters?.prompt_template) {
            extractedPrompt = saveCall.parameters.prompt_template as string;
            extractedCameraPreset = saveCall.parameters.camera_preset as Record<string, unknown>;
            extractedModel = saveCall.parameters.recommended_model as string;
            break;
          }
        }
      }
      // Fall back to the previous assistant message content (likely contains the crafted prompt)
      if (!extractedPrompt) {
        for (let i = messages.length - 2; i >= 0; i--) {
          if (messages[i].role === 'assistant' && messages[i].content.length > 50) {
            extractedPrompt = messages[i].content;
            break;
          }
        }
      }
    }

    // Save assistant message to conversation
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: assistantContent || '',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      timestamp: new Date().toISOString(),
    };
    messages.push(assistantMessage);

    // Persist conversation — upsert to handle cases where client-side creation failed
    if (conversation_id) {
      console.log(`[Vince] Saving ${messages.length} messages to conversation ${conversation_id}`);
      const { error: saveError } = await supabase
        .from('chatbot_conversations')
        .upsert({
          id: conversation_id,
          user_id: user.id,
          messages,
          tool_calls_count: toolCallsCount,
          metadata: { assistant: 'vince' },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (saveError) {
        console.error(`[Vince] Conversation save failed:`, saveError.message);
      } else {
        console.log(`[Vince] Conversation saved successfully`);
      }
    } else {
      console.warn('[Vince] No conversation_id — messages not persisted');
    }

    // Audit log
    await supabase.from('creative_studio_audit_log').insert({
      user_id: user.id,
      user_email: user.email,
      action: 'brand_prompt_agent',
      brand_id,
      prompt_text: user_message,
      parameters: {
        has_profile: !!profile,
        profile_confidence: profile?.confidence_score,
        directives_count: directives.length,
        tools_called: toolCalls.map(tc => tc.toolName),
        tools_succeeded: toolCalls.filter(tc => tc.success).length,
        model_used: modelName,
      },
    });

    console.log(`[Vince] Response complete. Tools called: ${toolCalls.length}, Content length: ${(assistantContent || '').length}`);

    trackUsage({
      supabase,
      userId: user.id,
      apiProvider: 'gemini',
      endpoint: 'brand-prompt-agent',
      modelName,
      featureType: 'chat',
      promptText: user_message,
      usageMetadata: response.usageMetadata,
      responseTimeMs: Date.now() - chatStart,
      status: 'success',
      metadata: { brandId: brand_id, toolCallsCount }
    });

    return new Response(JSON.stringify({
      success: true,
      message: assistantContent || '',
      brand_id,
      prompt: extractedPrompt,
      camera_preset: extractedCameraPreset,
      recommended_model: extractedModel,
      reasoning: assistantContent,
      tool_actions: toolCalls.length > 0 ? toolCalls : undefined,
      generated_images: generatedImages,
      generation_requested: generationRequested || false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    console.error('[Vince] Error:', errorMessage, stack);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage || 'Agent failed',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
