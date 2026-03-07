// ABOUTME: React Query mutation hooks for Creative Studio agent directive CRUD
// ABOUTME: Handles creating, updating, deleting, and AI-generating brand governance directives

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { AgentDirective } from '@/types/creative-studio';

const DIRECTIVES_KEY = 'creative-studio-agent-directives';
const BRAND_STATS_KEY = 'creative-studio-brand-stats';

export interface CreateDirectiveInput {
  brand_id: string;
  name: string;
  persona: string;
  rules: AgentDirective['rules'];
  forbidden_combinations?: AgentDirective['forbidden_combinations'];
  required_elements?: AgentDirective['required_elements'];
  tone_guidelines?: string;
  is_active?: boolean;
}

export interface UpdateDirectiveInput {
  name?: string;
  persona?: string;
  rules?: AgentDirective['rules'];
  forbidden_combinations?: AgentDirective['forbidden_combinations'];
  required_elements?: AgentDirective['required_elements'];
  tone_guidelines?: string;
  is_active?: boolean;
}

export function useCreateAgentDirective() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateDirectiveInput) => {
      const { data, error } = await (supabase
        .from('creative_studio_agent_directives') as any)
        .insert({
          ...input,
          rules: input.rules || [],
          is_active: input.is_active ?? true,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AgentDirective;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [DIRECTIVES_KEY, variables.brand_id] });
      queryClient.invalidateQueries({ queryKey: [BRAND_STATS_KEY, variables.brand_id] });
    },
  });
}

export function useUpdateAgentDirective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, brandId, updates }: { id: string; brandId: string; updates: UpdateDirectiveInput }) => {
      const { data, error } = await (supabase
        .from('creative_studio_agent_directives') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as AgentDirective, brandId };
    },
    onSuccess: ({ brandId }) => {
      queryClient.invalidateQueries({ queryKey: [DIRECTIVES_KEY, brandId] });
      queryClient.invalidateQueries({ queryKey: [BRAND_STATS_KEY, brandId] });
    },
  });
}

export function useDeleteAgentDirective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, brandId }: { id: string; brandId: string }) => {
      const { error } = await (supabase
        .from('creative_studio_agent_directives') as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return brandId;
    },
    onSuccess: (brandId) => {
      queryClient.invalidateQueries({ queryKey: [DIRECTIVES_KEY, brandId] });
      queryClient.invalidateQueries({ queryKey: [BRAND_STATS_KEY, brandId] });
    },
  });
}

// ── AI-generate guardrails from brand intelligence ──────────────────────────

export function useGenerateBrandGuardrails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ brandId, focusArea }: { brandId: string; focusArea?: string }) => {
      const { data, error } = await supabase.functions.invoke('generate-brand-guardrails', {
        body: { brand_id: brandId, focus_area: focusArea },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Guardrails generation failed');
      return data as {
        success: true;
        directive: AgentDirective;
        summary: { rules: number; forbidden_combinations: number; required_elements: number };
      };
    },
    onSuccess: (_data, { brandId }) => {
      queryClient.invalidateQueries({ queryKey: [DIRECTIVES_KEY, brandId] });
      queryClient.invalidateQueries({ queryKey: [BRAND_STATS_KEY, brandId] });
    },
  });
}
