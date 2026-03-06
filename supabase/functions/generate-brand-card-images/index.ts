// ABOUTME: Generates stylized 3D icon images for Creative Studio brand welcome cards
// ABOUTME: Uses Gemini image generation with brand-specific color interpolation

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

// ── Brand data shape (subset fetched from creative_studio_brands) ─────────

interface BrandData {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  color_palette?: string[];
  brand_category?: string;
  visual_identity?: string;
  card_images?: Record<string, string>;
  card_image_prompts?: Record<string, string>;
}

// ── Default prompt builders per card key ──────────────────────────────────
// Each produces a stylized 3D icon on a dark background — bold, centered,
// minimal detail, readable at 100×100px. Brand colors are interpolated.

const CARD_PROMPT_BUILDERS: Record<
  string,
  (b: BrandData) => string
> = {
  brand_dna: (b) =>
    `A stylized 3D icon of a glowing DNA double helix rendered in ${b.primary_color} and ${b.secondary_color} against a dark charcoal (#1a1a2e) background. The helix strands are luminous with a subtle ambient glow. Clean, minimal, modern icon style — like a premium app icon or game asset. Single centered subject with generous negative space. No text, no additional elements, no busy backgrounds. Bold enough to read clearly at 100×100 pixels. Soft studio lighting from above.`,

  ai_guidelines: (b) =>
    `A stylized 3D icon of a crystalline shield with a subtle geometric checkmark pattern embossed on the surface, rendered in ${b.primary_color} with ${b.secondary_color} edge highlights against a dark charcoal (#1a1a2e) background. The shield has a polished glass-like surface with subtle refraction. Clean, minimal, modern icon style — like a premium app icon. Single centered subject with generous negative space. No text, no logos. Bold and readable at small sizes. Soft studio lighting.`,

  generation_prompt: (b) =>
    `A stylized 3D icon of a magic wand with luminous sparkle particles trailing from its tip, rendered in ${b.primary_color} and ${b.secondary_color} against a dark charcoal (#1a1a2e) background. The sparkles form a subtle arc pattern. Clean, minimal, modern icon style — like a premium app icon. Single centered subject with generous negative space. No text, no additional elements. The sparkles use the brand colors with varying opacity. Soft studio lighting from above.`,

  templates: (b) =>
    `A stylized 3D icon of three overlapping layout cards or panels stacked at slight angles, rendered in ${b.primary_color} and ${b.secondary_color} against a dark charcoal (#1a1a2e) background. Each card has subtle grid lines suggesting template structure. Clean, minimal, modern icon style — like a premium app icon. Single centered subject with generous negative space. No text. The cards have a polished matte finish with soft shadows between layers. Soft studio lighting.`,

  brand_agent: (b) =>
    `A stylized 3D icon of a friendly AI assistant — an abstract geometric face or head shape with two softly glowing circular eyes, rendered in ${b.primary_color} and ${b.secondary_color} against a dark charcoal (#1a1a2e) background. The design is approachable and intelligent, not robotic. Clean, minimal, modern icon style — like a premium app icon. Single centered subject with generous negative space. No text. Subtle ambient glow around the head shape. Soft studio lighting.`,
};

const ALL_CARD_KEYS = Object.keys(CARD_PROMPT_BUILDERS);
const ASPECT_RATIO = "1:1";

// ── Gemini image generation ──────────────────────────────────────────────

async function generateImage(prompt: string): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio: ASPECT_RATIO },
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

    const { brand_id, card_keys: requestedKeys } = await req.json().catch(
      () => ({ brand_id: null, card_keys: null }),
    );

    if (!brand_id) {
      return new Response(
        JSON.stringify({ error: "brand_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch brand data
    const { data: brand, error: brandErr } = await supabase
      .from("creative_studio_brands")
      .select(
        "id, name, primary_color, secondary_color, color_palette, brand_category, visual_identity, card_images, card_image_prompts",
      )
      .eq("id", brand_id)
      .single();

    if (brandErr || !brand) {
      return new Response(
        JSON.stringify({ error: `Brand not found: ${brandErr?.message}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const brandData = brand as unknown as BrandData;
    const keysToGenerate: string[] = requestedKeys || ALL_CARD_KEYS;

    const results: Record<string, { status: string; url?: string; error?: string }> = {};

    for (const key of keysToGenerate) {
      const promptBuilder = CARD_PROMPT_BUILDERS[key];
      if (!promptBuilder) {
        results[key] = { status: "skipped", error: "No prompt defined for key" };
        continue;
      }

      // Use custom prompt override if set, otherwise build from default
      const prompt = brandData.card_image_prompts?.[key] || promptBuilder(brandData);

      console.log(`Generating card image for ${brandData.name} / ${key}...`);
      const startTime = Date.now();

      try {
        const base64 = await generateImage(prompt);
        if (!base64) {
          results[key] = { status: "failed", error: "No image from Gemini" };
          continue;
        }

        const generationTimeMs = Date.now() - startTime;

        // Upload to storage
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const filePath = `brand-cards/${brand_id}/${key}-${Date.now()}.png`;

        const { error: uploadErr } = await supabase.storage
          .from("media")
          .upload(filePath, bytes, {
            contentType: "image/png",
            upsert: false,
          });

        if (uploadErr) {
          results[key] = { status: "upload_failed", error: uploadErr.message };
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("media").getPublicUrl(filePath);

        // Track in creative_studio_generations for history & admin
        const title = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase());

        await supabase.from("creative_studio_generations").insert({
          user_id: null,
          brand_id,
          generation_type: "brand_card",
          model_used: MODEL,
          prompt_text: prompt,
          parameters: {
            original_prompt: `Brand card: ${brandData.name} / ${key}`,
            aspectRatio: ASPECT_RATIO,
            cardKey: key,
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
          folderPath: "/AI Generated/Brand Cards",
          title: `${brandData.name} — ${title}`,
          autoTags: ["ai-generated", "brand-card", key],
          customMetadata: {
            source: "brand-card-generator",
            brandId: brand_id,
            cardKey: key,
            model_used: MODEL,
          },
        });

        results[key] = { status: "success", url: publicUrl };
        console.log(`✓ ${key} → ${publicUrl} (${generationTimeMs}ms)`);
      } catch (err) {
        results[key] = { status: "error", error: String(err) };
      }
    }

    // Merge successful URLs into brand's card_images column
    const newImages: Record<string, string> = {};
    for (const [key, result] of Object.entries(results)) {
      if (result.status === "success" && result.url) {
        newImages[key] = result.url;
      }
    }

    if (Object.keys(newImages).length > 0) {
      const merged = {
        ...((brandData.card_images as Record<string, string>) || {}),
        ...newImages,
      };

      await supabase
        .from("creative_studio_brands")
        .update({ card_images: merged })
        .eq("id", brand_id);
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
