// ABOUTME: Fetches completed Creative Studio generations for a brand
// ABOUTME: Returns images, campaigns, and videos sorted by most recent

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Generation {
  id: string;
  generation_type: string;
  prompt_text: string | null;
  output_urls: string[] | null;
  copy_blocks: Array<{ type: 'text' | 'image'; content?: string; image_base64?: string; mime_type?: string }> | null;
  metadata: Record<string, unknown> | null;
  model_used: string | null;
  parameters: Record<string, unknown> | null;
  generation_time_ms: number | null;
  actual_cost_usd: number | null;
  created_at: string;
}

export function useCreations(brandId: string | null) {
  const [items, setItems] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!brandId) { setItems([]); return; }
    let cancelled = false;
    setIsLoading(true);

    supabase
      .from('creative_studio_generations')
      .select('id, generation_type, prompt_text, output_urls, copy_blocks, metadata, model_used, parameters, generation_time_ms, actual_cost_usd, created_at')
      .eq('brand_id', brandId)
      .eq('status', 'completed')
      .not('output_urls', 'is', null)
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setItems(data as Generation[]);
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [brandId]);

  return { items, isLoading };
}
