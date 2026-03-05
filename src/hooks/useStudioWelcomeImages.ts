// ABOUTME: Hook to load generated card images for the Creative Studio system welcome screen
// ABOUTME: Reads from site_settings 'creative_studio_welcome_images' key

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type WelcomeImageKey =
  | 'image_generation'
  | 'video_generation'
  | 'editing_suite'
  | 'upscaling'
  | 'product_recontext'
  | 'virtual_tryon'
  | 'conversational_editing'
  | 'camera_controls'
  | 'hero';

export type WelcomeImages = Partial<Record<WelcomeImageKey, string>>;

export const WELCOME_IMAGE_LABELS: Record<WelcomeImageKey, { label: string; description: string }> = {
  image_generation: { label: 'Image Generation', description: 'Text-to-image with brand voice injection' },
  video_generation: { label: 'Video Generation', description: 'Text, image, and director-mode video' },
  editing_suite: { label: 'Editing Suite', description: 'Background swap, object removal, canvas expansion' },
  upscaling: { label: 'Upscaling', description: 'AI-powered resolution enhancement' },
  product_recontext: { label: 'Product Recontext', description: 'Products in AI-generated scenes' },
  virtual_tryon: { label: 'Virtual Try-On', description: 'AI clothing try-on with realistic draping' },
  conversational_editing: { label: 'Conversational Editing', description: 'Chat-based image refinement' },
  camera_controls: { label: 'Camera Controls', description: 'Cinematic presets and lens settings' },
  hero: { label: 'Hero Banner', description: 'Main welcome page header image' },
};

export function useStudioWelcomeImages() {
  return useQuery({
    queryKey: ['studio-welcome-images'],
    queryFn: async (): Promise<WelcomeImages> => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'creative_studio_welcome_images')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return {};
        throw error;
      }

      return (data?.value as WelcomeImages) || {};
    },
    staleTime: 10 * 60 * 1000,
  });
}
