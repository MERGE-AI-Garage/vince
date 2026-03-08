// ABOUTME: First-visit demo experience state management for Brand Lens
// ABOUTME: Tracks localStorage keys for showcase and tour seen state, exposes trigger callbacks

import { useState, useCallback } from 'react';

const SHOWCASE_KEY = 'bl-showcase-seen';
const TOUR_KEY = 'bl-tour-seen';

export function useDemoExperience() {
  const [showcaseOpen, setShowcaseOpen] = useState(false);

  const openShowcase = useCallback(() => {
    setShowcaseOpen(true);
  }, []);

  const closeShowcase = useCallback(() => {
    localStorage.setItem(SHOWCASE_KEY, '1');
    setShowcaseOpen(false);
  }, []);

  const hasSeenShowcase = useCallback(() => {
    return !!localStorage.getItem(SHOWCASE_KEY);
  }, []);

  const hasSeenTour = useCallback(() => {
    return !!localStorage.getItem(TOUR_KEY);
  }, []);

  const markTourSeen = useCallback(() => {
    localStorage.setItem(TOUR_KEY, '1');
  }, []);

  return {
    showcaseOpen,
    openShowcase,
    closeShowcase,
    hasSeenShowcase,
    hasSeenTour,
    markTourSeen,
  };
}
