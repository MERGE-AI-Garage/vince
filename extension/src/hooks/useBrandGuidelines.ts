// ABOUTME: Fetches brand metadata + visual profile for the Brand Guidelines tab
// ABOUTME: Returns structured data for dynamic rendering of any brand's guidelines

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BrandGuidelinesData {
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
    brand_story?: Record<string, unknown>;
    brand_standards?: Record<string, unknown>;
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
      // Fetch brand + profile in parallel
      const [brandRes, profileRes] = await Promise.all([
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
      ]);

      if (cancelled) return;

      if (brandRes.error) {
        console.error('[useBrandGuidelines] Failed to fetch brand:', brandRes.error);
        setData(null);
        setIsLoading(false);
        return;
      }

      setData({
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
