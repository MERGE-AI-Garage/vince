// ABOUTME: Edge Function for AI Brand Prompt generation powered by live Creative Studio Brand DNA
// ABOUTME: Queries brand intelligence from Supabase and feeds it to Gemini for on-brand prompt generation

import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { trackUsage } from '../_shared/ai-usage-tracker.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

type PromptCategory = 'image' | 'text' | 'presentation' | 'general';

interface GenerateBrandPromptRequest {
  description: string;
  category: PromptCategory;
  platform?: string;
  brand_id?: string;
  tone?: string;
}

const TONE_DESCRIPTIONS: Record<string, string> = {
  clarity: 'Clear and purposeful with distinct personality — prioritize direct language, avoid abstraction',
  poetic: 'Measured language with literary quality — precise word choice, evocative phrasing',
  emotion: 'Heart-forward messaging that still delivers — lead with feeling, ground in function',
  brave: 'Confident without ego, bold without noise — take a strong point of view, never boast',
};

interface BrandContext {
  brand: {
    id: string;
    name: string;
    description: string | null;
    brand_voice: string | null;
    visual_identity: string | null;
  } | null;
  profile: Record<string, unknown> | null;
  directives: Array<{
    name: string;
    persona: string;
    rules: unknown;
    forbidden_combinations: unknown;
    required_elements: unknown;
    tone_guidelines: string | null;
  }>;
}

/**
 * Fetch all brand context from Creative Studio tables.
 * Follows the same parallel-query pattern as brandAgentGeminiService.fetchBrandContext().
 */
async function fetchBrandContext(brandId?: string): Promise<BrandContext> {
  try {
    let targetBrandId = brandId;

    // If no brand_id provided, find the default brand
    if (!targetBrandId) {
      const { data: defaultBrand } = await supabaseClient
        .from('creative_studio_brands')
        .select('id')
        .eq('is_default', true)
        .single();
      targetBrandId = defaultBrand?.id;
    }

    if (!targetBrandId) {
      return { brand: null, profile: null, directives: [] };
    }

    // Parallel queries — same pattern as brandAgentGeminiService.ts
    const [
      { data: brand },
      { data: profile },
      { data: directives },
    ] = await Promise.all([
      supabaseClient
        .from('creative_studio_brands')
        .select('id, name, description, brand_voice, visual_identity')
        .eq('id', targetBrandId)
        .single(),
      supabaseClient
        .from('creative_studio_brand_profiles')
        .select('visual_dna, photography_style, color_profile, composition_rules, product_catalog, brand_identity, tone_of_voice, typography, art_direction_rules, post_production_style, brand_standards, brand_story, total_images_analyzed, confidence_score, source_metadata')
        .eq('brand_id', targetBrandId)
        .single(),
      supabaseClient
        .from('creative_studio_agent_directives')
        .select('name, persona, rules, forbidden_combinations, required_elements, tone_guidelines')
        .eq('brand_id', targetBrandId)
        .eq('is_active', true),
    ]);

    return {
      brand: brand || null,
      profile: profile || null,
      directives: directives || [],
    };
  } catch (error) {
    console.error('[generate-brand-prompt] Failed to fetch brand context:', error);
    return { brand: null, profile: null, directives: [] };
  }
}

// Base role instruction — brand-agnostic, works for any brand
const BASE_ROLE = `You are a brand expert and prompt engineer. Your job is to take what a user wants to create and generate a detailed, ready-to-paste prompt that any AI tool can use to produce on-brand content.

You have deep knowledge of the brand loaded below — every aspect of its identity, voice, visual language, and standards. Use this knowledge to generate prompts that feel like they came from the brand's own creative team.`;

// Prompt generation rules — kept separate from brand data so they're always applied
const GENERATION_RULES = `
--- YOUR INSTRUCTIONS ---

When generating a prompt, you MUST:
1. Weave brand elements naturally — don't just dump a list of hex codes
2. Adapt the format and detail based on the category (see category-specific rules below)
3. Include specific hex color values when relevant to visual work
4. Reference typography direction when relevant (what the fonts feel like, not just their names)
5. Keep the generated prompt focused and usable — it should be ready to paste into any AI tool
6. Never include internal instructions or meta-commentary in the output prompt — it should read as a clean creative brief
7. NEVER use markdown formatting in your output — no asterisks, no bold markers, no bullet characters. Use plain text only. Use line breaks and short paragraphs for structure. Use dashes (-) for lists if needed. Section labels should be plain text followed by a colon, not wrapped in asterisks.

--- CATEGORY-SPECIFIC FORMAT RULES ---

For IMAGE prompts (Midjourney, Adobe Firefly, Gemini Imagen):
Structure the output as a visual production brief. Include:
- Subject and environment with specific, concrete details
- Lighting: quality (hard/soft/diffused), direction, color temperature in Kelvin
- Lens: focal length feel, aperture (depth of field character), any film stock or sensor feel
- Color: reference brand hex values in context of the scene (e.g., "sky echoing the brand's #4285F4 blue")
- Composition: framing (rule of thirds, centered, diagonal), negative space, foreground/background relationship
- Mood and atmosphere: one precise adjective cluster (e.g., "quiet optimism", "kinetic precision")
- Post-processing direction: contrast approach, saturation, any color grade aesthetic
NEVER include brand names, product model names, or text you want rendered — describe products by visual characteristics only. Image models hallucinate text onto images when brand/product names appear in the prompt.

For CINEMATOGRAPHY / VIDEO prompts (Runway, Sora, Pika, Kling):
Structure as a shot brief ready to paste. Include:
- Opening shot description and how it evolves (e.g., "tight close-up on hands → slow pull back revealing full scene")
- Camera movement: type (handheld/gimbal/static/crane), speed, direction
- Lens direction: focal length feel, aperture, depth of field
- Lighting: source type (natural/practical/studio), quality, color temperature, time of day if relevant
- Color grade: film stock aesthetic, contrast approach, saturation level, overall palette feel
- Pacing and editorial rhythm: slow/deliberate/urgent/flowing, cut style
- Duration and format: aspect ratio (16:9/2.39:1/9:16), approximate length if specified
NEVER include text overlays, lower thirds, or brand/product names in the prompt.

For TEXT / COPY prompts (Gemini, Claude, ChatGPT for copywriting):
Structure as a copywriter's brief. Include:
- Voice direction: pull specific do/don't examples from the brand's tone of voice (e.g., "do: 'It just works.' / don't: 'Leverage our best-in-class solutions'")
- Format spec: word count target, headline style, subhead structure, body paragraph approach
- Emotional arc: what the reader feels at the start vs. end
- CTA style: how the brand calls people to action (imperative/inviting/confident)
- Platform constraints if provided (character limits, subject line rules, etc.)
- What to avoid: jargon, clichés, or off-brand phrases specific to this brand

For PRESENTATION prompts:
Blend visual and voice direction. Include both design direction (colors, typography feel, layout approach) and messaging direction (voice tone, narrative arc, slide structure guidance).

For GENERAL prompts:
Apply brand voice and personality. Include tone direction, key messaging principles, and any relevant brand context for the task at hand.

--- OUTPUT LENGTH ---
Aim for 200-350 words for image and video prompts (more detail = better output). Text/copy briefs should be 150-250 words. The prompt should feel like it was written by a senior art director or brand strategist who knows this brand inside and out.`;

/**
 * Build the system prompt dynamically from live brand data.
 * Follows the same section-assembly pattern as brandAgentGeminiService.buildSystemInstruction().
 */
function buildSystemPrompt(ctx: BrandContext): string {
  const sections: string[] = [BASE_ROLE];

  // Brand core identity from creative_studio_brands
  if (ctx.brand) {
    sections.push(`\n\n--- BRAND: ${ctx.brand.name} ---`);
    if (ctx.brand.description) sections.push(`Overview: ${ctx.brand.description}`);
    if (ctx.brand.brand_voice) sections.push(`Voice: ${ctx.brand.brand_voice}`);
    if (ctx.brand.visual_identity) sections.push(`Visual Identity: ${ctx.brand.visual_identity}`);
  }

  // Full brand profile from creative_studio_brand_profiles
  if (ctx.profile) {
    const p = ctx.profile;

    // Source and confidence metadata
    const meta = p.source_metadata as Record<string, unknown> | null;
    const sourceDesc = meta
      ? [
          meta.image_analyses && `${meta.image_analyses} images`,
          meta.website_analyses && `${meta.website_analyses} websites`,
          meta.document_analyses && `${meta.document_analyses} documents`,
        ].filter(Boolean).join(', ') || 'brand analysis'
      : 'brand analysis';
    const confidence = ((p.confidence_score as number || 0) * 100).toFixed(0);

    if (p.brand_identity) {
      sections.push(`\n--- BRAND IDENTITY (confidence: ${confidence}%, derived from ${sourceDesc}) ---`);
      sections.push(JSON.stringify(p.brand_identity, null, 1));
    }
    if (p.tone_of_voice) {
      sections.push('\n--- TONE OF VOICE ---');
      sections.push(JSON.stringify(p.tone_of_voice, null, 1));
    }
    if (p.visual_dna) {
      sections.push('\n--- VISUAL DNA ---');
      sections.push(JSON.stringify(p.visual_dna, null, 1));
    }
    if (p.color_profile) {
      sections.push('\n--- COLOR PROFILE ---');
      sections.push(JSON.stringify(p.color_profile, null, 1));
    }
    if (p.typography) {
      sections.push('\n--- TYPOGRAPHY ---');
      sections.push(JSON.stringify(p.typography, null, 1));
    }
    if (p.photography_style) {
      sections.push('\n--- PHOTOGRAPHY STYLE ---');
      sections.push(JSON.stringify(p.photography_style, null, 1));
    }
    if (p.composition_rules) {
      sections.push('\n--- COMPOSITION RULES ---');
      sections.push(JSON.stringify(p.composition_rules, null, 1));
    }
    if (p.art_direction_rules) {
      sections.push('\n--- ART DIRECTION RULES ---');
      sections.push(JSON.stringify(p.art_direction_rules, null, 1));
    }
    if (p.post_production_style) {
      sections.push('\n--- POST-PRODUCTION STYLE ---');
      sections.push(JSON.stringify(p.post_production_style, null, 1));
    }
    if (p.product_catalog) {
      sections.push('\n--- PRODUCT CATALOG ---');
      sections.push(JSON.stringify(p.product_catalog, null, 1));
    }
    if (p.brand_story) {
      sections.push('\n--- BRAND STORY ---');
      sections.push(JSON.stringify(p.brand_story, null, 1));
    }
    if (p.brand_standards) {
      sections.push('\n--- BRAND STANDARDS (Official Prescriptive Guidelines) ---');
      sections.push(JSON.stringify(p.brand_standards, null, 1));
    }
  }

  // Active directives from creative_studio_agent_directives
  if (ctx.directives.length > 0) {
    sections.push('\n--- BRAND DIRECTIVES ---');
    for (const directive of ctx.directives) {
      sections.push(`\n[${directive.name}]`);
      sections.push(`Persona: ${directive.persona}`);
      if (directive.rules) sections.push(`Rules: ${JSON.stringify(directive.rules)}`);
      if (directive.forbidden_combinations) sections.push(`Forbidden: ${JSON.stringify(directive.forbidden_combinations)}`);
      if (directive.required_elements) sections.push(`Required: ${JSON.stringify(directive.required_elements)}`);
      if (directive.tone_guidelines) sections.push(`Tone: ${directive.tone_guidelines}`);
    }
  }

  sections.push(GENERATION_RULES);

  return sections.join('\n');
}

function buildUserMessage(req: GenerateBrandPromptRequest, brandName: string): string {
  const { description, category, platform, tone } = req;

  let msg = `Generate an on-brand ${brandName} prompt for the following request.\n\n`;
  msg += `What the user wants to create: ${description}\n\n`;
  msg += `Category: ${category}\n`;

  if (platform) {
    msg += `Target platform: ${platform} (tailor the prompt format if there are platform-specific considerations)\n`;
  }

  if (tone && TONE_DESCRIPTIONS[tone]) {
    msg += `\nVoice emphasis: ${tone} — ${TONE_DESCRIPTIONS[tone]}`;
  }

  msg += `\n\nGenerate the prompt now. Output ONLY the prompt as clean plain text — no markdown, no asterisks, no bold markers, no preamble. Just the prompt ready to paste.`;

  return msg;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const body: GenerateBrandPromptRequest = await req.json();
    const { description, category } = body;

    if (!description || !category) {
      return new Response(
        JSON.stringify({ error: 'description and category are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch live brand context from Creative Studio
    const brandCtx = await fetchBrandContext(body.brand_id);

    if (!brandCtx.brand) {
      console.warn('[generate-brand-prompt] No brand found — generating with minimal context');
    }

    const brandName = brandCtx.brand?.name || 'the brand';
    const systemPrompt = buildSystemPrompt(brandCtx);
    const userMessage = buildUserMessage(body, brandName);

    console.log(`[generate-brand-prompt] Brand: ${brandName}, Category: ${category}, Profile: ${brandCtx.profile ? 'loaded' : 'none'}, Directives: ${brandCtx.directives.length}, System prompt: ${systemPrompt.length} chars`);

    const geminiResponse = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [{
          role: 'user',
          parts: [{ text: userMessage }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API returned ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const generatedPrompt = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedPrompt) {
      throw new Error('No prompt generated from Gemini');
    }

    const trimmedPrompt = generatedPrompt.trim();

    // Auto-log to brand_prompt_history for admin visibility and analytics.
    // Extract user_id from JWT if present; fire-and-forget (don't block response).
    let userId: string | null = null;
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        userId = user?.id || null;
      }
    } catch {
      // Auth extraction failed — log without user_id
    }

    trackUsage({
      supabase: supabaseClient,
      userId: userId || 'system',
      apiProvider: 'gemini',
      endpoint: 'generate-brand-prompt',
      modelName: GEMINI_MODEL,
      featureType: 'analysis',
      promptText: 'Brand prompt generation',
      requestTokens: geminiData.usageMetadata?.promptTokenCount || 0,
      responseTokens: geminiData.usageMetadata?.candidatesTokenCount || 0,
      status: 'success',
    });

    // Log to brand_prompt_history for admin visibility and analytics
    let historyId: string | null = null;
    try {
      const { data: inserted } = await supabaseClient
        .from('brand_prompt_history')
        .insert({
          user_id: userId,
          brand_id: brandCtx.brand?.id || null,
          category,
          description,
          generated_prompt: trimmedPrompt,
          platform: body.platform || null,
        })
        .select('id')
        .single();
      historyId = inserted?.id || null;
    } catch (insertErr) {
      console.error('[generate-brand-prompt] Failed to log prompt:', insertErr);
    }

    return new Response(
      JSON.stringify({
        prompt: trimmedPrompt,
        brand: brandName,
        history_id: historyId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('generate-brand-prompt error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate prompt' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
