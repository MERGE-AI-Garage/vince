// ABOUTME: Detects which AI tool the user is currently viewing in their active tab
// ABOUTME: Queries the background script for the active tab URL and maps to platform names

import { useState, useEffect } from 'react';

const PLATFORM_MAP: Record<string, string> = {
  'chat.openai.com': 'ChatGPT',
  'chatgpt.com': 'ChatGPT',
  'gemini.google.com': 'Gemini',
  'aistudio.google.com': 'AI Studio',
  'firefly.adobe.com': 'Firefly',
  'midjourney.com': 'Midjourney',
  'claude.ai': 'Claude',
  'notebooklm.google.com': 'NotebookLM',
  'copilot.microsoft.com': 'Copilot',
  'leonardo.ai': 'Leonardo',
  'ideogram.ai': 'Ideogram',
};

export function useSiteDetection(): string | null {
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    function detect() {
      try {
        chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TAB_URL' }, (response) => {
          if (chrome.runtime.lastError || !response?.url) {
            setPlatform(null);
            return;
          }
          try {
            const hostname = new URL(response.url).hostname;
            const match = Object.entries(PLATFORM_MAP).find(([domain]) =>
              hostname.includes(domain)
            );
            setPlatform(match ? match[1] : null);
          } catch {
            setPlatform(null);
          }
        });
      } catch {
        setPlatform(null);
      }
    }

    detect();
    // Re-detect when the panel regains focus (user switches tabs)
    const interval = setInterval(detect, 5000);
    return () => clearInterval(interval);
  }, []);

  return platform;
}
