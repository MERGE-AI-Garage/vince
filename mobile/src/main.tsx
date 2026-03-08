// ABOUTME: Entry point for the Brand Lens mobile app (Capacitor — iOS)
// ABOUTME: Mounts MobileApp and handles cleanup when the app is backgrounded

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MobileApp } from './MobileApp';
import { forceCleanup } from '@/services/brand-agent/brandAgentLiveService';
import '@/index.css';

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <MobileApp />
  </StrictMode>
);

// Clean up voice sessions when the page is hidden (app backgrounded or closed)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    forceCleanup();
  }
});
