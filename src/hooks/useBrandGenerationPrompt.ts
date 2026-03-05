// ABOUTME: React Query hooks for brand generation prompts — CRUD, synthesis, and section toggles
// ABOUTME: Fetches the active structured prompt, triggers Gemini synthesis, and manages section on/off state

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BrandGenerationPrompt, BrandGenerationPromptSectionToggles } from '@/types/creative-studio';

const QUERY_KEY = 'brand-generation-prompt';
const HISTORY_KEY = 'brand-generation-prompt-history';

// ── Fetch active generation prompt for a brand ──────────────────────────────

export function useBrandGenerationPrompt(brandId?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, brandId],
    queryFn: async () => {
      if (!brandId) return null;

      const { data, error } = await supabase
        .from('brand_generation_prompts')
        .select('*')
        .eq('brand_id', brandId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        brand_id: data.brand_id,
        version: data.version,
        is_active: data.is_active,
        prompt_text: data.prompt_text,
        section_toggles: data.section_toggles as BrandGenerationPromptSectionToggles,
        synthesis_metadata: data.synthesis_metadata as Record<string, unknown> | undefined,
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
      } as BrandGenerationPrompt;
    },
    enabled: !!brandId,
  });
}

// ── Fetch version history for a brand ────────────────────────────────────────

export function useBrandGenerationPromptHistory(brandId?: string) {
  return useQuery({
    queryKey: [HISTORY_KEY, brandId],
    queryFn: async () => {
      if (!brandId) return [];

      const { data, error } = await supabase
        .from('brand_generation_prompts')
        .select('id, version, is_active, created_at, synthesis_metadata')
        .eq('brand_id', brandId)
        .order('version', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!brandId,
  });
}

// ── Trigger synthesis via edge function ──────────────────────────────────────

export function useSynthesizeGenerationPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brandId: string) => {
      const { data, error } = await supabase.functions.invoke('synthesize-generation-prompt', {
        body: { brand_id: brandId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Synthesis failed');
      return data as { success: true; prompt_text: string; version: number };
    },
    onSuccess: (_data, brandId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, brandId] });
      queryClient.invalidateQueries({ queryKey: [HISTORY_KEY, brandId] });
    },
  });
}

// ── Toggle a section on/off ──────────────────────────────────────────────────

export function useTogglePromptSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      promptId,
      sectionKey,
      enabled,
      brandId,
    }: {
      promptId: string;
      sectionKey: keyof BrandGenerationPromptSectionToggles;
      enabled: boolean;
      brandId: string;
    }) => {
      // Read current toggles, update the one section
      const { data: current, error: readError } = await supabase
        .from('brand_generation_prompts')
        .select('section_toggles')
        .eq('id', promptId)
        .single();

      if (readError) throw readError;

      const toggles = (current.section_toggles || {}) as BrandGenerationPromptSectionToggles;
      const updated = { ...toggles, [sectionKey]: enabled };

      const { error: updateError } = await supabase
        .from('brand_generation_prompts')
        .update({ section_toggles: updated, updated_at: new Date().toISOString() })
        .eq('id', promptId);

      if (updateError) throw updateError;
      return { brandId };
    },
    onSuccess: ({ brandId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, brandId] });
    },
  });
}

// ── Save manual edits to prompt_text ─────────────────────────────────────────

export function useUpdateGenerationPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      promptId,
      promptText,
      brandId,
    }: {
      promptId: string;
      promptText: string;
      brandId: string;
    }) => {
      const { error } = await supabase
        .from('brand_generation_prompts')
        .update({
          prompt_text: promptText,
          updated_at: new Date().toISOString(),
        })
        .eq('id', promptId);

      if (error) throw error;
      return { brandId };
    },
    onSuccess: ({ brandId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, brandId] });
    },
  });
}

// ── Utility: filter prompt text by active sections ───────────────────────────

export function filterPromptBySections(
  promptText: string,
  toggles: BrandGenerationPromptSectionToggles,
): string {
  // Split by ## headings, keep only sections that are toggled on
  const sectionRegex = /^## /m;
  const parts = promptText.split(sectionRegex);

  // First part is everything before the first ## heading (preamble)
  const preamble = parts[0]?.trim() || '';
  const sections = parts.slice(1);

  const sectionKeyMap: Record<string, keyof BrandGenerationPromptSectionToggles> = {
    'brand identity': 'brand_identity',
    'tone of voice': 'tone_of_voice',
    'visual style': 'visual_style',
    'color palette': 'color_palette',
    'typography': 'typography',
    'photography direction': 'photography_direction',
    'composition rules': 'composition_rules',
    'brand guardrails': 'brand_guardrails',
    'brand story': 'brand_story',
  };

  const enabledSections = sections.filter(section => {
    const firstLine = section.split('\n')[0]?.trim().toLowerCase() || '';
    const key = sectionKeyMap[firstLine];
    // If we can't match the heading, keep it (don't accidentally drop content)
    if (!key) return true;
    return toggles[key];
  });

  const filtered = enabledSections.map(s => `## ${s}`).join('\n');
  return preamble ? `${preamble}\n\n${filtered}` : filtered;
}

// ── Utility: parse sections from prompt text ─────────────────────────────────

export interface ParsedSection {
  key: keyof BrandGenerationPromptSectionToggles | null;
  heading: string;
  content: string;
}

export function parsePromptSections(promptText: string): ParsedSection[] {
  const sectionRegex = /^## /m;
  const parts = promptText.split(sectionRegex).slice(1); // skip preamble

  const sectionKeyMap: Record<string, keyof BrandGenerationPromptSectionToggles> = {
    'brand identity': 'brand_identity',
    'tone of voice': 'tone_of_voice',
    'visual style': 'visual_style',
    'color palette': 'color_palette',
    'typography': 'typography',
    'photography direction': 'photography_direction',
    'composition rules': 'composition_rules',
    'brand guardrails': 'brand_guardrails',
    'brand story': 'brand_story',
  };

  return parts.map(section => {
    const lines = section.split('\n');
    const heading = lines[0]?.trim() || '';
    const content = lines.slice(1).join('\n').trim();
    const key = sectionKeyMap[heading.toLowerCase()] || null;
    return { key, heading, content };
  });
}
