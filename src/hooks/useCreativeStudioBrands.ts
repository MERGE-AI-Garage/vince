// ABOUTME: React Query hooks for Creative Studio brand management
// ABOUTME: Handles fetching, creating, updating, and deleting brands

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type {
  CreativeStudioBrand,
  CreateBrandInput,
  UpdateBrandInput,
  QuickPrompt,
} from '@/types/creative-studio';

const QUERY_KEY = 'creative-studio-brands';

const DEFAULT_QUICK_PROMPTS: QuickPrompt[] = [
  {
    name: 'Product Hero',
    prompt: 'A hero product shot on a clean background with dramatic lighting',
    icon: 'box',
    category: 'product',
  },
  {
    name: 'Lifestyle',
    prompt: 'A lifestyle scene showing the product in natural use',
    icon: 'users',
    category: 'lifestyle',
  },
  {
    name: 'Social Post',
    prompt: 'A vibrant social media post with bold colors and engaging composition',
    icon: 'share',
    category: 'social',
  },
  {
    name: 'Flat Lay',
    prompt: 'A styled flat lay arrangement with complementary props',
    icon: 'palette',
    category: 'product',
  },
];

// Fetch all active brands
export function useCreativeStudioBrands() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creative_studio_brands')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []).map(brand => ({
        ...brand,
        quick_prompts: (brand.quick_prompts || []) as QuickPrompt[],
      })) as CreativeStudioBrand[];
    },
  });
}

// Fetch all brands (including inactive) for admin
export function useAllCreativeStudioBrands() {
  return useQuery({
    queryKey: [QUERY_KEY, 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creative_studio_brands')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []).map(brand => ({
        ...brand,
        quick_prompts: (brand.quick_prompts || []) as QuickPrompt[],
      })) as CreativeStudioBrand[];
    },
  });
}

// Get default brand
export function useDefaultBrand() {
  return useQuery({
    queryKey: [QUERY_KEY, 'default'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creative_studio_brands')
        .select('*')
        .eq('is_active', true)
        .eq('is_default', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // Fall back to first active brand
        const { data: fallback } = await supabase
          .from('creative_studio_brands')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(1)
          .single();

        return fallback ? {
          ...fallback,
          quick_prompts: (fallback.quick_prompts || []) as QuickPrompt[],
        } as CreativeStudioBrand : null;
      }

      return {
        ...data,
        quick_prompts: (data.quick_prompts || []) as QuickPrompt[],
      } as CreativeStudioBrand;
    },
  });
}

// Get brand by ID
export function useBrand(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('creative_studio_brands')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        quick_prompts: (data.quick_prompts || []) as QuickPrompt[],
      } as CreativeStudioBrand;
    },
    enabled: !!id,
  });
}

// Create brand (admin)
export function useCreateBrand() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateBrandInput) => {
      const quickPrompts = input.quick_prompts?.length
        ? input.quick_prompts
        : DEFAULT_QUICK_PROMPTS;

      const { data, error } = await supabase
        .from('creative_studio_brands')
        .insert({
          ...input,
          quick_prompts: quickPrompts,
          created_by: profile?.id,
          updated_by: profile?.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        quick_prompts: (data.quick_prompts || []) as QuickPrompt[],
      } as CreativeStudioBrand;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// Update brand (admin)
export function useUpdateBrand() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateBrandInput;
    }) => {
      const { data, error } = await supabase
        .from('creative_studio_brands')
        .update({
          ...updates,
          updated_by: profile?.id,
        })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Brand not found or you do not have permission to update it');
      }

      return {
        ...data,
        quick_prompts: (data.quick_prompts || []) as QuickPrompt[],
      } as CreativeStudioBrand;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// Delete brand (admin)
export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('creative_studio_brands')
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

// Toggle brand active status (admin)
export function useToggleBrandActive() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('creative_studio_brands')
        .update({
          is_active,
          updated_by: profile?.id,
        })
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

// Set default brand (admin)
export function useSetDefaultBrand() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      // First, unset all defaults
      await supabase
        .from('creative_studio_brands')
        .update({ is_default: false, updated_by: profile?.id })
        .neq('id', 'placeholder'); // Update all

      // Then set the new default
      const { error } = await supabase
        .from('creative_studio_brands')
        .update({
          is_default: true,
          updated_by: profile?.id,
        })
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

// Update brand quick prompts (admin)
export function useUpdateBrandQuickPrompts() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      quick_prompts,
    }: {
      id: string;
      quick_prompts: QuickPrompt[];
    }) => {
      const { error } = await supabase
        .from('creative_studio_brands')
        .update({
          quick_prompts,
          updated_by: profile?.id,
        })
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
