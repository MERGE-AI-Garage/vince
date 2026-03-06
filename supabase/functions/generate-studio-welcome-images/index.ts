// ABOUTME: Generates stylized 3D icon images for Creative Studio system welcome cards
// ABOUTME: Uses Gemini image generation with MERGE brand colors for the 8 capability cards + hero

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
 * MERGE brand context (same palette as guidelines images):
 * - Primary: dark green #133B34, viridian #00856C
 * - Accent: electrolight green #1ED75F
 * - Warm gray #EAE8E3
 * - Aesthetic: modern tech-agency sophistication
 */

const SECTION_PROMPTS: Record<string, { prompt: string; aspectRatio: string }> =
  {
    hero: {
      prompt: `Professional editorial photograph: A sweeping modern creative studio command center with three ultrawide curved displays showing abstract generative AI visualizations — flowing color gradients, geometric wireframes, and luminous particle effects in viridian green (#00856C) and teal. Clean brushed-aluminum desk, matte dark concrete walls. Soft ambient LED lighting with subtle green accent strips. The scene conveys multi-model creative power and brand-aware AI generation. Wide cinematic composition. No people, no text, no logos. Color palette: dark green (#133B34), viridian (#00856C), warm gray (#EAE8E3), subtle electrolight green accents. Premium and contemporary.`,
      aspectRatio: "16:9",
    },

    image_generation: {
      prompt: `A stylized 3D icon of a luminous paintbrush leaving a trail of glowing pixels and light particles, rendered in viridian green (#00856C) and electrolight green (#1ED75F) against a dark charcoal (#1a1a2e) background. The brush stroke transforms into a cascade of colorful geometric shapes suggesting image creation. Clean, minimal, modern icon style — like a premium app icon or game asset. Single centered subject with generous negative space. No text, no additional elements. Bold enough to read clearly at 100×100 pixels. Soft studio lighting from above.`,
      aspectRatio: "1:1",
    },

    video_generation: {
      prompt: `A stylized 3D icon of a film clapperboard with flowing motion lines and luminous frame strips extending from it, rendered in viridian green (#00856C) and teal (#0D9488) against a dark charcoal (#1a1a2e) background. The motion lines suggest dynamic video creation. Clean, minimal, modern icon style — like a premium app icon. Single centered subject with generous negative space. No text, no additional elements. Bold enough to read clearly at 100×100 pixels. Soft studio lighting from above.`,
      aspectRatio: "1:1",
    },

    editing_suite: {
      prompt: `A stylized 3D icon of precision scissors cutting through a luminous image plane, with geometric fragments floating away and reforming into a new composition, rendered in viridian green (#00856C) and warm gray (#EAE8E3) against a dark charcoal (#1a1a2e) background. Clean, minimal, modern icon style — like a premium app icon. Single centered subject with generous negative space. No text, no additional elements. Bold and readable at small sizes. Soft studio lighting.`,
      aspectRatio: "1:1",
    },

    upscaling: {
      prompt: `A stylized 3D icon of a magnifying glass with a grid of pixels inside it, where the pixels are transforming from blurry/large to crisp/detailed, rendered in viridian green (#00856C) and electrolight green (#1ED75F) against a dark charcoal (#1a1a2e) background. Glowing enhancement rays emanate from the lens. Clean, minimal, modern icon style — like a premium app icon. Single centered subject with generous negative space. No text. Soft studio lighting.`,
      aspectRatio: "1:1",
    },

    product_recontext: {
      prompt: `A stylized 3D icon of a product box or package hovering above a glowing scene-generation platform, with luminous environment rays projecting outward suggesting scene creation, rendered in viridian green (#00856C) and warm teal against a dark charcoal (#1a1a2e) background. Clean, minimal, modern icon style — like a premium app icon. Single centered subject with generous negative space. No text. Soft studio lighting from above.`,
      aspectRatio: "1:1",
    },

    virtual_tryon: {
      prompt: `A stylized 3D icon of a clothing hanger with a flowing fabric garment that has a subtle digital grid pattern, suggesting AI-powered virtual fitting, rendered in viridian green (#00856C) and soft teal against a dark charcoal (#1a1a2e) background. The fabric has a luminous edge glow. Clean, minimal, modern icon style — like a premium app icon. Single centered subject with generous negative space. No text. Soft studio lighting.`,
      aspectRatio: "1:1",
    },

    conversational_editing: {
      prompt: `A stylized 3D icon of two overlapping speech bubbles, one containing a small image canvas and the other containing a luminous cursor or wand, rendered in viridian green (#00856C) and electrolight green (#1ED75F) against a dark charcoal (#1a1a2e) background. Suggests back-and-forth creative dialogue. Clean, minimal, modern icon style — like a premium app icon. Single centered subject with generous negative space. No text. Soft studio lighting.`,
      aspectRatio: "1:1",
    },

    camera_controls: {
      prompt: `A stylized 3D icon of a camera lens with concentric aperture blades partially open, showing a luminous focal point in the center, rendered in viridian green (#00856C) and warm gray (#EAE8E3) against a dark charcoal (#1a1a2e) background. Subtle depth-of-field bokeh circles around the edges. Clean, minimal, modern icon style — like a premium app icon. Single centered subject with generous negative space. No text. Soft studio lighting.`,
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
