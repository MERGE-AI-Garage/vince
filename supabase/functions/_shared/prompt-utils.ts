// ABOUTME: Shared utilities for fetching AI prompts and model configs from database
// ABOUTME: Used by edge functions to enable dynamic prompt management via Gemini Control Panel

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

export interface PromptTemplate {
  id: string;
  name: string;
  slug: string;
  prompt_text: string;
  placeholders: Record<string, string> | string[];
  function_target: string;
  category: string;
  is_active: boolean;
}

export interface ModelConfig {
  id: string;
  name: string;
  model_name: string;
  temperature: number;
  top_k: number | null;
  top_p: number | null;
  max_output_tokens: number | null;
  response_modalities: string[] | null;
  safety_settings: any[] | null;
  is_default: boolean;
  is_active: boolean;
}

export interface PromptWithModel {
  prompt: PromptTemplate;
  modelConfig: ModelConfig | null;
}

/**
 * Fetches a prompt template by slug with its associated model configuration
 */
export async function getPromptWithModel(
  supabase: SupabaseClient,
  slug: string
): Promise<PromptWithModel | null> {
  // Fetch prompt template
  const { data: prompt, error: promptError } = await supabase
    .from('ai_prompt_templates')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (promptError || !prompt) {
    console.error(`Failed to fetch prompt template "${slug}":`, promptError);
    return null;
  }

  // Fetch associated model config via assignment
  const { data: assignment } = await supabase
    .from('prompt_model_assignments')
    .select(`
      model_config_id,
      gemini_model_configs (*)
    `)
    .eq('prompt_id', prompt.id)
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(1)
    .single();

  const modelConfig = assignment?.gemini_model_configs as ModelConfig | null;

  // Update usage stats
  await supabase
    .from('ai_prompt_templates')
    .update({
      usage_count: (prompt.usage_count || 0) + 1,
      last_used_at: new Date().toISOString()
    })
    .eq('id', prompt.id);

  return {
    prompt: prompt as PromptTemplate,
    modelConfig
  };
}

/**
 * Fetches multiple prompt templates by function target
 */
export async function getPromptsByFunction(
  supabase: SupabaseClient,
  functionTarget: string
): Promise<PromptTemplate[]> {
  const { data, error } = await supabase
    .from('ai_prompt_templates')
    .select('*')
    .eq('function_target', functionTarget)
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error) {
    console.error(`Failed to fetch prompts for function "${functionTarget}":`, error);
    return [];
  }

  return data as PromptTemplate[];
}

/**
 * Replaces template variables in a prompt string
 * Supports {{variable}} syntax
 */
export function interpolatePrompt(
  template: string,
  variables: Record<string, string | number | null | undefined>
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const replacement = value?.toString() ?? '';
    result = result.split(placeholder).join(replacement);
  }

  return result;
}

/**
 * Gets Gemini generation config from model config
 */
export function getGenerationConfig(modelConfig: ModelConfig | null) {
  if (!modelConfig) {
    // Default config for Gemini 3 Flash
    return {
      temperature: 1.0,
      topK: 40,
      topP: 0.95,
    };
  }

  const config: Record<string, number> = {
    temperature: modelConfig.temperature ?? 1.0,
    topK: modelConfig.top_k ?? 40,
    topP: modelConfig.top_p ?? 0.95,
  };
  // Only set maxOutputTokens if explicitly configured in DB
  if (modelConfig.max_output_tokens) {
    config.maxOutputTokens = modelConfig.max_output_tokens;
  }
  return config;
}

/**
 * Gets the model name from config or returns default
 */
export function getModelName(modelConfig: ModelConfig | null): string {
  return modelConfig?.model_name ?? 'gemini-3-flash-preview';
}
