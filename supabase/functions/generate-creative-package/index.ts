// ABOUTME: Generates a complete creative package using Gemini interleaved output.
// ABOUTME: Returns alternating text (headlines, copy) and images in a single API response.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { GoogleGenAI } from 'https://esm.sh/@google/genai@1.0.0';
import { registerMediaImage } from '../_shared/media-registration.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type DeliverableType =
  | 'linkedin_post'
  | 'product_shot_with_text'
  | 'social_story'
  | 'display_banner'
  | 'email_header';

interface DeliverableTemplate {
  name: string;
  default_aspect_ratio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  image_instructions: string;
  copy_instructions: string;
}

const DELIVERABLE_TEMPLATES: Record<DeliverableType, DeliverableTemplate> = {
  linkedin_post: {
    name: 'LinkedIn Post',
    default_aspect_ratio: '4:3',
    image_instructions: `Professional marketing image suitable for LinkedIn. Include the brand logo subtly in a corner or along the bottom edge. Render a bold, concise headline in clean sans-serif typography in the upper portion of the image. Use the brand's primary color as an accent bar or background element at the bottom. The overall composition should feel polished and corporate-creative — not stock photography.`,
    copy_instructions: `Write a LinkedIn post (200–300 characters) with a strong hook, 2–3 value sentences, and a closing call-to-action or question. Return this as the text block BEFORE the image.`,
  },
  product_shot_with_text: {
    name: 'Product Shot',
    default_aspect_ratio: '1:1',
    image_instructions: `Clean product photography on a brand-appropriate surface or background. Render the product name or a 3–5 word headline in the brand's typographic style in the upper or lower third. Place the brand logo in a corner with adequate breathing room. The product should be the clear hero — text and logo are supporting elements, not competing.`,
    copy_instructions: `Write a 2–3 sentence product caption that highlights the key benefit and includes a CTA. Return this as the text block BEFORE the image.`,
  },
  social_story: {
    name: 'Social Story',
    default_aspect_ratio: '9:16',
    image_instructions: `Vertical social story format (9:16). Render a bold, punchy headline in the upper third in large brand typography. A hero visual fills the middle section. Render a short CTA or swipe-up prompt at the bottom in a contrasting brand color. Brand logo sits in the top corner. The design should feel native to Instagram or TikTok stories — bold, immediate, scroll-stopping.`,
    copy_instructions: `Write a 1-sentence hook and a 3–5 word CTA for the story overlay. Return this as the text block BEFORE the image.`,
  },
  display_banner: {
    name: 'Display Banner',
    default_aspect_ratio: '16:9',
    image_instructions: `Horizontal display advertising banner. Clean, high-contrast layout. Render a main headline in bold brand typography on the left or upper portion. Render a shorter subheadline below it. Include a CTA button shape with the CTA text rendered inside it in the lower right. Brand logo in the upper left corner. Background uses the brand's primary or secondary color palette. Professional, ad-ready composition.`,
    copy_instructions: `Write a headline (6–8 words), a subheadline (10–14 words), and a CTA button label (2–3 words). Return these as the text block BEFORE the image.`,
  },
  email_header: {
    name: 'Email Header',
    default_aspect_ratio: '3:4',
    image_instructions: `Email newsletter masthead image. Brand logo prominently placed at the top center or top left. Render the email campaign title or subject line in the brand's heading typography below the logo. A supporting visual or brand color background fills the lower portion. Clean, professional, optimized for email rendering — minimal complexity, high contrast.`,
    copy_instructions: `Write the email subject line (50 characters max) and a preview text snippet (90 characters max). Return these as the text block BEFORE the image.`,
  },
};

interface DeliverableSpec {
  name?: string;
  description?: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  deliverable_type?: DeliverableType;
}

interface PackageRequest {
  brand_id: string;
  brief: string;
  deliverables?: DeliverableSpec[];
  system_context?: string;
  user_id?: string;
}

interface PackagePart {
  type: 'text' | 'image';
  content?: string;
  image_base64?: string;
  mime_type?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    // Extract user_id from JWT for generation records
    let userId: string | null = null;
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub || null;
    } catch { /* non-critical */ }

    const body = await req.json() as PackageRequest;
    const { brand_id, brief, deliverables, system_context } = body;
    if (!brand_id || !brief) throw new Error('brand_id and brief are required');

    // Fallback: when called via service role (no JWT sub), use user_id from body
    if (!userId && body.user_id) userId = body.user_id;

    // Fetch brand data
    const { data: brand } = await supabase
      .from('creative_studio_brands')
      .select('name, slug, primary_color, secondary_color, color_palette, visual_identity, brand_voice, brand_category, quick_prompts')
      .eq('id', brand_id)
      .single();

    if (!brand) throw new Error('Brand not found');

    // Fetch brand visual profile if it exists
    const { data: profile } = await supabase
      .from('creative_studio_brand_profiles')
      .select('visual_dna, photography_style, color_profile, composition_rules, brand_identity, tone_of_voice')
      .eq('brand_id', brand_id)
      .maybeSingle();

    // Build brand context for system instruction
    const brandContext = buildBrandContext(brand, profile);
    const fullSystemInstruction = system_context
      ? `${system_context}\n\n${brandContext}`
      : `You are Vince, an expert AI creative director for Brand Lens. You generate complete creative packages — combining strategic copy with brand-aligned imagery in a single response.\n\n${brandContext}\n\nFor each deliverable, write the headline and body copy FIRST, then generate the corresponding image immediately after. The images must reflect the brand's visual identity, color palette, and photography style.`;

    // Default to 3 standard deliverables when none are specified
    const effectiveDeliverables = (deliverables && deliverables.length > 0) ? deliverables : [
      { deliverable_type: 'display_banner' as DeliverableType },
      { deliverable_type: 'linkedin_post' as DeliverableType },
      { deliverable_type: 'product_shot_with_text' as DeliverableType },
    ];

    // Resolve deliverable specs — apply templates when deliverable_type is set
    const resolvedDeliverables = effectiveDeliverables.map(d => {
      if (d.deliverable_type && DELIVERABLE_TEMPLATES[d.deliverable_type]) {
        const tmpl = DELIVERABLE_TEMPLATES[d.deliverable_type];
        return {
          name: d.name || tmpl.name,
          description: d.description
            ? `${d.description}\n\nImage: ${tmpl.image_instructions}\nCopy: ${tmpl.copy_instructions}`
            : `Image: ${tmpl.image_instructions}\nCopy: ${tmpl.copy_instructions}`,
          aspect_ratio: d.aspect_ratio || tmpl.default_aspect_ratio,
        };
      }
      return d as { name: string; description: string; aspect_ratio: string };
    });

    // Build the deliverables prompt
    let deliverablePrompt = brief;
    if (resolvedDeliverables.length > 0) {
      deliverablePrompt += '\n\nGenerate the following deliverables:\n';
      resolvedDeliverables.forEach((d, i) => {
        deliverablePrompt += `${i + 1}. ${d.name}: ${d.description} (${d.aspect_ratio} format)\n`;
      });
      deliverablePrompt += '\nFor each deliverable, write the creative copy first (as plain text), then immediately generate the corresponding image.';
    }

    // Call Gemini with interleaved output
    const ai = new GoogleGenAI({ apiKey });
    const startTime = Date.now();

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [{ role: 'user', parts: [{ text: deliverablePrompt }] }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        systemInstruction: fullSystemInstruction,
      },
    });

    const latencyMs = Date.now() - startTime;

    // Parse response parts
    const parts: PackagePart[] = [];
    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error('No content in Gemini response');
    }

    const imageUrls: string[] = [];

    for (const part of candidate.content.parts) {
      if (part.text) {
        parts.push({ type: 'text', content: part.text });
      } else if (part.inlineData) {
        const { data: base64, mimeType } = part.inlineData;
        parts.push({
          type: 'image',
          image_base64: base64,
          mime_type: mimeType,
        });

        // Upload to Supabase storage
        try {
          const ext = mimeType === 'image/png' ? 'png' : 'jpg';
          const filename = `packages/${brand.slug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

          const { error: uploadError } = await supabase.storage
            .from('creative-studio')
            .upload(filename, buffer, { contentType: mimeType, upsert: false });

          if (!uploadError) {
            const { data: publicUrl } = supabase.storage
              .from('creative-studio')
              .getPublicUrl(filename);
            imageUrls.push(publicUrl.publicUrl);
            // Replace base64 with URL in the part to reduce response size
            parts[parts.length - 1].image_base64 = undefined;
            parts[parts.length - 1].content = publicUrl.publicUrl;

            // Register in media library (non-blocking)
            registerMediaImage({
              supabase,
              url: publicUrl.publicUrl,
              storagePath: filename,
              filename: `${brand.slug}-package-${Date.now()}.${ext}`,
              mimeType,
              sizeBytes: buffer.length,
              folderPath: '/AI Generated/Brand Cards',
              title: `${brand.name} Creative Package`,
              autoTags: ['creative-studio', 'ai-generated', 'creative-package'],
              customMetadata: {
                generation_type: 'creative_package',
                brand_id,
                brand_name: brand.name,
              },
            }).catch(err => console.error('[generate-creative-package] Media registration failed:', err));
          }
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          // Keep base64 as fallback
        }
      }
    }

    const deliverableNames = resolvedDeliverables.length > 0
      ? resolvedDeliverables.map((d, i) => d.name || `Deliverable ${i + 1}`)
      : [];

    const brandAlignment = computeBrandAlignment(brand, profile);

    // Look up model_id for generation record (model_id may be NOT NULL in schema)
    const { data: modelRow } = await supabase
      .from('creative_studio_models')
      .select('id')
      .eq('model_id', 'gemini-3.1-flash-image-preview')
      .maybeSingle();

    // Record generation in history (always, even without a userId)
    const { error: insertError } = await supabase.from('creative_studio_generations').insert({
      user_id: userId || null,
      brand_id: brand_id || null,
      generation_type: 'creative_package',
      model_id: modelRow?.id || null,
      model_used: 'gemini-3.1-flash-image-preview',
      prompt_text: brief,
      status: 'completed',
      output_urls: imageUrls,
      completed_at: new Date().toISOString(),
      generation_time_ms: latencyMs,
      estimated_cost_usd: 0,
      parameters: { deliverable_count: resolvedDeliverables.length },
      metadata: { package: true, deliverable_names: deliverableNames },
    });
    if (insertError) console.error('[generate-creative-package] Generation record insert failed:', insertError.message);

    return new Response(
      JSON.stringify({
        success: true,
        brand_name: brand.name,
        brief,
        deliverable_names: deliverableNames,
        brand_alignment: brandAlignment,
        parts,
        image_urls: imageUrls,
        latency_ms: latencyMs,
        model: 'gemini-3.1-flash-image-preview',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Creative package error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

interface BrandAlignment {
  score: number;
  dimensions: {
    visual_identity: boolean;
    photography: boolean;
    color_system: boolean;
    brand_voice: boolean;
  };
}

function computeBrandAlignment(
  brand: Record<string, unknown>,
  profile: Record<string, unknown> | null,
): BrandAlignment {
  const hasVisualIdentity = !!(profile?.visual_dna &&
    typeof profile.visual_dna === 'object' &&
    Object.keys(profile.visual_dna as object).length > 0);

  const hasPhotography = !!(profile?.photography_style &&
    typeof profile.photography_style === 'object' &&
    Object.values(profile.photography_style as object).some(v => v));

  const hasColorSystem = !!(
    (brand.color_palette && Array.isArray(brand.color_palette) && (brand.color_palette as string[]).length > 0) ||
    brand.primary_color
  );

  const hasVoice = !!(
    (profile?.tone_of_voice &&
      typeof profile.tone_of_voice === 'object' &&
      (profile.tone_of_voice as Record<string, unknown>).personality) ||
    brand.brand_voice
  );

  const dimensionValues = [hasVisualIdentity, hasPhotography, hasColorSystem, hasVoice];
  const score = Math.round((dimensionValues.filter(Boolean).length / dimensionValues.length) * 100);

  return {
    score,
    dimensions: {
      visual_identity: hasVisualIdentity,
      photography: hasPhotography,
      color_system: hasColorSystem,
      brand_voice: hasVoice,
    },
  };
}

function buildBrandContext(brand: Record<string, unknown>, profile: Record<string, unknown> | null): string {
  const lines: string[] = [
    `## Brand: ${brand.name}`,
    `Category: ${brand.brand_category || 'General'}`,
    `Primary Color: ${brand.primary_color}`,
    `Secondary Color: ${brand.secondary_color}`,
  ];

  if (brand.color_palette) {
    const palette = brand.color_palette as string[];
    lines.push(`Full Palette: ${palette.join(', ')}`);
  }

  if (brand.visual_identity) {
    lines.push(`\nVisual Identity: ${brand.visual_identity}`);
  }

  if (brand.brand_voice) {
    lines.push(`Brand Voice: ${brand.brand_voice}`);
  }

  if (profile) {
    if (profile.visual_dna && typeof profile.visual_dna === 'object') {
      const dna = profile.visual_dna as Record<string, unknown>;
      if (dna.signature_style) lines.push(`\nSignature Style: ${dna.signature_style}`);
      if (dna.dos) lines.push(`Visual Dos: ${(dna.dos as string[]).join('; ')}`);
      if (dna.donts) lines.push(`Visual Don'ts: ${(dna.donts as string[]).join('; ')}`);
    }

    if (profile.photography_style && typeof profile.photography_style === 'object') {
      const photo = profile.photography_style as Record<string, string>;
      const photoLines = Object.entries(photo)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`);
      if (photoLines.length > 0) {
        lines.push(`\nPhotography Style:\n${photoLines.join('\n')}`);
      }
    }

    if (profile.tone_of_voice && typeof profile.tone_of_voice === 'object') {
      const tone = profile.tone_of_voice as Record<string, unknown>;
      if (tone.personality) lines.push(`Tone: ${tone.personality}`);
    }
  }

  return lines.join('\n');
}
