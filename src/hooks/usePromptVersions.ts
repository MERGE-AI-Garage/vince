// ABOUTME: React Query hooks for Brand DNA prompt version history
// ABOUTME: Provides fetch, create, and restore operations against the prompt_versions table

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PromptVersion {
  id: string;
  prompt_id: string;
  content: string;
  version_number: number;
  change_summary: string | null;
  created_at: string;
  created_by: string | null;
}

export const usePromptVersions = (promptId: string) => {
  return useQuery({
    queryKey: ['prompt-versions', promptId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', promptId)
        .order('version_number', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as PromptVersion[];
    },
  });
};

export const useCreatePromptVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      promptId,
      content,
      changeSummary,
    }: {
      promptId: string;
      content: string;
      changeSummary?: string;
    }) => {
      // Auto-increment version number
      const { data: existing } = await supabase
        .from('prompt_versions')
        .select('version_number')
        .eq('prompt_id', promptId)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = (existing?.[0]?.version_number || 0) + 1;

      const { data: { user } } = await supabase.auth.getUser();

      // Update the active prompt text
      const { error: updateError } = await supabase
        .from('ai_prompt_templates')
        .update({ prompt_text: content, updated_at: new Date().toISOString() })
        .eq('id', promptId);
      if (updateError) throw updateError;

      // Record the version
      const { data, error } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: promptId,
          content,
          version_number: nextVersion,
          change_summary: changeSummary || null,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PromptVersion;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prompt-versions', variables.promptId] });
      queryClient.invalidateQueries({ queryKey: ['brand-dna-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['ai-prompt-templates'] });
    },
    onError: (error) => {
      console.error('[PromptVersions] Error creating version:', error);
      toast.error('Failed to save prompt version');
    },
  });
};

export const useRestorePromptVersion = () => {
  const queryClient = useQueryClient();
  const createVersion = useCreatePromptVersion();

  return useMutation({
    mutationFn: async ({
      versionToRestore,
    }: {
      versionToRestore: PromptVersion;
    }) => {
      // createVersion handles both the template update and the version record
      await createVersion.mutateAsync({
        promptId: versionToRestore.prompt_id,
        content: versionToRestore.content,
        changeSummary: `Restored from v${versionToRestore.version_number}`,
      });

      return versionToRestore;
    },
    onSuccess: (version) => {
      queryClient.invalidateQueries({ queryKey: ['prompt-versions', version.prompt_id] });
      toast.success(`Restored to v${version.version_number}`);
    },
    onError: (error) => {
      console.error('[PromptVersions] Error restoring version:', error);
      toast.error('Failed to restore prompt version');
    },
  });
};
