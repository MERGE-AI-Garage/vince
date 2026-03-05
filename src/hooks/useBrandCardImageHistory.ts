// ABOUTME: Hook to fetch generation history for a brand card image
// ABOUTME: Queries ai_image_generations by brandId + cardKey metadata for version history

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BrandCardGenerationRecord {
  id: string;
  prompt: string;
  image_url: string;
  model_used: string;
  generation_time_ms: number | null;
  created_at: string;
}

export function useBrandCardImageHistory(brandId: string | null, cardKey: string | null) {
  return useQuery({
    queryKey: ['brand-card-image-history', brandId, cardKey],
    queryFn: async (): Promise<BrandCardGenerationRecord[]> => {
      const { data, error } = await supabase
        .from('ai_image_generations')
        .select('id, prompt, image_url, model_used, generation_time_ms, created_at')
        .eq('status', 'completed')
        .eq('category', 'brand-card')
        .filter('metadata->>brandId', 'eq', brandId!)
        .filter('metadata->>cardKey', 'eq', cardKey!)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data as unknown as BrandCardGenerationRecord[]) || [];
    },
    enabled: !!brandId && !!cardKey,
    staleTime: 2 * 60 * 1000,
  });
}
