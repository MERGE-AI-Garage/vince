// ABOUTME: Admin hooks for belt/maturity management — set levels, generate certs, send notifications
// ABOUTME: Powers the Belt Management admin panel and test progression dialog

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserBeltRecord {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  department: string | null;
  current_level_id: string | null;
  level_name: string | null;
  level_number: number | null;
  belt_color: string | null;
  level_slug: string | null;
  total_programs_completed: number;
  last_activity_at: string | null;
  level_history: Array<{
    level_id: string;
    level_name: string;
    level_number?: number;
    reached_at: string;
    previous_level_id?: string;
    set_by_admin?: string;
  }>;
  has_certificate: boolean;
}

export interface BeltCertificate {
  id: string;
  user_id: string;
  maturity_level_id: string;
  certificate_number: string;
  verification_code: string;
  certificate_url: string | null;
  metadata: Record<string, any>;
  issued_at: string;
  created_at: string;
}

// Belt color → prompt slug mapping
const BELT_PROMPT_SLUGS: Record<string, string> = {
  white: 'belt-certificate-white',
  yellow: 'belt-certificate-yellow',
  green: 'belt-certificate-green',
  blue: 'belt-certificate-blue',
  purple: 'belt-certificate-purple',
  black: 'belt-certificate-black',
};

export function getBeltPromptSlug(levelSlug: string | null): string {
  if (!levelSlug) return 'course-completion-certificate';
  const map: Record<string, string> = {
    explorer: 'belt-certificate-white',
    creator: 'belt-certificate-yellow',
    builder: 'belt-certificate-green',
    innovator: 'belt-certificate-blue',
    architect: 'belt-certificate-purple',
    master: 'belt-certificate-black',
  };
  return map[levelSlug] || 'course-completion-certificate';
}

// Fetch all users with belt data (admin)
export const useAllUserBelts = () => {
  return useQuery({
    queryKey: ['admin-user-belts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_user_belts');
      if (error) throw error;
      return (data || []) as UserBeltRecord[];
    },
    staleTime: 15000,
    refetchOnMount: true,
  });
};

// Set any user's belt level (admin promote/demote/set)
export const useSetUserBelt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, levelId, levelName }: {
      userId: string;
      levelId: string;
      levelName: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('admin_set_user_belt', {
        p_user_id: userId,
        p_level_id: levelId,
        p_admin_id: user.id,
      });

      if (error) throw error;
      return { data, levelName };
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-belts'] });
      queryClient.invalidateQueries({ queryKey: ['user-maturity'] });
      queryClient.invalidateQueries({ queryKey: ['user-maturity-by-id'] });
      toast.success(`Belt set to ${variables.levelName}`);
    },
    onError: (error: Error) => {
      console.error('Error setting user belt:', error);
      toast.error(`Failed to set belt level: ${error.message}`);
    },
  });
};

// Reset a user's belt (remove belt while preserving history)
export const useResetUserBelt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('admin_reset_user_belt', {
        p_user_id: userId,
        p_admin_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-belts'] });
      queryClient.invalidateQueries({ queryKey: ['user-maturity'] });
      queryClient.invalidateQueries({ queryKey: ['user-maturity-by-id'] });
      toast.success('Belt removed');
    },
    onError: (error: Error) => {
      console.error('Error removing user belt:', error);
      toast.error(`Failed to remove belt: ${error.message}`);
    },
  });
};

// Generate a belt certificate for a user
export const useGenerateBeltCertificate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, levelId, levelName, levelSlug, userName }: {
      userId: string;
      levelId: string;
      levelName: string;
      levelSlug: string;
      userName: string;
    }) => {
      const promptSlug = getBeltPromptSlug(levelSlug);

      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: {
          user_id: userId,
          certificate_type: 'belt',
          maturity_level_id: levelId,
          course_id: levelId,
          course_title: levelName,
          user_name: userName,
          completion_date: new Date().toISOString(),
          prompt_slug: promptSlug,
          extra_placeholders: {
            belt_name: levelName,
            specialization: '',
            track_name: 'AI Enablement',
            programs_completed: '',
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-belts'] });
      queryClient.invalidateQueries({ queryKey: ['belt-certificates'] });
      toast.success('Belt certificate generated');
    },
    onError: (error: Error) => {
      console.error('Error generating belt certificate:', error);
      toast.error(`Certificate generation failed: ${error.message}`);
    },
  });
};

// Send belt advancement notification email
export const useSendBeltNotification = () => {
  return useMutation({
    mutationFn: async ({ userId, beltName, certificateImageUrl }: {
      userId: string;
      beltName: string;
      certificateImageUrl?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('send-enablement-notification', {
        body: {
          event_type: 'belt_advancement',
          user_id: userId,
          belt_name: beltName,
          certificate_image_url: certificateImageUrl,
        },
      });

      if (error) {
        // Extract detailed error from response body when available
        const context = (error as any).context;
        if (context?.json) {
          try {
            const body = await context.json();
            throw new Error(body.error || body.details?.message || error.message);
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== error.message) throw parseErr;
          }
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Belt advancement notification sent');
    },
    onError: (error: Error) => {
      console.error('Error sending belt notification:', error);
      toast.error(`Notification failed: ${error.message}`);
    },
  });
};

// Fetch belt certificates for a specific user
export const useUserBeltCertificates = (userId?: string) => {
  return useQuery({
    queryKey: ['belt-certificates', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('belt_certificates')
        .select('*')
        .eq('user_id', userId)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      return (data || []) as BeltCertificate[];
    },
    enabled: !!userId,
    staleTime: 15000,
  });
};
