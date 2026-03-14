// ABOUTME: React Query hooks for Creative Studio generation history and analytics
// ABOUTME: Server-side aggregation via Postgres RPCs, real-time subscriptions, budget tracking

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type {
  GenerationWithDetails,
  GenerationType,
  GenerationStatus,
  GenerationStats,
  CostAnalytics,
  TopUser,
  PromptAnalytics,
  BudgetStatus,
} from '@/types/creative-studio';

const QUERY_KEY = 'creative-studio-generations';

interface GenerationFilters {
  status?: GenerationStatus;
  type?: GenerationType;
  userId?: string;
  modelId?: string;
  brandId?: string;
  limit?: number;
  offset?: number;
}

// ── Real-time subscription ───────────────────────────────────────────────────

export function useRealtimeGenerations() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('creative-studio-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'creative_studio_generations',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'creative_studio_generations',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// ── User's own generations ───────────────────────────────────────────────────

export function useMyGenerations(limit = 50) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: [QUERY_KEY, 'my', profile?.id, limit],
    queryFn: async () => {
      if (!profile?.id) {
        return [];
      }

      const { data, error } = await supabase
        .from('creative_studio_generations')
        .select(`
          *,
          model:creative_studio_models(*),
          brand:creative_studio_brands(*),
          user:profiles!user_id(full_name, avatar_url)
        `)
        .or(`user_id.eq.${profile.id},user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data || []).map(gen => ({
        ...gen,
        parameters: gen.parameters as Record<string, unknown>,
        metadata: gen.metadata as Record<string, unknown>,
        model: gen.model ? {
          ...gen.model,
          capabilities: gen.model.capabilities as string[],
          parameters: gen.model.parameters as Record<string, unknown>,
        } : undefined,
        brand: gen.brand ? {
          ...gen.brand,
          quick_prompts: gen.brand.quick_prompts as unknown[],
        } : undefined,
      })) as GenerationWithDetails[];
    },
    enabled: !!profile?.id,
  });
}

// ── All generations (admin) ──────────────────────────────────────────────────

export function useAllGenerations(filters: GenerationFilters = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, 'all', filters],
    queryFn: async () => {
      let query = supabase
        .from('creative_studio_generations')
        .select(`
          *,
          model:creative_studio_models(*),
          brand:creative_studio_brands(*),
          user:profiles!user_id(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.type) {
        query = query.eq('generation_type', filters.type);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.modelId) {
        query = query.eq('model_id', filters.modelId);
      }
      if (filters.brandId) {
        query = query.eq('brand_id', filters.brandId);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map(gen => ({
        ...gen,
        parameters: gen.parameters as Record<string, unknown>,
        metadata: gen.metadata as Record<string, unknown>,
        model: gen.model ? {
          ...gen.model,
          capabilities: gen.model.capabilities as string[],
          parameters: gen.model.parameters as Record<string, unknown>,
        } : undefined,
        brand: gen.brand ? {
          ...gen.brand,
          quick_prompts: gen.brand.quick_prompts as unknown[],
        } : undefined,
      })) as GenerationWithDetails[];
    },
  });
}

// ── Generation by ID ─────────────────────────────────────────────────────────

export function useGeneration(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('creative_studio_generations')
        .select(`
          *,
          model:creative_studio_models(*),
          brand:creative_studio_brands(*),
          user:profiles!user_id(full_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        parameters: data.parameters as Record<string, unknown>,
        metadata: data.metadata as Record<string, unknown>,
        model: data.model ? {
          ...data.model,
          capabilities: data.model.capabilities as string[],
          parameters: data.model.parameters as Record<string, unknown>,
        } : undefined,
        brand: data.brand ? {
          ...data.brand,
          quick_prompts: data.brand.quick_prompts as unknown[],
        } : undefined,
      } as GenerationWithDetails;
    },
    enabled: !!id,
  });
}

// ── Server-side generation stats via RPC ─────────────────────────────────────

export function useGenerationStats(days = 30, offsetDays = 0) {
  return useQuery({
    queryKey: [QUERY_KEY, 'stats', days, offsetDays],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_generation_stats', {
        p_days: days,
        p_offset_days: offsetDays,
      });

      if (error) throw error;

      const raw = data as Record<string, unknown>;
      return {
        total_generations: Number(raw.total_generations) || 0,
        image_generations: Number(raw.image_generations) || 0,
        video_generations: Number(raw.video_generations) || 0,
        successful_generations: Number(raw.successful_generations) || 0,
        failed_generations: Number(raw.failed_generations) || 0,
        success_rate: Number(raw.success_rate) || 0,
        average_generation_time_ms: Number(raw.average_generation_time_ms) || 0,
        total_estimated_cost: Number(raw.total_estimated_cost) || 0,
        unique_users: Number(raw.unique_users) || 0,
        generations_by_type: (raw.generations_by_type as Array<{ type: string; count: number }>) || [],
        generations_by_model: (raw.generations_by_model as Array<{ model_name: string; count: number }>) || [],
        generations_over_time: (raw.generations_over_time as Array<{ date: string; count: number }>) || [],
        cost_by_model: ((raw.cost_by_model as Array<{ model_name: string; cost: number }>) || []).map(m => ({
          ...m,
          cost: Number(m.cost) || 0,
        })),
        generations_by_brand: (raw.generations_by_brand as Array<{ brand_id: string | null; brand_name: string; count: number }>) || [],
        generations_by_hour: (raw.generations_by_hour as Array<{ hour: number; count: number }>) || [],
      } as GenerationStats;
    },
  });
}

// ── Period-over-period comparison ────────────────────────────────────────────

export function useGenerationStatsComparison(days = 30) {
  const { data: current } = useGenerationStats(days, 0);
  const { data: previous } = useGenerationStats(days, days);

  if (!current || !previous) return null;

  return {
    current,
    previous,
    deltas: {
      total_generations: computeDelta(current.total_generations, previous.total_generations),
      total_estimated_cost: computeDelta(current.total_estimated_cost, previous.total_estimated_cost),
      unique_users: computeDelta(current.unique_users, previous.unique_users),
      image_generations: computeDelta(current.image_generations, previous.image_generations),
      video_generations: computeDelta(current.video_generations, previous.video_generations),
    },
  };
}

function computeDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

// ── Cost analytics (SQL view) ────────────────────────────────────────────────

export function useCostAnalytics(days = 30) {
  return useQuery({
    queryKey: [QUERY_KEY, 'cost-analytics', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('creative_studio_cost_analytics')
        .select('*')
        .gte('date', startDate.toISOString())
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as CostAnalytics[];
    },
  });
}

// ── Chart drill-down filter ──────────────────────────────────────────────────

export function useGenerationsByFilter(filter: {
  date?: string;
  type?: string;
  model?: string;
  promptSearch?: string;
  promptExact?: string;
} | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'by-filter', filter],
    queryFn: async () => {
      if (!filter) return [];

      let query = supabase
        .from('creative_studio_generations')
        .select(`
          *,
          user:profiles!user_id(full_name, avatar_url, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter.date) {
        query = query
          .gte('created_at', `${filter.date}T00:00:00`)
          .lt('created_at', `${filter.date}T23:59:59.999`);
      }
      if (filter.type) query = query.eq('generation_type', filter.type);
      if (filter.model) query = query.eq('model_used', filter.model);
      if (filter.promptSearch) query = query.ilike('prompt_text', `%${filter.promptSearch}%`);
      if (filter.promptExact) query = query.eq('prompt_text', filter.promptExact);

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(gen => ({
        ...gen,
        parameters: gen.parameters as Record<string, unknown>,
        metadata: gen.metadata as Record<string, unknown>,
      })) as GenerationWithDetails[];
    },
    enabled: !!filter,
  });
}

// ── User's generations (admin drill-down) ────────────────────────────────────

export function useGenerationsByUser(userId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'by-user', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('creative_studio_generations')
        .select(`
          *,
          model:creative_studio_models(*),
          brand:creative_studio_brands(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      return (data || []).map(gen => ({
        ...gen,
        parameters: gen.parameters as Record<string, unknown>,
        metadata: gen.metadata as Record<string, unknown>,
        model: gen.model ? {
          ...gen.model,
          capabilities: gen.model.capabilities as string[],
          parameters: gen.model.parameters as Record<string, unknown>,
        } : undefined,
        brand: gen.brand ? {
          ...gen.brand,
          quick_prompts: gen.brand.quick_prompts as unknown[],
        } : undefined,
      })) as GenerationWithDetails[];
    },
    enabled: !!userId,
  });
}

// ── Top users via RPC ────────────────────────────────────────────────────────

export function useTopUsers(days = 30, limit = 20) {
  return useQuery({
    queryKey: [QUERY_KEY, 'top-users', days, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_users', {
        p_days: days,
        p_limit: limit,
      });

      if (error) throw error;

      return ((data as unknown as TopUser[]) || []).map(u => ({
        ...u,
        total_cost: Number(u.total_cost) || 0,
        success_rate: Number(u.success_rate) || 0,
        generation_count: Number(u.generation_count) || 0,
        successful_count: Number(u.successful_count) || 0,
        failed_count: Number(u.failed_count) || 0,
        types_used: Number(u.types_used) || 0,
      }));
    },
  });
}

// ── Budget status ────────────────────────────────────────────────────────────

export function useBudgetStatus() {
  return useQuery({
    queryKey: [QUERY_KEY, 'budget-status'],
    queryFn: async () => {
      // Get the threshold setting
      const { data: settings, error: settingsError } = await supabase
        .from('creative_studio_cost_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['budget_alert_threshold']);

      if (settingsError) throw settingsError;

      const thresholdRow = settings?.find(s => s.setting_key === 'budget_alert_threshold');
      const threshold = Number(thresholdRow?.setting_value) || 0;

      if (threshold <= 0) return null;

      // Get current month spend
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: spendData, error: spendError } = await supabase
        .from('creative_studio_generations')
        .select('estimated_cost_usd')
        .gte('created_at', monthStart.toISOString());

      if (spendError) throw spendError;

      const currentSpend = (spendData || []).reduce(
        (sum, g) => sum + (Number(g.estimated_cost_usd) || 0),
        0
      );

      const percentUsed = threshold > 0 ? (currentSpend / threshold) * 100 : 0;

      return {
        threshold,
        currentSpend,
        percentUsed,
        isOverBudget: currentSpend >= threshold,
      } as BudgetStatus;
    },
    refetchInterval: 60000, // Re-check every minute
  });
}

// ── Prompt analytics via RPC ─────────────────────────────────────────────────

export function usePromptAnalytics(days = 30) {
  return useQuery({
    queryKey: [QUERY_KEY, 'prompt-analytics', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_prompt_analytics', {
        p_days: days,
      });

      if (error) throw error;

      const raw = data as Record<string, unknown>;
      return {
        avg_length: Number(raw.avg_length) || 0,
        total_prompts: Number(raw.total_prompts) || 0,
        length_distribution: (raw.length_distribution as PromptAnalytics['length_distribution']) || [],
        reused_prompts: (raw.reused_prompts as PromptAnalytics['reused_prompts']) || [],
        top_keywords: (raw.top_keywords as PromptAnalytics['top_keywords']) || [],
      } as PromptAnalytics;
    },
  });
}

// ── Invalidate generations queries ───────────────────────────────────────────

export function useInvalidateGenerations() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  };
}
