// ABOUTME: Smart suggestion hook that matches prompt text against brand reference collections
// ABOUTME: Debounced keyword matching returns suggested collections ranked by relevance

import { useMemo } from 'react';
import { useBrandReferenceCollections } from './useBrandReferences';
import type { BrandReferenceCollection } from '@/types/creative-studio';

interface SuggestedCollection {
  collection: BrandReferenceCollection;
  matchScore: number;
  matchedOn: string;
}

/**
 * Match prompt text against brand reference collections via keyword search.
 * Returns suggested collections sorted by relevance score.
 */
export function useBrandReferenceSuggestions(
  brandId?: string,
  promptText?: string,
  excludeCollections?: string[],
): SuggestedCollection[] {
  const { data: collections } = useBrandReferenceCollections(brandId);

  return useMemo(() => {
    if (!collections?.length || !promptText?.trim()) return [];

    const words = promptText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return [];

    const excluded = new Set(excludeCollections || []);
    const suggestions: SuggestedCollection[] = [];

    for (const collection of collections) {
      if (excluded.has(collection.name)) continue;

      let score = 0;
      let matchedOn = '';

      // Match against collection name (split on hyphens for slug matching)
      const nameWords = collection.name.toLowerCase().split(/[-_\s]+/);
      for (const word of words) {
        for (const nameWord of nameWords) {
          if (nameWord.includes(word) || word.includes(nameWord)) {
            score += 3;
            matchedOn = matchedOn || `name: "${collection.name}"`;
          }
        }
      }

      // Match against image labels
      for (const img of collection.images) {
        if (!img.label) continue;
        const labelLower = img.label.toLowerCase();
        for (const word of words) {
          if (labelLower.includes(word)) {
            score += 1;
            matchedOn = matchedOn || `label: "${img.label}"`;
          }
        }
      }

      // Boost character collections when prompt mentions people-related terms
      if (collection.reference_type === 'character') {
        const personTerms = ['ceo', 'executive', 'leader', 'person', 'portrait', 'headshot', 'keynote', 'speaker', 'team'];
        for (const word of words) {
          if (personTerms.includes(word)) {
            score += 2;
            matchedOn = matchedOn || `person keyword: "${word}"`;
          }
        }
      }

      // Boost product collections when prompt mentions product-related terms
      if (collection.reference_type === 'product') {
        const productTerms = ['product', 'hero', 'shot', 'showcase', 'display', 'catalog', 'render'];
        for (const word of words) {
          if (productTerms.includes(word)) {
            score += 2;
            matchedOn = matchedOn || `product keyword: "${word}"`;
          }
        }
      }

      if (score > 0) {
        suggestions.push({ collection, matchScore: score, matchedOn });
      }
    }

    return suggestions.sort((a, b) => b.matchScore - a.matchScore);
  }, [collections, promptText, excludeCollections]);
}
