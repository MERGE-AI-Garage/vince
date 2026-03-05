// ABOUTME: React Query hook for lab exercise generation quota
// ABOUTME: Checks lab-specific quota separate from regular Creative Studio quota

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { QuotaCheckResult } from '@/types/creative-studio';

const LAB_QUOTA_KEY = 'lab-quota';

export function useLabQuota(enabled = true) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: [LAB_QUOTA_KEY, profile?.id],
    queryFn: async () => {
      if (!profile?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .rpc('can_user_generate_lab', { p_user_id: profile.id })
        .single();

      if (error) throw error;
      return data as QuotaCheckResult;
    },
    enabled: enabled && !!profile?.id,
    staleTime: 30000,
  });
}

export { LAB_QUOTA_KEY };
