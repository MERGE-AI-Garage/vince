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

const VALID_CATEGORIES = ['product', 'lifestyle', 'campaign', 'social', 'hero', 'editorial', 'cinematography', 'copy', 'brand-voice'];

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
        maxOutputTokens: 16384,
      },
    });

    const systemInstruction = `You are a senior creative director AND head of copy strategy generating Director Mode Quick Starters for the brand "${brand.name}".

Quick Starters are pre-built creative briefs. Visual starters (product, hero, lifestyle, etc.) direct AI image/video generation. Copy starters and brand-voice starters are complete, deployable agency documents — not summaries. They must be written to the standard of a top-tier creative agency like Ogilvy, R/GA, or Google's in-house creative team.

BRAND CONTEXT:
${brandContext}

RULES:
1. Generate 14-20 Quick Starters (minimum 12)
2. Each starter MUST reference specific brand products, materials, settings, voice attributes, or audience personas from the brand context — NO generic placeholders
3. Starters should cover a MIX of these categories: ${JSON.stringify(VALID_CATEGORIES)}
4. Include at least 1 starter from EACH of these category groups:
   - Visual (product, hero, lifestyle, editorial)
   - Video (cinematography)
   - Social (social, campaign)
   - Copy/Text (copy, brand-voice) — require at least 2 copy starters AND at least 2 brand-voice starters
5. PROMPT LENGTH BY TYPE:
   - Visual starters (product, hero, lifestyle, editorial, campaign, social, cinematography): 2-4 sentences of vivid, specific creative direction
   - "copy" starters: complete structured brief, 150-300 words (see COPY BRIEF TEMPLATE below)
   - "brand-voice" starters: complete deployable AI system prompt, 300-500 words (see BRAND-VOICE TEMPLATE below)
6. Include actual product names, materials, finishes, and brand-specific details
7. Camera presets should match the brand's photography style preferences
8. Names should be concise (2-4 words) and evocative
9. Descriptions should explain when/why to use the starter (1 sentence)
10. Vary the visual shot types: hero shots, in-situ, macro details, lifestyle, editorial, campaign concepts
11. If the brand has sustainability/CSR themes, include at least one campaign starter for those
12. If the brand has multiple product lines, ensure starters cover different products
13. VARIABLE FIELDS FOR VISUAL STARTERS: If the brand has a product_catalog with 2+ distinct products, create at least 2 starters
    with a {{product}} variable. Use {{product}} literally in prompt_template where the product name goes.
    Set variable_fields to [{key:"product", label:"Product", type:"select", options:[list of product names], required:true}].
    Set the most common product as default_value.
14. For campaign/lifestyle starters where tone or theme varies, add a {{campaign_theme}} select field
    with options drawn from the brand's actual themes (e.g., sustainability, innovation, community).
15. For starters WITHOUT variable dimensions, set variable_fields to [].

═══════════════════════════════════════════════
COPY BRIEF TEMPLATE (use for ALL "copy" category starters)
═══════════════════════════════════════════════
The prompt_template for a "copy" starter IS the creative brief. It must be 150-300 words and follow this exact structure, populated entirely from the brand context above:

COPY BRIEF: {{content_type}} for {{platform}}

TARGET AUDIENCE: [specific persona drawn from brand context — life stage, role, mindset, core tension or aspiration. Be specific: "25-40 year old brand managers at mid-market companies who feel pressure to prove ROI on every creative dollar" not "marketing professionals"]

AUDIENCE MIND STATE: [what they're thinking or feeling before they encounter this piece — the pre-existing belief or problem this copy must meet them in]

OBJECTIVE: [what this specific piece must achieve — not a vague goal like "awareness" but a specific shift: "move someone from 'I've heard of them' to 'I need to try this'"]

SINGLE-MINDED PROPOSITION: [one sentence — the single irreducible truth this copy must land. Not a tagline. A strategic insight distilled to its most persuasive form, drawn from brand positioning/brand_identity]

PROOF POINTS (use 2-3):
• [RTB drawn from brand DNA, product catalog, brand story, or brand standards — specific and verifiable]
• [RTB 2]
• [RTB 3 if applicable]

VOICE DIRECTION:
Tone: [specific tone descriptor from tone_of_voice — e.g., "confident and direct, warm but never casual, authoritative without jargon"]
Write like: [positive analogy — who would this brand sound like if it were a person?]
Not like: [negative analogy — what voice to actively avoid]
Preferred words: [4-8 specific words/phrases from brand glossary or brand_standards]
Avoid: [specific words/phrases that contradict brand voice, drawn from forbidden_combinations or tone_guidelines]

FORMAT:
Word count: [specific range appropriate for {{content_type}} on {{platform}}]
Structure: [e.g., "hook (1 punchy sentence) → problem (2 sentences) → brand-specific resolution (2 sentences) → CTA"]
Mandatory inclusions: [brand name placement, required CTA, any compliance requirements from directives]

EMOTIONAL ARC: Reader enters feeling [X] → copy creates [shift or tension] → reader exits feeling [desired state] and does [desired action]

DO NOT: [3-5 hard no-gos drawn from brand directives, forbidden_combinations, governance rules, or tone_guidelines — be specific]

Variable fields MUST include:
- platform: select with options drawn from brand's actual channels (e.g., LinkedIn, Instagram, Email, Display Ad, OOH Billboard, TikTok, Print — use only channels relevant to this brand)
- content_type: select with options relevant to this brand (e.g., Headline + Tagline, Social Caption, Email Subject + Preview, Body Copy, CTA, Long-form Article, Product Description)
- audience: select if the brand has multiple audience segments; options drawn from brand_identity or positioning_framework
- tone_variation: select if brand has distinct tone modes (e.g., "Inspirational", "Educational", "Promotional") drawn from tone_of_voice or social_media_voice

═══════════════════════════════════════════════
BRAND-VOICE TEMPLATE (use for ALL "brand-voice" category starters)
═══════════════════════════════════════════════
The prompt_template for a "brand-voice" starter IS a deployable AI system prompt — ready to paste into Gemini, Claude, or ChatGPT before writing any copy. It must be 300-500 words and follow this exact structure, populated entirely from the brand context above:

You are a copywriter for [Brand Name], [2-sentence brand positioning description drawn from brand_identity, brand_story, or positioning_framework].

BRAND VOICE
[Brand voice descriptor from brand_voice field or tone_of_voice]. Every sentence you write for this brand should feel [positive adjective] and [positive adjective], never [negative adjective] or [negative adjective].

VOICE PILLARS
[Pillar 1 Name — draw from personality_mood_descriptors or tone_of_voice]: [1-sentence definition of this voice quality and what it means in practice].
  ✓ Sound like this: "[original example sentence written in this brand's voice — vivid, specific, not generic]"
  ✗ Not like this: "[counter-example showing exactly what to avoid — equally specific]"

[Pillar 2 Name]: [1-sentence definition].
  ✓ Sound like this: "[example]"
  ✗ Not like this: "[counter-example]"

[Pillar 3 Name]: [1-sentence definition].
  ✓ Sound like this: "[example]"
  ✗ Not like this: "[counter-example]"

VOCABULARY
Use: [10-15 specific words and short phrases from brand glossary, brand_standards, or brand_voice — words this brand actually owns]
Avoid: [10-15 specific words/phrases that contradict this brand's voice — pull from forbidden_combinations, tone_guidelines, or competitive_landscape context]

GRAMMAR & STYLE
[5-7 specific rules drawn from writer_guidelines — examples: sentence length preference ("Short sentences. Declarative. No filler."), punctuation conventions, capitalization rules, number formatting, Oxford comma stance, em dash vs. parenthetical preference]

TONE BY CHANNEL
- Short-form social (Instagram/TikTok): [how voice adapts — what changes, what stays constant]
- Professional social (LinkedIn): [adaptation]
- Email: [adaptation]
- Long-form/thought leadership: [adaptation]
- Advertising and OOH: [adaptation]

YOU ARE WRITING: {{content_type}} for {{audience}}

BEFORE YOU WRITE — internalize this brand's positioning: [brand's core positioning statement or single-minded proposition drawn from positioning_framework, brand_standards, or brand_identity. This is the strategic anchor every piece of copy must connect back to.]

Variable fields MUST include:
- content_type: select with options (Social Caption, Email Campaign, Ad Headline + Body, Blog Post / Article, Executive Thought Leadership, Product Description, Press Release, Pitch Deck Copy, Video Script)
- audience: select if brand has multiple segments; options drawn from brand context
- platform: select (LinkedIn, Instagram, Email, Website, OOH, Video, Print)

Return a JSON array of objects with this schema:
[
  {
    "name": "Short Evocative Name",
    "description": "When to use this starter — one sentence",
    "category": "one of: product, lifestyle, campaign, social, hero, editorial, cinematography, copy, brand-voice",
    "prompt_template": "Visual starters: 2-4 sentences. Copy starters: full 150-300 word brief using COPY BRIEF TEMPLATE. Brand-voice starters: full 300-500 word system prompt using BRAND-VOICE TEMPLATE. Use {{variable_key}} syntax for all user-selectable values.",
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

    const userPrompt = `Generate Director Mode Quick Starters for "${brand.name}". Visual starters should feel hand-crafted by a creative director who deeply understands the brand. Copy starters must be complete agency-grade creative briefs — use every relevant detail from the brand context (tone_of_voice, brand_standards, writer_guidelines, glossary, positioning_framework, personality_mood_descriptors) to populate the structured templates. Brand-voice starters must be complete, deployable AI system prompts with real voice pillars, paired do/don't examples, and vocabulary drawn from the brand's actual language. No generic filler.`;

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
