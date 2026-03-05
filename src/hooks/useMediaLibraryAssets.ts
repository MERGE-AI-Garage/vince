// ABOUTME: React Query hook for fetching recent assets from the media library
// ABOUTME: Supports both image and video file types for asset pickers

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MediaLibraryAsset {
  id: string;
  filename: string;
  url: string;
  mime_type: string;
}

export function useMediaLibraryAssets(fileType: 'image' | 'video' = 'image', limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['media-library-assets', user?.id, fileType, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media')
        .select('id, filename, url, mime_type')
        .is('deleted_at', null)
        .eq('file_type', fileType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as MediaLibraryAsset[];
    },
    enabled: !!user?.id,
  });
}
