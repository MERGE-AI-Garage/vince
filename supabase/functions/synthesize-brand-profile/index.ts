// ABOUTME: Edge Function that synthesizes analyses from multiple sources into a brand profile
// ABOUTME: Merges website, image, and document analyses into brand_profiles — the "brand DNA memory"

import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { getPromptWithModel } from '../_shared/prompt-utils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SynthesizeRequest {
  brand_id: string;
}

const FALLBACK_SYNTHESIS_PROMPT = `You are a brand strategist. Given analyses from multiple sources (website crawls, image analyses, documents), synthesize the brand's complete identity into a definitive brand DNA profile.

SOURCE WEIGHTING:
- Logo image data is HIGHEST AUTHORITY for: brand palette colors (exact hex values), logo description. Logo colors ALWAYS take precedence over all other color sources.
- Website data is authoritative for: fonts, tagline, tone of voice, brand values, messaging. Website colors are secondary to logo colors.
- Reference photo data is authoritative for: photography style, composition, lighting, visual mood. Photo colors inform mood/palette_relationships but do NOT override logo-sourced brand colors.
- Document data is authoritative for: brand guidelines, dos/donts, formal brand values, brand story, typed color specs (hex, PMS, CMYK)

BRAND STORY SYNTHESIS RULES:
- Multiple documents may contribute to the same brand_story sections
- When documents overlap: prefer the most recent data; combine complementary details
- When documents conflict: use the more authoritative source (CSR report for sustainability, annual report for financials, pitch deck for market positioning)
- Deduplicate: if two documents say the same thing differently, keep the richer version
- Each sub-section should read as a coherent whole, not a list of document excerpts

For each dimension, identify:
- CONSISTENT PATTERNS: What appears across sources — these are brand standards
- SIGNATURE ELEMENTS: What makes this brand unique
- RULES: Explicit do's and don'ts a creative must follow

Return ONLY valid JSON matching this schema:
{
  "visual_dna": {
    "signature_style": "One paragraph describing the brand's overall visual identity",
    "key_differentiators": ["What makes this brand unique visually"],
    "visual_principles": ["Core visual rules that define the brand"],
    "dos": ["Things a creative should always do"],
    "donts": ["Things a creative should never do"]
  },
  "photography_style": {
    "preferred_aperture": "f/2.8",
    "preferred_focal_length": "85mm",
    "preferred_lighting": "soft diffused natural",
    "preferred_color_temperature": "warm",
    "depth_of_field_preference": "shallow",
    "film_stock_feel": "digital_clean"
  },
  "color_profile": {
    "mandatory_colors": ["#hex values that must appear"],
    "forbidden_colors": ["#hex values that should never appear"],
    "palette_relationships": "Description of how colors interact",
    "overall_tone": "warm|cool|neutral|vibrant"
  },
  "composition_rules": {
    "preferred_layouts": ["rule_of_thirds", "centered"],
    "framing_conventions": ["tight crop on product", "environmental context"],
    "aspect_ratio_preference": "3:2"
  },
  "product_catalog": {
    "product_type_1": {
      "name": "Product Name",
      "styling_rules": ["How this product should be styled"],
      "required_elements": ["What must appear with this product"],
      "forbidden_elements": ["What must never appear"]
    }
  },
  "brand_identity": {
    "tagline": "The brand's primary tagline or slogan",
    "brand_values": ["value1", "value2"],
    "brand_aesthetic": "Description of the brand aesthetic",
    "messaging": ["Key brand messages"],
    "logo_description": "Description of the logo"
  },
  "tone_of_voice": {
    "formality": "formal|semi-formal|casual|conversational",
    "personality": "Description of brand personality",
    "energy": "calm|moderate|energetic|intense",
    "dos": ["Writing style guidelines to follow"],
    "donts": ["Writing style things to avoid"]
  },
  "typography": {
    "heading_font": "Font family name",
    "body_font": "Font family name",
    "style_description": "Description of typographic style"
  },
  "brand_story": {
    "narrative_summary": "One paragraph synthesis of the brand's corporate narrative",
    "mission_vision": { "mission": "", "vision": "", "purpose": "" },
    "heritage": { "founding_story": "", "milestones": [], "legacy": "" },
    "sustainability": { "environmental": "", "social": "", "governance": "", "goals": [] },
    "innovation": { "approach": "", "differentiators": [], "technology": "" },
    "culture": { "values_in_practice": "", "employee_experience": "", "dei": "" },
    "community": { "partnerships": [], "programs": "", "impact_metrics": "" },
    "customer_focus": { "promise": "", "experience": "", "testimonial_themes": [] },
    "competitive_position": { "market_position": "", "key_differentiators": [], "awards": [] }
  },
  "brand_standards": {
    "color_system": {
      "color_groups": [{ "name": "Primary|Secondary|Accent", "colors": [{ "name": "", "hex": "", "pms": "" }] }],
      "gradients": [],
      "ada_compliance": [{ "foreground": "", "background": "", "ratio": "", "level": "AA|AAA" }]
    },
    "typography_system": {
      "primary_font": { "name": "", "category": "sans-serif|serif|display", "weights": [], "usage": "" },
      "secondary_font": { "name": "", "category": "", "weights": [], "usage": "" },
      "rules": [{ "text": "" }],
      "layout_hierarchy": [{ "element": "H1|H2|body|caption", "font": "", "color": "" }]
    },
    "logo_system": {
      "primary": { "description": "", "clear_space": "", "minimum_size": { "digital": "", "print": "" } },
      "monogram": { "description": "", "variants": [], "usage": "" }
    },
    "vertical_positioning": {
      "verticals": [{ "name": "", "sub_verticals": [{ "name": "", "headline": "", "description": "" }] }]
    },
    "writer_guidelines": {
      "principles": [{ "name": "", "description": "", "example_instead_of": "", "example_try": "" }],
      "litmus_test": ""
    },
    "social_media_voice": {
      "persona": "",
      "voice_traits": [{ "name": "", "description": "" }],
      "content_types": [],
      "hashtags": []
    },
    "competitive_landscape": {
      "per_vertical": [{ "vertical": "", "competitors": [] }],
      "market_position_summary": ""
    },
    "glossary": [{ "preferred": "", "replaces": "" }]
  }
}

BRAND STANDARDS MANDATE:
If you have data about colors (hex codes, PMS values), typography (font names, weights), logo usage, brand voice, writing style, or competitive positioning, you MUST populate the brand_standards section. Map color_profile data into brand_standards.color_system with proper color_groups. Map typography data into brand_standards.typography_system. Map tone_of_voice into brand_standards.writer_guidelines and social_media_voice. Map competitive data into brand_standards.competitive_landscape.

BRAND STORY MANDATE:
If ANY document analyses contain brand_story data, you MUST include a complete brand_story section in your output. Documents are the authoritative source for brand_story — never omit brand_story because image or website analyses outnumber document analyses. Faithfully preserve the extracted corporate narrative.

ARRAY COMPLETENESS MANDATE:
For array fields (milestones, differentiators, awards, goals, partnerships, values, testimonial_themes), preserve EVERY item from the source analyses — do not summarize, deduplicate aggressively, or trim to a "top N" selection. If the input analyses contain 21 milestones, the output must contain all 21 (you may clean up wording but never drop entries). Completeness is more valuable than brevity for these fields.

IMPORTANT: Only include sections where you have data. If there are no image analyses, omit photography_style and composition_rules. If there is no website analysis, omit typography. Never fabricate data.`;

/**
 * Resolves the synthesis prompt for a brand using the chain:
 * 1. Brand-specific override (synthesis_prompt_id)
 * 2. Category default (brand-profile-synthesis-{category})
 * 3. Generic (brand-profile-synthesis)
 * 4. Hardcoded fallback
 */
async function resolveSynthesisPrompt(supabase: any, brandId: string): Promise<string> {
  const { data: brand } = await supabase
    .from('creative_studio_brands')
    .select('brand_category, synthesis_prompt_id')
    .eq('id', brandId)
    .single();

  // 1. Brand-specific override
  if (brand?.synthesis_prompt_id) {
    const { data: override } = await supabase
      .from('ai_prompt_templates')
      .select('prompt_text')
      .eq('id', brand.synthesis_prompt_id)
      .eq('is_active', true)
      .single();
    if (override?.prompt_text) {
      console.log(`[Synthesizer] Using brand-specific prompt override for ${brandId}`);
      return override.prompt_text;
    }
  }

  // 2. Category default
  if (brand?.brand_category) {
    const categorySlug = `brand-profile-synthesis-${brand.brand_category}`;
    const categoryPrompt = await getPromptWithModel(supabase, categorySlug);
    if (categoryPrompt?.prompt.prompt_text) {
      console.log(`[Synthesizer] Using category prompt: ${categorySlug}`);
      return categoryPrompt.prompt.prompt_text;
    }
  }

  // 3. Generic
  const genericPrompt = await getPromptWithModel(supabase, 'brand-profile-synthesis');
  if (genericPrompt?.prompt.prompt_text) {
    console.log('[Synthesizer] Using generic brand-profile-synthesis prompt');
    return genericPrompt.prompt.prompt_text;
  }

  // 4. Hardcoded fallback
  console.log('[Synthesizer] Using hardcoded fallback prompt');
  return FALLBACK_SYNTHESIS_PROMPT;
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

    // Verify auth
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: SynthesizeRequest = await req.json();
    const { brand_id } = body;

    if (!brand_id) {
      return new Response(JSON.stringify({ error: 'brand_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve the synthesis prompt: brand-specific → category → generic → hardcoded
    const synthesisPrompt = await resolveSynthesisPrompt(supabase, brand_id);

    // Get brand name
    const { data: brand } = await supabase
      .from('creative_studio_brands')
      .select('name')
      .eq('id', brand_id)
      .single();

    // Load ALL analyses for this brand (additive — includes all previous runs)
    const { data: analyses, error: fetchError } = await supabase
      .from('creative_studio_brand_analyses')
      .select('analysis_data, tags, source_image_url, source_type, image_category')
      .eq('brand_id', brand_id)
      .order('analyzed_at', { ascending: false });

    if (fetchError || !analyses?.length) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No analyses found for this brand. Run image or website analysis first.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group analyses by source type and image category for clearer Gemini input
    const allImageAnalyses = analyses.filter(a => (a.source_type || 'image') === 'image');
    const logoAnalyses = allImageAnalyses.filter(a => a.image_category === 'logo');
    const photoAnalyses = allImageAnalyses.filter(a => a.image_category !== 'logo');
    const websiteAnalyses = analyses.filter(a => a.source_type === 'website');
    const documentAnalyses = analyses.filter(a => a.source_type === 'document');

    // Normalize website analyses that may have data nested under a "0" key
    // (caused by Gemini returning an array that got spread into an object)
    const normalizedWebsiteAnalyses = websiteAnalyses.map(a => {
      const data = a.analysis_data;
      if (data && data["0"] && typeof data["0"] === 'object') {
        const unwrapped = data["0"] as Record<string, unknown>;
        return { ...a, analysis_data: { ...unwrapped, _extraction: data._extraction } };
      }
      return a;
    });

    // Build structured input for Gemini with source awareness
    const maxImageAnalyses = 100;
    const inputSections: string[] = [];

    if (normalizedWebsiteAnalyses.length > 0) {
      inputSections.push(
        `WEBSITE ANALYSES (${normalizedWebsiteAnalyses.length}):\n` +
        JSON.stringify(normalizedWebsiteAnalyses.map(a => a.analysis_data), null, 0)
      );
    }

    if (logoAnalyses.length > 0) {
      inputSections.push(
        `LOGO ANALYSES — AUTHORITATIVE FOR BRAND COLORS (${logoAnalyses.length}):\n` +
        `These are logos/brand marks. Their colors are the definitive brand palette. Use these exact hex values as mandatory_colors.\n` +
        JSON.stringify(logoAnalyses.map(a => a.analysis_data), null, 0)
      );
    }

    if (photoAnalyses.length > 0) {
      const photoSubset = photoAnalyses.slice(0, maxImageAnalyses);
      inputSections.push(
        `REFERENCE PHOTO ANALYSES — AUTHORITATIVE FOR PHOTOGRAPHY STYLE (${photoSubset.length} of ${photoAnalyses.length}):\n` +
        `These are reference photographs. Use them for photography style, composition, and mood — NOT for brand color palette.\n` +
        JSON.stringify(photoSubset.map(a => a.analysis_data), null, 0)
      );
    }

    if (documentAnalyses.length > 0) {
      inputSections.push(
        `DOCUMENT ANALYSES (${documentAnalyses.length}):\n` +
        JSON.stringify(documentAnalyses.map(a => a.analysis_data), null, 0)
      );
    }

    const analysisSummary = inputSections.join('\n\n');

    // Call Gemini to synthesize
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`;

    const payload = {
      contents: [{
        role: 'user',
        parts: [{
          text: `Synthesize a unified brand DNA profile for "${brand?.name || 'Unknown'}" from the following multi-source analyses.\n\n${analysisSummary}`,
        }],
      }],
      systemInstruction: {
        parts: [{ text: synthesisPrompt }],
      },
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
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
      throw new Error(`Gemini synthesis failed: ${response.status} — ${errorText.slice(0, 200)}`);
    }

    const geminiData = await response.json();
    const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('No synthesis content in Gemini response');
    }

    let synthesized: Record<string, unknown>;
    try {
      const parsed = JSON.parse(textContent);
      synthesized = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
      const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1].trim());
        synthesized = Array.isArray(parsed) ? parsed[0] : parsed;
      } else {
        throw new Error('Failed to parse synthesis JSON');
      }
    }

    // Log synthesis output for diagnostics
    const populatedKeys = Object.keys(synthesized).filter(k => synthesized[k] !== null && synthesized[k] !== undefined);
    console.log(`[Synthesizer] Gemini populated sections: [${populatedKeys.join(', ')}]`);
    if (documentAnalyses.length > 0 && !synthesized.brand_story) {
      console.warn(`[Synthesizer] WARNING: ${documentAnalyses.length} document analyses present but brand_story missing from synthesis output`);
    }

    // Calculate confidence based on sample size and source diversity
    const totalAnalyses = analyses.length;
    let confidenceScore = 0.3;
    // Base confidence from volume
    if (totalAnalyses >= 200) confidenceScore = 0.95;
    else if (totalAnalyses >= 100) confidenceScore = 0.85;
    else if (totalAnalyses >= 50) confidenceScore = 0.7;
    else if (totalAnalyses >= 20) confidenceScore = 0.5;
    // Boost confidence if multiple source types contribute
    const sourceTypes = new Set(analyses.map(a => a.source_type || 'image'));
    if (sourceTypes.size >= 2) confidenceScore = Math.min(1, confidenceScore + 0.1);

    // Upsert the brand profile (merge with existing)
    const { data: existingProfile } = await supabase
      .from('creative_studio_brand_profiles')
      .select('*')
      .eq('brand_id', brand_id)
      .single();

    const now = new Date().toISOString();
    const profileData: Record<string, unknown> = {
      brand_id,
      source_metadata: {
        total_analyses: totalAnalyses,
        logo_analyses: logoAnalyses.length,
        photo_analyses: photoAnalyses.length,
        image_analyses: allImageAnalyses.length,
        website_analyses: websiteAnalyses.length,
        document_analyses: documentAnalyses.length,
        source_types: [...sourceTypes],
        last_synthesized: now,
      },
      total_images_analyzed: totalAnalyses,
      last_analysis_run: now,
      confidence_score: confidenceScore,
      updated_at: now,
    };

    // Only overwrite profile sections that Gemini actually populated —
    // preserves existing Brand DNA values when re-synthesizing after document import
    if (synthesized.visual_dna) profileData.visual_dna = synthesized.visual_dna;
    if (synthesized.photography_style) profileData.photography_style = synthesized.photography_style;
    if (synthesized.color_profile) profileData.color_profile = synthesized.color_profile;
    if (synthesized.composition_rules) profileData.composition_rules = synthesized.composition_rules;
    if (synthesized.product_catalog) profileData.product_catalog = mergeProductCatalog(existingProfile?.product_catalog, synthesized.product_catalog);
    if (synthesized.brand_identity) profileData.brand_identity = synthesized.brand_identity;
    if (synthesized.tone_of_voice) profileData.tone_of_voice = synthesized.tone_of_voice;
    if (synthesized.typography) profileData.typography = synthesized.typography;
    if (synthesized.art_direction_rules) profileData.art_direction_rules = synthesized.art_direction_rules;
    if (synthesized.post_production_style) profileData.post_production_style = synthesized.post_production_style;
    if (synthesized.brand_story) profileData.brand_story = synthesized.brand_story;
    if (synthesized.brand_standards) profileData.brand_standards = synthesized.brand_standards;

    if (existingProfile) {
      await supabase
        .from('creative_studio_brand_profiles')
        .update(profileData)
        .eq('id', existingProfile.id);
    } else {
      await supabase
        .from('creative_studio_brand_profiles')
        .insert(profileData);
    }

    // Sync synthesized data back to the brands table for UI display
    const brandSync: Record<string, unknown> = {};

    // Colors: always sync from synthesis
    if (synthesized.color_profile) {
      const cp = synthesized.color_profile as {
        mandatory_colors?: string[];
        brand_colors?: Array<{ hex: string }>;
      };
      const colorList = cp.mandatory_colors?.length
        ? cp.mandatory_colors
        : cp.brand_colors?.map(c => c.hex).filter(Boolean);

      if (colorList && colorList.length > 0) {
        brandSync.primary_color = colorList[0];
        brandSync.color_palette = colorList;
        if (colorList.length > 1) {
          brandSync.secondary_color = colorList[1];
        }
      }
    }

    // Description and logo: only fill when currently empty
    const { data: currentBrand } = await supabase
      .from('creative_studio_brands')
      .select('description, logo_url')
      .eq('id', brand_id)
      .single();

    if (!currentBrand?.description) {
      const narrative = (synthesized.brand_story as any)?.narrative_summary
        || (synthesized.brand_identity as any)?.brand_aesthetic;
      if (narrative) {
        brandSync.description = narrative;
      }
    }

    if (!currentBrand?.logo_url && logoAnalyses.length > 0) {
      brandSync.logo_url = logoAnalyses[0].source_image_url;
    }

    if (Object.keys(brandSync).length > 0) {
      await supabase
        .from('creative_studio_brands')
        .update(brandSync)
        .eq('id', brand_id);
    }

    // Audit log
    await supabase.from('creative_studio_audit_log').insert({
      user_id: user.id,
      user_email: user.email,
      action: 'synthesize_brand_profile',
      brand_id,
      parameters: {
        total_analyses: totalAnalyses,
        logo_analyses: logoAnalyses.length,
        photo_analyses: photoAnalyses.length,
        image_analyses: allImageAnalyses.length,
        website_analyses: websiteAnalyses.length,
        document_analyses: documentAnalyses.length,
        confidence_score: confidenceScore,
        had_existing_profile: !!existingProfile,
      },
    });

    // Build list of sections that were populated for UI transparency
    const updatedSections: string[] = [];
    if (synthesized.visual_dna) updatedSections.push('Visual DNA');
    if (synthesized.photography_style) updatedSections.push('Photography Style');
    if (synthesized.color_profile) updatedSections.push('Color Profile');
    if (synthesized.composition_rules) updatedSections.push('Composition Rules');
    if (synthesized.product_catalog) updatedSections.push('Product Catalog');
    if (synthesized.brand_identity) updatedSections.push('Brand Identity');
    if (synthesized.tone_of_voice) updatedSections.push('Tone of Voice');
    if (synthesized.typography) updatedSections.push('Typography');
    if (synthesized.art_direction_rules) updatedSections.push('Art Direction Rules');
    if (synthesized.post_production_style) updatedSections.push('Post-Production Style');
    if (synthesized.brand_story) updatedSections.push('Brand Story');

    return new Response(JSON.stringify({
      success: true,
      profile: profileData,
      images_analyzed: totalAnalyses,
      confidence_score: confidenceScore,
      updated_sections: updatedSections,
      source_breakdown: {
        logos: logoAnalyses.length,
        photos: photoAnalyses.length,
        images: allImageAnalyses.length,
        websites: websiteAnalyses.length,
        documents: documentAnalyses.length,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Brand profile synthesis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Synthesis failed',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function mergeProductCatalog(
  existing: Record<string, unknown> | null | undefined,
  newCatalog: unknown,
): Record<string, unknown> {
  const merged = { ...(existing || {}) };
  if (newCatalog && typeof newCatalog === 'object') {
    Object.assign(merged, newCatalog);
  }
  return merged;
}
