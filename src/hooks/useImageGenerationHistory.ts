// ABOUTME: Hook to fetch generation history for a guidelines section image
// ABOUTME: Queries ai_image_generations by sectionKey metadata for prompt viewing and version history

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GenerationRecord {
  id: string;
  prompt: string;
  image_url: string;
  model_used: string;
  generation_time_ms: number | null;
  created_at: string;
}

export function useImageGenerationHistory(sectionKey: string | null) {
  return useQuery({
    queryKey: ['image-generation-history', sectionKey],
    queryFn: async (): Promise<GenerationRecord[]> => {
      // Match by original_prompt (covers all records) or metadata sectionKey (newer records)
      const originalPrompt = `Guidelines section: ${sectionKey}`;
      const { data, error } = await supabase
        .from('ai_image_generations')
        .select('id, prompt, image_url, model_used, generation_time_ms, created_at')
        .eq('status', 'completed')
        .eq('category', 'ai-guidelines')
        .or(`original_prompt.eq.${originalPrompt},metadata->>sectionKey.eq.${sectionKey}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data as unknown as GenerationRecord[]) || [];
    },
    enabled: !!sectionKey,
    staleTime: 2 * 60 * 1000,
  });
}
