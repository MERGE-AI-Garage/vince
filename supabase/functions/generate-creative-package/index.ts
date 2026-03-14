// ABOUTME: Generates a complete creative package using Gemini interleaved output.
// ABOUTME: Returns alternating text (headlines, copy) and images in a single API response.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { GoogleGenAI } from 'https://esm.sh/@google/genai@1.0.0';
import { registerMediaImage } from '../_shared/media-registration.ts';
import { getEmbedding } from '../_shared/embedding-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type DeliverableType =
  | 'linkedin_post'
  | 'product_shot_with_text'
  | 'social_story'
  | 'display_banner'
  | 'email_header'
  | 'tiktok_reel'
  | 'instagram_feed_portrait'
  | 'print_full_page'
  | 'print_ooh_billboard'
  | 'print_ooh_transit'
  | 'print_direct_mail'
  | 'print_collateral'
  | 'banner_leaderboard'
  | 'banner_skyscraper';

interface DeliverableTemplate {
  name: string;
  default_aspect_ratio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '4:5' | '8:1' | '1:4' | '2:3';
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
  tiktok_reel: {
    name: 'TikTok / Reels',
    default_aspect_ratio: '9:16',
    image_instructions: `Vertical TikTok/Reels-native format (9:16). Bold, immediate, hook-forward composition. Place a punchy 3–5 word hook in the upper safe zone (top 20%) in large, high-contrast typography — white or brand color with a subtle drop shadow. The central visual is the hero: a single powerful image, product, or person that commands attention. Reserve the bottom safe zone (bottom 20%) for the brand logo and a short CTA. The overall aesthetic should feel native to the For You Page — raw energy, high contrast, scroll-stopping. No busy backgrounds. No stock-photo feel.`,
    copy_instructions: `Write a 1-sentence TikTok hook (under 10 words), the 3–5 word on-screen text overlay, and 3–5 relevant hashtags. Return these as the text block BEFORE the image.`,
  },
  instagram_feed_portrait: {
    name: 'Instagram Feed (Portrait)',
    default_aspect_ratio: '4:5',
    image_instructions: `Instagram feed portrait format (4:5). Optimized for maximum organic reach — the dominant crop in the Instagram feed. The subject (product, person, or lifestyle visual) is centered and fills the frame with breathing room on the sides. Lower third contains a subtle brand color wash or gradient overlay with the brand logo placed cleanly above it. Optional: render a 2–4 word brand or campaign tagline in refined brand typography in the lower third. Composition should feel aspirational, editorial, and native to a premium Instagram feed — not ad-like.`,
    copy_instructions: `Write an Instagram caption: a 1-sentence lead (hook), 2–3 sentences of brand storytelling, and a closing CTA. Include 5–8 hashtags at the end. Return this as the text block BEFORE the image.`,
  },
  print_full_page: {
    name: 'Print Ad — Full Page',
    default_aspect_ratio: '3:4',
    image_instructions: `Full-page magazine advertisement composition. Professional studio photography aesthetic. Single dominant visual with generous white space for headline placement. CMYK-safe color palette — avoid neon or oversaturated hues that don't reproduce in print. Rich shadow and highlight detail, tonal range suitable for offset printing. No text overlaid — leave a clear zone for headline at the top and body copy at the bottom third. Ultra-high detail, large-format print production quality.`,
    copy_instructions: `Write a magazine ad: one powerful 5–7 word headline, one 10–15 word subheadline, one 15–20 word body line, one CTA phrase (3–5 words). Tone: authoritative, aspirational. Return these as the text block BEFORE the image.`,
  },
  print_ooh_billboard: {
    name: 'OOH — Billboard',
    default_aspect_ratio: '16:9',
    image_instructions: `Outdoor billboard advertisement designed to be read at 60mph from 300 feet. Bold, high-contrast composition with a single dominant visual — no clutter. Maximum three words of text rendered in the design, extremely large and legible. High-brightness colors, strong silhouettes, and deep contrast. CMYK-safe color palette. Ultra-high detail for large-format outdoor printing. The composition must work at massive scale: nothing small, nothing subtle.`,
    copy_instructions: `Write billboard copy: a 3–5 word headline (must work at large scale, read in under 3 seconds), a 2–3 word tagline or CTA, and the brand name. Nothing else — billboards live or die on brevity. Return these as the text block BEFORE the image.`,
  },
  print_ooh_transit: {
    name: 'OOH — Transit Shelter',
    default_aspect_ratio: '2:3',
    image_instructions: `Transit shelter advertisement in vertical format, viewed by pedestrians at street level from 5–10 feet away. Strong vertical visual hierarchy: bold visual filling the top half, clear message zone in the bottom half. High contrast for daylight and nighttime readability. CMYK-safe color palette with print-production detail. The composition should feel direct and human — this is street-level communication, not broadcasting from a distance.`,
    copy_instructions: `Write transit ad copy: a 5–8 word headline, one 10–15 word supporting line, and one CTA. Approachable, human tone. Return these as the text block BEFORE the image.`,
  },
  print_direct_mail: {
    name: 'Direct Mail',
    default_aspect_ratio: '4:3',
    image_instructions: `Direct mail postcard front in horizontal format. Immediate visual impact — this piece must stand out in a stack of mail. Warm, inviting composition with a product or lifestyle hero as the dominant visual. Leave a clear zone for headline overlay text in the upper or lower third. High-quality print aesthetic, CMYK-safe, suitable for offset or digital print production.`,
    copy_instructions: `Write direct mail copy: an attention-grabbing 5–7 word headline, one 15–20 word offer statement, and one CTA with urgency. Conversational, benefit-forward tone. Return these as the text block BEFORE the image.`,
  },
  print_collateral: {
    name: 'Collateral — Sell Sheet',
    default_aspect_ratio: '3:4',
    image_instructions: `Corporate collateral cover — brochure, sell sheet, or folder insert. Clean, professional composition. Brand colors are dominant throughout. Subtle texture or gradient background adds depth without clutter. Clear space for document title text in the top third and brand logo in the bottom right. Premium print quality, CMYK-safe, rich tonal detail suitable for offset printing.`,
    copy_instructions: `Write collateral cover copy: a document title (3–5 words), one 8–12 word value proposition line, and the brand name/tagline. Tone: confident, professional, trustworthy. Return these as the text block BEFORE the image.`,
  },
  banner_leaderboard: {
    name: 'Banner — Leaderboard',
    default_aspect_ratio: '8:1',
    image_instructions: `IAB 728×90 leaderboard display ad (8:1 extreme horizontal format). Three-zone layout: brand logo and product visual on the left third, headline text in the center third in bold brand typography, CTA button on the right third with contrasting brand color fill. High contrast background using the brand's primary or secondary color. Text must be large enough to read at screen size — no fine print. Clean, ad-ready composition with clear visual hierarchy.`,
    copy_instructions: `Write a 4–6 word headline and a 2–3 word CTA button label. Return these as the text block BEFORE the image.`,
  },
  banner_skyscraper: {
    name: 'Banner — Skyscraper',
    default_aspect_ratio: '1:4',
    image_instructions: `IAB 160×600 wide skyscraper display ad (1:4 extreme vertical format). Three-zone vertical stack: brand logo at top with adequate padding, a product or lifestyle visual filling the wide middle section, CTA button at the bottom in a contrasting brand color with the CTA text rendered inside. Background uses the brand's primary color or a clean neutral. Text elements must be large enough to read comfortably — the column format demands bold, legible typography. Professional, ad-ready.`,
    copy_instructions: `Write a 3–5 word headline and a 2–3 word CTA button label. Return these as the text block BEFORE the image.`,
  },
};

interface DeliverableSpec {
  name?: string;
  description?: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '4:5' | '8:1' | '1:4' | '2:3';
  deliverable_type?: DeliverableType;
}

interface PackageRequest {
  brand_id: string;
  brief: string;
  deliverables?: DeliverableSpec[];
  system_context?: string;
  user_id?: string;
  reference_image_urls?: string[];
  pre_generated_image_url?: string;
}

interface PackagePart {
  type: 'text' | 'image';
  content?: string;
  image_base64?: string;
  mime_type?: string;
  image_url?: string;
}

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const mimeType = contentType.split(';')[0].trim();
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return { data: btoa(binary), mimeType };
  } catch {
    return null;
  }
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
    const { brand_id, brief, deliverables, system_context, reference_image_urls, pre_generated_image_url } = body;
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

    // Invisible RAG: fetch relevant brand memory rules for the requested deliverable types
    let memoryRules = '';
    try {
      const deliverableTypes = (deliverables && deliverables.length > 0)
        ? deliverables.map(d => d.deliverable_type || d.name || '').filter(Boolean).join(', ')
        : 'display banner, linkedin post, product shot';
      const autoQuery = `Visual style, photography rules, and compliance for ${deliverableTypes}`;
      const queryVector = await getEmbedding(apiKey, autoQuery, 'RETRIEVAL_QUERY');
      const { data: ragContext } = await supabase.rpc('match_brand_memory', {
        query_embedding: queryVector,
        match_threshold: 0.5,
        match_count: 3,
        p_brand_id: brand_id,
        p_category: null,
      });
      if (ragContext?.length) {
        memoryRules = '\n\nSTRICT BRAND RULES FROM MEMORY (enforce these exactly):\n' +
          ragContext.map((c: { content: string }) => c.content).join('\n');
      }
    } catch (ragErr) {
      // Non-fatal: proceed without memory rules if retrieval fails
      console.warn('[package] Brand memory retrieval failed:', ragErr);
    }

    const baseInstruction = system_context
      ? `${system_context}\n\n${brandContext}`
      : `You are Vince, an expert AI creative director for Vince. You generate complete creative packages — combining strategic copy with brand-aligned imagery in a single response.\n\n${brandContext}\n\nFor each deliverable, write the headline and body copy FIRST, then generate the corresponding image immediately after. The images must reflect the brand's visual identity, color palette, and photography style.`;
    const fullSystemInstruction = `${baseInstruction}${memoryRules}`;

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

    // Analyze reference images with Gemini Vision to extract text descriptions.
    // Injecting images as inlineData in the interleaved output request causes the model
    // to drop image generation — Vision analysis + text description is the reliable path.
    if (reference_image_urls && reference_image_urls.length > 0) {
      console.log(`[generate-creative-package] Analyzing ${reference_image_urls.length} reference image(s) via Vision`);
      const descriptions: string[] = [];
      for (const url of reference_image_urls) {
        const img = await fetchImageAsBase64(url);
        if (!img) continue;
        try {
          const visionAi = new GoogleGenAI({ apiKey });
          const visionRes = await visionAi.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{
              role: 'user',
              parts: [
                { inlineData: { mimeType: img.mimeType, data: img.data } },
                { text: 'Describe this image concisely for use as a subject reference in image generation. If it shows a person, describe their physical appearance (hair color and style, eye color if visible, skin tone, approximate age, build, attire, expression). If it shows a logo or product, describe the visual elements precisely. Be specific and visual — 2-4 sentences.' },
              ],
            }],
          });
          const desc = visionRes.candidates?.[0]?.content?.parts?.[0]?.text;
          if (desc) descriptions.push(desc.trim());
        } catch (visionErr) {
          console.warn('[generate-creative-package] Vision analysis failed for reference image:', visionErr);
        }
      }
      if (descriptions.length > 0) {
        const subjectBlock = descriptions.map((d, i) => `Reference subject ${i + 1}: ${d}`).join('\n');
        deliverablePrompt = `SUBJECT REFERENCE:\n${subjectBlock}\n\nFeature the above subject(s) as the primary visual in all generated images. Match the described appearance closely.\n\n${deliverablePrompt}`;
      }
    }

    const ai = new GoogleGenAI({ apiKey });
    const startTime = Date.now();
    const parts: PackagePart[] = [];
    const imageUrls: string[] = [];

    if (pre_generated_image_url) {
      // Copy-only path: user already has a generated image (e.g. from generate_headshot_scene).
      // Generate text copy with a fast text model, then attach the pre-generated image.
      console.log('[generate-creative-package] pre_generated_image_url provided — generating copy only');
      const copyPrompt = deliverablePrompt + '\n\nGenerate only the written copy (headlines, body text, CTAs). Do NOT generate any images.';
      const copyResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: copyPrompt }] }],
        config: {
          responseModalities: ['TEXT'],
          systemInstruction: fullSystemInstruction,
        },
      });
      for (const part of copyResponse.candidates?.[0]?.content?.parts ?? []) {
        if (part.text) parts.push({ type: 'text', content: part.text });
      }
      parts.push({ type: 'image', image_url: pre_generated_image_url });
      imageUrls.push(pre_generated_image_url);
    } else {
    // Call Gemini with interleaved output
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [{ role: 'user', parts: [{ text: deliverablePrompt }] }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        systemInstruction: fullSystemInstruction,
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error('No content in Gemini response');
    }

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
              createdBy: userId,
              autoTags: ['creative-studio', 'ai-generated', 'creative-package'],
              customMetadata: {
                generation_type: 'creative_package',
                brand_id,
                brand_name: brand.name,
              },
              modelUsed: 'gemini-3.1-flash-image-preview',
            }).catch(err => console.error('[generate-creative-package] Media registration failed:', err));
          }
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          // Keep base64 as fallback
        }
      }
    }
    } // end else (full interleaved generation path)

    const latencyMs = Date.now() - startTime;
    const ASPECT_RATIO_NAMES: Record<string, string> = {
      '16:9': 'Widescreen',
      '9:16': 'Vertical',
      '1:1': 'Square',
      '4:3': 'Standard',
      '3:4': 'Portrait',
      '4:5': 'Instagram Portrait',
      '8:1': 'Leaderboard Banner',
      '1:4': 'Skyscraper Banner',
    };
    const deliverableNames = resolvedDeliverables.length > 0
      ? resolvedDeliverables.map((d, i) => {
          if (d.name) return d.name;
          // Infer a short name from the first few words of the description
          if (d.description) {
            const firstLine = d.description.replace(/\n.*/s, '').trim();
            const words = firstLine.split(/\s+/).slice(0, 3).join(' ');
            if (words.length > 2) return words;
          }
          // Fall back to a human-readable name derived from the aspect ratio
          if (d.aspect_ratio && ASPECT_RATIO_NAMES[d.aspect_ratio]) {
            return ASPECT_RATIO_NAMES[d.aspect_ratio];
          }
          return `Deliverable ${i + 1}`;
        })
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
    if (insertError) console.error('[generate-creative-package] Generation record insert failed:', insertError.code, insertError.message, { user_id: userId, brand_id });

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
