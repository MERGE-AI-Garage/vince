// ABOUTME: Data hooks for brand reference image collections (product, character, style, environment)
// ABOUTME: CRUD operations against creative_studio_brand_references with collection grouping

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BrandReference, BrandReferenceCollection, ReferenceType, ReferenceIntent } from '@/types/creative-studio';

/** Fetch all references for a brand, grouped into collections */
export function useBrandReferenceCollections(brandId?: string) {
  return useQuery({
    queryKey: ['brand-references', brandId],
    queryFn: async (): Promise<BrandReferenceCollection[]> => {
      if (!brandId) return [];

      const { data, error } = await supabase
        .from('creative_studio_brand_references')
        .select('*')
        .eq('brand_id', brandId)
        .order('collection')
        .order('is_primary', { ascending: false })
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const refs = (data || []) as BrandReference[];

      // Group by collection name
      const collectionMap = new Map<string, BrandReference[]>();
      for (const ref of refs) {
        if (!collectionMap.has(ref.collection)) {
          collectionMap.set(ref.collection, []);
        }
        collectionMap.get(ref.collection)!.push(ref);
      }

      return Array.from(collectionMap.entries()).map(([name, images]) => ({
        name,
        reference_type: images[0].reference_type,
        reference_intent: images[0].reference_intent,
        images,
        primaryImage: images.find(i => i.is_primary),
      }));
    },
    enabled: !!brandId,
  });
}

/** Fetch flat list of all references for a brand (useful for pickers) */
export function useBrandReferences(brandId?: string) {
  return useQuery({
    queryKey: ['brand-references-flat', brandId],
    queryFn: async (): Promise<BrandReference[]> => {
      if (!brandId) return [];

      const { data, error } = await supabase
        .from('creative_studio_brand_references')
        .select('*')
        .eq('brand_id', brandId)
        .order('collection')
        .order('is_primary', { ascending: false })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as BrandReference[];
    },
    enabled: !!brandId,
  });
}

interface AddBrandReferenceInput {
  brand_id: string;
  url: string;
  storage_path?: string;
  filename?: string;
  collection: string;
  reference_type: ReferenceType;
  reference_intent: ReferenceIntent;
  label?: string;
  description?: string;
  media_resolution?: 'low' | 'medium' | 'high';
  is_primary?: boolean;
  created_by?: string;
}

export function useAddBrandReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddBrandReferenceInput) => {
      // If setting as primary, unset other primaries in the same collection
      if (input.is_primary) {
        await supabase
          .from('creative_studio_brand_references')
          .update({ is_primary: false })
          .eq('brand_id', input.brand_id)
          .eq('collection', input.collection);
      }

      const { data, error } = await supabase
        .from('creative_studio_brand_references')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as BrandReference;
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ['brand-references', input.brand_id] });
      queryClient.invalidateQueries({ queryKey: ['brand-references-flat', input.brand_id] });
    },
  });
}

export function useUpdateBrandReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, brandId, updates }: {
      id: string;
      brandId: string;
      updates: Partial<Pick<BrandReference, 'label' | 'description' | 'media_resolution' | 'reference_intent' | 'sort_order' | 'is_primary'>>;
    }) => {
      // If setting as primary, unset other primaries in the same collection
      if (updates.is_primary) {
        const { data: ref } = await supabase
          .from('creative_studio_brand_references')
          .select('collection')
          .eq('id', id)
          .single();

        if (ref) {
          await supabase
            .from('creative_studio_brand_references')
            .update({ is_primary: false })
            .eq('brand_id', brandId)
            .eq('collection', ref.collection);
        }
      }

      const { error } = await supabase
        .from('creative_studio_brand_references')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { brandId }) => {
      queryClient.invalidateQueries({ queryKey: ['brand-references', brandId] });
      queryClient.invalidateQueries({ queryKey: ['brand-references-flat', brandId] });
    },
  });
}

export function useRemoveBrandReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, brandId, storagePath }: {
      id: string;
      brandId: string;
      storagePath?: string;
    }) => {
      // Delete the DB record
      const { error } = await supabase
        .from('creative_studio_brand_references')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Clean up storage if we have a path (non-blocking — DB record is already gone)
      if (storagePath) {
        try {
          await supabase.storage.from('media').remove([storagePath]);
        } catch (storageErr) {
          console.warn('Storage cleanup failed (non-blocking):', storageErr);
        }
      }
    },
    onSuccess: (_, { brandId }) => {
      queryClient.invalidateQueries({ queryKey: ['brand-references', brandId] });
      queryClient.invalidateQueries({ queryKey: ['brand-references-flat', brandId] });
    },
  });
}

export function useRenameBrandCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ brandId, oldName, newName }: {
      brandId: string;
      oldName: string;
      newName: string;
    }) => {
      const slug = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!slug) throw new Error('Collection name is required');
      if (slug === oldName) return;

      // Rename all references in the collection
      const { error } = await supabase
        .from('creative_studio_brand_references')
        .update({ collection: slug })
        .eq('brand_id', brandId)
        .eq('collection', oldName);

      if (error) throw error;

      // Update any prompt templates that reference the old collection name
      const { data: templates } = await supabase
        .from('creative_studio_brand_prompts')
        .select('id, reference_collections')
        .eq('brand_id', brandId)
        .contains('reference_collections', [oldName]);

      if (templates?.length) {
        for (const tmpl of templates) {
          const updated = (tmpl.reference_collections as string[]).map(
            (c: string) => c === oldName ? slug : c
          );
          await supabase
            .from('creative_studio_brand_prompts')
            .update({ reference_collections: updated })
            .eq('id', tmpl.id);
        }
      }
    },
    onSuccess: (_, { brandId }) => {
      queryClient.invalidateQueries({ queryKey: ['brand-references', brandId] });
      queryClient.invalidateQueries({ queryKey: ['brand-references-flat', brandId] });
      queryClient.invalidateQueries({ queryKey: ['brand-prompt-templates', brandId] });
    },
  });
}
