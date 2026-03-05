import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const isDev = process.env.NODE_ENV === 'development';

export interface OptimizedSitePageData {
  page: {
    id: string;
    page_key: string;
    title: string;
    description?: string;
    hero_content?: any;
    metadata?: any;
    is_active: boolean;
  } | null;
  sections: Array<{
    id: string;
    section_key: string;
    section_name: string;
    content: any;
    is_enabled: boolean;
    display_order: number;
  }>;
}

export const useOptimizedSitePageData = (pageKey: string) => {
  return useQuery({
    queryKey: ['optimized-site-page-data', pageKey],
    queryFn: async (): Promise<OptimizedSitePageData> => {
      try {
        if (isDev) {
          console.log(`[CMS Query:${pageKey}] Fetching page data...`);
        }

        // First, fetch the page
        const pageResult = await supabase
          .from('site_pages')
          .select('id, page_key, title, description, hero_content, metadata, is_active')
          .eq('page_key', pageKey)
          .eq('is_active', true)
          .maybeSingle();

        if (pageResult.error) {
          console.warn(`[CMS Query:${pageKey}] Page query error:`, pageResult.error);
          throw pageResult.error;
        }

        const page = pageResult.data;
        let sections: any[] = [];

        // Only query sections if we found a page (filter by page_id in the database)
        if (page) {
          const sectionsResult = await supabase
            .from('site_page_sections')
            .select('id, section_key, section_type, content, is_enabled, display_order, page_id')
            .eq('page_id', page.id)
            .eq('is_enabled', true)
            .order('display_order');

          if (sectionsResult.error) {
            console.warn(`[CMS Query:${pageKey}] Sections query error:`, sectionsResult.error);
            throw sectionsResult.error;
          }

          sections = sectionsResult.data || [];
        }

        if (isDev) {
          console.log(`[CMS Query:${pageKey}] Results:`, {
            pageFound: !!page,
            pageId: page?.id,
            heroContent: page?.hero_content,
            sectionsCount: sections.length,
            sectionKeys: sections.map(s => s.section_key),
          });
        }

        return {
          page: page || null,
          sections: sections.map(section => ({
            id: section.id,
            section_key: section.section_key,
            section_name: section.section_type, // Map section_type to section_name for compatibility
            content: section.content,
            is_enabled: section.is_enabled,
            display_order: section.display_order
          }))
        };

      } catch (error: any) {
        // Graceful fallback - return default structure if queries fail
        console.warn(`[CMS Query:${pageKey}] Failed to load page data:`, error);

        return {
          page: {
            id: 'fallback',
            page_key: pageKey,
            title: getDefaultTitle(pageKey),
            description: getDefaultDescription(pageKey),
            hero_content: null,
            metadata: null,
            is_active: true
          },
          sections: getDefaultSections(pageKey)
        };
      }
    },
    staleTime: 30 * 1000, // 30 seconds - fast updates for editor changes
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    retry: 1,
    retryDelay: 1000,
  });
};

// Helper functions for fallback content
const getDefaultTitle = (pageKey: string): string => {
  switch (pageKey) {
    case 'platforms': return 'AI Platform Hub';
    case 'learning': return 'Learning Hub';
    case 'innovation_lab': return 'Strategic Initiatives';
    case 'use_cases': return 'Use Cases';
    default: return 'AI Garage';
  }
};

const getDefaultDescription = (pageKey: string): string => {
  switch (pageKey) {
    case 'platforms': return 'Discover and explore AI platforms and tools to accelerate your projects';
    case 'learning': return 'Master AI tools with comprehensive courses and certifications';
    case 'innovation_lab': return 'Collaborate, experiment, and innovate with cutting-edge AI';
    case 'use_cases': return 'Explore practical AI applications and workflows';
    default: return 'Your central hub for AI tools and resources';
  }
};

const getDefaultSections = (pageKey: string) => {
  return [{
    id: 'fallback-hero',
    section_key: 'hero',
    section_name: 'hero',
    content: {
      title: getDefaultTitle(pageKey),
      subtitle: 'AI-Powered Solutions',
      description: getDefaultDescription(pageKey)
    },
    is_enabled: true,
    display_order: 0
  }];
};