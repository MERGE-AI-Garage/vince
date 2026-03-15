// ABOUTME: Hook to read and mutate studio welcome image prompts from the studio_welcome_image_prompts table
// ABOUTME: Auto-versions on every save, provides version history query and restore mutation

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StudioWelcomeImagePrompt {
  id: string;
  image_key: string;
  label: string;
  group_name: string;
  prompt: string;
  aspect_ratio: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StudioWelcomeImagePromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  prompt: string;
  aspect_ratio: string;
  model_used: string | null;
  change_summary: string | null;
  created_by: string | null;
  created_at: string;
}

export function useStudioWelcomeImagePrompts() {
  return useQuery({
    queryKey: ['studio-welcome-image-prompts'],
    queryFn: async (): Promise<StudioWelcomeImagePrompt[]> => {
      const { data, error } = await supabase
        .from('studio_welcome_image_prompts' as any)
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return (data as unknown as StudioWelcomeImagePrompt[]) || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateStudioWelcomeImagePrompt() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      prompt,
      aspect_ratio,
      changeSummary,
    }: {
      id: string;
      prompt: string;
      aspect_ratio?: string;
      changeSummary?: string;
    }) => {
      // 1. Update the prompt row
      const updates: Record<string, unknown> = { prompt, updated_at: new Date().toISOString() };
      if (aspect_ratio) updates.aspect_ratio = aspect_ratio;

      const { error: updateErr } = await supabase
        .from('studio_welcome_image_prompts' as any)
        .update(updates)
        .eq('id', id);

      if (updateErr) throw updateErr;

      // 2. Get next version number
      const { data: versions } = await supabase
        .from('studio_welcome_image_prompt_versions' as any)
        .select('version_number')
        .eq('prompt_id', id)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = ((versions as any)?.[0]?.version_number || 0) + 1;

      // 3. Create version entry
      await supabase
        .from('studio_welcome_image_prompt_versions' as any)
        .insert({
          prompt_id: id,
          version_number: nextVersion,
          prompt,
          aspect_ratio: aspect_ratio || '1:1',
          change_summary: changeSummary || null,
          created_by: user?.id || null,
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-welcome-image-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['studio-welcome-image-prompt-versions'] });
    },
  });
}

export function useStudioWelcomeImagePromptVersions(promptId: string | null) {
  return useQuery({
    queryKey: ['studio-welcome-image-prompt-versions', promptId],
    queryFn: async (): Promise<StudioWelcomeImagePromptVersion[]> => {
      if (!promptId) return [];
      const { data, error } = await supabase
        .from('studio_welcome_image_prompt_versions' as any)
        .select('*')
        .eq('prompt_id', promptId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return (data as unknown as StudioWelcomeImagePromptVersion[]) || [];
    },
    enabled: !!promptId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRestoreStudioWelcomeImagePromptVersion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      promptId,
      version,
    }: {
      promptId: string;
      version: StudioWelcomeImagePromptVersion;
    }) => {
      // 1. Update main prompt row with restored content
      const { error: updateErr } = await supabase
        .from('studio_welcome_image_prompts' as any)
        .update({
          prompt: version.prompt,
          aspect_ratio: version.aspect_ratio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', promptId);

      if (updateErr) throw updateErr;

      // 2. Get next version number
      const { data: versions } = await supabase
        .from('studio_welcome_image_prompt_versions' as any)
        .select('version_number')
        .eq('prompt_id', promptId)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = ((versions as any)?.[0]?.version_number || 0) + 1;

      // 3. Create version entry marking the restore
      await supabase
        .from('studio_welcome_image_prompt_versions' as any)
        .insert({
          prompt_id: promptId,
          version_number: nextVersion,
          prompt: version.prompt,
          aspect_ratio: version.aspect_ratio,
          change_summary: `Restored from v${version.version_number}`,
          created_by: user?.id || null,
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-welcome-image-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['studio-welcome-image-prompt-versions'] });
    },
  });
}
