// ABOUTME: Edge Function for Creative Studio image generation
// ABOUTME: Supports text-to-image, editing, upscaling, virtual try-on, product recontext via Gemini/Imagen

import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Vertex AI configuration for models not available on the Gemini API
const VERTEX_AI_PROJECT = 'ai-garage-aigarage-site-oauth';
const VERTEX_AI_LOCATION = 'us-central1';
const VERTEX_AI_BASE_URL = `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_PROJECT}/locations/${VERTEX_AI_LOCATION}/publishers/google/models`;

// Models that require Vertex AI instead of the Gemini API
const VERTEX_AI_MODELS = ['imagen-4.0-upscale-preview', 'virtual-try-on-001', 'imagen-product-recontext-preview-06-30'];

type GenerationType = 'text_to_image' | 'image_edit' | 'inpainting' | 'outpainting' | 'upscaling' | 'product_recontext' | 'virtual_try_on' | 'multi_turn_edit';

interface ConversationHistoryTurn {
  role: 'user' | 'model';
  text?: string;
  image_url?: string;
  thought_signature?: string;
}

interface ReferenceImage {
  image: string;
  media_resolution?: string;
  reference_intent?: 'subject' | 'style' | 'structure' | 'logo';
  reference_type?: 'product' | 'character' | 'style' | 'environment';
  collection?: string;
}

const REFERENCE_INTENT_PROMPTS: Record<string, string> = {
  subject: 'The following image is a reference of the subject/product that MUST appear prominently in the generated image. Reproduce this specific object faithfully — preserve its shape, color, materials, branding, and distinguishing details.',
  style: 'The following image is a style reference. Match its visual aesthetic — color palette, lighting mood, texture treatment, and artistic style — but do NOT reproduce the specific objects in it.',
  structure: 'The following image is a composition/structure reference. Follow its spatial layout, framing, perspective, and arrangement of elements, but generate original content with the style and subject from the text prompt.',
  logo: 'The following image is the brand\'s OFFICIAL LOGO. When the prompt calls for the brand logo or brand mark, you MUST reproduce THIS EXACT logo faithfully — same shape, colors, proportions, and typography. Do NOT invent, approximate, or hallucinate the logo. Use this provided image as the authoritative source.',
  character: 'The following images show the same person from multiple angles and expressions. You MUST reproduce this EXACT person faithfully in the generated image — same facial structure, hair, eye color, skin tone, build, and distinguishing features. The person should look identical across all generated scenes.',
};

interface GenerateImageRequest {
  generation_type: GenerationType;
  prompt: string;
  model_id?: string;
  brand_id?: string;
  user_id?: string; // For server-to-server calls (e.g., from brand-prompt-agent)
  negative_prompt?: string;
  aspect_ratio?: string;
  num_outputs?: number;
  seed?: number;
  input_image?: string;
  mask_image?: string;
  expansion_direction?: string;
  upscale_factor?: number;
  person_image?: string;
  garment_image?: string;
  edit_mode?: string;
  mask_mode?: string;
  mask_dilation?: number;
  guidance_scale?: number;
  // Multi-turn conversation
  conversation_history?: ConversationHistoryTurn[];
  thought_signature?: string;
  // Gemini generation controls
  temperature?: number;
  thinking_level?: string;
  // Reference images for Gemini multi-image fusion
  reference_images?: ReferenceImage[];
  // Camera preset selections (slug values from creative_studio_camera_options)
  camera_preset?: Record<string, unknown>;
  // Lab exercise tracking
  lab_module_id?: string;
  lab_program_id?: string;
  // Template provenance
  template_id?: string;
  template_name?: string;
  template_variables?: Record<string, string>;
  // Persisted reference image URLs (uploaded to storage by frontend)
  reference_image_urls?: string[];
  // Generation settings
  director_mode?: boolean;
  safety_setting?: string;
  person_generation?: string;
  // Brand reference collections to auto-inject (resolved from creative_studio_brand_references)
  reference_collections?: string[];
  // Brand logo injection — only inject logo as reference when explicitly requested
  include_logo?: boolean;
  // Output resolution (e.g., "512px", "1K", "2K", "4K")
  image_size?: string;
  // Enable Google Search grounding (web + image search)
  use_grounding?: boolean;
}

function mapMediaResolution(level?: string): string {
  switch (level) {
    case 'low': return 'MEDIA_RESOLUTION_LOW';
    case 'medium': return 'MEDIA_RESOLUTION_MEDIUM';
    case 'high': return 'MEDIA_RESOLUTION_HIGH';
    default: return 'MEDIA_RESOLUTION_MEDIUM';
  }
}

function log(step: string, message: string, data?: unknown) {
  const entry = data ? `[${step}] ${message}: ${JSON.stringify(data).substring(0, 500)}` : `[${step}] ${message}`;
  console.log(entry);
}

// Build reference image parts with character-aware grouping.
// Character collections (multiple images of the same person) get a single group prompt
// instead of per-image intent prompts, for better consistency.
interface RefPartsResult {
  parts: Array<Record<string, unknown>>;
  skippedImages: Array<{ url: string; error: string }>;
}

async function buildReferenceImageParts(
  refs: ReferenceImage[],
  resolveImage: (input: string) => Promise<{ mime_type: string; data: string }>,
): Promise<RefPartsResult> {
  const parts: Array<Record<string, unknown>> = [];
  const skippedImages: Array<{ url: string; error: string }> = [];

  // Group by collection for character-aware handling
  const characterGroups = new Map<string, ReferenceImage[]>();
  const otherRefs: ReferenceImage[] = [];

  for (const ref of refs) {
    if (ref.reference_type === 'character' && ref.collection) {
      if (!characterGroups.has(ref.collection)) {
        characterGroups.set(ref.collection, []);
      }
      characterGroups.get(ref.collection)!.push(ref);
    } else {
      otherRefs.push(ref);
    }
  }

  // Emit character groups with a single shared prompt
  for (const [collection, groupRefs] of characterGroups) {
    const groupParts: Array<Record<string, unknown>> = [];
    for (const ref of groupRefs) {
      try {
        const resolved = await resolveImage(ref.image);
        groupParts.push({ inline_data: resolved });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log('REF_PARTS', `Skipping broken character ref`, { url: ref.image.substring(0, 100), error: msg });
        skippedImages.push({ url: ref.image.substring(0, 100), error: msg });
      }
    }
    if (groupParts.length > 0) {
      parts.push({ text: REFERENCE_INTENT_PROMPTS.character });
      parts.push(...groupParts);
      log('REF_PARTS', `Character group "${collection}": ${groupParts.length}/${groupRefs.length} image(s)`);
    }
  }

  // Emit other refs with individual intent prompts
  for (const ref of otherRefs) {
    try {
      const resolved = await resolveImage(ref.image);
      const intent = ref.reference_intent || 'subject';
      parts.push({ text: REFERENCE_INTENT_PROMPTS[intent] });
      parts.push({ inline_data: resolved });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log('REF_PARTS', `Skipping broken ref`, { url: ref.image.substring(0, 100), error: msg });
      skippedImages.push({ url: ref.image.substring(0, 100), error: msg });
    }
  }

  return { parts, skippedImages };
}

// Resolve an image input (URL, data URI, or raw base64) to raw base64 data
async function resolveImageToBase64(imageInput: string): Promise<string> {
  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    log('RESOLVE_IMG', 'Fetching image from URL', { url: imageInput.substring(0, 100) });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const resp = await fetch(imageInput, { signal: controller.signal });
      if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`);
      const buf = await resp.arrayBuffer();
      return encodeBase64(new Uint8Array(buf));
    } finally {
      clearTimeout(timeout);
    }
  }
  return imageInput.replace(/^data:(image|video)\/[a-zA-Z0-9+]+;base64,/i, '');
}

// Exchange a Google service account key for a short-lived OAuth2 access token
async function getVertexAIAccessToken(): Promise<string> {
  const keyJson = Deno.env.get('VERTEX_AI_SERVICE_ACCOUNT_KEY');
  if (!keyJson) throw new Error('Missing VERTEX_AI_SERVICE_ACCOUNT_KEY');

  const key = JSON.parse(keyJson);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: unknown) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unsigned = `${encode(header)}.${encode(payload)}`;

  // Import the RSA private key and sign the JWT
  const pemBody = key.private_key.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemBody), (c: string) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsigned));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const jwt = `${unsigned}.${sig}`;

  // Exchange JWT for access token
  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResp.ok) {
    const err = await tokenResp.text();
    throw new Error(`Failed to get Vertex AI access token: ${err.substring(0, 300)}`);
  }

  const tokenData = await tokenResp.json();
  return tokenData.access_token;
}

serve(async (req) => {
  log('INIT', 'Generate creative image function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let currentStep = 'INIT';
  let generationId: string | null = null;

  try {
    // ── Step 1: Parse request ──────────────────────────────────────────
    currentStep = 'PARSE';
    const request = await req.json() as GenerateImageRequest;
    const {
      generation_type,
      prompt,
      model_id,
      brand_id,
      negative_prompt,
      aspect_ratio = '1:1',
      num_outputs = 1,
      seed,
      input_image,
      mask_image,
      expansion_direction,
      upscale_factor,
      person_image,
      garment_image,
      edit_mode,
      mask_mode,
      mask_dilation,
      guidance_scale,
      conversation_history,
      thought_signature,
      temperature,
      thinking_level,
      reference_images: _requestReferenceImages,
      camera_preset,
      lab_module_id,
      lab_program_id,
      template_id,
      template_name,
      template_variables,
      reference_image_urls,
      reference_collections,
      director_mode,
      safety_setting,
      person_generation,
      include_logo,
      image_size,
      use_grounding,
    } = request;
    let reference_images: ReferenceImage[] | undefined = _requestReferenceImages;

    log('PARSE', 'Request parsed', {
      generation_type, prompt: prompt?.substring(0, 50), aspect_ratio, model_id,
      has_conversation: !!conversation_history?.length,
      has_reference_images: !!reference_images?.length,
      temperature, thinking_level,
      lab_module_id: lab_module_id || undefined,
    });

    // ── Step 2: Validate ───────────────────────────────────────────────
    currentStep = 'VALIDATE';
    const promptOptionalTypes: GenerationType[] = ['virtual_try_on', 'upscaling'];
    if (!prompt && !promptOptionalTypes.includes(generation_type)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (['inpainting', 'outpainting', 'image_edit', 'upscaling', 'product_recontext'].includes(generation_type) && !input_image) {
      return new Response(
        JSON.stringify({ success: false, error: 'Input image is required for this generation type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (generation_type === 'virtual_try_on' && (!person_image || !garment_image)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Person image and garment image are required for virtual try-on' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (generation_type === 'multi_turn_edit') {
      if (!model_id?.startsWith('gemini') && model_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Multi-turn editing requires a Gemini model' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    log('VALIDATE', 'Inputs validated');

    // ── Step 3: Initialize Supabase ────────────────────────────────────
    currentStep = 'SUPABASE_INIT';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    log('SUPABASE_INIT', 'Supabase client created');

    // ── Step 4: Authenticate user ──────────────────────────────────────
    currentStep = 'AUTH';
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      log('AUTH', 'Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let userId: string;
    let userEmail: string | undefined;

    if (token === supabaseKey && request.user_id) {
      // Service-role call from another edge function (e.g., brand-prompt-agent)
      userId = request.user_id;
      log('AUTH', 'Service role auth with explicit user_id', { userId });
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        log('AUTH', 'Authentication failed', { error: authError?.message });
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      userId = user.id;
      userEmail = user.email;
      log('AUTH', 'User authenticated', { userId });
    }

    // ── Step 5: Check quota ────────────────────────────────────────────
    currentStep = 'QUOTA';
    const isLabGeneration = !!lab_module_id;
    const { data: quotaData, error: quotaError } = isLabGeneration
      ? await supabase.rpc('can_user_generate_lab', { p_user_id: userId })
      : await supabase.rpc('can_user_generate_creative', {
          p_user_id: userId,
          p_generation_type: generation_type,
        });

    if (quotaError) {
      log('QUOTA', 'Quota check failed', { error: quotaError.message, code: quotaError.code });
      throw new Error(`Quota check failed: ${quotaError.message}`);
    }

    // RPC returns TABLE, so data is an array - get first row
    const quotaCheck = Array.isArray(quotaData) ? quotaData[0] : quotaData;

    if (!quotaCheck) {
      log('QUOTA', 'No quota data returned');
      throw new Error('Quota check returned no data');
    }

    if (!quotaCheck.can_generate) {
      const resetDate = new Date(quotaCheck.period_end).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      log('QUOTA', 'Rate limit exceeded', { remaining: quotaCheck.remaining, limit: quotaCheck.limit_value });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          details: `You've used all ${quotaCheck.limit_value} of your weekly image generations. Your quota resets on ${resetDate}.`,
          quota: {
            remaining: 0,
            limit: quotaCheck.limit_value,
            reset_date: quotaCheck.period_end,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    log('QUOTA', 'Quota check passed', { remaining: quotaCheck.remaining });

    // ── Step 6: Get user name ──────────────────────────────────────────
    currentStep = 'USER_NAME';
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('first_name, last_name')
      .eq('user_id', userId)
      .single();

    const userName = userRole?.first_name && userRole?.last_name
      ? `${userRole.first_name}_${userRole.last_name}`
      : userEmail?.split('@')[0] || userId;

    log('USER_NAME', 'User name resolved', { userName });

    // ── Step 7: Get model details ──────────────────────────────────────
    currentStep = 'MODEL';
    let modelUsed = 'gemini-2.5-flash-image';
    let costPerGeneration = 0.039;
    let modelUuid: string | null = null;
    let maxRefImages = 14;

    if (model_id) {
      // Frontend sends model_id as a string name (e.g. 'gemini-3-pro-image-preview'),
      // not a UUID. Look up by the model_id column, not the id (UUID) column.
      const { data: model, error: modelError } = await supabase
        .from('creative_studio_models')
        .select('id, model_id, cost_per_generation, parameters')
        .eq('model_id', model_id)
        .single();

      if (modelError) {
        log('MODEL', 'Model lookup failed', { error: modelError.message, model_id });
      }

      if (model) {
        modelUuid = model.id;
        modelUsed = model.model_id;
        costPerGeneration = Number(model.cost_per_generation);
        const params = model.parameters as Record<string, unknown> | null;
        if (params?.max_reference_images) {
          maxRefImages = params.max_reference_images as number;
        }
      }
    }

    log('MODEL', 'Model resolved', { modelUsed, modelUuid, costPerGeneration, maxRefImages });

    // ── Step 7b: Load brand context for prompt enrichment ────────────
    // Tries generation prompt first (structured, multi-section), falls back to legacy brand_voice
    currentStep = 'BRAND_CONTEXT';
    let enrichedPrompt = prompt;

    if (brand_id && prompt) {
      let injected = false;

      // Try structured generation prompt first
      const { data: genPrompt } = await supabase
        .from('brand_generation_prompts')
        .select('prompt_text, section_toggles')
        .eq('brand_id', brand_id)
        .eq('is_active', true)
        .maybeSingle();

      if (genPrompt?.prompt_text) {
        // Filter out disabled sections by splitting on ## headings
        const toggles = genPrompt.section_toggles || {};
        const sectionKeyMap: Record<string, string> = {
          'brand identity': 'brand_identity',
          'tone of voice': 'tone_of_voice',
          'visual style': 'visual_style',
          'color palette': 'color_palette',
          'typography': 'typography',
          'photography direction': 'photography_direction',
          'composition rules': 'composition_rules',
          'brand guardrails': 'brand_guardrails',
          'brand story': 'brand_story',
        };

        const parts = genPrompt.prompt_text.split(/^## /m);
        const preamble = parts[0]?.trim() || '';
        const sections = parts.slice(1).filter(section => {
          const heading = section.split('\n')[0]?.trim().toLowerCase() || '';
          const key = sectionKeyMap[heading];
          if (!key) return true;
          return toggles[key] !== false;
        });

        const filtered = sections.map(s => `## ${s}`).join('\n');
        const finalPrompt = preamble ? `${preamble}\n\n${filtered}` : filtered;

        enrichedPrompt = `${finalPrompt}\n\n${prompt}`;
        injected = true;
        log('BRAND_CONTEXT', 'Generation prompt injected', {
          brand_id,
          prompt_length: finalPrompt.length,
          sections_active: sections.length,
        });
      }

      // Fallback to legacy brand_voice
      if (!injected) {
        const { data: brandRecord } = await supabase
          .from('creative_studio_brands')
          .select('brand_voice')
          .eq('id', brand_id)
          .single();

        if (brandRecord?.brand_voice) {
          enrichedPrompt = `${brandRecord.brand_voice}\n\n${prompt}`;
          log('BRAND_CONTEXT', 'Legacy brand voice injected (no generation prompt)', {
            brand_id,
            voice_length: brandRecord.brand_voice.length,
          });
        } else {
          log('BRAND_CONTEXT', 'No brand context found', { brand_id });
        }
      }
    }

    // ── Step 7c: Auto-inject brand logo as reference image ─────────────
    // Queries the brand_logos table for uploaded logo variants, picks the best
    // match for the scene, and injects as a reference image. Falls back to the
    // legacy logo_url field if no logos exist in the new table.
    // Skips SVG logos (Gemini requires raster formats) and degrades gracefully
    // on fetch failure so a broken logo URL doesn't kill the entire generation.
    if (brand_id && generation_type === 'text_to_image' && include_logo) {
      try {
        // Query logo variants table — prefer default, then sort order
        const { data: brandLogos } = await supabase
          .from('creative_studio_brand_logos')
          .select('url, variant, lockup, background, is_default')
          .eq('brand_id', brand_id)
          .order('is_default', { ascending: false })
          .order('sort_order', { ascending: true });

        let logoUrls: string[] = [];

        if (brandLogos && brandLogos.length > 0) {
          // Scene-aware selection: detect dark/light context from prompt
          const promptLower = (prompt || '').toLowerCase();
          const darkScene = /dark|night|moody|black background|neon|shadow/.test(promptLower);
          const lightScene = /white background|clean|bright|light background|minimal/.test(promptLower);

          let selected = brandLogos;
          if (darkScene) {
            // Prefer reversed/mono_light variants for dark scenes
            const darkFriendly = brandLogos.filter(l => l.variant === 'reversed' || l.variant === 'mono_light' || l.background === 'dark');
            if (darkFriendly.length > 0) selected = darkFriendly;
          } else if (lightScene) {
            // Prefer full_color or mono_dark for light scenes
            const lightFriendly = brandLogos.filter(l => l.variant === 'full_color' || l.variant === 'mono_dark' || l.background === 'light');
            if (lightFriendly.length > 0) selected = lightFriendly;
          }

          // Take the first match (default or best sorted)
          logoUrls = [selected[0].url];
          log('BRAND_LOGO', 'Selected logo variant from library', {
            variant: selected[0].variant,
            lockup: selected[0].lockup,
            background: selected[0].background,
            is_default: selected[0].is_default,
            total_available: brandLogos.length,
          });
        } else {
          // Fallback: legacy logo_url field on the brand record
          const { data: brand } = await supabase
            .from('creative_studio_brands')
            .select('logo_url')
            .eq('id', brand_id)
            .single();

          if (brand?.logo_url) {
            logoUrls = [brand.logo_url];
            log('BRAND_LOGO', 'Using legacy logo_url (no logos in library)', { url: brand.logo_url.substring(0, 100) });
          }
        }

        // Filter out SVGs — Gemini only accepts raster image formats
        logoUrls = logoUrls.filter(url => {
          const isSvg = url.toLowerCase().includes('.svg');
          if (isSvg) log('BRAND_LOGO', 'Skipping SVG logo (not supported by image model)', { url: url.substring(0, 100) });
          return !isSvg;
        });

        if (logoUrls.length > 0) {
          const logoRefs: ReferenceImage[] = logoUrls.map(url => ({
            image: url,
            reference_intent: 'logo' as const,
          }));
          reference_images = [...logoRefs, ...(reference_images || [])];
          log('BRAND_LOGO', 'Auto-injected brand logo as reference image', {
            brand_id,
            logo_count: logoUrls.length,
            total_references: reference_images.length,
          });
        }
      } catch (logoErr) {
        // Degrade gracefully — generate without logo reference rather than failing
        log('BRAND_LOGO', 'Failed to load brand logos, continuing without logo injection', {
          brand_id,
          error: String(logoErr).substring(0, 200),
        });
      }
    }

    // ── Step 7d: Resolve reference collections ─────────────────────────
    // If the request includes reference_collections (from template or manual selection),
    // fetch the corresponding images from creative_studio_brand_references and merge them in.
    // Fallback: if only template_id is provided, look up the template's collections.
    let resolvedCollections = reference_collections;
    if (!resolvedCollections?.length && template_id && brand_id) {
      currentStep = 'REF_COLLECTIONS_LOOKUP';
      try {
        const { data: tmpl } = await supabase
          .from('creative_studio_brand_prompts')
          .select('reference_collections')
          .eq('id', template_id)
          .maybeSingle();
        if (tmpl?.reference_collections?.length) {
          resolvedCollections = tmpl.reference_collections;
          log('REF_COLLECTIONS_LOOKUP', `Resolved ${resolvedCollections.length} collection(s) from template`, { template_id });
        }
      } catch (lookupErr) {
        log('REF_COLLECTIONS_LOOKUP', 'Failed to look up template collections', {
          error: String(lookupErr).substring(0, 200),
        });
      }
    }
    if (resolvedCollections?.length && brand_id) {
      currentStep = 'REF_COLLECTIONS';
      try {
        const { data: collectionRefs, error: collError } = await supabase
          .from('creative_studio_brand_references')
          .select('*')
          .eq('brand_id', brand_id)
          .in('collection', resolvedCollections)
          .order('collection')
          .order('is_primary', { ascending: false })
          .order('sort_order', { ascending: true });

        if (collError) throw collError;

        if (collectionRefs && collectionRefs.length > 0) {
          const collRefs: ReferenceImage[] = collectionRefs.map(cr => ({
            image: cr.url,
            media_resolution: cr.media_resolution || 'medium',
            reference_intent: cr.reference_intent as ReferenceImage['reference_intent'],
            reference_type: cr.reference_type as ReferenceImage['reference_type'],
            collection: cr.collection,
          }));

          // Deduplicate: don't re-add URLs already present from ad-hoc staging
          const existingUrls = new Set((reference_images || []).map(r => r.image));
          const newRefs = collRefs.filter(r => !existingUrls.has(r.image));

          reference_images = [...(reference_images || []), ...newRefs];
          log('REF_COLLECTIONS', `Resolved ${resolvedCollections.length} collection(s) → ${newRefs.length} new reference(s)`, {
            collections: resolvedCollections,
            total_references: reference_images.length,
          });
        }
      } catch (collErr) {
        log('REF_COLLECTIONS', 'Failed to resolve reference collections, continuing without', {
          error: String(collErr).substring(0, 200),
        });
      }
    }

    // ── Step 7e: Enforce per-model reference image limit ───────────────
    if (reference_images && reference_images.length > maxRefImages) {
      log('REF_LIMIT', `Truncating ${reference_images.length} references to model limit of ${maxRefImages}`);
      const prioritized = [...reference_images].sort((a, b) => {
        const priority = (r: ReferenceImage) => {
          if (r.reference_intent === 'logo') return 0;
          if (r.reference_type === 'character') return 1;
          if (!r.collection) return 2; // explicit staging
          return 3; // auto-injected from collections
        };
        return priority(a) - priority(b);
      });
      reference_images = prioritized.slice(0, maxRefImages);
      log('REF_LIMIT', `Kept ${reference_images.length} references after priority truncation`, {
        kept_intents: reference_images.map(r => r.reference_intent || 'subject'),
      });
    }

    // ── Step 8: Create generation record ───────────────────────────────
    currentStep = 'GEN_RECORD';
    const { data: generation, error: genError } = await supabase
      .from('creative_studio_generations')
      .insert({
        user_id: userId,
        brand_id: brand_id || null,
        generation_type,
        model_id: modelUuid,
        model_used: modelUsed,
        prompt_text: prompt || `${generation_type} generation`,
        negative_prompt: negative_prompt || null,
        parameters: {
          aspect_ratio,
          num_outputs,
          seed,
          expansion_direction,
          ...(temperature !== undefined ? { temperature } : {}),
          ...(thinking_level ? { thinking_level } : {}),
          ...(conversation_history?.length ? { conversation_turns: conversation_history.length } : {}),
          ...(reference_images?.length ? {
            reference_image_count: reference_images.length,
            reference_intents: reference_images.map(r => r.reference_intent || 'subject'),
          } : {}),
          ...(camera_preset ? { camera_preset } : {}),
          ...(director_mode ? { director_mode } : {}),
          ...(safety_setting ? { safety_setting } : {}),
          ...(person_generation ? { person_generation } : {}),
        },
        input_image_url: input_image ? 'base64_provided' : null,
        input_mask_url: mask_image ? 'base64_provided' : null,
        status: 'processing',
        estimated_cost_usd: costPerGeneration * num_outputs,
        metadata: {
          ...(isLabGeneration ? { lab_module_id, lab_program_id } : {}),
          ...(template_id ? { template_id, template_name, ...(template_variables ? { template_variables } : {}) } : {}),
          ...(reference_image_urls?.length ? { reference_image_urls } : {}),
        },
      })
      .select('id')
      .single();

    if (genError) {
      log('GEN_RECORD', 'Failed to create generation record', { error: genError.message });
      throw new Error('Failed to create generation record');
    }

    generationId = generation.id;
    log('GEN_RECORD', 'Generation record created', { id: generationId });

    const startTime = Date.now();

    // ── Step 9: Get API key ────────────────────────────────────────────
    currentStep = 'API_KEY';
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      log('API_KEY', 'GEMINI_API_KEY not found in environment');
      await supabase
        .from('creative_studio_generations')
        .update({ status: 'failed', error_message: 'Server configuration error: Missing API key', completed_at: new Date().toISOString() })
        .eq('id', generation.id);
      throw new Error('Missing Gemini API Key');
    }

    log('API_KEY', 'API key found');

    // ── Step 10: Build and send API request ────────────────────────────
    currentStep = 'API_CALL';
    let endpoint: string;
    let requestBody: Record<string, unknown>;
    let responseParser: 'gemini' | 'imagen';
    let allSkippedImages: RefPartsResult['skippedImages'] = [];

    if (modelUsed.startsWith('gemini') && generation_type === 'multi_turn_edit') {
      // Gemini multi-turn conversational editing
      endpoint = `${BASE_URL}/models/${modelUsed}:generateContent`;
      responseParser = 'gemini';

      const contents: Array<Record<string, unknown>> = [];

      // Build contents array from conversation history
      if (conversation_history && conversation_history.length > 0) {
        for (const turn of conversation_history) {
          const turnParts: Array<Record<string, unknown>> = [];

          if (turn.image_url) {
            const imageData = turn.image_url.replace(/^data:image\/[a-zA-Z]+;base64,/i, '');
            turnParts.push({
              inline_data: { mime_type: 'image/jpeg', data: imageData },
            });
          }

          if (turn.text) {
            turnParts.push({ text: turn.text });
          }

          // Echo thought signatures on model turns
          if (turn.role === 'model' && turn.thought_signature) {
            turnParts.push({ thoughtSignature: turn.thought_signature });
          }

          contents.push({ role: turn.role, parts: turnParts });
        }
      }

      // Build current user turn
      const currentParts: Array<Record<string, unknown>> = [];

      // Add reference images to current turn with character-aware grouping
      if (reference_images && reference_images.length > 0) {
        const resolveInline = async (input: string) => {
          if (input.startsWith('http')) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10_000);
            try {
              const imgResp = await fetch(input, { signal: controller.signal });
              if (!imgResp.ok) throw new Error(`HTTP ${imgResp.status}`);
              const imgBuf = await imgResp.arrayBuffer();
              return { mime_type: imgResp.headers.get('content-type') || 'image/jpeg', data: encodeBase64(new Uint8Array(imgBuf)) };
            } finally {
              clearTimeout(timeout);
            }
          }
          return { mime_type: 'image/jpeg', data: input.replace(/^data:image\/[a-zA-Z]+;base64,/i, '') };
        };
        const { parts: refParts, skippedImages } = await buildReferenceImageParts(reference_images, resolveInline);
        currentParts.push(...refParts);
        allSkippedImages = skippedImages;
      }

      // Add input image if provided
      if (input_image) {
        if (input_image.startsWith('http')) {
          const imgResp = await fetch(input_image);
          const imgBuf = await imgResp.arrayBuffer();
          const imgBase64 = encodeBase64(new Uint8Array(imgBuf));
          const mimeType = imgResp.headers.get('content-type') || 'image/jpeg';
          currentParts.push({
            inline_data: { mime_type: mimeType, data: imgBase64 },
          });
        } else {
          const imageData = input_image.replace(/^data:image\/[a-zA-Z]+;base64,/i, '');
          currentParts.push({
            inline_data: { mime_type: 'image/jpeg', data: imageData },
          });
        }
      }

      currentParts.push({ text: enrichedPrompt });
      contents.push({ role: 'user', parts: currentParts });

      // Build generationConfig with optional temperature and thinking
      const multiTurnImageConfig: Record<string, unknown> = {
        aspectRatio: aspect_ratio,
        imageSize: image_size || '2K',
      };
      // personGeneration is not a valid imageConfig field for Gemini generateContent
      // (gemini-3.1+ rejects unknown fields; older models silently ignore them)

      const generationConfig: Record<string, unknown> = {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: multiTurnImageConfig,
      };

      if (temperature !== undefined) generationConfig.temperature = temperature;
      if (thinking_level && modelUsed.includes('flash')) generationConfig.thinkingConfig = { thinkingLevel: thinking_level.toLowerCase() };

      requestBody = { contents, generationConfig } as Record<string, unknown>;
      if (use_grounding) {
        requestBody.tools = [{ googleSearch: {} }];
      }

      log('API_CALL', 'Multi-turn request built', {
        turns: contents.length,
        grounding: !!use_grounding,
      });

    } else if (modelUsed.startsWith('gemini')) {
      // Gemini API: generateContent with IMAGE modality
      endpoint = `${BASE_URL}/models/${modelUsed}:generateContent`;
      responseParser = 'gemini';

      const parts: Array<Record<string, unknown>> = [];

      // Add reference images with character-aware grouping
      if (reference_images && reference_images.length > 0) {
        const resolveInline = async (input: string) => {
          const data = await resolveImageToBase64(input);
          return { mime_type: 'image/jpeg', data };
        };
        const { parts: refParts, skippedImages } = await buildReferenceImageParts(reference_images, resolveInline);
        parts.push(...refParts);
        allSkippedImages = skippedImages;
        log('API_CALL', `Added ${reference_images.length - skippedImages.length}/${reference_images.length} reference image(s) with character-aware grouping`);
      }

      // Add input image if provided
      if (input_image) {
        const imageData = await resolveImageToBase64(input_image);
        parts.push({
          inline_data: {
            mime_type: 'image/jpeg',
            data: imageData,
          },
        });
      }

      // Add mask if provided (for inpainting or outpainting)
      if (mask_image && (generation_type === 'inpainting' || generation_type === 'outpainting')) {
        const maskData = await resolveImageToBase64(mask_image);
        parts.push({
          inline_data: {
            mime_type: 'image/png',
            data: maskData,
          },
        });
      }

      // Build contextual prompt based on generation type
      let contextualPrompt = enrichedPrompt;
      switch (generation_type) {
        case 'inpainting':
          contextualPrompt = `Edit this image by replacing the masked area with: ${enrichedPrompt}. Keep the rest of the image unchanged.`;
          break;
        case 'outpainting':
          contextualPrompt = `This image has a gray area on the ${expansion_direction || 'right'} side that needs to be filled. The second image is a mask where white indicates the area to generate and black indicates the area to preserve. Seamlessly extend the existing scene into the gray/masked area with: ${enrichedPrompt}. Maintain visual consistency, lighting, and perspective with the existing content.`;
          break;
        case 'upscaling':
          contextualPrompt = `Enhance and upscale this image while preserving all details. Improve quality and resolution. ${enrichedPrompt}`;
          break;
        case 'image_edit':
          contextualPrompt = `Edit this image: ${enrichedPrompt}. Make the requested changes while maintaining the overall style and quality.`;
          break;
      }

      // Summarize reference image roles in the text prompt
      if (reference_images && reference_images.length > 0) {
        const intentCounts: Record<string, number> = {};
        let characterCount = 0;
        for (const ref of reference_images) {
          if (ref.reference_type === 'character') {
            characterCount++;
          } else {
            const intent = ref.reference_intent || 'subject';
            intentCounts[intent] = (intentCounts[intent] || 0) + 1;
          }
        }
        const summaryParts: string[] = [];
        if (intentCounts.logo) summaryParts.push(`${intentCounts.logo} official brand logo(s) — reproduce EXACTLY as provided, never hallucinate`);
        if (characterCount) summaryParts.push(`${characterCount} character reference(s) — reproduce this EXACT person's appearance faithfully`);
        if (intentCounts.subject) summaryParts.push(`${intentCounts.subject} subject/product reference(s) — feature these objects prominently`);
        if (intentCounts.style) summaryParts.push(`${intentCounts.style} style reference(s) — match their visual aesthetic`);
        if (intentCounts.structure) summaryParts.push(`${intentCounts.structure} structure reference(s) — follow their composition`);
        contextualPrompt = `I have provided ${reference_images.length} reference image(s): ${summaryParts.join('; ')}. Using these references as directed: ${contextualPrompt}`;
      }

      // Prevent Gemini from rendering brand names, product model names, or text onto images
      contextualPrompt += `\n\nIMPORTANT: Do NOT render, overlay, or include any text, words, brand names, product model names, labels, watermarks, or written content visible in the generated image. The image should contain ONLY visual elements — no typography, lettering, or readable characters.`;

      if (negative_prompt) {
        contextualPrompt += `\n\nAvoid: ${negative_prompt}`;
      }

      parts.push({ text: contextualPrompt });

      // Build generationConfig with optional temperature and thinking
      const imageConfig: Record<string, unknown> = {
        aspectRatio: aspect_ratio,
        imageSize: image_size || '2K',
      };
      // personGeneration is not a valid imageConfig field for Gemini generateContent
      // (gemini-3.1+ rejects unknown fields; older models silently ignore them)

      const generationConfig: Record<string, unknown> = {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig,
      };

      if (temperature !== undefined) generationConfig.temperature = temperature;
      if (thinking_level && modelUsed.includes('flash')) generationConfig.thinkingConfig = { thinkingLevel: thinking_level.toLowerCase() };

      requestBody = {
        contents: [{ parts }],
        generationConfig,
      } as Record<string, unknown>;
      if (use_grounding) {
        requestBody.tools = [{ googleSearch: {} }];
      }
    } else if (modelUsed.startsWith('imagen') || modelUsed.startsWith('virtual-try-on')) {
      // Imagen/specialized model API: predict endpoint
      // Route Vertex AI-only models to Vertex AI, others to Gemini API
      const useVertexAI = VERTEX_AI_MODELS.includes(modelUsed);
      endpoint = useVertexAI
        ? `${VERTEX_AI_BASE_URL}/${modelUsed}:predict`
        : `${BASE_URL}/models/${modelUsed}:predict`;
      responseParser = 'imagen';

      if (generation_type === 'upscaling') {
        // Vertex AI upscale: prompt + image + upscaleConfig
        const factor = upscale_factor === 4 ? 'x4' : upscale_factor === 3 ? 'x3' : 'x2';
        requestBody = {
          instances: [{
            prompt: enrichedPrompt || 'Upscale the image',
            image: { bytesBase64Encoded: await resolveImageToBase64(input_image!) },
          }],
          parameters: {
            mode: 'upscale',
            sampleCount: 1,
            upscaleConfig: { upscaleFactor: factor },
          },
        };

      } else if (generation_type === 'virtual_try_on') {
        // Virtual Try-On: personImage + productImages
        requestBody = {
          instances: [{
            personImage: {
              image: { bytesBase64Encoded: await resolveImageToBase64(person_image!) },
            },
            productImages: [{
              image: { bytesBase64Encoded: await resolveImageToBase64(garment_image!) },
            }],
          }],
          parameters: {
            sampleCount: num_outputs,
            personGeneration: 'allow_adult',
          },
        };

      } else if (generation_type === 'product_recontext') {
        // Product Recontext: prompt + productImages array
        requestBody = {
          instances: [{
            prompt: enrichedPrompt,
            productImages: [{
              image: { bytesBase64Encoded: await resolveImageToBase64(input_image!) },
            }],
          }],
          parameters: {
            sampleCount: num_outputs,
            enhancePrompt: true,
          },
        };

      } else if (modelUsed === 'imagen-3.0-capability-001' && input_image && (mask_image || edit_mode)) {
        // Imagen editing: referenceImages with editConfig
        const referenceImages: Array<Record<string, unknown>> = [
          {
            referenceType: 'REFERENCE_TYPE_RAW',
            referenceId: 1,
            referenceImage: { bytesBase64Encoded: await resolveImageToBase64(input_image) },
          },
        ];

        if (mask_image) {
          referenceImages.push({
            referenceType: 'REFERENCE_TYPE_MASK',
            referenceImage: { bytesBase64Encoded: await resolveImageToBase64(mask_image) },
            maskImageConfig: {
              maskMode: mask_mode || 'MASK_MODE_USER_PROVIDED',
              dilation: mask_dilation ?? 0.01,
            },
          });
        }

        // Default edit mode based on generation type
        let resolvedEditMode = edit_mode;
        if (!resolvedEditMode) {
          switch (generation_type) {
            case 'inpainting': resolvedEditMode = 'EDIT_MODE_INPAINT_INSERTION'; break;
            case 'outpainting': resolvedEditMode = 'EDIT_MODE_OUTPAINT'; break;
            default: resolvedEditMode = 'EDIT_MODE_INPAINT_INSERTION';
          }
        }

        requestBody = {
          instances: [{
            prompt: enrichedPrompt,
            referenceImages,
          }],
          parameters: {
            editMode: resolvedEditMode,
            sampleCount: num_outputs,
            ...(guidance_scale ? { guidanceScale: guidance_scale } : {}),
            ...(seed ? { seed } : {}),
          },
        };

      } else {
        // Standard Imagen text-to-image (imagen-4.0-*, imagen-3.0-generate-*)
        requestBody = {
          instances: [{
            prompt: enrichedPrompt + (negative_prompt ? `\nNegative prompt: ${negative_prompt}` : ''),
          }],
          parameters: {
            sampleCount: num_outputs,
            aspectRatio: aspect_ratio,
            ...(seed ? { seed } : {}),
          },
        };
      }
    } else {
      log('API_CALL', 'Unsupported model', { modelUsed });
      await supabase
        .from('creative_studio_generations')
        .update({ status: 'failed', error_message: `Unsupported model: ${modelUsed}`, completed_at: new Date().toISOString() })
        .eq('id', generation.id);
      throw new Error(`Unsupported model: ${modelUsed}`);
    }

    // Use Vertex AI auth for Vertex AI endpoints, Gemini API key for everything else
    const isVertexAI = endpoint.startsWith('https://us-central1-aiplatform');
    let authHeaders: Record<string, string>;

    if (isVertexAI) {
      log('API_CALL', 'Using Vertex AI auth', { model: modelUsed });
      const accessToken = await getVertexAIAccessToken();
      authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` };
    } else {
      authHeaders = { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey };
    }

    log('API_CALL', 'Making request', { endpoint, responseParser, isVertexAI });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(requestBody),
    });

    const responseTime = Date.now() - startTime;
    log('API_CALL', 'API response received', { status: response.status, timeMs: responseTime });

    if (!response.ok) {
      const errorText = await response.text();
      log('API_CALL', 'API error', { status: response.status, error: errorText.substring(0, 500) });

      await supabase
        .from('creative_studio_generations')
        .update({
          status: 'failed',
          error_message: `API error: ${response.status} - ${errorText.substring(0, 1000)}`,
          generation_time_ms: responseTime,
          completed_at: new Date().toISOString(),
        })
        .eq('id', generation.id);

      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    log('API_CALL', 'Response parsed successfully');

    // Check for error in response body (Google sometimes returns 200 with error object)
    if (data.error) {
      const errorMessage = data.error.message || JSON.stringify(data.error).substring(0, 500);
      log('API_CALL', 'API returned error in response body', { error: errorMessage, code: data.error.code });
      await supabase
        .from('creative_studio_generations')
        .update({
          status: 'failed',
          error_message: `API error ${data.error.code || ''}: ${errorMessage}`,
          generation_time_ms: responseTime,
          completed_at: new Date().toISOString(),
        })
        .eq('id', generation.id);
      throw new Error(`API error: ${errorMessage}`);
    }

    // ── Step 11: Capture Gemini usage metadata + extract images ────────
    currentStep = 'EXTRACT';
    let tokenUsage: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } | undefined;
    if (data.usageMetadata) {
      tokenUsage = {
        promptTokenCount: data.usageMetadata.promptTokenCount,
        candidatesTokenCount: data.usageMetadata.candidatesTokenCount,
        totalTokenCount: data.usageMetadata.totalTokenCount,
      };
      log('API_CALL', 'Token usage captured', tokenUsage);
    }

    const images: Array<{ data: string; mimeType: string }> = [];
    let textResponse: string | undefined;
    let responseThoughtSignature: string | undefined;

    if (responseParser === 'gemini') {
      if (data.candidates?.[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.inlineData) {
            images.push({
              data: part.inlineData.data,
              mimeType: part.inlineData.mimeType || 'image/png',
            });
          }
          if (part.text && !textResponse) {
            textResponse = part.text;
          }
          // Capture thought signature (API may use either casing)
          if (part.thoughtSignature || part.thought_signature) {
            responseThoughtSignature = part.thoughtSignature || part.thought_signature;
          }
        }
      }
      if (textResponse || responseThoughtSignature) {
        log('EXTRACT', 'Extracted text/signature from response', {
          hasText: !!textResponse,
          hasSignature: !!responseThoughtSignature,
        });
      }
    } else {
      // Imagen response format
      if (data.predictions) {
        for (const pred of data.predictions) {
          if (pred.bytesBase64Encoded) {
            images.push({
              data: pred.bytesBase64Encoded,
              mimeType: pred.mimeType || 'image/png',
            });
          }
        }
      }
    }

    // Gemini generateContent returns 1 image per call — make additional parallel calls if needed
    if (responseParser === 'gemini' && num_outputs > 1 && images.length < num_outputs) {
      const additionalCount = Math.min(num_outputs, 4) - images.length;
      log('EXTRACT', `Making ${additionalCount} additional parallel call(s) for Gemini multi-output`);

      const additionalResults = await Promise.allSettled(
        Array.from({ length: additionalCount }, () =>
          fetch(endpoint, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(requestBody),
          })
        )
      );

      for (let i = 0; i < additionalResults.length; i++) {
        const result = additionalResults[i];
        if (result.status !== 'fulfilled' || !result.value.ok) {
          log('EXTRACT', `Additional call ${i + 1} failed`, {
            reason: result.status === 'rejected' ? String(result.reason) : `HTTP ${result.value.status}`,
          });
          continue;
        }
        try {
          const extraData = await result.value.json();
          if (extraData.candidates?.[0]?.content?.parts) {
            for (const part of extraData.candidates[0].content.parts) {
              if (part.inlineData) {
                images.push({
                  data: part.inlineData.data,
                  mimeType: part.inlineData.mimeType || 'image/png',
                });
              }
            }
          }
          // Accumulate token usage from additional calls
          if (extraData.usageMetadata) {
            if (!tokenUsage) {
              tokenUsage = { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 };
            }
            tokenUsage.promptTokenCount = (tokenUsage.promptTokenCount || 0) + (extraData.usageMetadata.promptTokenCount || 0);
            tokenUsage.candidatesTokenCount = (tokenUsage.candidatesTokenCount || 0) + (extraData.usageMetadata.candidatesTokenCount || 0);
            tokenUsage.totalTokenCount = (tokenUsage.totalTokenCount || 0) + (extraData.usageMetadata.totalTokenCount || 0);
          }
        } catch (parseErr) {
          log('EXTRACT', `Failed to parse additional call ${i + 1}`, { error: String(parseErr) });
        }
      }
    }

    if (images.length === 0) {
      log('EXTRACT', 'No images in response', { responseKeys: Object.keys(data) });
      await supabase
        .from('creative_studio_generations')
        .update({
          status: 'failed',
          error_message: 'No images generated - empty API response',
          generation_time_ms: responseTime,
          completed_at: new Date().toISOString(),
        })
        .eq('id', generation.id);
      throw new Error('No images generated');
    }

    log('EXTRACT', `Extracted ${images.length} image(s)`);

    // ── Step 12: Upload images ─────────────────────────────────────────
    currentStep = 'UPLOAD';
    const outputUrls: string[] = [];
    const mediaIds: string[] = [];

    // Get or create Creative Studio folder
    const { data: studioFolder } = await supabase
      .from('media_folders')
      .select('id')
      .eq('path', '/Creative Studio')
      .single();

    const studioFolderId = studioFolder?.id;

    // Get or create user folder
    const userFolderPath = `/Creative Studio/${userName}`;
    let { data: userFolder } = await supabase
      .from('media_folders')
      .select('id')
      .eq('path', userFolderPath)
      .single();

    if (!userFolder && studioFolderId) {
      const { data: newFolder } = await supabase
        .from('media_folders')
        .insert({
          name: userName,
          path: userFolderPath,
          parent_id: studioFolderId,
          description: `Creative Studio outputs for ${userName}`,
          color: '#8b5cf6',
          icon: 'palette',
          created_by: userId,
        })
        .select('id')
        .single();

      userFolder = newFolder;
    }

    let folderId = userFolder?.id || studioFolderId || null;

    // For lab generations, create a Labs/{labTitle} subfolder
    let labFolderName: string | null = null;
    if (isLabGeneration && userFolder?.id) {
      const { data: labModule } = await supabase
        .from('program_modules')
        .select('title')
        .eq('id', lab_module_id)
        .single();

      labFolderName = labModule?.title?.replace(/[^a-zA-Z0-9 -]/g, '').trim() || 'Lab';
      const labFolderPath = `${userFolderPath}/Labs/${labFolderName}`;

      // Get or create Labs parent folder
      const labsParentPath = `${userFolderPath}/Labs`;
      let { data: labsParent } = await supabase
        .from('media_folders')
        .select('id')
        .eq('path', labsParentPath)
        .single();

      if (!labsParent) {
        const { data: newLabsParent } = await supabase
          .from('media_folders')
          .insert({
            name: 'Labs',
            path: labsParentPath,
            parent_id: userFolder.id,
            description: `Lab exercise outputs`,
            color: '#f59e0b',
            icon: 'flask-conical',
            created_by: userId,
          })
          .select('id')
          .single();
        labsParent = newLabsParent;
      }

      // Get or create specific lab folder
      if (labsParent) {
        let { data: labFolder } = await supabase
          .from('media_folders')
          .select('id')
          .eq('path', labFolderPath)
          .single();

        if (!labFolder) {
          const { data: newLabFolder } = await supabase
            .from('media_folders')
            .insert({
              name: labFolderName,
              path: labFolderPath,
              parent_id: labsParent.id,
              description: `Lab: ${labFolderName}`,
              color: '#f59e0b',
              icon: 'flask-conical',
              created_by: userId,
            })
            .select('id')
            .single();
          labFolder = newLabFolder;
        }

        if (labFolder) folderId = labFolder.id;
      }

      log('UPLOAD', 'Lab folder resolved', { labFolderName, folderId });
    }

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const timestamp = Date.now();
      const extension = image.mimeType.split('/')[1] || 'png';
      const storagePath = isLabGeneration && labFolderName
        ? `creative-studio/${userName}/labs/${labFolderName}/${timestamp}-${i}.${extension}`
        : `creative-studio/${userName}/${generation_type}/${timestamp}-${i}.${extension}`;

      const imageBuffer = Uint8Array.from(atob(image.data), c => c.charCodeAt(0));
      const imageBlob = new Blob([imageBuffer], { type: image.mimeType });
      const fileSize = imageBuffer.length;

      log('UPLOAD', `Uploading image ${i + 1}/${images.length}`, { storagePath, sizeBytes: fileSize });

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(storagePath, imageBlob, {
          contentType: image.mimeType,
          upsert: false,
        });

      if (uploadError) {
        log('UPLOAD', 'Upload error', { error: uploadError.message });
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(storagePath);

      if (!urlData?.publicUrl) continue;

      outputUrls.push(urlData.publicUrl);

      // Create media record
      const { data: mediaRecord } = await supabase
        .from('media')
        .insert({
          filename: `${generation_type}-${timestamp}-${i}.${extension}`,
          title: `Creative Studio - ${generation_type.replace(/_/g, ' ')}`,
          description: (prompt || generation_type).substring(0, 200),
          url: urlData.publicUrl,
          storage_path: storagePath,
          mime_type: image.mimeType,
          file_type: 'image',
          size_bytes: fileSize,
          folder_id: folderId,
          created_by: userId,
          auto_tags: isLabGeneration
            ? ['creative-studio', 'ai-generated', 'lab', generation_type]
            : ['creative-studio', 'ai-generated', generation_type],
          custom_metadata: {
            generation_type: 'creative_studio',
            generation_id: generation.id,
            prompt: (prompt || generation_type).substring(0, 2000),
            model_used: modelUsed,
            ...(isLabGeneration ? { lab_module_id, lab_program_id, lab_name: labFolderName } : {}),
          },
          ai_provenance: {
            generated: true,
            model: modelUsed,
            generation_id: generation.id,
            tool_name: 'Creative Studio',
            generation_date: new Date().toISOString(),
            generation_type: generation_type,
            human_reviewed: false,
            reviewed_by: null,
          },
          disclosure_status: 'pending_review',
        })
        .select('id')
        .single();

      if (mediaRecord) {
        mediaIds.push(mediaRecord.id);
      }
    }

    log('UPLOAD', `Uploaded ${outputUrls.length} image(s)`);

    // ── Step 13: Finalize ──────────────────────────────────────────────
    currentStep = 'FINALIZE';

    // Build completion update, merging token usage into existing metadata
    const completionUpdate: Record<string, unknown> = {
      status: 'completed',
      output_urls: outputUrls,
      media_ids: mediaIds,
      generation_time_ms: responseTime,
      completed_at: new Date().toISOString(),
    };

    if (tokenUsage) {
      // Read existing metadata to merge (avoid overwriting lab/template data)
      const { data: currentGen } = await supabase
        .from('creative_studio_generations')
        .select('metadata')
        .eq('id', generation.id)
        .single();

      completionUpdate.metadata = {
        ...((currentGen?.metadata as Record<string, unknown>) || {}),
        token_usage: tokenUsage,
      };
    }

    await supabase
      .from('creative_studio_generations')
      .update(completionUpdate)
      .eq('id', generation.id);

    // Increment quota (lab vs standard)
    if (isLabGeneration) {
      await supabase.rpc('increment_lab_quota', { p_user_id: userId });
      await supabase.rpc('append_lab_generation', {
        p_user_id: userId,
        p_module_id: lab_module_id,
        p_program_id: lab_program_id,
        p_generation_id: generation.id,
      });
    } else {
      await supabase.rpc('increment_creative_quota', {
        p_user_id: userId,
        p_generation_type: generation_type,
      });
    }

    log('FINALIZE', 'Generation completed successfully');

    // Track in ai_image_generations for Gemini Control Panel
    for (let i = 0; i < outputUrls.length; i++) {
      try {
        await supabase
          .from('ai_image_generations')
          .insert({
            user_id: userId,
            prompt: prompt || generation_type,
            original_prompt: prompt || generation_type,
            model_used: modelUsed,
            status: 'completed',
            image_url: outputUrls[i],
            storage_path: `creative-studio/${userName}/${generation_type}/${Date.now()}-${i}`,
            generation_time_ms: responseTime,
            content_type: 'creative-studio',
            category: generation_type,
            metadata: {
              aspectRatio: aspect_ratio,
              generationId: generation.id,
              brandId: brand_id,
              imageSize: image_size || '2K',
              endpoint: 'creative-studio-image',
            },
          });
      } catch (imgTrackError) {
        log('FINALIZE', 'Failed to track in ai_image_generations', { error: String(imgTrackError) });
      }
    }

    // Track analytics
    try {
      await supabase.functions.invoke('ai-tracking-middleware', {
        body: {
          action: 'track_api_call',
          data: {
            userId: userId,
            apiProvider: 'google-ai',
            endpoint: 'creative-studio-image',
            modelName: modelUsed,
            featureType: generation_type,
            promptText: (prompt || generation_type).substring(0, 2000),
            responseTimeMs: responseTime,
            status: 'success',
            metadata: {
              generationId: generation.id,
              numOutputs: images.length,
            },
          },
        },
      });
    } catch (trackingError) {
      log('FINALIZE', 'Failed to track analytics', { error: String(trackingError) });
    }

    return new Response(
      JSON.stringify({
        success: true,
        generation_id: generation.id,
        output_urls: outputUrls,
        media_ids: mediaIds,
        generation_time_ms: responseTime,
        ...(textResponse ? { text_response: textResponse } : {}),
        ...(responseThoughtSignature ? { thought_signature: responseThoughtSignature } : {}),
        ...(allSkippedImages.length > 0 ? {
          warnings: [`${allSkippedImages.length} reference image(s) could not be loaded and were skipped`],
        } : {}),
        quota: {
          remaining: (quotaCheck.remaining || 0) - 1,
          limit: quotaCheck.limit_value,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack?.substring(0, 300) : undefined;
    log('ERROR', `Failed at step ${currentStep}`, { message: errMsg, stack: errStack });

    // Mark generation as failed so records don't get stuck in "processing"
    // Skip if an inner handler (e.g. API_CALL) already wrote a detailed error
    if (generationId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const sb = createClient(supabaseUrl, supabaseKey);
        const { data: existing } = await sb
          .from('creative_studio_generations')
          .select('status')
          .eq('id', generationId)
          .single();
        if (existing?.status !== 'failed') {
          await sb.from('creative_studio_generations').update({
            status: 'failed',
            error_message: `${currentStep}: ${errMsg}`.substring(0, 1000),
            completed_at: new Date().toISOString(),
          }).eq('id', generationId);
        }
      } catch (cleanupErr) {
        log('ERROR', 'Failed to mark generation as failed', { error: String(cleanupErr) });
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to generate image',
        details: errMsg,
        step: currentStep,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
