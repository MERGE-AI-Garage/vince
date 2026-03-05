// ABOUTME: React Query hooks for Creative Studio audit log with filtering and stats
// ABOUTME: Reads from creative_studio_audit_log table for admin activity monitoring

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const AUDIT_KEY = 'creative-studio-audit-log';
const AUDIT_STATS_KEY = 'creative-studio-audit-stats';

export interface CreativeStudioAuditEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  action: string;
  generation_id: string | null;
  brand_id: string | null;
  model_used: string | null;
  prompt_text: string | null;
  parameters: Record<string, unknown> | null;
  estimated_cost_usd: number | null;
  actual_cost_usd: number | null;
  compliance_check_result: Record<string, unknown> | null;
  ip_address: string | null;
  session_id: string | null;
  created_at: string;
}

export interface AuditFilters {
  action: string;
  date_range: 'today' | 'week' | 'month' | 'all';
  user_email: string;
}

export interface AuditStats {
  total_today: number;
  total_this_week: number;
  total_this_month: number;
  total_cost_this_month: number;
  unique_users_this_week: number;
}

function getDateCutoff(range: string): string | null {
  const now = new Date();
  switch (range) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return start.toISOString();
    }
    case 'week': {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return weekAgo.toISOString();
    }
    case 'month': {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return monthAgo.toISOString();
    }
    default:
      return null;
  }
}

export function useCreativeStudioAuditLog(
  filters: Partial<AuditFilters> = {},
  limit = 200
) {
  return useQuery({
    queryKey: [AUDIT_KEY, filters, limit],
    queryFn: async () => {
      let query = supabase
        .from('creative_studio_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filters.action && filters.action !== 'all') {
        query = query.eq('action', filters.action);
      }

      if (filters.date_range && filters.date_range !== 'all') {
        const cutoff = getDateCutoff(filters.date_range);
        if (cutoff) {
          query = query.gte('created_at', cutoff);
        }
      }

      if (filters.user_email) {
        query = query.ilike('user_email', `%${filters.user_email}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CreativeStudioAuditEntry[];
    },
  });
}

export function useCreativeStudioAuditStats() {
  return useQuery({
    queryKey: [AUDIT_STATS_KEY],
    queryFn: async (): Promise<AuditStats> => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [todayRes, weekRes, monthRes, costRes, usersRes] = await Promise.all([
        supabase
          .from('creative_studio_audit_log')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', todayStart),
        supabase
          .from('creative_studio_audit_log')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', weekAgo),
        supabase
          .from('creative_studio_audit_log')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', monthAgo),
        supabase
          .from('creative_studio_audit_log')
          .select('estimated_cost_usd')
          .gte('created_at', monthAgo)
          .not('estimated_cost_usd', 'is', null),
        supabase
          .from('creative_studio_audit_log')
          .select('user_email')
          .gte('created_at', weekAgo),
      ]);

      const totalCost = (costRes.data || []).reduce(
        (sum, row) => sum + (Number(row.estimated_cost_usd) || 0),
        0
      );

      const uniqueUsers = new Set(
        (usersRes.data || []).map(r => r.user_email).filter(Boolean)
      ).size;

      return {
        total_today: todayRes.count ?? 0,
        total_this_week: weekRes.count ?? 0,
        total_this_month: monthRes.count ?? 0,
        total_cost_this_month: totalCost,
        unique_users_this_week: uniqueUsers,
      };
    },
    staleTime: 30_000,
  });
}
