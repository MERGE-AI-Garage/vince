// ABOUTME: Edge function that synthesizes a structured generation prompt from all brand intelligence
// ABOUTME: Compiles brand profile, directives, and voice into an 8-section markdown prompt for image generation

import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SynthesizeRequest {
  brand_id: string;
}

const SYSTEM_PROMPT = `You are an expert creative director writing instructions for AI image generation models.

Given a brand's structured intelligence data (visual DNA, colors, typography, photography style, tone of voice, directives, etc.), synthesize a comprehensive generation prompt that will guide AI image models to produce on-brand creative output.

OUTPUT FORMAT: Return structured markdown with exactly these 9 sections, each starting with a ## heading. Each section should be 2-4 concise, directive sentences written as instructions to an image generation model.

## Brand Identity
Describe the brand's core identity, values, aesthetic positioning, and tagline. Write as directives: "Always reflect...", "The brand is..."

## Tone of Voice
Define the brand's personality, energy level, formality, and emotional register. Include specific dos and don'ts for visual tone.

## Visual Style
Describe the brand's signature visual identity — key differentiators, visual principles, and what makes this brand recognizable. Write as creative direction.

## Color Palette
Specify mandatory brand colors (with hex values if available), forbidden colors, palette relationships, and overall color tone. Be precise — image models respond well to specific color direction.

## Typography
Describe the brand's typographic style, preferred fonts, and how text should appear in generated images. IMPORTANT: AI image generation models are notoriously poor at rendering text. Include these directives:
- Keep any text overlays minimal (1-3 words maximum)
- Prefer bold, clean sans-serif letterforms for legibility
- Avoid long strings, paragraphs, or fine serif text
- When text must appear, place it prominently with high contrast against background
- Consider whether the image truly needs text — often a text-free composition is stronger

## Photography Direction
Specify camera settings (aperture, focal length), lighting preferences, depth of field, color temperature, and film stock feel. Be technical and specific — these translate directly to image generation parameters.

## Composition Rules
Define preferred layouts, framing conventions, aspect ratios, and spatial arrangement rules. Reference specific composition techniques (rule of thirds, centered, diagonal, etc.).

## Brand Guardrails
List explicit rules, forbidden elements, and required elements. Include any compliance restrictions. Write as clear do's and don'ts.

## Brand Story
Distill the brand's corporate narrative into visual creative direction. Draw from:
- Heritage & founding story → timeless, authentic compositions that reflect the brand's roots
- Sustainability commitments → natural materials, eco-conscious settings, earth tones
- Innovation positioning → modern, forward-looking, technology-informed aesthetics
- Cultural values & DEI → diverse casting, inclusive representation, authentic human moments
- Community involvement → warmth, connection, real-world settings
- Customer promise → emotional resonance, aspirational but authentic
Write as creative briefs — "Reflect the brand's 50-year heritage through classic, timeless compositions" not "The company was founded in 1975."

RULES:
- Only include content for sections where source data exists. If there's no data for a section, write a brief placeholder like "No specific direction available — use professional judgment."
- Never fabricate brand data — only synthesize what's provided
- Write in second person imperative: "Use warm lighting", "Avoid cold blue tones"
- Be specific and actionable — vague direction produces vague images
- Keep each section focused and scannable`;

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

    // ── Gather all brand intelligence ──────────────────────────────────

    // Brand basics
    const { data: brand } = await supabase
      .from('creative_studio_brands')
      .select('name, brand_voice, brand_category, visual_identity')
      .eq('id', brand_id)
      .single();

    if (!brand) {
      return new Response(JSON.stringify({ error: 'Brand not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Brand visual profile (DNA)
    const { data: profile } = await supabase
      .from('creative_studio_brand_profiles')
      .select('visual_dna, photography_style, color_profile, composition_rules, brand_identity, tone_of_voice, typography, art_direction_rules, post_production_style, brand_story')
      .eq('brand_id', brand_id)
      .maybeSingle();

    // Agent directives
    const { data: directives } = await supabase
      .from('creative_studio_agent_directives')
      .select('rules, forbidden_combinations, required_elements, tone_guidelines')
      .eq('brand_id', brand_id)
      .eq('is_active', true);

    // Check we have at least some data to work with
    const hasProfile = profile && Object.values(profile).some(v => v !== null);
    const hasVoice = !!brand.brand_voice;
    const hasDirectives = directives && directives.length > 0;

    if (!hasProfile && !hasVoice && !hasDirectives) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No brand intelligence data found. Build a Visual DNA profile, set a brand voice, or add directives first.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Build structured input for Gemini ──────────────────────────────

    const inputSections: string[] = [];

    inputSections.push(`BRAND: "${brand.name}"`);
    if (brand.brand_category) {
      inputSections.push(`CATEGORY: ${brand.brand_category}`);
    }
    if (brand.brand_voice) {
      inputSections.push(`BRAND VOICE (legacy prompt text):\n${brand.brand_voice}`);
    }
    if (brand.visual_identity) {
      inputSections.push(`VISUAL IDENTITY SUMMARY:\n${brand.visual_identity}`);
    }

    if (profile) {
      if (profile.brand_identity) {
        inputSections.push(`BRAND IDENTITY DATA:\n${JSON.stringify(profile.brand_identity, null, 0)}`);
      }
      if (profile.tone_of_voice) {
        inputSections.push(`TONE OF VOICE DATA:\n${JSON.stringify(profile.tone_of_voice, null, 0)}`);
      }
      if (profile.visual_dna && Object.keys(profile.visual_dna).length > 0) {
        inputSections.push(`VISUAL DNA:\n${JSON.stringify(profile.visual_dna, null, 0)}`);
      }
      if (profile.color_profile) {
        inputSections.push(`COLOR PROFILE:\n${JSON.stringify(profile.color_profile, null, 0)}`);
      }
      if (profile.typography) {
        inputSections.push(`TYPOGRAPHY:\n${JSON.stringify(profile.typography, null, 0)}`);
      }
      if (profile.photography_style) {
        inputSections.push(`PHOTOGRAPHY STYLE:\n${JSON.stringify(profile.photography_style, null, 0)}`);
      }
      if (profile.composition_rules) {
        inputSections.push(`COMPOSITION RULES:\n${JSON.stringify(profile.composition_rules, null, 0)}`);
      }
      if (profile.art_direction_rules) {
        inputSections.push(`ART DIRECTION RULES:\n${JSON.stringify(profile.art_direction_rules, null, 0)}`);
      }
      if (profile.post_production_style) {
        inputSections.push(`POST-PRODUCTION STYLE:\n${JSON.stringify(profile.post_production_style, null, 0)}`);
      }
      if (profile.brand_story) {
        inputSections.push(`BRAND STORY:\n${JSON.stringify(profile.brand_story, null, 0)}`);
      }
    }

    if (directives && directives.length > 0) {
      const allRules = directives.flatMap(d => d.rules || []);
      const allForbidden = directives.flatMap(d => d.forbidden_combinations || []);
      const allRequired = directives.flatMap(d => d.required_elements || []);
      const toneGuidelines = directives.map(d => d.tone_guidelines).filter(Boolean);

      inputSections.push(`AGENT DIRECTIVES:\nRules: ${JSON.stringify(allRules, null, 0)}\nForbidden Combinations: ${JSON.stringify(allForbidden, null, 0)}\nRequired Elements: ${JSON.stringify(allRequired, null, 0)}\nTone Guidelines: ${toneGuidelines.join('; ')}`);
    }

    const fullInput = inputSections.join('\n\n');

    // ── Call Gemini ────────────────────────────────────────────────────

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`;

    const payload = {
      contents: [{
        role: 'user',
        parts: [{
          text: `Synthesize a generation prompt for "${brand.name}" from the following brand intelligence data.\n\n${fullInput}`,
        }],
      }],
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      generationConfig: {
        temperature: 0.3,
        topP: 0.85,
        maxOutputTokens: 4096,
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
    const promptText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!promptText) {
      throw new Error('No content in Gemini response');
    }

    // ── Determine version and save ────────────────────────────────────

    // Get current max version for this brand
    const { data: latestVersion } = await supabase
      .from('brand_generation_prompts')
      .select('version')
      .eq('brand_id', brand_id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newVersion = (latestVersion?.version || 0) + 1;

    // Deactivate existing active prompt
    await supabase
      .from('brand_generation_prompts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('brand_id', brand_id)
      .eq('is_active', true);

    // Insert new active prompt
    const { data: newPrompt, error: insertError } = await supabase
      .from('brand_generation_prompts')
      .insert({
        brand_id,
        version: newVersion,
        is_active: true,
        prompt_text: promptText,
        section_toggles: {
          brand_identity: true,
          tone_of_voice: true,
          visual_style: true,
          color_palette: true,
          typography: true,
          photography_direction: true,
          composition_rules: true,
          brand_guardrails: true,
          brand_story: true,
        },
        synthesis_metadata: {
          synthesized_at: new Date().toISOString(),
          had_profile: hasProfile,
          had_voice: hasVoice,
          had_directives: hasDirectives,
          directive_count: directives?.length || 0,
          model: 'gemini-3-flash-preview',
        },
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Audit log
    await supabase.from('creative_studio_audit_log').insert({
      user_id: user.id,
      user_email: user.email,
      action: 'synthesize_generation_prompt',
      brand_id,
      parameters: {
        version: newVersion,
        had_profile: hasProfile,
        had_voice: hasVoice,
        had_directives: hasDirectives,
        prompt_length: promptText.length,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      prompt_text: promptText,
      version: newVersion,
      prompt_id: newPrompt.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Generation prompt synthesis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Synthesis failed',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
