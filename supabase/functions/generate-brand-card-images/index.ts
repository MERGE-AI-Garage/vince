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

// ── Color palette helper ───────────────────────────────────────────────────
// Returns up to 3 distinct colors from the brand palette, deduplicated against
// primary and secondary. Used to produce more brand-accurate icon images.

function buildPaletteString(b: BrandData): string {
  const palette = b.color_palette ?? [];
  const used = new Set([b.primary_color.toLowerCase(), b.secondary_color.toLowerCase()]);
  const accents: string[] = [];
  for (const c of palette) {
    if (accents.length >= 2) break;
    if (!used.has(c.toLowerCase())) {
      accents.push(c);
      used.add(c.toLowerCase());
    }
  }
  const colors = [b.primary_color, b.secondary_color, ...accents];
  return colors.join(", ");
}

// ── Subject descriptions per card key ────────────────────────────────────
// Returns only the subject; the style suffix is appended at generation time.

const CARD_SUBJECTS: Record<string, string> = {
  brand_dna:          "Product photography, studio lighting. A DNA double helix icon — two intertwined strands with evenly spaced connecting rungs.",
  ai_guidelines:      "Product photography, studio lighting. A shield icon with a small checkmark centered on the face — clean rounded-top geometric form.",
  generation_prompt:  "Product photography, studio lighting. A magic wand icon with a small four-pointed star at its tip — tapered elegant form.",
  templates:          "Product photography, studio lighting. Three overlapping rectangular cards or panels slightly offset at depth — clean layered form suggesting reusable structure.",
  brand_agent:        "Product photography, studio lighting. A rounded square face form with two circular eyes and a subtle arc — abstract friendly AI agent icon.",
  art_direction:      "Product photography, studio lighting. A camera aperture iris — concentric precision blades forming a circular opening, like a lens diagram.",
};

// ── Image style presets ───────────────────────────────────────────────────
// Each preset is a suffix appended to the subject description.

type PromptStyle = "stacked_acrylic" | "laser_cut" | "murano_glass";

const STYLE_PRESETS: Record<PromptStyle, (b: BrandData) => string> = {
  stacked_acrylic: (b) => {
    const base = b.secondary_color || b.primary_color;
    return ` Built from 4 stacked laser-cut acrylic layers graduated from a deep dark variant of ${base} at the base to bright ${b.primary_color} at the top. Each layer offset casting a clean shadow on the one below. Matte acrylic with subtle edge translucency. Product photography, studio lighting, directional light from upper left. Dark background. No text, no people, no logos.`;
  },
  laser_cut: (b) => {
    const base = b.secondary_color || b.primary_color;
    return ` Precision laser-cut from 6 stacked metal plates in a graduated fade from dark ${base} at the back to polished ${b.primary_color} at the front. Hard crisp edges, no rounding. Each plate casts a sharp geometric shadow on the one behind it. Machined metal surface with hairline finish. Product photography, directional studio lighting from upper left. Pure black background. No text, no people, no logos.`;
  },
  murano_glass: (b) => {
    const base = b.secondary_color || b.primary_color;
    return ` Handblown Murano glass sculpture in translucent ${b.primary_color} fading to deep ${base} at the base. Internal caustic light refractions and color bloom through the glass body. Smooth organic surface with subtle bubble inclusions catching the studio light. Product photography, soft overhead studio lighting with a single specular highlight. Black velvet background. No text, no people, no logos.`;
  },
};

const ALL_CARD_KEYS = Object.keys(CARD_SUBJECTS);
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

    const { brand_id, card_keys: requestedKeys, prompt_style: requestedStyle } = await req.json().catch(
      () => ({ brand_id: null, card_keys: null, prompt_style: null }),
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
    const styleKey: PromptStyle = (requestedStyle && requestedStyle in STYLE_PRESETS)
      ? (requestedStyle as PromptStyle)
      : "stacked_acrylic";
    const styleSuffix = STYLE_PRESETS[styleKey];

    const results: Record<string, { status: string; url?: string; error?: string }> = {};

    for (const key of keysToGenerate) {
      const subject = CARD_SUBJECTS[key];
      if (!subject) {
        results[key] = { status: "skipped", error: "No prompt defined for key" };
        continue;
      }

      // Use custom prompt override if set, otherwise combine subject + selected style
      const prompt = brandData.card_image_prompts?.[key] || (subject + styleSuffix(brandData));

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
            promptStyle: styleKey,
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
          modelUsed: MODEL,
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
