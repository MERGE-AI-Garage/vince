// ABOUTME: Hook to manage studio welcome image sets — named snapshots of generated images by model run
// ABOUTME: Supports saving, activating, renaming, and deleting sets; activating restores images and prompts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateSiteSetting } from '@/hooks/useSiteSettings';

export interface StudioWelcomeImageSetPromptSnapshot {
  prompt: string;
  aspect_ratio: string;
}

export interface StudioWelcomeImageSet {
  id: string;
  name: string;
  model_used: string;
  image_count: number;
  images: Record<string, string>;
  prompts: Record<string, StudioWelcomeImageSetPromptSnapshot> | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export function useStudioWelcomeImageSets() {
  return useQuery({
    queryKey: ['studio-welcome-image-sets'],
    queryFn: async (): Promise<StudioWelcomeImageSet[]> => {
      const { data, error } = await supabase
        .from('studio_welcome_image_sets' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as StudioWelcomeImageSet[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveStudioWelcomeImageSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      model_used,
      images,
      prompts,
      notes,
    }: {
      name: string;
      model_used: string;
      images: Record<string, string>;
      prompts?: Record<string, StudioWelcomeImageSetPromptSnapshot>;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('studio_welcome_image_sets' as any)
        .insert({
          name,
          model_used,
          image_count: Object.keys(images).length,
          images,
          prompts: prompts || null,
          is_active: false,
          notes: notes || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-welcome-image-sets'] });
    },
  });
}

export function useActivateStudioWelcomeImageSet() {
  const queryClient = useQueryClient();
  const updateSetting = useUpdateSiteSetting();

  return useMutation({
    mutationFn: async (setId: string) => {
      // Deactivate all sets
      const { error: deactivateErr } = await supabase
        .from('studio_welcome_image_sets' as any)
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deactivateErr) throw deactivateErr;

      // Activate the selected set
      const { data: setData, error: activateErr } = await supabase
        .from('studio_welcome_image_sets' as any)
        .update({ is_active: true })
        .eq('id', setId)
        .select('images, prompts, name')
        .single();

      if (activateErr) throw activateErr;

      // Fetch current active images to preserve slots not in this set
      const { data: currentSetting } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'creative_studio_welcome_images')
        .single();

      const currentImages = (currentSetting?.value as Record<string, string>) || {};
      const setImages = (setData as any).images as Record<string, string>;

      await updateSetting.mutateAsync({
        key: 'creative_studio_welcome_images',
        value: { ...currentImages, ...setImages },
      });

      // Restore prompts if the set has them
      const setPrompts = (setData as any).prompts as Record<string, StudioWelcomeImageSetPromptSnapshot> | null;
      if (setPrompts) {
        const setName = (setData as any).name as string;

        const { data: promptRows } = await supabase
          .from('studio_welcome_image_prompts' as any)
          .select('id, image_key')
          .in('image_key', Object.keys(setPrompts));

        if (promptRows) {
          for (const row of promptRows as any[]) {
            const snapshot = setPrompts[row.image_key];
            if (!snapshot) continue;

            await supabase
              .from('studio_welcome_image_prompts' as any)
              .update({
                prompt: snapshot.prompt,
                aspect_ratio: snapshot.aspect_ratio,
                updated_at: new Date().toISOString(),
              })
              .eq('id', row.id);

            const { data: versions } = await supabase
              .from('studio_welcome_image_prompt_versions' as any)
              .select('version_number')
              .eq('prompt_id', row.id)
              .order('version_number', { ascending: false })
              .limit(1);

            const nextVersion = ((versions as any)?.[0]?.version_number || 0) + 1;

            await supabase
              .from('studio_welcome_image_prompt_versions' as any)
              .insert({
                prompt_id: row.id,
                version_number: nextVersion,
                prompt: snapshot.prompt,
                aspect_ratio: snapshot.aspect_ratio,
                change_summary: `Restored from set: ${setName}`,
              });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-welcome-image-sets'] });
      queryClient.invalidateQueries({ queryKey: ['studio-welcome-images'] });
      queryClient.invalidateQueries({ queryKey: ['studio-welcome-image-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['studio-welcome-image-prompt-versions'] });
    },
  });
}

export function useRenameStudioWelcomeImageSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('studio_welcome_image_sets' as any)
        .update({ name })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-welcome-image-sets'] });
    },
  });
}

export function useDeleteStudioWelcomeImageSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (setId: string) => {
      const { error } = await supabase
        .from('studio_welcome_image_sets' as any)
        .delete()
        .eq('id', setId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-welcome-image-sets'] });
    },
  });
}
