// ABOUTME: Driver.js admin tour for Vince /admin page
// ABOUTME: 5 steps covering brand portfolio, model routing, analytics, DNA, and infrastructure

import { useCallback } from 'react';
import { driver } from 'driver.js';

interface UseVinceAdminTourOptions {
  onComplete?: () => void;
}

export function useVinceAdminTour({ onComplete }: UseVinceAdminTourOptions = {}) {
  const startAdminTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Got it',
      animate: true,
      smoothScroll: true,
      onDestroyStarted: () => {
        onComplete?.();
        driverObj.destroy();
      },
      steps: [
        {
          element: '[data-tour="admin-brands-tab"]',
          popover: {
            title: 'Brand portfolio',
            description: 'Every brand gets a full intelligence pipeline — crawl website, import guidelines documents, extract visual DNA. Brands power every generation in the studio.',
            side: 'bottom' as const,
            align: 'start' as const,
          },
        },
        {
          element: '[data-tour="admin-intelligence-tab"]',
          popover: {
            title: 'Brand DNA',
            description: 'Review and manage the extracted visual intelligence for each brand — photography style, color science, composition rules, tone of voice. This is what Vince loads before every session.',
            side: 'bottom' as const,
            align: 'start' as const,
          },
        },
        {
          element: '[data-tour="admin-models-tab"]',
          popover: {
            title: 'Model routing',
            description: 'Assign Imagen 4 for photography, Veo 3 for video, Flash for fast iteration. Configure capabilities, parameters, and per-model defaults — full control over the generation pipeline.',
            side: 'bottom' as const,
            align: 'start' as const,
          },
        },
        {
          element: '[data-tour="admin-analytics-tab"]',
          popover: {
            title: 'Generation analytics',
            description: 'Generation volume, brand usage patterns, model performance, and cost tracking — 30-day rolling view of everything creative teams are actually producing.',
            side: 'bottom' as const,
            align: 'start' as const,
          },
        },
        {
          // Floating step — Vince control panel is at /vince-control-panel
          popover: {
            title: 'Vince control panel',
            description: 'Navigate to /vince-control-panel for Vince\'s full configuration — system prompt, voice settings, brand DNA injection preview, and conversation history. Everything a creative director needs to tune the agent.',
          },
        },
      ],
    });

    driverObj.drive();
  }, [onComplete]);

  return { startAdminTour };
}
