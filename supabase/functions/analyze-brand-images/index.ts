// ABOUTME: Edge Function that analyzes brand reference images using Gemini Vision
// ABOUTME: Extracts structured visual metadata (camera, lighting, composition, color, subject) per image

import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { getPromptWithModel } from '../_shared/prompt-utils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyzeRequest {
  brand_id: string;
  image_urls: string[];
  analysis_directives?: string;
  brand_category?: string;
  user_id?: string;
  image_category_overrides?: Record<string, 'logo' | 'photo'>;
  add_to_logo_library?: boolean;
}

const FALLBACK_IMAGE_ANALYSIS_PROMPT = `You are a professional photography and brand analyst. Analyze this image and extract structured visual metadata.

Return ONLY valid JSON with the following schema:
{
  "camera_settings": {
    "estimated_aperture": "f/2.8",
    "focal_length": "85mm",
    "depth_of_field": "shallow|medium|deep",
    "shutter_speed_feel": "frozen|natural|motion_blur"
  },
  "lighting": {
    "direction": "front|side|back|top|ambient",
    "quality": "hard|soft|diffused|mixed",
    "color_temperature": "warm|neutral|cool",
    "key_fill_ratio": "high_contrast|balanced|low_contrast",
    "lighting_type": "natural|studio|artificial|mixed"
  },
  "composition": {
    "rule_of_thirds": true,
    "leading_lines": false,
    "framing": "tight|medium|wide|environmental",
    "symmetry": "symmetric|asymmetric|balanced",
    "negative_space": "minimal|moderate|extensive"
  },
  "color_palette": {
    "dominant_colors": ["#hex1", "#hex2", "#hex3"],
    "accent_colors": ["#hex"],
    "overall_tone": "warm|cool|neutral|vibrant|muted",
    "saturation_level": "low|medium|high|vivid"
  },
  "subject": {
    "category": "food|product|person|landscape|abstract|architecture",
    "position": "center|thirds|off-center|filling_frame",
    "styling_details": "description of styling",
    "textures": ["glossy", "matte", "rough"],
    "materials": ["metal", "glass", "fabric"]
  },
  "brand_elements": {
    "logos": [],
    "text": [],
    "packaging": [],
    "branded_items": []
  },
  "mood": {
    "overall_mood": "professional|casual|luxurious|playful|dramatic",
    "energy_level": "calm|moderate|energetic|intense",
    "formality": "formal|semi-formal|casual|editorial"
  },
  "technical_quality": {
    "resolution_feel": "low|medium|high|ultra",
    "sharpness": "soft|sharp|tack_sharp",
    "noise_level": "clean|minimal|noticeable"
  },
  "tags": ["tag1", "tag2", "tag3"]
}`;

const FALLBACK_LOGO_ANALYSIS_PROMPT = `You are a brand identity analyst. This image is a logo or brand mark. Extract brand-specific visual data — NOT photographic metadata.

Return ONLY valid JSON with the following schema:
{
  "logo_type": "wordmark|lettermark|icon|combination|emblem|abstract",
  "brand_colors": [
    { "hex": "#000000", "role": "primary|secondary|accent", "name": "optional color name if identifiable" }
  ],
  "color_count": 2,
  "background": "transparent|white|dark|colored",
  "composition": {
    "orientation": "horizontal|vertical|square|circular",
    "complexity": "simple|moderate|complex",
    "symmetry": "symmetric|asymmetric"
  },
  "typography_in_logo": {
    "has_text": true,
    "font_style": "serif|sans-serif|script|display|custom",
    "weight": "light|regular|bold|heavy",
    "case": "uppercase|lowercase|mixed|title"
  },
  "brand_elements": {
    "icon_description": "Brief description of any icon or symbol",
    "tagline_visible": false,
    "text_content": "Any visible text in the logo"
  },
  "tags": ["tag1", "tag2"]
}`;

/**
 * Classifies an image as logo or photo using a lightweight Gemini call.
 */
async function classifyImage(
  apiKey: string,
  imagePart: Record<string, unknown>,
): Promise<'logo' | 'photo'> {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      role: 'user',
      parts: [
        imagePart,
        { text: 'Is this a logo, icon, or brand mark (flat graphic, vector-like, brand identity element)? Or is it a photograph/reference image (photographic qualities like lighting, depth of field, real-world scene)? Return ONLY valid JSON: {"image_category": "logo" or "photo"}' },
      ],
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 64,
      responseMimeType: 'application/json',
    },
  };

  try {
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn('[Image Analyzer] Classification call failed, defaulting to photo');
      return 'photo';
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (parsed.image_category === 'logo') return 'logo';
    }
  } catch (err) {
    console.warn('[Image Analyzer] Classification parse error, defaulting to photo:', err);
  }
  return 'photo';
}

/**
 * Resolves the analysis prompt for a brand using the chain:
 * 1. Brand-specific override (image_analysis_prompt_id)
 * 2. Category default (brand-image-analysis-{category})
 * 3. Generic (brand-image-analysis)
 * 4. Hardcoded fallback
 */
async function resolveAnalysisPrompt(supabase: any, brandId: string): Promise<string> {
  // Fetch brand's category and prompt override
  const { data: brand } = await supabase
    .from('creative_studio_brands')
    .select('brand_category, image_analysis_prompt_id')
    .eq('id', brandId)
    .single();

  // 1. Brand-specific override
  if (brand?.image_analysis_prompt_id) {
    const { data: override } = await supabase
      .from('ai_prompt_templates')
      .select('prompt_text')
      .eq('id', brand.image_analysis_prompt_id)
      .eq('is_active', true)
      .single();
    if (override?.prompt_text) {
      console.log(`[Image Analyzer] Using brand-specific prompt override for ${brandId}`);
      return override.prompt_text;
    }
  }

  // 2. Category default
  if (brand?.brand_category) {
    const categorySlug = `brand-image-analysis-${brand.brand_category}`;
    const categoryPrompt = await getPromptWithModel(supabase, categorySlug);
    if (categoryPrompt?.prompt.prompt_text) {
      console.log(`[Image Analyzer] Using category prompt: ${categorySlug}`);
      return categoryPrompt.prompt.prompt_text;
    }
  }

  // 3. Generic
  const genericPrompt = await getPromptWithModel(supabase, 'brand-image-analysis');
  if (genericPrompt?.prompt.prompt_text) {
    console.log('[Image Analyzer] Using generic brand-image-analysis prompt');
    return genericPrompt.prompt.prompt_text;
  }

  // 4. Hardcoded fallback
  console.log('[Image Analyzer] Using hardcoded fallback prompt');
  return FALLBACK_IMAGE_ANALYSIS_PROMPT;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth — supports both user JWT and service-role calls from other edge functions
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    let userId: string;
    let userEmail: string | undefined;

    const body: AnalyzeRequest = await req.json();

    if (token === supabaseServiceKey && body.user_id) {
      // Service-role call from another edge function (e.g., brand-prompt-agent)
      userId = body.user_id;
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
      userEmail = user.email;
    }

    const { brand_id, image_urls, analysis_directives, image_category_overrides, add_to_logo_library } = body;

    if (!brand_id || !image_urls?.length) {
      return new Response(JSON.stringify({ error: 'brand_id and image_urls are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve the photo analysis prompt: brand-specific override → category default → generic → hardcoded
    const photoPrompt = await resolveAnalysisPrompt(supabase, brand_id);

    // Build the photo system instruction with optional brand-specific directives
    let photoSystemPrompt = photoPrompt;
    if (analysis_directives) {
      photoSystemPrompt += `\n\nADDITIONAL BRAND-SPECIFIC ANALYSIS DIRECTIVES:\n${analysis_directives}`;
    }

    const results: Array<{
      image_url: string;
      analysis: Record<string, unknown>;
      tags: string[];
      image_category: 'logo' | 'photo';
      error?: string;
    }> = [];

    // Process images in batches of 5 to respect rate limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < image_urls.length; i += BATCH_SIZE) {
      const batch = image_urls.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(async (imageUrl) => {
          try {
            // Build image part once — reused for classification and analysis
            const imagePart = await buildImagePart(imageUrl);

            // Determine image category: manual override > auto-classification
            let category: 'logo' | 'photo' = 'photo';
            if (image_category_overrides?.[imageUrl]) {
              category = image_category_overrides[imageUrl];
              console.log(`[Image Analyzer] Using manual override: ${category} for ${imageUrl.slice(0, 60)}`);
            } else {
              category = await classifyImage(geminiApiKey, imagePart);
              console.log(`[Image Analyzer] Auto-classified as ${category}: ${imageUrl.slice(0, 60)}`);
            }

            // Route to the correct prompt based on classification
            const prompt = category === 'logo' ? FALLBACK_LOGO_ANALYSIS_PROMPT : photoSystemPrompt;
            const result = await analyzeImage(geminiApiKey, prompt, imageUrl, imagePart);
            return { ...result, image_category: category };
          } catch (err: any) {
            return { analysis: {}, tags: [], image_category: 'photo' as const, error: err.message };
          }
        })
      );

      for (let j = 0; j < batch.length; j++) {
        const result = batchResults[j];
        const imageUrl = batch[j];

        if (result.status === 'fulfilled') {
          results.push({ image_url: imageUrl, ...result.value });
        } else {
          results.push({
            image_url: imageUrl,
            analysis: {},
            tags: [],
            image_category: 'photo',
            error: result.reason?.message || 'Analysis failed',
          });
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < image_urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Store results in database
    const analysisRecords = results
      .filter(r => !r.error)
      .map(r => ({
        brand_id,
        source_image_url: r.image_url,
        analysis_data: r.analysis,
        tags: r.tags,
        analyzed_by: userId,
        image_category: r.image_category,
      }));

    let savedCount = analysisRecords.length;
    let insertErrors: string[] = [];

    if (analysisRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('creative_studio_brand_analyses')
        .insert(analysisRecords);

      if (insertError) {
        console.error('Batch insert failed, retrying individually:', insertError.message);
        // Retry per-record to isolate bad data
        savedCount = 0;
        for (const record of analysisRecords) {
          const { error } = await supabase
            .from('creative_studio_brand_analyses')
            .insert(record);
          if (error) {
            console.error(`Insert failed for ${record.source_image_url}:`, error.message);
            insertErrors.push(`${record.source_image_url}: ${error.message}`);
          } else {
            savedCount++;
          }
        }
      }
    }

    // Auto-add official logos to the brand's logo library and set logo_url
    if (add_to_logo_library) {
      const logoUrls = results
        .filter(r => !r.error && r.image_category === 'logo')
        .map(r => r.image_url);

      if (logoUrls.length > 0) {
        // Check existing logo count for sort_order and is_default
        const { data: existingLogos } = await supabase
          .from('creative_studio_brand_logos')
          .select('id')
          .eq('brand_id', brand_id);
        const existingCount = existingLogos?.length ?? 0;
        const isFirstLogo = existingCount === 0;

        const logoRecords = logoUrls.map((url, i) => ({
          brand_id,
          url,
          variant: 'full_color' as const,
          lockup: 'horizontal' as const,
          background: 'transparent' as const,
          is_default: isFirstLogo && i === 0,
          sort_order: existingCount + i,
          created_by: userId,
        }));

        const { error: logoInsertError } = await supabase
          .from('creative_studio_brand_logos')
          .insert(logoRecords);
        if (logoInsertError) {
          console.error('[Image Analyzer] Logo library insert failed:', logoInsertError.message);
        } else {
          console.log(`[Image Analyzer] Added ${logoUrls.length} logos to brand library`);
        }

        // Set logo_url on the brand if currently empty
        const { data: currentBrand } = await supabase
          .from('creative_studio_brands')
          .select('logo_url')
          .eq('id', brand_id)
          .single();

        if (!currentBrand?.logo_url) {
          await supabase
            .from('creative_studio_brands')
            .update({ logo_url: logoUrls[0] })
            .eq('id', brand_id);
          console.log(`[Image Analyzer] Set brand logo_url to first official logo`);
        }
      }
    }

    // Write audit log (non-blocking — don't fail the response for this)
    await supabase.from('creative_studio_audit_log').insert({
      user_id: userId,
      user_email: userEmail || 'service-role',
      action: 'analyze_brand_images',
      brand_id,
      parameters: {
        image_count: image_urls.length,
        successful: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length,
        saved: savedCount,
        insert_errors: insertErrors.length > 0 ? insertErrors : undefined,
        has_directives: !!analysis_directives,
        errors: results.filter(r => r.error).map(r => r.error),
        first_url_type: image_urls[0]?.substring(0, 50),
      },
    }).then(({ error }) => { if (error) console.error('Audit log insert failed:', error.message); });

    // Return results with per-image analysis summaries for UI transparency
    const resultSummaries = results.filter(r => !r.error).map(r => ({
      image_url: r.image_url,
      image_category: r.image_category,
      shot_type: r.image_category === 'logo'
        ? (r.analysis as any)?.logo_type || 'logo'
        : (r.analysis as any)?.shot_classification?.shot_type || (r.analysis as any)?.subject?.category || 'unknown',
      scene_context: (r.analysis as any)?.shot_classification?.scene_context || null,
      mood: (r.analysis as any)?.mood_and_positioning?.overall_mood || (r.analysis as any)?.mood?.overall_mood || null,
      dominant_colors: r.image_category === 'logo'
        ? ((r.analysis as any)?.brand_colors || []).map((c: any) => c.hex)
        : (r.analysis as any)?.color_and_post_production?.dominant_colors || (r.analysis as any)?.color_palette?.dominant_colors || [],
      tags: r.tags,
    }));

    // Fail the response if zero records were saved
    if (savedCount === 0 && analysisRecords.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `Analysis completed but failed to save results: ${insertErrors.join('; ')}`,
        total: image_urls.length,
        analyzed: results.filter(r => !r.error).length,
        saved: 0,
        insert_errors: insertErrors,
        summaries: resultSummaries,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      total: image_urls.length,
      analyzed: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      saved: savedCount,
      insert_errors: insertErrors.length > 0 ? insertErrors : undefined,
      results,
      summaries: resultSummaries,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Brand image analysis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Analysis failed',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Builds a Gemini-compatible image part from a URL or base64 data URI.
 */
async function buildImagePart(imageUrl: string): Promise<Record<string, unknown>> {
  if (imageUrl.startsWith('data:')) {
    const [header, data] = imageUrl.split(',');
    const mimeType = header.match(/data:(.*?);/)?.[1] || 'image/jpeg';
    return { inlineData: { mimeType, data } };
  }

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`);

  const imageBuffer = await imageResponse.arrayBuffer();
  const bytes = new Uint8Array(imageBuffer);
  // Chunked encoding to avoid stack overflow with spread operator on large arrays
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  const base64 = btoa(binary);
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
  return { inlineData: { mimeType: contentType, data: base64 } };
}

async function analyzeImage(
  apiKey: string,
  systemPrompt: string,
  imageUrl: string,
  prebuiltImagePart?: Record<string, unknown>,
): Promise<{ analysis: Record<string, unknown>; tags: string[]; error?: string }> {

  const imagePart = prebuiltImagePart || await buildImagePart(imageUrl);

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      role: 'user',
      parts: [
        imagePart,
        { text: 'Analyze this image according to the system instructions. Return only valid JSON.' },
      ],
    }],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.3,
      topP: 0.85,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Image Analyzer] Gemini API rejected ${imageUrl}: ${response.status} — ${errorText.slice(0, 500)}`);
    throw new Error(`Gemini API error: ${response.status} — ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    throw new Error('No analysis content in Gemini response');
  }

  // Parse JSON response (Gemini sometimes wraps response in an array)
  let analysis: Record<string, unknown>;
  try {
    const parsed = JSON.parse(textContent);
    analysis = Array.isArray(parsed) ? parsed[0] : parsed;
  } catch {
    // Try to extract JSON from markdown code block
    const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1].trim());
      analysis = Array.isArray(parsed) ? parsed[0] : parsed;
    } else {
      throw new Error('Failed to parse analysis JSON');
    }
  }

  const tags = (analysis.tags as string[]) || [];
  delete analysis.tags;

  return { analysis, tags };
}
