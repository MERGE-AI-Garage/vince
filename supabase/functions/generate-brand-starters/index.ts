// ABOUTME: Generates brand-specific Director Mode Quick Starters from Brand DNA
// ABOUTME: Uses brand profile, product catalog, and brand story to create 8-15 tailored prompt templates

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateStartersRequest {
  brand_id: string;
}

interface VariableField {
  key: string;
  label: string;
  type: 'select' | 'text';
  options?: string[];
  default_value?: string;
  required?: boolean;
}

interface GeneratedStarter {
  name: string;
  description: string;
  category: string;
  prompt_template: string;
  variable_fields?: VariableField[];
  camera_preset?: {
    aperture?: number;
    focal_length?: number;
    color_temperature?: number;
    lighting_setup?: string;
    depth_of_field?: string;
    film_stock?: string;
    composition?: string;
    shot_type?: string;
  };
}

const VALID_CATEGORIES = ['product', 'lifestyle', 'campaign', 'social', 'hero', 'editorial', 'cinematography'];

function buildFullBrandContext(
  brand: Record<string, unknown>,
  profile: Record<string, unknown> | null,
  directives: Array<Record<string, unknown>>,
): string {
  const sections: string[] = [];

  sections.push(`Brand: ${brand.name}`);
  if (brand.brand_category) sections.push(`Industry: ${brand.brand_category}`);
  if (brand.brand_voice) sections.push(`Brand Voice: ${brand.brand_voice}`);
  if (brand.visual_identity) sections.push(`Visual Identity: ${brand.visual_identity}`);

  if (!profile) return sections.join('\n\n');

  if (profile.visual_dna) {
    sections.push(`Visual DNA: ${JSON.stringify(profile.visual_dna, null, 1)}`);
  }
  if (profile.photography_style) {
    sections.push(`Photography Style: ${JSON.stringify(profile.photography_style, null, 1)}`);
  }
  if (profile.color_profile) {
    sections.push(`Color Profile: ${JSON.stringify(profile.color_profile, null, 1)}`);
  }
  if (profile.composition_rules) {
    sections.push(`Composition Rules: ${JSON.stringify(profile.composition_rules, null, 1)}`);
  }
  if (profile.product_catalog) {
    sections.push(`Product Catalog: ${JSON.stringify(profile.product_catalog, null, 1)}`);
  }
  if (profile.brand_identity) {
    sections.push(`Brand Identity: ${JSON.stringify(profile.brand_identity, null, 1)}`);
  }
  if (profile.tone_of_voice) {
    sections.push(`Tone of Voice: ${JSON.stringify(profile.tone_of_voice, null, 1)}`);
  }
  if (profile.art_direction_rules) {
    sections.push(`Art Direction Rules: ${JSON.stringify(profile.art_direction_rules, null, 1)}`);
  }
  if (profile.post_production_style) {
    sections.push(`Post-Production Style: ${JSON.stringify(profile.post_production_style, null, 1)}`);
  }
  if (profile.brand_story) {
    sections.push(`Brand Story: ${JSON.stringify(profile.brand_story, null, 1)}`);
  }
  if (profile.typography) {
    sections.push(`Typography: ${JSON.stringify(profile.typography, null, 1)}`);
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

    // Authenticate — service role key accepted for server-to-server calls
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    // deno-lint-ignore no-explicit-any
    let user: any;
    if (token === supabaseServiceKey) {
      user = { id: 'service-role', email: 'system' };
    } else {
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError || !authUser) {
        return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      user = authUser;
    }

    const body: GenerateStartersRequest = await req.json();
    const { brand_id } = body;

    if (!brand_id) {
      return new Response(JSON.stringify({ success: false, error: 'brand_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load brand context in parallel
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
    if (!profile) {
      return new Response(JSON.stringify({ success: false, error: 'No brand profile found. Run Brand DNA analysis first.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const directives = directivesResult.data || [];
    const brandContext = buildFullBrandContext(brand, profile, directives);

    // Build Gemini prompt
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.8,
        maxOutputTokens: 8192,
      },
    });

    const systemInstruction = `You are a creative director generating Director Mode Quick Starters for the brand "${brand.name}".

Quick Starters are pre-built creative briefs that populate Director Mode fields for AI image and video generation. Each starter should be a specific, vivid scenario tailored to this brand's products, visual style, and story.

BRAND CONTEXT:
${brandContext}

RULES:
1. Generate 10-15 Quick Starters (minimum 8)
2. Each starter MUST reference specific brand products, materials, or settings from the brand context
3. Starters should cover a MIX of these categories: ${JSON.stringify(VALID_CATEGORIES)}
4. Each prompt_template should be 2-4 sentences of vivid, specific creative direction
5. Include actual product names, materials, finishes, and brand-specific details — NOT generic placeholders
6. Camera presets should match the brand's photography style preferences
7. Names should be concise (2-4 words) and evocative
8. Descriptions should explain when/why to use the starter (1 sentence)
9. Vary the shot types: hero shots, in-situ, macro details, lifestyle, editorial, campaign concepts
10. If the brand has sustainability/CSR themes, include at least one campaign starter for those
11. If the brand has multiple product lines, ensure starters cover different products
12. VARIABLE FIELDS: If the brand has a product_catalog with 2+ distinct products, create at least 2 starters
    with a {{product}} variable. Use {{product}} literally in prompt_template where the product name goes.
    Set variable_fields to [{key:"product", label:"Product", type:"select", options:[list of product names], required:true}].
    Set the most common product as default_value.
13. For campaign/lifestyle starters where tone or theme varies, you may add a {{campaign_theme}} select field
    with options drawn from the brand's actual themes (e.g., sustainability, innovation, community).
14. For starters WITHOUT variable dimensions, set variable_fields to [].

Return a JSON array of objects with this schema:
[
  {
    "name": "Short Evocative Name",
    "description": "When to use this starter — one sentence",
    "category": "one of: product, lifestyle, campaign, social, hero, editorial, cinematography",
    "prompt_template": "2-4 sentences of creative direction. Use {{variable_key}} syntax for user-selectable values.",
    "variable_fields": [
      {
        "key": "product",
        "label": "Product",
        "type": "select",
        "options": ["Product A", "Product B"],
        "default_value": "Product A",
        "required": true
      }
    ],
    "camera_preset": {
      "aperture": 2.8,
      "focal_length": 85,
      "lighting_setup": "descriptive string like 'studio three-point' or 'natural daylight'",
      "depth_of_field": "shallow|medium|deep",
      "film_stock": "descriptive string like 'clean digital' or 'warm film'",
      "color_temperature": 5500,
      "composition": "descriptive string like 'centered hero' or 'rule of thirds'",
      "shot_type": "descriptive string like 'hero close-up' or 'wide environmental'"
    }
  }
]`;

    const userPrompt = `Generate Director Mode Quick Starters for "${brand.name}". Make each starter specific to this brand's actual products, visual identity, and story. These should feel like they were hand-crafted by a creative director who deeply understands the brand.`;

    console.log(`[generate-brand-starters] Brand: ${brand.name}, Category: ${brand.brand_category}, User: ${user.email}`);

    const result = await model.generateContent({
      systemInstruction,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    });

    const responseText = result.response.text();
    let starters: GeneratedStarter[];

    try {
      const parsed = JSON.parse(responseText);
      starters = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // Try extracting from markdown code fence
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1].trim());
        starters = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        console.error('[generate-brand-starters] Failed to parse Gemini response:', responseText.slice(0, 500));
        return new Response(JSON.stringify({ success: false, error: 'Failed to parse AI response' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Validate and normalize each starter
    starters = starters
      .filter(s => s.name && s.prompt_template)
      .map(s => ({
        ...s,
        category: VALID_CATEGORIES.includes(s.category) ? s.category : 'product',
        description: s.description || '',
        camera_preset: s.camera_preset || undefined,
      }));

    console.log(`[generate-brand-starters] Generated ${starters.length} starters for ${brand.name}`);

    return new Response(JSON.stringify({
      success: true,
      starters,
      brand_name: brand.name,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[generate-brand-starters] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
