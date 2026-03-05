// ABOUTME: React Query hooks for Creative Studio model management
// ABOUTME: Handles fetching, caching, and mutations for AI models

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CreativeStudioModel, ModelType } from '@/types/creative-studio';

const QUERY_KEY = 'creative-studio-models';

// Fetch all models
export function useCreativeStudioModels(type?: ModelType) {
  return useQuery({
    queryKey: [QUERY_KEY, type],
    queryFn: async () => {
      let query = supabase
        .from('creative_studio_models')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (type) {
        query = query.eq('model_type', type);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map(model => ({
        ...model,
        capabilities: model.capabilities as string[],
        parameters: model.parameters as Record<string, unknown>,
      })) as CreativeStudioModel[];
    },
  });
}

// Fetch all models (including inactive) for admin
export function useAllCreativeStudioModels() {
  return useQuery({
    queryKey: [QUERY_KEY, 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creative_studio_models')
        .select('*')
        .order('model_type', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []).map(model => ({
        ...model,
        capabilities: model.capabilities as string[],
        parameters: model.parameters as Record<string, unknown>,
      })) as CreativeStudioModel[];
    },
  });
}

// Get default model by type
export function useDefaultModel(type: ModelType) {
  return useQuery({
    queryKey: [QUERY_KEY, 'default', type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creative_studio_models')
        .select('*')
        .eq('model_type', type)
        .eq('is_active', true)
        .eq('is_default', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // Fall back to first active model of type
        const { data: fallback } = await supabase
          .from('creative_studio_models')
          .select('*')
          .eq('model_type', type)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(1)
          .single();

        return fallback ? {
          ...fallback,
          capabilities: fallback.capabilities as string[],
          parameters: fallback.parameters as Record<string, unknown>,
        } as CreativeStudioModel : null;
      }

      return {
        ...data,
        capabilities: data.capabilities as string[],
        parameters: data.parameters as Record<string, unknown>,
      } as CreativeStudioModel;
    },
  });
}

// Create model (admin)
export function useCreateModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (model: {
      name: string;
      model_id: string;
      model_type: ModelType;
      provider: string;
      capabilities: string[];
      parameters: Record<string, unknown>;
      cost_per_generation: number;
      is_active: boolean;
      is_default: boolean;
      sort_order: number;
    }) => {
      const { data, error } = await supabase
        .from('creative_studio_models')
        .insert(model)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// Update model (admin)
export function useUpdateModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CreativeStudioModel>;
    }) => {
      const { data, error } = await supabase
        .from('creative_studio_models')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// Toggle model active status (admin)
export function useToggleModelActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('creative_studio_models')
        .update({ is_active })
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// Set default model (admin)
export function useSetDefaultModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, model_type }: { id: string; model_type: ModelType }) => {
      // First, unset all defaults for this type
      await supabase
        .from('creative_studio_models')
        .update({ is_default: false })
        .eq('model_type', model_type);

      // Then set the new default
      const { error } = await supabase
        .from('creative_studio_models')
        .update({ is_default: true })
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// Delete model (admin)
export function useDeleteModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('creative_studio_models')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
