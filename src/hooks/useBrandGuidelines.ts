// ABOUTME: Fetches brand metadata + visual profile for the Brand Guidelines tab
// ABOUTME: Returns structured data for dynamic rendering of any brand's guidelines

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BrandLogo {
  id: string;
  url: string;
  variant: string | null;
  lockup: string | null;
  background: string | null;
  is_default: boolean | null;
  notes: string | null;
  sort_order: number | null;
}

export interface BrandGuidelinesData {
  brand_logos: BrandLogo[];
  brand: {
    id: string;
    name: string;
    logo_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    description: string | null;
    brand_voice: string | null;
    website_url: string | null;
    brand_category: string | null;
    is_default: boolean | null;
  };
  profile: {
    visual_dna: Record<string, unknown>;
    photography_style?: Record<string, unknown>;
    color_profile?: {
      mandatory_colors?: string[];
      brand_colors?: Array<{
        name?: string;
        hex: string;
        rgb?: string;
        cmyk?: string;
        pms?: string;
        role?: string;
        uses?: string[];
      }>;
      forbidden_colors?: string[];
      palette_relationships?: string;
      overall_tone?: string;
    };
    composition_rules?: {
      preferred_layouts?: string[];
      framing_conventions?: string[];
      aspect_ratio_preference?: string;
    };
    product_catalog?: Record<string, unknown>;
    brand_identity?: {
      tagline?: string;
      brand_values?: string[];
      brand_aesthetic?: string;
      positioning?: string;
      target_audience?: string;
      visual_language?: string;
      manifesto?: string;
      messaging?: string[];
      logo_description?: string;
    };
    tone_of_voice?: {
      formality?: string;
      personality?: string;
      energy?: string;
      dos?: string[];
      donts?: string[];
    };
    typography?: {
      heading_font?: string;
      body_font?: string;
      style_description?: string;
    };
    brand_story?: {
      narrative_summary?: string;
      mission_vision?: {
        mission?: string;
        vision?: string;
        purpose?: string;
      };
      heritage?: {
        founding_story?: string;
        milestones?: string[];
        legacy?: string;
      };
      innovation?: {
        approach?: string;
        differentiators?: string[];
        technology?: string;
      };
      customer_focus?: {
        promise?: string;
        experience?: string;
        testimonial_themes?: string[];
      };
      competitive_position?: {
        market_position?: string;
        key_differentiators?: string[];
        awards?: string[];
      };
      culture?: {
        dei?: string;
        values_in_practice?: string;
        employee_experience?: string;
      };
      community?: {
        programs?: string;
        partnerships?: string[];
        impact_metrics?: string;
      };
      sustainability?: {
        goals?: string[];
        social?: string;
        governance?: string;
        environmental?: string;
      };
    };
    brand_standards?: {
      logo_system?: {
        primary?: {
          description?: string;
          clear_space?: string;
          minimum_size?: { print?: string; digital?: string };
        };
        monogram?: {
          description?: string;
          usage?: string;
          variants?: string[];
        };
      };
      color_system?: {
        color_groups?: Array<{
          name: string;
          colors: Array<{ name?: string; hex: string; pms?: string; rgb?: string; cmyk?: string }>;
        }>;
        ada_compliance?: Array<{
          background?: string;
          foreground?: string;
          ratio?: string;
          level?: string;
        }>;
      };
      writer_guidelines?: {
        principles?: Array<{
          name: string;
          description: string;
          example_try?: string;
          example_instead_of?: string;
        }>;
        litmus_test?: string;
      };
      typography_system?: {
        rules?: Array<{ text: string }>;
        primary_font?: { name?: string; usage?: string; weights?: string[] };
        secondary_font?: { name?: string; usage?: string; weights?: string[] };
        layout_hierarchy?: Array<{ element: string; font: string; color?: string }>;
      };
      glossary?: Array<{ preferred: string; replaces: string }>;
      social_media_voice?: {
        persona?: string;
        hashtags?: string[];
        voice_traits?: Array<{ name: string; description: string }>;
        content_types?: string[];
      };
      vertical_positioning?: {
        verticals?: Array<{
          name: string;
          sub_verticals?: Array<{ name: string; headline?: string; description?: string }>;
        }>;
      };
      competitive_landscape?: {
        per_vertical?: Array<{ vertical: string; competitors: string[] }>;
        market_position_summary?: string;
      };
    };
    source_metadata?: Record<string, unknown>;
    confidence_score: number;
    total_images_analyzed: number;
  } | null;
}

export function useBrandGuidelines(brandId: string | null | undefined) {
  const [data, setData] = useState<BrandGuidelinesData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!brandId) {
      setData(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    async function load() {
      // Fetch brand, profile, and logo library in parallel
      const [brandRes, profileRes, logosRes] = await Promise.all([
        supabase
          .from('creative_studio_brands')
          .select('id, name, logo_url, primary_color, secondary_color, description, brand_voice, website_url, brand_category, is_default')
          .eq('id', brandId!)
          .single(),
        supabase
          .from('creative_studio_brand_profiles')
          .select('*')
          .eq('brand_id', brandId!)
          .single(),
        supabase
          .from('creative_studio_brand_logos')
          .select('id, url, variant, lockup, background, is_default, notes, sort_order')
          .eq('brand_id', brandId!)
          .order('sort_order', { ascending: true }),
      ]);

      if (cancelled) return;

      if (brandRes.error) {
        console.error('[useBrandGuidelines] Failed to fetch brand:', brandRes.error);
        setData(null);
        setIsLoading(false);
        return;
      }

      setData({
        brand_logos: logosRes.data || [],
        brand: brandRes.data,
        profile: profileRes.data || null,
      });
      setIsLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [brandId]);

  return { data, isLoading };
}
