// ABOUTME: Reusable debounced search hook for RSS control panel tabs
// ABOUTME: Prevents excessive API calls by debouncing search input changes

import { useState, useEffect } from 'react';

interface UseDebounceSearchReturn {
  query: string;
  setQuery: (value: string) => void;
  debouncedQuery: string;
}

/**
 * Hook for debouncing search input to avoid excessive refetching
 * @param initialValue - Initial search query value
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 */
export function useDebounceSearch(
  initialValue = '',
  delay = 300
): UseDebounceSearchReturn {
  const [query, setQuery] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  return { query, setQuery, debouncedQuery };
}
