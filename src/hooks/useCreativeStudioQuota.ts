// ABOUTME: React Query hooks for Creative Studio quota and cost management
// ABOUTME: Handles user quota checks, cost settings, and usage analytics

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type {
  QuotaCheckResult,
  UserQuotaDisplay,
  CostSettings,
  GenerationType,
} from '@/types/creative-studio';

const QUOTA_KEY = 'creative-studio-quota';
const COST_KEY = 'creative-studio-cost-settings';

// Get current user's quota status
export function useCreativeStudioQuota(generationType: GenerationType = 'text_to_image') {
  const { profile } = useAuth();

  return useQuery({
    queryKey: [QUOTA_KEY, profile?.id, generationType],
    queryFn: async () => {
      if (!profile?.id) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .rpc('can_user_generate_creative', {
          p_user_id: profile.id,
          p_generation_type: generationType,
        })
        .single();

      if (error) {
        throw error;
      }

      return data as QuotaCheckResult;
    },
    enabled: !!profile?.id,
    staleTime: 30000, // 30 seconds
  });
}

// Get both image and video quota for display
export function useCreativeStudioFullQuota() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: [QUOTA_KEY, 'full', profile?.id],
    queryFn: async () => {
      if (!profile?.id) {
        throw new Error('Not authenticated');
      }

      // Get image quota
      const { data: imageQuota, error: imageError } = await supabase
        .rpc('can_user_generate_creative', {
          p_user_id: profile.id,
          p_generation_type: 'text_to_image',
        })
        .single();

      if (imageError) {
        throw imageError;
      }

      // Get video quota
      const { data: videoQuota, error: videoError } = await supabase
        .rpc('can_user_generate_creative', {
          p_user_id: profile.id,
          p_generation_type: 'text_to_video',
        })
        .single();

      if (videoError) {
        throw videoError;
      }

      return {
        image: imageQuota as QuotaCheckResult,
        video: videoQuota as QuotaCheckResult,
        period_end: (imageQuota as QuotaCheckResult).period_end,
        is_unlimited: (imageQuota as QuotaCheckResult).is_unlimited,
      };
    },
    enabled: !!profile?.id,
    staleTime: 30000,
  });
}

// Get cost settings
export function useCostSettings() {
  return useQuery({
    queryKey: [COST_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creative_studio_cost_settings')
        .select('*');

      if (error) {
        throw error;
      }

      // Convert to CostSettings object
      const settings: Record<string, string | number | boolean> = {};
      for (const row of data || []) {
        const value = row.setting_value;
        // Parse JSON value
        if (typeof value === 'string') {
          if (value === 'true') settings[row.setting_key] = true;
          else if (value === 'false') settings[row.setting_key] = false;
          else if (!isNaN(Number(value))) settings[row.setting_key] = Number(value);
          else settings[row.setting_key] = value;
        } else {
          settings[row.setting_key] = value;
        }
      }

      return {
        default_image_weekly_limit: (settings.default_image_weekly_limit as number) || 20,
        default_video_weekly_limit: (settings.default_video_weekly_limit as number) || 5,
        image_cost: (settings.image_cost as number) || 0.075,
        video_cost: (settings.video_cost as number) || 0.50,
        budget_alert_threshold: (settings.budget_alert_threshold as number) || 500,
        admin_email_alerts: (settings.admin_email_alerts as boolean) ?? true,
      } as CostSettings;
    },
    staleTime: 60000, // 1 minute
  });
}

// Update cost setting (admin)
export function useUpdateCostSetting() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      setting_key,
      setting_value,
    }: {
      setting_key: string;
      setting_value: string | number | boolean;
    }) => {
      const { error } = await supabase
        .from('creative_studio_cost_settings')
        .update({
          setting_value: String(setting_value),
          updated_by: profile?.id,
        })
        .eq('setting_key', setting_key);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COST_KEY] });
    },
  });
}

// Get all users' quota usage (admin)
export function useAllUsersQuotaUsage() {
  return useQuery({
    queryKey: [QUOTA_KEY, 'all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creative_studio_current_week_usage')
        .select('*')
        .order('image_generations_used', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as UserQuotaDisplay[];
    },
  });
}

// Per-user actual costs for the current week (admin)
export interface WeeklyUserCost {
  user_id: string;
  total_cost: number;
  image_cost: number;
  video_cost: number;
  image_count: number;
  video_count: number;
}

export function useWeeklyUserCosts() {
  return useQuery({
    queryKey: [QUOTA_KEY, 'weekly-costs'],
    queryFn: async () => {
      // Start of current week (Monday UTC)
      const now = new Date();
      const day = now.getUTCDay();
      const monday = new Date(now);
      monday.setUTCDate(now.getUTCDate() - day + (day === 0 ? -6 : 1));
      monday.setUTCHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('creative_studio_generations')
        .select('user_id, generation_type, estimated_cost_usd')
        .eq('status', 'completed')
        .gte('created_at', monday.toISOString());

      if (error) throw error;

      // Group by user, split image vs. video costs
      const userMap = new Map<string, WeeklyUserCost>();
      for (const gen of data || []) {
        if (!gen.user_id) continue;
        if (!userMap.has(gen.user_id)) {
          userMap.set(gen.user_id, {
            user_id: gen.user_id,
            total_cost: 0,
            image_cost: 0,
            video_cost: 0,
            image_count: 0,
            video_count: 0,
          });
        }
        const entry = userMap.get(gen.user_id)!;
        const cost = Number(gen.estimated_cost_usd) || 0;
        const isVideo = ['text_to_video', 'image_to_video'].includes(gen.generation_type);
        entry.total_cost += cost;
        if (isVideo) {
          entry.video_cost += cost;
          entry.video_count += 1;
        } else {
          entry.image_cost += cost;
          entry.image_count += 1;
        }
      }

      return userMap;
    },
    staleTime: 30000,
  });
}

// Update user's quota limit (admin)
export function useUpdateUserQuotaLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      user_id,
      image_generations_limit,
      video_generations_limit,
      is_unlimited,
    }: {
      user_id: string;
      image_generations_limit?: number;
      video_generations_limit?: number;
      is_unlimited?: boolean;
    }) => {
      // First, ensure quota record exists
      await supabase.rpc('get_or_create_creative_quota', { p_user_id: user_id });

      // Then update the limits
      const period_start = new Date();
      period_start.setUTCHours(0, 0, 0, 0);
      // Set to start of week (Monday)
      const day = period_start.getUTCDay();
      const diff = period_start.getUTCDate() - day + (day === 0 ? -6 : 1);
      period_start.setUTCDate(diff);

      const { error } = await supabase
        .from('creative_studio_user_quotas')
        .update({
          image_generations_limit,
          video_generations_limit,
          is_unlimited,
        })
        .eq('user_id', user_id)
        .eq('period_start', period_start.toISOString());

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUOTA_KEY] });
    },
  });
}
