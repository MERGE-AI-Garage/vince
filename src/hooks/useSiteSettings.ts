
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSetting {
  id: string;
  key: string;
  value: any;
  description?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      return data as SiteSetting[];
    },
  });
};

export const useImageGenerationStyles = () => {
  return useQuery({
    queryKey: ['image-generation-styles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .ilike('key', 'image_generation_style_%')
        .order('key');

      if (error) throw error;
      return data as SiteSetting[];
    },
  });
};

export const useUpdateSiteSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: any; description?: string }) => {
      // Automatically set category for settings
      let category = 'general';
      if (key.startsWith('theme_')) {
        category = 'theme';
      } else if (['site_title', 'site_tagline', 'logo_url', 'logo_alt_text', 'footer_logo_url', 'footer_logo_alt_text'].includes(key)) {
        category = 'branding';
      }

      // First try to update existing setting
      const { data: existing, error: fetchError } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        // Update existing setting
        const { data, error } = await supabase
          .from('site_settings')
          .update({
            value,
            description,
            category,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new setting
        const { data, error } = await supabase
          .from('site_settings')
          .insert({
            key,
            value,
            description,
            category,
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-setting'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-settings'] });
      queryClient.invalidateQueries({ queryKey: ['image-generation-styles'] });
      queryClient.invalidateQueries({ queryKey: ['branding-settings'] });
    },
  });
};

export const useCreateSiteSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (setting: Omit<SiteSetting, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('site_settings')
        .insert(setting)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-settings'] });
      queryClient.invalidateQueries({ queryKey: ['image-generation-styles'] });
      queryClient.invalidateQueries({ queryKey: ['branding-settings'] });
    },
  });
};

export const useDeleteSiteSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('site_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-settings'] });
      queryClient.invalidateQueries({ queryKey: ['image-generation-styles'] });
      queryClient.invalidateQueries({ queryKey: ['branding-settings'] });
    },
  });
};

export const useSiteSetting = (key: string) => {
  return useQuery({
    queryKey: ['site-setting', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', key)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as SiteSetting | null;
    },
  });
};

export const useBrandingSettings = () => {
  const query = useQuery({
    queryKey: ['branding-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('category', 'branding')
        .eq('is_active', true)
        .order('key');

      if (error) throw error;
      return data as SiteSetting[];
    },
  });

  // Transform the data to provide individual properties
  const settings = query.data || [];
  const siteTitle = settings.find(s => s.key === 'site_title')?.value || 'Vince';
  const siteTagline = settings.find(s => s.key === 'site_tagline')?.value || 'See Your Brand Clearly';
  const logoUrl = settings.find(s => s.key === 'logo_url')?.value || '';
  const logoAltText = settings.find(s => s.key === 'logo_alt_text')?.value || 'Vince Logo';
  const footerLogoUrl = settings.find(s => s.key === 'footer_logo_url')?.value || '';
  const footerLogoAltText = settings.find(s => s.key === 'footer_logo_alt_text')?.value || 'Vince Footer Logo';

  return {
    ...query,
    siteTitle,
    siteTagline,
    logoUrl,
    logoAltText,
    footerLogoUrl,
    footerLogoAltText,
  };
};
