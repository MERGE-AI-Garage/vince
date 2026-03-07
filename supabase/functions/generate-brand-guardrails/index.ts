// ABOUTME: Edge function that generates brand guardrails from intelligence profile data
// ABOUTME: Uses Gemini to create structured rules, forbidden combos, and required elements

import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { trackUsage } from '../_shared/ai-usage-tracker.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT_BASE = `You are an expert brand governance strategist. Given a brand's intelligence profile (visual DNA, colors, typography, photography style, tone of voice, brand identity, brand story, and standards), generate operational guardrails that protect brand consistency in AI-generated creative content.

Generate guardrails that are:
- SPECIFIC to this brand (reference actual colors, fonts, values by name)
- ACTIONABLE for an AI image/content generation model
- REALISTIC — don't over-restrict creative freedom, focus on what truly matters for brand consistency

RULES FOR GENERATION:
- Generate 6-10 rules with appropriate severity levels:
  - "error": Hard stops — things that MUST NOT happen (wrong colors, off-brand tone, competitor references)
  - "warning": Soft guidance — things to avoid but not critical (stock photo aesthetics, generic compositions)
  - "info": Best practices — preferred approaches that improve quality
- Generate 3-5 forbidden combinations — pairs/groups of elements that should never appear together
- Generate 3-5 required elements — things that should be present in specific contexts
- Write a concise tone_guidelines summary (2-3 sentences)
- Generate a descriptive name for the directive set
- Generate a persona description (who enforces these rules — e.g., "Senior brand strategist with deep knowledge of...")

Assign categories to rules from: "color", "typography", "photography", "composition", "tone", "messaging", "identity", "compliance"

Return ONLY valid JSON matching the specified schema.`;

const FOCUS_AREA_ADDITIONS: Record<string, string> = {
  visual_identity: `FOCUS: Visual Identity only. Concentrate rules on brand colors (exact hex values), logo usage, brand marks, visual symbols, and color combinations. Ignore photography, tone, and copy direction. The persona should be a brand identity specialist.`,
  photography_and_composition: `FOCUS: Photography & Composition only. Concentrate rules on shot types, lighting setups, camera settings (aperture, focal length), color temperature, framing, depth of field, and compositional guidelines. Ignore tone, copy, and color palette rules unless they specifically relate to photographic post-processing. The persona should be a senior art director or director of photography.`,
  tone_and_messaging: `FOCUS: Tone & Messaging only. Concentrate rules on brand voice, copy direction, content dos/don'ts, word choice, audience tone, emotional register, and messaging hierarchy. Ignore visual and photographic rules entirely. The persona should be a brand voice and content strategist.`,
  typography_and_text: `FOCUS: Typography & Text only. Concentrate rules on font usage, type hierarchy, text overlay guidelines (when text appears in images), typographic combinations to avoid, size relationships, and text legibility standards. The persona should be a typographer or visual communications specialist.`,
  product_representation: `FOCUS: Product Representation only. Concentrate rules on how products must be shown — accurate colors, required brand elements on packaging, forbidden modifications, surface and context requirements, and what constitutes faithful vs. distorted product reproduction in AI-generated imagery. The persona should be a product marketing or brand standards specialist.`,
  compliance: `FOCUS: Compliance & Regulatory only. Concentrate rules on legal restrictions, industry regulations, required disclaimers, forbidden claims, competitor references, and brand liability guardrails. Ignore aesthetic and stylistic rules. The persona should be a brand compliance or legal risk specialist.`,
};

function buildSystemPrompt(focusArea?: string): string {
  if (!focusArea || !FOCUS_AREA_ADDITIONS[focusArea]) return SYSTEM_PROMPT_BASE;
  return `${SYSTEM_PROMPT_BASE}\n\n${FOCUS_AREA_ADDITIONS[focusArea]}`;
}

interface GenerateRequest {
  brand_id: string;
  focus_area?: string;
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

    const body: GenerateRequest = await req.json();
    const { brand_id, focus_area } = body;

    if (!brand_id) {
      return new Response(JSON.stringify({ error: 'brand_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Gather brand intelligence ──────────────────────────────────────

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

    const { data: profile } = await supabase
      .from('creative_studio_brand_profiles')
      .select('visual_dna, photography_style, color_profile, composition_rules, brand_identity, tone_of_voice, typography, brand_story, brand_standards')
      .eq('brand_id', brand_id)
      .maybeSingle();

    // Fetch existing directives to avoid duplicates
    const { data: existingDirectives } = await supabase
      .from('creative_studio_agent_directives')
      .select('name, rules, forbidden_combinations, required_elements')
      .eq('brand_id', brand_id);

    const hasProfile = profile && Object.values(profile).some(v => v !== null);
    if (!hasProfile && !brand.brand_voice) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No brand intelligence data found. Build a brand profile first.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Build input for Gemini ─────────────────────────────────────────

    const inputSections: string[] = [];

    inputSections.push(`BRAND: "${brand.name}"`);
    if (brand.brand_category) {
      inputSections.push(`CATEGORY: ${brand.brand_category}`);
    }
    if (brand.brand_voice) {
      inputSections.push(`BRAND VOICE:\n${brand.brand_voice}`);
    }
    if (brand.visual_identity) {
      inputSections.push(`VISUAL IDENTITY:\n${brand.visual_identity}`);
    }

    if (profile) {
      const sections: [string, unknown][] = [
        ['BRAND IDENTITY', profile.brand_identity],
        ['TONE OF VOICE', profile.tone_of_voice],
        ['VISUAL DNA', profile.visual_dna],
        ['COLOR PROFILE', profile.color_profile],
        ['TYPOGRAPHY', profile.typography],
        ['PHOTOGRAPHY STYLE', profile.photography_style],
        ['COMPOSITION RULES', profile.composition_rules],
        ['BRAND STORY', profile.brand_story],
        ['BRAND STANDARDS', profile.brand_standards],
      ];

      for (const [label, data] of sections) {
        if (data && typeof data === 'object' && Object.keys(data as Record<string, unknown>).length > 0) {
          inputSections.push(`${label}:\n${JSON.stringify(data, null, 0)}`);
        }
      }
    }

    if (existingDirectives && existingDirectives.length > 0) {
      inputSections.push(`EXISTING DIRECTIVES (do NOT duplicate these — generate complementary rules):\n${JSON.stringify(existingDirectives, null, 0)}`);
    }

    const fullInput = inputSections.join('\n\n');

    // ── Call Gemini with structured output ──────────────────────────────

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const payload = {
      contents: [{
        role: 'user',
        parts: [{
          text: `Generate brand guardrails for "${brand.name}" based on the following intelligence data.\n\n${fullInput}`,
        }],
      }],
      systemInstruction: {
        parts: [{ text: buildSystemPrompt(focus_area) }],
      },
      generationConfig: {
        temperature: 0.3,
        topP: 0.85,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING', description: 'Descriptive name for this directive set' },
            persona: { type: 'STRING', description: 'Who enforces these rules' },
            rules: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  rule: { type: 'STRING' },
                  severity: { type: 'STRING', enum: ['error', 'warning', 'info'] },
                  category: { type: 'STRING' },
                },
                required: ['rule', 'severity', 'category'],
              },
            },
            forbidden_combinations: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  items: { type: 'ARRAY', items: { type: 'STRING' } },
                  reason: { type: 'STRING' },
                },
                required: ['items', 'reason'],
              },
            },
            required_elements: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  element: { type: 'STRING' },
                  when: { type: 'STRING' },
                },
                required: ['element', 'when'],
              },
            },
            tone_guidelines: { type: 'STRING' },
          },
          required: ['name', 'persona', 'rules', 'forbidden_combinations', 'required_elements', 'tone_guidelines'],
        },
      },
    };

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini generation failed: ${response.status} — ${errorText.slice(0, 200)}`);
    }

    const geminiData = await response.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    trackUsage({
      supabase,
      userId: user.id,
      apiProvider: 'gemini',
      endpoint: 'generate-brand-guardrails',
      modelName: 'gemini-2.5-flash',
      featureType: 'analysis',
      promptText: 'Brand guardrails generation',
      requestTokens: geminiData.usageMetadata?.promptTokenCount || 0,
      responseTokens: geminiData.usageMetadata?.candidatesTokenCount || 0,
      status: rawText ? 'success' : 'error',
    });

    if (!rawText) {
      throw new Error('No content in Gemini response');
    }

    const guardrails = JSON.parse(rawText);

    // ── Insert as inactive directive ───────────────────────────────────

    const { data: newDirective, error: insertError } = await (supabase
      .from('creative_studio_agent_directives') as any)
      .insert({
        brand_id,
        name: guardrails.name,
        persona: guardrails.persona,
        focus_area: focus_area || null,
        rules: guardrails.rules,
        forbidden_combinations: guardrails.forbidden_combinations,
        required_elements: guardrails.required_elements,
        tone_guidelines: guardrails.tone_guidelines,
        is_active: false,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Audit log
    await supabase.from('creative_studio_audit_log').insert({
      user_id: user.id,
      user_email: user.email,
      action: 'generate_brand_guardrails',
      brand_id,
      parameters: {
        directive_id: newDirective.id,
        focus_area: focus_area || null,
        rule_count: guardrails.rules?.length || 0,
        forbidden_count: guardrails.forbidden_combinations?.length || 0,
        required_count: guardrails.required_elements?.length || 0,
        had_existing_directives: (existingDirectives?.length || 0) > 0,
        model: 'gemini-2.5-flash',
      },
    });

    return new Response(JSON.stringify({
      success: true,
      directive: newDirective,
      summary: {
        rules: guardrails.rules?.length || 0,
        forbidden_combinations: guardrails.forbidden_combinations?.length || 0,
        required_elements: guardrails.required_elements?.length || 0,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Brand guardrails generation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Generation failed',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
