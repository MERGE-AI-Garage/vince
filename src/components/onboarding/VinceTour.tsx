// ABOUTME: Driver.js voice-focused feature spotlight tour for Vince
// ABOUTME: 5 steps pointing to Brand DNA, Vince voice mode, and Director Mode — not a generic UI tutorial

import { useCallback } from 'react';
import { driver } from 'driver.js';

interface UseVinceTourOptions {
  onComplete?: () => void;
}

export function useVinceTour({ onComplete }: UseVinceTourOptions = {}) {
  const startTour = useCallback(() => {
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
          element: '[data-tour="brand-selector"]',
          popover: {
            title: 'Your brand DNA is active',
            description: 'Every generation — image, video, copy — draws from the selected brand\'s analyzed photography style, color profile, and composition rules. Switch brands here to change creative context instantly.',
            side: 'bottom' as const,
            align: 'start' as const,
          },
        },
        {
          element: '[data-tour="brand-agent-toggle"]',
          popover: {
            title: 'Talk to Vince',
            description: 'Tap to open a Gemini Live voice session. Vince has your brand\'s full intelligence loaded. Speak your brief — describe the campaign, the mood, the moment — and he produces structured creative output.',
            side: 'bottom' as const,
            align: 'end' as const,
          },
        },
        {
          element: '[data-tour="brand-intel-badges"]',
          popover: {
            title: 'Intelligence layers',
            description: 'Each badge is a deep-analyzed layer — DNA, Standards, Guidelines — feeding Vince and every generation in real time. More layers means tighter brand governance on every output.',
            side: 'bottom' as const,
            align: 'start' as const,
          },
        },
        {
          // Director Mode lives in the right panel in video mode — floating step covers all contexts
          popover: {
            title: 'Director Mode',
            description: 'Switch the prompt bar to Video. The right panel reveals Director Mode — structured controls for scene, lens, lighting, and camera movement. "Enhance with Brand DNA" wires your brand\'s photography standards directly into Veo\'s generation parameters.',
          },
        },
        {
          popover: {
            title: 'Production infrastructure',
            description: 'The /admin panel has model routing, quota management, generation analytics, brand intelligence dashboards, and Vince\'s complete control panel. This is production software.',
          },
        },
      ],
    });

    driverObj.drive();
  }, [onComplete]);

  return { startTour };
}
