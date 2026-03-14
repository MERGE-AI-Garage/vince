// ABOUTME: Fetches and manages the logo library for a brand
// ABOUTME: Includes inline rename support via the notes field

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { BrandLogo } from './useBrandGuidelines';

export type { BrandLogo };

export function useBrandLogos(brandId: string | null) {
  const [logos, setLogos] = useState<BrandLogo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const rename = async (id: string, notes: string): Promise<boolean> => {
    const { error } = await supabase
      .from('creative_studio_brand_logos')
      .update({ notes })
      .eq('id', id);
    if (!error) {
      setLogos(prev => prev.map(l => l.id === id ? { ...l, notes } : l));
    }
    return !error;
  };

  useEffect(() => {
    if (!brandId) { setLogos([]); return; }
    let cancelled = false;
    setIsLoading(true);

    supabase
      .from('creative_studio_brand_logos')
      .select('id, url, variant, lockup, background, is_default, notes, sort_order')
      .eq('brand_id', brandId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setLogos(data);
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [brandId]);

  return { logos, isLoading, rename };
}
