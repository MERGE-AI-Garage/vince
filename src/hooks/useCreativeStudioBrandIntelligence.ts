// ABOUTME: React Query hooks for brand intelligence - profiles, directives, and analytics
// ABOUTME: Fetches brand visual DNA, agent directives, and prompt counts for UI display

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BrandVisualProfile, AgentDirective } from '@/types/creative-studio';

const PROFILE_KEY = 'creative-studio-brand-profiles';
const DIRECTIVES_KEY = 'creative-studio-agent-directives';
const BRAND_STATS_KEY = 'creative-studio-brand-stats';
const ANALYSES_KEY = 'creative-studio-brand-analyses';

// Fetch brand visual profile
export function useBrandProfile(brandId: string | undefined) {
  return useQuery({
    queryKey: [PROFILE_KEY, brandId],
    queryFn: async () => {
      if (!brandId) return null;

      const { data, error } = await supabase
        .from('creative_studio_brand_profiles')
        .select('*')
        .eq('brand_id', brandId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        brand_id: data.brand_id,
        visual_dna: data.visual_dna || {},
        photography_style: data.photography_style,
        color_profile: data.color_profile,
        composition_rules: data.composition_rules,
        product_catalog: data.product_catalog,
        brand_identity: data.brand_identity || undefined,
        tone_of_voice: data.tone_of_voice || undefined,
        typography: data.typography || undefined,
        brand_story: (data as Record<string, unknown>).brand_story as Record<string, unknown> | undefined,
        brand_standards: (data as Record<string, unknown>).brand_standards as Record<string, unknown> | undefined,
        source_metadata: data.source_metadata || undefined,
        total_images_analyzed: data.total_images_analyzed || 0,
        last_analysis_run: data.last_analysis_run,
        confidence_score: data.confidence_score || 0,
        updated_at: data.updated_at,
      } as BrandVisualProfile;
    },
    enabled: !!brandId,
  });
}

// Fetch active agent directives for a brand
export function useBrandDirectives(brandId: string | undefined) {
  return useQuery({
    queryKey: [DIRECTIVES_KEY, brandId],
    queryFn: async () => {
      if (!brandId) return [];

      const { data, error } = await supabase
        .from('creative_studio_agent_directives')
        .select('*')
        .eq('brand_id', brandId)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(d => ({
        ...d,
        rules: Array.isArray(d.rules) ? d.rules : [],
        forbidden_combinations: d.forbidden_combinations || undefined,
        required_elements: d.required_elements || undefined,
        tone_guidelines: d.tone_guidelines || undefined,
      })) as AgentDirective[];
    },
    enabled: !!brandId,
  });
}

// Aggregated brand stats for display in the selector
export interface BrandStats {
  promptCount: number;
  directiveCount: number;
  imagesAnalyzed: number;
  confidenceScore: number;
  hasProfile: boolean;
}

export function useBrandStats(brandId: string | undefined) {
  return useQuery({
    queryKey: [BRAND_STATS_KEY, brandId],
    queryFn: async (): Promise<BrandStats> => {
      if (!brandId) return { promptCount: 0, directiveCount: 0, imagesAnalyzed: 0, confidenceScore: 0, hasProfile: false };

      const [promptRes, directiveRes, profileRes] = await Promise.all([
        supabase
          .from('creative_studio_brand_prompts')
          .select('id', { count: 'exact', head: true })
          .eq('brand_id', brandId),
        supabase
          .from('creative_studio_agent_directives')
          .select('id', { count: 'exact', head: true })
          .eq('brand_id', brandId)
          .eq('is_active', true),
        supabase
          .from('creative_studio_brand_profiles')
          .select('total_images_analyzed, confidence_score')
          .eq('brand_id', brandId)
          .maybeSingle(),
      ]);

      return {
        promptCount: promptRes.count ?? 0,
        directiveCount: directiveRes.count ?? 0,
        imagesAnalyzed: profileRes.data?.total_images_analyzed ?? 0,
        confidenceScore: profileRes.data?.confidence_score ?? 0,
        hasProfile: !!profileRes.data,
      };
    },
    enabled: !!brandId,
    staleTime: 30_000,
  });
}

// Individual image analyses for a brand
export interface BrandImageAnalysis {
  id: string;
  brand_id: string;
  source_image_url: string;
  analysis_data: Record<string, unknown>;
  tags: string[];
  analyzed_at: string;
  source_type?: 'image' | 'website' | 'document';
}

export function useBrandAnalyses(brandId: string | undefined) {
  return useQuery({
    queryKey: [ANALYSES_KEY, brandId],
    queryFn: async (): Promise<BrandImageAnalysis[]> => {
      if (!brandId) return [];

      const { data, error } = await supabase
        .from('creative_studio_brand_analyses')
        .select('*')
        .eq('brand_id', brandId)
        .order('analyzed_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(d => ({
        id: d.id,
        brand_id: d.brand_id,
        source_image_url: d.source_image_url,
        analysis_data: d.analysis_data || {},
        tags: d.tags || [],
        analyzed_at: d.analyzed_at,
        source_type: d.source_type || 'image',
      }));
    },
    enabled: !!brandId,
  });
}

// Update a specific section of the brand visual profile
export type ProfileSection = 'visual_dna' | 'photography_style' | 'color_profile' | 'composition_rules' | 'product_catalog' | 'brand_identity' | 'tone_of_voice' | 'typography' | 'brand_story';

export function useUpdateBrandProfileSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      brandId,
      section,
      data,
    }: {
      brandId: string;
      section: ProfileSection;
      data: Record<string, unknown>;
    }) => {
      const { error } = await supabase
        .from('creative_studio_brand_profiles')
        .update({
          [section]: data,
          updated_at: new Date().toISOString(),
        })
        .eq('brand_id', brandId);

      if (error) throw error;
    },
    onSuccess: (_, { brandId }) => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_KEY, brandId] });
      queryClient.invalidateQueries({ queryKey: [BRAND_STATS_KEY, brandId] });
    },
  });
}

// Delete a single brand analysis
export function useDeleteBrandAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, brandId }: { id: string; brandId: string }) => {
      const { error } = await (supabase
        .from('creative_studio_brand_analyses') as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return brandId;
    },
    onSuccess: (brandId) => {
      queryClient.invalidateQueries({ queryKey: [ANALYSES_KEY, brandId] });
      queryClient.invalidateQueries({ queryKey: [BRAND_STATS_KEY, brandId] });
    },
  });
}

// Delete entire brand profile
export function useDeleteBrandProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brandId: string) => {
      const { error } = await (supabase
        .from('creative_studio_brand_profiles') as any)
        .delete()
        .eq('brand_id', brandId);

      if (error) throw error;
      return brandId;
    },
    onSuccess: (brandId) => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_KEY, brandId] });
      queryClient.invalidateQueries({ queryKey: [BRAND_STATS_KEY, brandId] });
    },
  });
}

// Analyze a brand's website URL to extract brand DNA
export function useAnalyzeWebsite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      brandId,
      url,
    }: {
      brandId: string;
      url: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('analyze-brand-website', {
        body: { brand_id: brandId, url },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Website analysis failed');

      return data;
    },
    onSuccess: (_, { brandId }) => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_KEY, brandId] });
      queryClient.invalidateQueries({ queryKey: [BRAND_STATS_KEY, brandId] });
      queryClient.invalidateQueries({ queryKey: [ANALYSES_KEY, brandId] });
    },
  });
}
