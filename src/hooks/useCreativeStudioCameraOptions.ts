// ABOUTME: React Query hooks for Creative Studio camera option management
// ABOUTME: Handles fetching, caching, and CRUD mutations for film stocks, lighting setups, etc.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CameraMediaType = 'still' | 'video' | 'both';

export interface CameraOption {
  id: string;
  category: string;
  slug: string;
  display_name: string;
  description: string | null;
  prompt_fragment: string;
  sort_order: number;
  is_active: boolean;
  media_type: CameraMediaType;
  created_at: string;
}

export type CameraOptionCategory =
  | 'film_stock' | 'lighting' | 'composition' | 'depth_of_field'
  | 'camera_body' | 'print_process' | 'color_grade' | 'film_effect' | 'shot_type'
  | 'aperture' | 'focal_length' | 'color_temperature' | 'frame_rate';

const QUERY_KEY = 'creative-studio-camera-options';

/** Fetch active camera options, optionally filtered by category and media type */
export function useCameraOptions(category?: CameraOptionCategory, mediaType?: 'still' | 'video') {
  return useQuery({
    queryKey: [QUERY_KEY, category, mediaType],
    queryFn: async () => {
      let query = supabase
        .from('creative_studio_camera_options')
        .select('*')
        .eq('is_active', true)
        .order('display_name', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      if (mediaType) {
        query = query.in('media_type', [mediaType, 'both']);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CameraOption[];
    },
  });
}

/** Fetch ALL camera options including inactive (admin) */

export function useAllCameraOptions() {
  return useQuery({
    queryKey: [QUERY_KEY, 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creative_studio_camera_options')
        .select('*')
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as CameraOption[];
    },
  });
}

export interface CreateCameraOptionInput {
  category: string;
  slug: string;
  display_name: string;
  description?: string;
  prompt_fragment: string;
  sort_order?: number;
  is_active?: boolean;
  media_type?: CameraMediaType;
}

export interface UpdateCameraOptionInput {
  display_name?: string;
  description?: string | null;
  prompt_fragment?: string;
  sort_order?: number;
  is_active?: boolean;
  media_type?: CameraMediaType;
}

/** Create a camera option (admin) */
export function useCreateCameraOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCameraOptionInput) => {
      const { data, error } = await supabase
        .from('creative_studio_camera_options')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as CameraOption;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/** Update a camera option (admin) */
export function useUpdateCameraOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateCameraOptionInput }) => {
      const { data, error } = await supabase
        .from('creative_studio_camera_options')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CameraOption;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/** Toggle active status (admin) */
export function useToggleCameraOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('creative_studio_camera_options')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/** Delete a camera option (admin) */
export function useDeleteCameraOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('creative_studio_camera_options')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
