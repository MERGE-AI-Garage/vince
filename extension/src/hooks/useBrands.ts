// ABOUTME: Fetches active brands from Supabase for the brand picker dropdown
// ABOUTME: Caches selection in chrome.storage.local and defaults to the is_default brand

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Brand {
  id: string;
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  logo_url: string | null;
  is_default: boolean | null;
}

const BRAND_STORAGE_KEY = 'selected_brand_id';

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Fetch active brands
      const { data, error } = await supabase
        .from('creative_studio_brands')
        .select('id, name, primary_color, secondary_color, logo_url, is_default')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('[useBrands] Failed to fetch brands:', error);
        setIsLoading(false);
        return;
      }

      const activeBrands = (data || []) as Brand[];
      setBrands(activeBrands);

      // Restore saved selection or fall back to default brand
      let savedId: string | null = null;
      try {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          const stored = await chrome.storage.local.get(BRAND_STORAGE_KEY);
          savedId = stored[BRAND_STORAGE_KEY] || null;
        }
      } catch {
        // Storage not available
      }

      const savedBrand = savedId ? activeBrands.find(b => b.id === savedId) : null;
      const defaultBrand = activeBrands.find(b => b.is_default);
      const initial = savedBrand || defaultBrand || activeBrands[0] || null;

      setSelectedBrandIdState(initial?.id || null);
      setIsLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const setSelectedBrandId = useCallback((brandId: string | null) => {
    setSelectedBrandIdState(brandId);
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        if (brandId) {
          chrome.storage.local.set({ [BRAND_STORAGE_KEY]: brandId });
        } else {
          chrome.storage.local.remove(BRAND_STORAGE_KEY);
        }
      }
    } catch {
      // Storage not available
    }
  }, []);

  return { brands, selectedBrandId, setSelectedBrandId, isLoading };
}
