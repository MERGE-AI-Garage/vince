// ABOUTME: Conversational Brand Agent with tool calling — generates and saves prompts, analyzes images
// ABOUTME: Uses Gemini function calling to take real actions: save templates, search library, analyze brands

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';
import { trackUsage } from '../_shared/ai-usage-tracker.ts';

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
    description: 'Generate a complete creative package with interleaved text and images in a single call. Use this when the user asks for a campaign, a set of deliverables, or multiple assets at once. This generates ALL copy AND images together — much faster than generating images one by one. Returns alternating text blocks (headlines, body copy, strategy notes) and images. PREFER this over generate_image when the user wants a creative campaign or multiple deliverables.',
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
              name: { type: 'string', description: 'Deliverable name (e.g., "Hero Banner")' },
              description: { type: 'string', description: 'What this deliverable should show' },
              aspect_ratio: {
                type: 'string',
                enum: ['1:1', '16:9', '9:16', '4:3', '3:4'],
                description: 'Image format',
              },
            },
            required: ['name', 'description', 'aspect_ratio'],
          },
          description: 'Specific deliverables to generate. If omitted, Vince will determine the best deliverables from the brief.',
        },
      },
      required: ['brief'],
    },
  },
  {
    name: 'create_brand',
    description: 'Create a new brand in the system. Use when the user asks to set up a new brand, onboard a new client, or create a brand from scratch. Returns the new brand ID so subsequent tools can reference it.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Brand name (e.g., "Google", "Nike")' },
        website_url: { type: 'string', description: 'Brand website URL (e.g., "google.com")' },
        primary_color: { type: 'string', description: 'Primary brand color as hex (e.g., "#4285F4")' },
        secondary_color: { type: 'string', description: 'Secondary brand color as hex' },
        brand_category: { type: 'string', description: 'Category (e.g., "Technology", "Food & Beverage", "Retail")' },
        description: { type: 'string', description: 'Brief brand description' },
      },
      required: ['name'],
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
    case 'create_brand':
      return await createBrand(parameters, context, supabase);
    case 'analyze_brand_website':
      return await analyzeBrandWebsite(parameters, context, supabase);
    case 'import_brand_document':
      return await importBrandDocument(parameters, context, supabase);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
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
    }),
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Creative package generation failed');
  }

  return {
    success: true,
    parts: result.parts,
    image_urls: result.image_urls,
    latency_ms: result.latency_ms,
    model: result.model,
    message: `Generated creative package with ${result.image_urls?.length || 0} images in ${(result.latency_ms / 1000).toFixed(1)}s`,
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
      primary_color: (params.primary_color as string) || '#00856C',
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
  // Get the brand's website URL if not provided
  let url = params.url as string | undefined;
  if (!url) {
    const { data: brand } = await supabase
      .from('creative_studio_brands')
      .select('website_url')
      .eq('id', context.brand_id)
      .single();
    url = brand?.website_url;
  }

  if (!url) throw new Error('No website URL provided and no website_url stored on the brand. Pass a url parameter.');

  // Normalize URL
  if (!url.startsWith('http')) url = `https://${url}`;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-brand-website`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      brand_id: context.brand_id,
      url,
    }),
  });

  const result = await response.json();
  if (!response.ok || result.error) {
    throw new Error(result.error || `Website analysis failed (${response.status})`);
  }

  return {
    success: true,
    url,
    pages_crawled: result.pages_crawled || result.pagesCrawled || 1,
    sections_extracted: result.sections_extracted || Object.keys(result.extracted || {}).length,
    message: `Website analysis complete for ${url}. Brand DNA profile has been updated with extracted visual identity, colors, typography, and messaging.`,
    summary: result.summary || result.extracted?.brand_identity || null,
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

BRAND ONBOARDING FLOW:
When a user asks to set up a new brand, follow this sequence:
1. Call create_brand with the name, website URL, and primary color they provide.
2. If they gave a website URL, immediately call analyze_brand_website to populate the visual DNA.
3. If they provide documents (PDFs, brand guidelines), use import_brand_document for each one.
4. After onboarding, summarize what was extracted and suggest next steps (uploading reference images, creating prompt templates).

BEHAVIORAL RULES:
1. When generating a prompt, always include recommended camera settings.
2. Before creating a new template, search the library to avoid duplicates.
3. When the user asks to save something, use the save_prompt_template tool — don't just say you'll save it.
4. Respond conversationally. Don't wrap everything in JSON. Include prompts naturally in your response.
5. When you use a tool, briefly explain what you did and the result.
6. NEVER include brand names, product model names, or any text you want rendered onto the image in generation prompts. Describe products by their visual characteristics instead: "brushed chrome commercial flushometer" rather than "SLOAN ROYAL flushometer". Image generation models will hallucinate text onto images if you mention brand/product names.`);

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
2. When they confirm ("OK generate", "go ahead", "make it", "shoot it"), check quota with check_generation_quota, then generate immediately with generate_image.
3. Pick aspect ratio from context (Instagram → 1:1, stories → 9:16, hero banner → 16:9). State it, don't ask.
4. Default to 1 image. Generate 2 when exploring looks or when you want to give options.
5. After generation, present the results and offer to save the prompt to the library if it's a keeper.
6. If quota is exhausted, inform the user of the reset date and offer to save the prompt for later.

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

    // Authenticate
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

    const body = await req.json();

    // ── Mode routing for live session tool calling ───────────────────────
    if (body.mode === 'get_tools') {
      return new Response(JSON.stringify({ success: true, tools: VINCE_TOOLS }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.mode === 'tool_call') {
      if (!body.tool_name) {
        return new Response(JSON.stringify({ success: false, error: 'tool_name is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!body.brand_id && body.tool_name !== 'create_brand') {
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
        );
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
    const { brand_id, user_message, parts, conversation_id, user_context } = body;

    if (!user_message && !parts) {
      return new Response(JSON.stringify({ success: false, error: 'user_message is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Vince] Message from ${user.email}: "${user_message.slice(0, 80)}"`);

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
      content: user_message,
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
    let result = await chat.sendMessage(sendContent);
    let response = result.response;

    const toolCalls: ToolCall[] = [];
    let functionCallsResult = response.functionCalls();

    while (functionCallsResult && functionCallsResult.length > 0) {
      const functionCall = functionCallsResult[0];
      const toolName = functionCall.name;
      const parameters = (functionCall.args || {}) as Record<string, unknown>;

      // Gemini hallucinates URLs for inline images — always use the actual inline data
      if (toolName === 'analyze_brand_image' && inlineImageDataUris.length > 0) {
        parameters.image_urls = inlineImageDataUris;
      }

      console.log(`[Vince] Executing tool: ${toolName}`, JSON.stringify(parameters).slice(0, 200));

      try {
        const toolResult = await executeTool(
          toolName,
          parameters,
          { brand_id, user_id: user.id },
          supabase,
        );
        toolCalls.push({ toolName, parameters, result: toolResult, success: true });
        toolCallsCount++;

        result = await chat.sendMessage([{
          functionResponse: { name: toolName, response: toolResult },
        }]);
        response = result.response;
        functionCallsResult = response.functionCalls();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Vince] Tool failed: ${toolName}`, errorMessage);
        toolCalls.push({ toolName, parameters, error: errorMessage, success: false });

        result = await chat.sendMessage([{
          functionResponse: { name: toolName, response: { error: errorMessage } },
        }]);
        response = result.response;
        functionCallsResult = response.functionCalls();
      }
    }

    const assistantContent = response.text();

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

    // Persist conversation
    if (conversation_id) {
      await supabase
        .from('chatbot_conversations')
        .update({
          messages,
          tool_calls_count: toolCallsCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation_id);
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
    console.error('[Vince] Error:', errorMessage);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage || 'Agent failed',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
