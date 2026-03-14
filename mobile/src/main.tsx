// ABOUTME: Entry point for the Vince mobile app (Capacitor — iOS)
// ABOUTME: Mounts MobileApp and handles cleanup when the app is backgrounded

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MobileApp } from './MobileApp';
import '@/index.css';

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <MobileApp />
  </StrictMode>
);

// Lazy import — only needed when app is backgrounded, no reason to pull it in at startup
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    import('@/services/brand-agent/brandAgentLiveService').then(({ forceCleanup }) => {
      forceCleanup();
    });
  }
});
