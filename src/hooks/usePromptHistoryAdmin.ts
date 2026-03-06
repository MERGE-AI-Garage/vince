// ABOUTME: React Query hooks for browsing brand_prompt_history as an admin
// ABOUTME: Supports filtering, pagination, stats, and promote-to-template workflow

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const HISTORY_KEY = 'brand-prompt-history-admin';
const STATS_KEY = 'brand-prompt-history-stats';

export interface PromptHistoryEntry {
  id: string;
  user_id: string | null;
  brand_id: string | null;
  category: string;
  description: string;
  generated_prompt: string;
  platform: string | null;
  is_favorited: boolean;
  is_promoted: boolean;
  promoted_to_preset_id: string | null;
  created_at: string;
  // Joined fields
  user_email?: string | null;
  user_name?: string | null;
  brand_name?: string | null;
  brand_color?: string | null;
}

export interface PromptHistoryFilters {
  brand_id: string;
  category: string;
  date_range: '7d' | '30d' | '90d' | 'all';
  favorited_only: boolean;
  search: string;
  user_id: string;
}

export interface PromptHistoryStats {
  total: number;
  unique_users: number;
  favorited: number;
  promoted: number;
}

export interface PromptHistoryUser {
  id: string;
  label: string;
  email: string | null;
}

function getDateCutoff(range: string): string | null {
  const now = new Date();
  switch (range) {
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    default: return null;
  }
}

export function usePromptHistoryAdmin(
  filters: Partial<PromptHistoryFilters> = {},
  limit = 50
) {
  return useQuery({
    queryKey: [HISTORY_KEY, filters, limit],
    queryFn: async () => {
      let query = supabase
        .from('brand_prompt_history')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filters.brand_id && filters.brand_id !== 'all') {
        query = query.eq('brand_id', filters.brand_id);
      }
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters.user_id && filters.user_id !== 'all') {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.favorited_only) {
        query = query.eq('is_favorited', true);
      }
      const cutoff = getDateCutoff(filters.date_range || 'all');
      if (cutoff) {
        query = query.gte('created_at', cutoff);
      }
      if (filters.search) {
        query = query.or(
          `description.ilike.%${filters.search}%,generated_prompt.ilike.%${filters.search}%`
        );
      }

      const { data, count, error } = await query;
      if (error) throw error;

      const entries = (data || []) as PromptHistoryEntry[];
      if (entries.length === 0) return { entries, totalCount: count ?? 0 };

      // Batch-resolve user and brand display names
      const userIds = [...new Set(entries.map(e => e.user_id).filter(Boolean))] as string[];
      const brandIds = [...new Set(entries.map(e => e.brand_id).filter(Boolean))] as string[];

      const [profilesResult, brandsResult] = await Promise.all([
        userIds.length > 0
          ? supabase.from('profiles').select('id, email, full_name').in('id', userIds)
          : { data: [] },
        brandIds.length > 0
          ? supabase.from('creative_studio_brands').select('id, name, primary_color').in('id', brandIds)
          : { data: [] },
      ]);

      const userMap = new Map(
        (profilesResult.data || []).map(p => [p.id, { email: p.email, name: p.full_name }])
      );
      const brandMap = new Map(
        (brandsResult.data || []).map(b => [b.id, { name: b.name, color: b.primary_color }])
      );

      const enriched = entries.map(entry => ({
        ...entry,
        is_favorited: entry.is_favorited ?? false,
        is_promoted: entry.is_promoted ?? false,
        user_email: entry.user_id ? userMap.get(entry.user_id)?.email || null : null,
        user_name: entry.user_id ? userMap.get(entry.user_id)?.name || null : null,
        brand_name: entry.brand_id ? brandMap.get(entry.brand_id)?.name || null : null,
        brand_color: entry.brand_id ? brandMap.get(entry.brand_id)?.color || null : null,
      }));

      return { entries: enriched, totalCount: count ?? 0 };
    },
    refetchOnWindowFocus: false,
  });
}

export function usePromptHistoryStats() {
  return useQuery({
    queryKey: [STATS_KEY],
    queryFn: async () => {
      const [totalRes, usersRes, favRes, promoRes] = await Promise.all([
        supabase
          .from('brand_prompt_history')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('brand_prompt_history')
          .select('user_id')
          .not('user_id', 'is', null),
        supabase
          .from('brand_prompt_history')
          .select('id', { count: 'exact', head: true })
          .eq('is_favorited', true),
        supabase
          .from('brand_prompt_history')
          .select('id', { count: 'exact', head: true })
          .eq('is_promoted', true),
      ]);

      const uniqueUsers = new Set(
        (usersRes.data || []).map(r => r.user_id).filter(Boolean)
      ).size;

      return {
        total: totalRes.count ?? 0,
        unique_users: uniqueUsers,
        favorited: favRes.count ?? 0,
        promoted: promoRes.count ?? 0,
      } as PromptHistoryStats;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function usePromptHistoryUsers() {
  return useQuery({
    queryKey: [HISTORY_KEY, 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_prompt_history')
        .select('user_id')
        .not('user_id', 'is', null);
      if (error) throw error;

      const uniqueIds = [...new Set((data || []).map(r => r.user_id).filter(Boolean))] as string[];
      if (uniqueIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', uniqueIds)
        .order('full_name');

      return (profiles || []).map(p => ({
        id: p.id,
        label: p.full_name || p.email || p.id,
        email: p.email,
      })) as PromptHistoryUser[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function usePromoteToTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      historyId: string;
      brandId: string;
      name: string;
      category: string;
      promptTemplate: string;
      userId?: string;
    }) => {
      // Insert into prompt library
      const { data: template, error: insertError } = await supabase
        .from('creative_studio_brand_prompts')
        .insert({
          brand_id: params.brandId,
          name: params.name,
          prompt_template: params.promptTemplate,
          category: params.category,
          content_type: 'image',
          locked_parameters: {},
          variable_fields: [],
          is_auto_generated: false,
          usage_count: 0,
          created_by: params.userId || null,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Mark history entry as promoted
      const { error: updateError } = await supabase
        .from('brand_prompt_history')
        .update({
          is_promoted: true,
          promoted_to_preset_id: template.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.historyId);

      if (updateError) throw updateError;

      return template.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HISTORY_KEY] });
      queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
    },
  });
}
