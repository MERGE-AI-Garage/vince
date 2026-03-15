// ABOUTME: Generates editorial-quality images for Creative Studio system welcome cards
// ABOUTME: Uses Gemini image generation for the 8 capability cards + hero welcome image

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { registerMediaImage } from "../_shared/media-registration.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "gemini-3-pro-image-preview";

/*
 * Brand color context:
 * - Primary dark: #0D1B16 (deep forest green)
 * - Viridian: #00856C
 * - Accent: #1ED75F (electrolight green)
 * - Aesthetic: premium, editorial, Apple/Google campaign quality
 *
 * Image style direction for all cards:
 * - Show the OUTPUT or result of the capability — not an abstract icon
 * - Editorial photography aesthetic: Apple or Google product campaign quality
 * - No 3D cartoon objects, no floating geometry, no literal tech metaphors
 * - No text overlays, no UI chrome, no watermarks
 * - Clean composition with intentional negative space
 * - Lighting: either soft studio or dramatic editorial
 */

const SECTION_PROMPTS: Record<string, { prompt: string; aspectRatio: string }> =
  {
    hero: {
      prompt: `Abstract color-field fine art photograph: deep emerald green shadows dissolving into warm charcoal black, with a single luminous viridian shaft of light cutting diagonally through the frame. Painterly quality, like a Rothko color study translated to photography. No people, no objects, no text, no technology. Pure mood — creative possibility in darkness. Aspect ratio wide. Soft gradients, rich shadow detail, subtle green (#00856C) and electrolight green (#1ED75F) as color accents. Premium, contemporary, like a Peloton or Apple campaign backdrop. Full bleed.`,
      aspectRatio: "16:9",
    },

    image_generation: {
      prompt: `Editorial portrait photography: an ultra-sharp, high-fashion studio portrait of a woman with striking bone structure, dramatic side lighting, deep shadow on one side of the face, catchlights in the eyes. Flawless skin texture visible, subtle green-tinted rim light. Clean charcoal gray seamless backdrop. Shallow depth of field, Canon 85mm f/1.2 quality. The image demonstrates flawless AI image generation — photorealistic, technically perfect. No text, no UI, no logos. Apple product campaign aesthetic. Square format.`,
      aspectRatio: "1:1",
    },

    video_generation: {
      prompt: `Cinematic still frame from a high-budget short film: a lone figure silhouetted against a massive emerald green aurora borealis over a dramatic Nordic fjord landscape at night. Ultra-wide lens, anamorphic flare, deep shadow foreground, luminous sky. Rich color grading — deep teals and electric greens. Film grain texture. Composition like a Malick film or an Apple TV cinematic trailer. No text, no UI, no branding. Square format, full bleed.`,
      aspectRatio: "1:1",
    },

    editing_suite: {
      prompt: `Editorial split-composition photograph: left half shows a raw, flat, slightly underexposed street photograph of a city alley — desaturated and gray. Right half shows the same scene precision-edited: rich contrast, vibrant emerald and amber tones, sharp detail pulled from shadows, cinematic color grade. A clean hairline divides the two halves. The result communicates precision image editing power. No text, no UI elements. Square format, clean professional aesthetic.`,
      aspectRatio: "1:1",
    },

    upscaling: {
      prompt: `Extreme macro close-up editorial photograph: a luxury watch face, shot at 1:1 macro scale. The rhodium-plated indices gleam with razor-sharp precision. Applied indices catch light perfectly. The grain of the guilloché dial pattern is exquisitely resolved — you can count every line. Depth of field is razor thin. Swiss watchmaking precision. Black and dark forest green background. Demonstrates hyper-detail upscaling capability. No text, no UI. Square format.`,
      aspectRatio: "1:1",
    },

    product_recontext: {
      prompt: `Premium product photography: a single dark green glass perfume bottle with a gold stopper, floating in a dreamlike underwater scene with soft emerald light rays filtering through water from above. The bottle is perfectly sharp, lit by soft caustic light patterns. Bubbles catch the light. Dark vignette edges, vivid viridian and deep teal tones. Shot like a Chanel or Tom Ford fragrance campaign. No text, no logos. Square format.`,
      aspectRatio: "1:1",
    },

    virtual_tryon: {
      prompt: `High-fashion editorial photography: a beautifully tailored forest-green structured blazer, photographed on a minimal off-white studio seamless backdrop. The blazer is the sole subject — perfectly draped, softly lit with a large softbox. Every stitch, texture, and lapel edge is crisp. Clean negative space. Shot like a luxury menswear campaign — Loro Piana or Brunello Cucinelli quality. No model needed — just the garment as hero. Square format.`,
      aspectRatio: "1:1",
    },

    conversational_editing: {
      prompt: `Minimal graphic design photograph: an elegant dark-mode UI fragment on a deep charcoal background. A single rounded chat bubble in viridian green (#00856C) sits at the top left, containing a one-line text prompt in clean white sans-serif. Below, a thumbnail preview shows a partially transformed photograph with a subtle green processing overlay. The composition is 70% negative space — dark, premium, intentional. No branding, no chrome, no labels. Square format.`,
      aspectRatio: "1:1",
    },

    camera_controls: {
      prompt: `Dramatic architectural photography: looking straight up at a modernist glass-and-steel skyscraper from directly below, ultra-wide 14mm fisheye perspective. The building's steel ribs converge toward a brilliant viridian-lit cloudy sky at center. Deep contrast, dark foreground columns, luminous top. Geometric perfection of perspective distortion. Shot like a Julius Shulman or Iwan Baan architectural image. Demonstrates advanced camera angle and perspective control. No text, no UI. Square format.`,
      aspectRatio: "1:1",
    },
  };

const ALL_KEYS = Object.keys(SECTION_PROMPTS);

// ── Gemini image generation ──────────────────────────────────────────────

async function generateImage(
  prompt: string,
  aspectRatio: string,
): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Gemini API error: ${response.status} — ${errText}`);
    return null;
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!parts) {
    console.error("No parts in Gemini response");
    return null;
  }

  for (const part of parts) {
    if (part.inlineData?.data) {
      return part.inlineData.data;
    }
  }

  console.error("No image data in response parts");
  return null;
}

// ── Main handler ─────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { sections: requestedSections } = await req.json().catch(() => ({
      sections: null,
    }));
    const sectionKeys: string[] = requestedSections || ALL_KEYS;

    const results: Record<
      string,
      { status: string; url?: string; error?: string }
    > = {};

    for (const key of sectionKeys) {
      const section = SECTION_PROMPTS[key];
      if (!section) {
        results[key] = { status: "skipped", error: "No prompt defined" };
        continue;
      }

      console.log(`Generating welcome image: ${key}...`);
      const startTime = Date.now();

      try {
        const base64 = await generateImage(section.prompt, section.aspectRatio);
        if (!base64) {
          results[key] = { status: "failed", error: "No image from Gemini" };
          continue;
        }

        const generationTimeMs = Date.now() - startTime;

        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const filePath = `studio-welcome/${key}-${Date.now()}.png`;

        const { error: uploadErr } = await supabase.storage
          .from("media")
          .upload(filePath, bytes, {
            contentType: "image/png",
            upsert: false,
          });

        if (uploadErr) {
          results[key] = {
            status: "upload_failed",
            error: uploadErr.message,
          };
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("media").getPublicUrl(filePath);

        const title = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase());

        await supabase.from("creative_studio_generations").insert({
          user_id: null,
          generation_type: "welcome_image",
          model_used: MODEL,
          prompt_text: section.prompt,
          parameters: {
            original_prompt: `Studio welcome: ${key}`,
            aspectRatio: section.aspectRatio,
            sectionKey: key,
          },
          output_urls: [publicUrl],
          status: "completed",
          generation_time_ms: generationTimeMs,
          metadata: {
            storage_path: `media/${filePath}`,
            file_size: bytes.length,
          },
          completed_at: new Date().toISOString(),
        });

        // Register in media library for discoverability
        await registerMediaImage({
          supabase,
          url: publicUrl,
          storagePath: `media/${filePath}`,
          filename: `${key}-${Date.now()}.png`,
          mimeType: "image/png",
          sizeBytes: bytes.length,
          folderPath: "/AI Generated/Welcome",
          title,
          description: section.prompt.substring(0, 200),
          autoTags: ["ai-generated", "studio-welcome", key],
          customMetadata: {
            source: "studio-welcome-generator",
            sectionKey: key,
            model_used: MODEL,
            aspectRatio: section.aspectRatio,
          },
          modelUsed: MODEL,
        });

        results[key] = { status: "success", url: publicUrl };
        console.log(`✓ ${key} → ${publicUrl} (${generationTimeMs}ms)`);
      } catch (err) {
        results[key] = { status: "error", error: String(err) };
      }
    }

    // Merge successful URLs into site_settings
    const imageUrls: Record<string, string> = {};
    for (const [key, result] of Object.entries(results)) {
      if (result.status === "success" && result.url) {
        imageUrls[key] = result.url;
      }
    }

    if (Object.keys(imageUrls).length > 0) {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "creative_studio_welcome_images")
        .single();

      const merged = {
        ...((existing?.value as Record<string, string>) || {}),
        ...imageUrls,
      };

      await supabase
        .from("site_settings")
        .upsert({
          key: "creative_studio_welcome_images",
          value: merged,
        });
    }

    return new Response(JSON.stringify({ results }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
