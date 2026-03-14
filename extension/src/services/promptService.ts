// ABOUTME: Client for the generate-brand-prompt Supabase Edge Function
// ABOUTME: Sends user intent + category to Gemini and returns on-brand prompts with history tracking

import { supabase } from '@/integrations/supabase/client';

export type PromptCategory = 'image' | 'text' | 'presentation' | 'general';

export interface GeneratePromptRequest {
  description: string;
  category: PromptCategory;
  platform?: string;
  brand_id?: string;
  tone?: string;
  tone_description?: string;
}

export interface GeneratePromptResponse {
  prompt: string;
  brand: string | null;
  history_id: string | null;
}

export async function generateBrandPrompt(req: GeneratePromptRequest): Promise<GeneratePromptResponse> {
  const { data, error } = await supabase.functions.invoke('generate-brand-prompt', {
    body: req,
  });

  if (error) {
    throw new Error(error.message || 'Failed to generate prompt');
  }

  if (!data?.prompt) {
    throw new Error(data?.error || 'No prompt generated');
  }

  return {
    prompt: data.prompt,
    brand: data.brand || null,
    history_id: data.history_id || null,
  };
}

/**
 * Increment usage_count on a brand preset when it's selected.
 */
export async function incrementPresetUsage(brandId: string, presetName: string): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from('creative_studio_brand_prompts')
    .select('id, usage_count')
    .eq('brand_id', brandId)
    .eq('name', presetName)
    .limit(1)
    .maybeSingle();

  if (fetchError || !data) return;

  const { error } = await supabase
    .from('creative_studio_brand_prompts')
    .update({ usage_count: (data.usage_count || 0) + 1 })
    .eq('id', data.id);

  if (error) {
    console.error('[promptService] Failed to increment usage:', error);
  }
}

/**
 * Toggle the favorite flag on a prompt history entry.
 */
export async function favoritePrompt(historyId: string, isFavorited: boolean): Promise<void> {
  const { error } = await supabase
    .from('brand_prompt_history')
    .update({ is_favorited: isFavorited, updated_at: new Date().toISOString() })
    .eq('id', historyId);

  if (error) {
    console.error('[promptService] Failed to update favorite:', error);
  }
}
