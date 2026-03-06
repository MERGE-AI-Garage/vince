// ABOUTME: Generates a complete creative package using Gemini interleaved output.
// ABOUTME: Returns alternating text (headlines, copy) and images in a single API response.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { GoogleGenAI } from 'https://esm.sh/@google/genai@1.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeliverableSpec {
  name: string;
  description: string;
  aspect_ratio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

interface PackageRequest {
  brand_id: string;
  brief: string;
  deliverables?: DeliverableSpec[];
  system_context?: string;
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

    const { brand_id, brief, deliverables, system_context } = await req.json() as PackageRequest;
    if (!brand_id || !brief) throw new Error('brand_id and brief are required');

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

    // Build the deliverables prompt
    let deliverablePrompt = brief;
    if (deliverables && deliverables.length > 0) {
      deliverablePrompt += '\n\nGenerate the following deliverables:\n';
      deliverables.forEach((d, i) => {
        deliverablePrompt += `${i + 1}. ${d.name}: ${d.description} (${d.aspect_ratio} format)\n`;
      });
      deliverablePrompt += '\nFor each deliverable, write the creative copy first, then generate the image.';
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
          }
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          // Keep base64 as fallback
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        brand_name: brand.name,
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
