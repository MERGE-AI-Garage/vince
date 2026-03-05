// ABOUTME: One-shot Gemini enhancement for Director Mode prompts using Brand DNA
// ABOUTME: Takes current Director fields + brand context and returns brand-enhanced field values

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DirectorFields {
  scene_description: string;
  camera_movement: string;
  lighting: string;
  lens: string;
  subject_attributes: string;
  dialogue: string;
}

interface EnhanceRequest {
  brand_id: string;
  current_fields: DirectorFields;
  mode: 'quick' | 'full';
  media_type?: 'image' | 'video';
  starter_prompt?: string;
  starter_name?: string;
  available_options: {
    camera_movements: string[];
    lighting_presets: string[];
    lens_presets: string[];
  };
}

// Find the closest match from allowed options using substring/keyword matching
function fuzzyMatchOption(value: string, options: string[]): string {
  if (!value) return '';
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '_');

  // Exact match first
  if (options.includes(value)) return value;
  if (options.includes(normalized)) return normalized;

  // Keyword matching — map common terms to option slugs
  const keywordMap: Record<string, string[]> = {
    'static': ['static', 'locked', 'fixed', 'still', 'tripod'],
    'pan_left': ['pan_left', 'pan left'],
    'pan_right': ['pan_right', 'pan right'],
    'tilt_up': ['tilt_up', 'tilt up'],
    'tilt_down': ['tilt_down', 'tilt down'],
    'dolly_in': ['dolly_in', 'dolly in', 'push_in', 'push in', 'move_in', 'move in', 'slow_push', 'slow push', 'forward'],
    'dolly_out': ['dolly_out', 'dolly out', 'pull_back', 'pull back', 'pull_out', 'reveal'],
    'crane_up': ['crane_up', 'crane up', 'jib_up', 'rise'],
    'crane_down': ['crane_down', 'crane down', 'jib_down', 'descend'],
    'tracking_left': ['tracking_left', 'track_left', 'track left', 'lateral_left'],
    'tracking_right': ['tracking_right', 'track_right', 'track right', 'lateral_right'],
    'orbit': ['orbit', 'arc', 'circular', 'revolve', 'rotate', '360'],
    'handheld': ['handheld', 'hand_held', 'natural', 'documentary'],
    'steadicam': ['steadicam', 'steady', 'smooth', 'glide', 'floating'],
    'natural_daylight': ['natural_daylight', 'natural daylight', 'daylight', 'natural_light', 'natural light', 'bright_natural', 'window_light', 'sun'],
    'golden_hour': ['golden_hour', 'golden', 'warm_natural', 'sunset', 'sunrise'],
    'blue_hour': ['blue_hour', 'blue hour', 'twilight', 'dusk'],
    'studio_three_point': ['studio', 'three_point', '3_point', 'three point', 'studio_lighting', 'professional', 'controlled'],
    'dramatic_side': ['dramatic_side', 'dramatic side', 'side_light', 'side light', 'dramatic', 'side_lit', 'side lit', 'rembrandt', 'chiaroscuro'],
    'neon_glow': ['neon', 'urban', 'glow', 'city_light'],
    'candlelight': ['candlelight', 'candle', 'warm_ambient', 'warm ambient', 'flame'],
    'overcast': ['overcast', 'diffused', 'soft_light', 'soft light', 'cloudy', 'even_light'],
    'high_key': ['high_key', 'high key', 'bright', 'minimal_shadow', 'clean_bright'],
    'low_key': ['low_key', 'low key', 'dark', 'moody', 'noir'],
    'wide_angle_16mm': ['16mm', 'ultra_wide', 'ultra wide'],
    'wide_24mm': ['24mm', 'wide_angle', 'wide angle', 'wide'],
    'standard_35mm': ['35mm', 'standard'],
    'normal_50mm': ['50mm', 'normal', 'nifty_fifty'],
    'portrait_85mm': ['85mm', 'portrait', 'medium_telephoto'],
    'telephoto_135mm': ['135mm', 'telephoto', 'compressed'],
    'macro': ['macro', 'close_up', 'close-up', 'closeup', 'extreme_close', 'detail'],
    'anamorphic': ['anamorphic', 'cinematic', 'widescreen', 'cinemascope'],
    'tilt_shift': ['tilt_shift', 'tilt shift', 'miniature', 'selective_focus'],
    'fisheye': ['fisheye', 'fish_eye', 'barrel'],
  };

  const lowerVal = value.toLowerCase();
  for (const [optionSlug, keywords] of Object.entries(keywordMap)) {
    if (!options.includes(optionSlug)) continue;
    for (const keyword of keywords) {
      if (lowerVal.includes(keyword) || normalized.includes(keyword.replace(/\s/g, '_'))) {
        return optionSlug;
      }
    }
  }

  // No match found — return empty (will show as "Auto"/"None")
  return '';
}

function buildBrandContext(
  brand: Record<string, unknown>,
  profile: Record<string, unknown> | null,
  directives: Array<Record<string, unknown>>,
): string {
  const sections: string[] = [];

  sections.push(`Brand: ${brand.name}`);

  if (brand.brand_voice) {
    sections.push(`Brand Voice: ${brand.brand_voice}`);
  }

  if (brand.visual_identity) {
    sections.push(`Visual Identity: ${brand.visual_identity}`);
  }

  if (profile?.photography_style) {
    sections.push(`Photography Style: ${JSON.stringify(profile.photography_style, null, 1)}`);
  }

  if (profile?.color_profile) {
    sections.push(`Color Profile: ${JSON.stringify(profile.color_profile, null, 1)}`);
  }

  if (profile?.composition_rules) {
    sections.push(`Composition Rules: ${JSON.stringify(profile.composition_rules, null, 1)}`);
  }

  if (profile?.product_catalog) {
    sections.push(`Product Catalog: ${JSON.stringify(profile.product_catalog, null, 1)}`);
  }

  if (profile?.brand_identity) {
    sections.push(`Brand Identity: ${JSON.stringify(profile.brand_identity, null, 1)}`);
  }

  if (profile?.tone_of_voice) {
    sections.push(`Tone of Voice: ${JSON.stringify(profile.tone_of_voice, null, 1)}`);
  }

  for (const directive of directives) {
    if (directive.rules) sections.push(`Directive Rules: ${JSON.stringify(directive.rules)}`);
    if (directive.forbidden_combinations) sections.push(`Forbidden: ${JSON.stringify(directive.forbidden_combinations)}`);
    if (directive.required_elements) sections.push(`Required: ${JSON.stringify(directive.required_elements)}`);
  }

  return sections.join('\n\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: EnhanceRequest = await req.json();
    const { brand_id, current_fields, mode, media_type = 'video', starter_prompt, starter_name, available_options } = body;
    const isImage = media_type === 'image';

    if (!brand_id) {
      return new Response(JSON.stringify({ success: false, error: 'brand_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load brand context
    const [brandResult, profileResult, directivesResult] = await Promise.all([
      supabaseClient.from('creative_studio_brands').select('*').eq('id', brand_id).single(),
      supabaseClient.from('creative_studio_brand_profiles').select('*').eq('brand_id', brand_id).single(),
      supabaseClient.from('creative_studio_agent_directives').select('*').eq('brand_id', brand_id).eq('is_active', true),
    ]);

    const brand = brandResult.data;
    if (!brand) {
      return new Response(JSON.stringify({ success: false, error: 'Brand not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const profile = profileResult.data;
    const directives = directivesResult.data || [];
    const brandContext = buildBrandContext(brand, profile, directives);

    // Build Gemini prompt
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.8,
      },
    });

    const systemInstruction = isImage
      ? `You are a creative director specializing in PHOTOGRAPHY for the brand "${brand.name}". Your job is to translate creative briefs into Director Mode fields for AI STILL IMAGE generation.

CRITICAL: You are generating a SINGLE STILL PHOTOGRAPH, not a video. The input brief may contain video/motion language — you MUST rewrite it as a static composition:
- "camera glides forward" / "cinematic sweep" / "tracking shot" → describe the STATIC VANTAGE POINT instead (e.g., "centered low-angle perspective looking down the length of the room")
- "pan across" / "slow reveal" → describe what is VISIBLE IN FRAME from a fixed position
- "dolly in" / "push in" → use the equivalent LENS CHOICE (telephoto for compressed perspective, wide for environmental context)
- ANY motion verbs (glides, sweeps, tracks, moves, follows) → replace with spatial/compositional language (centered, symmetrical, off-center, foreground/background layering)
- The scene_description must read like a photograph caption, NOT a shot list or storyboard

BRAND CONTEXT:
${brandContext}

RULES:
1. camera_movement MUST always be "" (not applicable for still images)
2. lighting MUST be one of these exact slugs: ${JSON.stringify(available_options.lighting_presets)}
3. lens MUST be one of these exact slugs: ${JSON.stringify(available_options.lens_presets)}
4. Use empty string "" for any dropdown field where "Auto" is appropriate
5. scene_description MUST be vivid and specific (1-3 sentences) describing a SINGLE FROZEN MOMENT — NEVER leave this empty
6. subject_attributes should describe the main subject's appearance, material, and key visual features
7. dialogue MUST always be "" (not applicable for still images)
8. lighting and lens should be populated — pick the best match for the brand's visual style

Return a JSON object with exactly these fields:
{
  "scene_description": "string — REQUIRED, never empty, must describe a STILL photograph",
  "camera_movement": "",
  "lighting": "string (exact slug from allowed values)",
  "lens": "string (exact slug from allowed values)",
  "subject_attributes": "string",
  "dialogue": ""
}`
      : `You are a creative director specializing in VIDEO production for the brand "${brand.name}". Your job is to translate creative briefs — which may be written for still photography — into VIDEO Director Mode fields for AI video generation.

IMPORTANT: The input may describe a still photography shot (with aperture, focal length, studio lighting). You must REINTERPRET these as video concepts:
- Still photo lighting descriptions → choose the closest VIDEO lighting preset
- Aperture/focal length → choose the closest VIDEO lens preset
- "Studio shot" or "hero shot" → translate to a slow, controlled camera movement (dolly, orbit, or static)
- "Macro" or "close-up" → use the macro lens and a slow dolly_in camera movement
- "Wide establishing shot" → use wide_24mm lens with a slow pan or steadicam

BRAND CONTEXT:
${brandContext}

RULES:
1. camera_movement MUST be one of these exact slugs: ${JSON.stringify(available_options.camera_movements)}
2. lighting MUST be one of these exact slugs: ${JSON.stringify(available_options.lighting_presets)}
3. lens MUST be one of these exact slugs: ${JSON.stringify(available_options.lens_presets)}
4. Use empty string "" for any dropdown field where "Auto" or "None" is appropriate
5. scene_description MUST be vivid and specific (1-3 sentences) — NEVER leave this empty
6. subject_attributes should describe the main subject's appearance, material, and key visual features
7. dialogue can be empty "" if there are no speaking subjects
8. ALL dropdown fields (camera_movement, lighting, lens) should be populated — pick the best match, don't leave them empty

Return a JSON object with exactly these fields:
{
  "scene_description": "string — REQUIRED, never empty",
  "camera_movement": "string (exact slug from allowed values)",
  "lighting": "string (exact slug from allowed values)",
  "lens": "string (exact slug from allowed values)",
  "subject_attributes": "string",
  "dialogue": "string"
}`;

    let userPrompt: string;

    if (starter_prompt) {
      // Expanding a quick starter or template into full Director fields
      userPrompt = isImage
        ? `Translate this creative brief into Director Mode fields for a ${brand.name} brand STILL PHOTOGRAPH. The brief may have been written for video — rewrite any motion/camera movement language as a static composition description.

Creative brief: "${starter_prompt}"

Fill in scene_description, lighting, lens, and subject_attributes. The scene_description MUST describe a single frozen moment as a photograph — NO motion verbs, NO camera movement language. Set camera_movement and dialogue to empty strings "".`
        : `Translate this creative brief into full VIDEO Director Mode fields for a ${brand.name} brand video. Even if the brief describes a still photograph, reimagine it as a cinematic video scene.

Creative brief: "${starter_prompt}"

You MUST fill in ALL 6 fields. For dropdown fields, use the EXACT slug values from the allowed lists. Never return empty strings for scene_description, camera_movement, lighting, or lens.`;
    } else if (mode === 'quick') {
      // Fill empty fields, preserve user's existing values
      const relevantFields = isImage
        ? Object.entries(current_fields).filter(([k]) => k !== 'camera_movement' && k !== 'dialogue')
        : Object.entries(current_fields);
      const filledFields = relevantFields
        .filter(([_, v]) => v && v.trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      const emptyFields = relevantFields
        .filter(([_, v]) => !v || !v.trim())
        .map(([k]) => k)
        .join(', ');

      userPrompt = `The user has partially filled Director Mode fields. Fill in the EMPTY fields to complement what they've already written, keeping everything brand-consistent.

Already filled:
${filledFields || '(nothing filled yet)'}

Empty fields to fill: ${emptyFields || '(all filled)'}

IMPORTANT: For fields the user already filled, return their EXACT text unchanged. Only enhance the empty fields.${isImage ? ' Always set camera_movement and dialogue to empty strings "". The scene_description must describe a still photograph — no motion verbs or camera movement language.' : ''}`;
    } else {
      // Full rewrite mode
      const relevantFields = isImage
        ? Object.entries(current_fields).filter(([k]) => k !== 'camera_movement' && k !== 'dialogue')
        : Object.entries(current_fields);
      const existingContext = relevantFields
        .filter(([_, v]) => v && v.trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');

      const mediaLabel = isImage ? 'photograph' : 'video';
      userPrompt = `Rewrite ALL Director Mode fields for maximum brand alignment with ${brand.name}. Use the user's existing content as inspiration but feel free to improve everything.

User's current fields:
${existingContext || `(empty — create from scratch for a typical brand ${mediaLabel})`}

Create the best possible brand-aligned ${mediaLabel} scene.${isImage ? ' Always set camera_movement and dialogue to empty strings "". The scene_description must describe a still photograph — no motion verbs or camera movement language.' : ''}`;
    }

    console.log(`[enhance-director-prompt] Brand: ${brand.name}, Media: ${media_type}, Mode: ${mode || 'starter'}, Starter: ${starter_name || 'none'}, User: ${user.email}`);

    const result = await model.generateContent({
      systemInstruction,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    });

    const responseText = result.response.text();
    let enhanced: DirectorFields;

    try {
      enhanced = JSON.parse(responseText);
    } catch {
      console.error('[enhance-director-prompt] Failed to parse Gemini response:', responseText);
      return new Response(JSON.stringify({ success: false, error: 'Failed to parse AI response' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For images, force video-only fields to empty
    if (isImage) {
      enhanced.camera_movement = '';
      enhanced.dialogue = '';
    }

    // Fuzzy-match dropdown values to closest valid option
    enhanced.camera_movement = fuzzyMatchOption(
      enhanced.camera_movement || '',
      available_options.camera_movements,
    );
    enhanced.lighting = fuzzyMatchOption(
      enhanced.lighting || '',
      available_options.lighting_presets,
    );
    enhanced.lens = fuzzyMatchOption(
      enhanced.lens || '',
      available_options.lens_presets,
    );

    // Fallback: if scene_description is empty but we had a starter prompt, use it
    if (!enhanced.scene_description?.trim() && starter_prompt) {
      enhanced.scene_description = starter_prompt;
    }

    // Ensure all fields exist as strings
    enhanced.scene_description = enhanced.scene_description || '';
    enhanced.camera_movement = enhanced.camera_movement || '';
    enhanced.lighting = enhanced.lighting || '';
    enhanced.lens = enhanced.lens || '';
    enhanced.subject_attributes = enhanced.subject_attributes || '';
    enhanced.dialogue = enhanced.dialogue || '';

    console.log(`[enhance-director-prompt] Result — scene: ${enhanced.scene_description.slice(0, 80)}..., camera: ${enhanced.camera_movement}, lighting: ${enhanced.lighting}, lens: ${enhanced.lens}`);

    return new Response(JSON.stringify({
      success: true,
      fields: enhanced,
      applied_starter: starter_name || null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[enhance-director-prompt] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
