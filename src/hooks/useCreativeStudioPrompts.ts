// ABOUTME: React Query hooks for Creative Studio brand prompt template management
// ABOUTME: Handles fetching, creating, updating, deleting, and usage tracking for brand prompts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { BrandPromptTemplate, CameraPreset, TemplateReferenceImage } from '@/types/creative-studio';

const QUERY_KEY = 'creative-studio-brand-prompts';

interface PromptRow {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  category: string | null;
  prompt_template: string;
  locked_parameters: Record<string, unknown>;
  variable_fields: unknown;
  camera_preset: unknown;
  reference_images: TemplateReferenceImage[] | null;
  agent_directive_id: string | null;
  recommended_model: string | null;
  created_by: string | null;
  is_auto_generated: boolean | null;
  usage_count: number | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: PromptRow): BrandPromptTemplate {
  return {
    ...row,
    description: row.description ?? undefined,
    category: row.category ?? undefined,
    variable_fields: Array.isArray(row.variable_fields) ? row.variable_fields : [],
    camera_preset: row.camera_preset as CameraPreset | undefined,
    reference_images: (Array.isArray(row.reference_images) && row.reference_images.length > 0)
      ? row.reference_images
      : undefined,
    agent_directive_id: row.agent_directive_id ?? undefined,
    recommended_model: row.recommended_model ?? undefined,
    created_by: row.created_by ?? undefined,
    is_auto_generated: row.is_auto_generated ?? false,
    usage_count: row.usage_count ?? 0,
  };
}

// Fetch prompts for a specific brand
export function useBrandPrompts(brandId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, brandId],
    queryFn: async () => {
      if (!brandId) return [];

      const { data, error } = await supabase
        .from('creative_studio_brand_prompts')
        .select('*')
        .eq('brand_id', brandId)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapRow);
    },
    enabled: !!brandId,
  });
}

// Fetch prompts for a brand filtered by category
export function useBrandPromptsByCategory(brandId: string | undefined, category: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, brandId, 'category', category],
    queryFn: async () => {
      if (!brandId) return [];

      let query = supabase
        .from('creative_studio_brand_prompts')
        .select('*')
        .eq('brand_id', brandId)
        .order('usage_count', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapRow);
    },
    enabled: !!brandId,
  });
}

// Fetch all prompts across all brands (admin view)
export function useAllBrandPrompts() {
  return useQuery({
    queryKey: [QUERY_KEY, 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creative_studio_brand_prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapRow);
    },
  });
}

// Get a single prompt by ID
export function useBrandPrompt(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'single', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('creative_studio_brand_prompts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return mapRow(data);
    },
    enabled: !!id,
  });
}

export interface CreatePromptInput {
  brand_id: string;
  name: string;
  description?: string;
  category?: string;
  prompt_template: string;
  locked_parameters?: Record<string, unknown>;
  variable_fields?: BrandPromptTemplate['variable_fields'];
  camera_preset?: CameraPreset;
  reference_images?: TemplateReferenceImage[];
  reference_collections?: string[];
  agent_directive_id?: string;
  recommended_model?: string;
  is_auto_generated?: boolean;
}

// Create a new prompt template
export function useCreateBrandPrompt() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (input: CreatePromptInput) => {
      const { data, error } = await supabase
        .from('creative_studio_brand_prompts')
        .insert({
          ...input,
          locked_parameters: input.locked_parameters ?? {},
          variable_fields: input.variable_fields ?? [],
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return mapRow(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.brand_id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'all'] });
    },
  });
}

export interface UpdatePromptInput {
  name?: string;
  description?: string;
  category?: string;
  prompt_template?: string;
  locked_parameters?: Record<string, unknown>;
  variable_fields?: BrandPromptTemplate['variable_fields'];
  camera_preset?: CameraPreset | null;
  reference_images?: TemplateReferenceImage[];
  reference_collections?: string[] | null;
  agent_directive_id?: string | null;
  recommended_model?: string | null;
}

// Update an existing prompt template
export function useUpdateBrandPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdatePromptInput }) => {
      const { data, error } = await supabase
        .from('creative_studio_brand_prompts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapRow(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.brand_id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'all'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'single', data.id] });
    },
  });
}

// Delete a prompt template
export function useDeleteBrandPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, brandId }: { id: string; brandId: string }) => {
      const { error } = await supabase
        .from('creative_studio_brand_prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return brandId;
    },
    onSuccess: (brandId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, brandId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'all'] });
    },
  });
}

// Increment usage count when a prompt is used
export function useIncrementPromptUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, brandId }: { id: string; brandId: string }) => {
      const { error } = await supabase.rpc('increment_prompt_usage', { prompt_id: id });

      // If RPC doesn't exist, fall back to direct update
      if (error) {
        const { data: current } = await supabase
          .from('creative_studio_brand_prompts')
          .select('usage_count')
          .eq('id', id)
          .single();

        const { error: updateError } = await supabase
          .from('creative_studio_brand_prompts')
          .update({ usage_count: (current?.usage_count ?? 0) + 1 })
          .eq('id', id);

        if (updateError) throw updateError;
      }

      return brandId;
    },
    onSuccess: (brandId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, brandId] });
    },
  });
}

// Generate brand-specific Quick Starters from Brand DNA via AI
export interface GeneratedStarter {
  name: string;
  description: string;
  category: string;
  prompt_template: string;
  camera_preset?: CameraPreset;
}

export function useGenerateBrandStarters() {
  return useMutation({
    mutationFn: async (brandId: string): Promise<GeneratedStarter[]> => {
      const { data, error } = await supabase.functions.invoke('generate-brand-starters', {
        body: { brand_id: brandId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');
      return data.starters as GeneratedStarter[];
    },
  });
}

// Get distinct categories for a brand's prompts
export function useBrandPromptCategories(brandId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, brandId, 'categories'],
    queryFn: async () => {
      if (!brandId) return [];

      const { data, error } = await supabase
        .from('creative_studio_brand_prompts')
        .select('category')
        .eq('brand_id', brandId)
        .not('category', 'is', null);

      if (error) throw error;

      const categories = [...new Set((data || []).map(d => d.category).filter(Boolean))];
      return categories as string[];
    },
    enabled: !!brandId,
  });
}
