// ABOUTME: Capacitor configuration for the Brand Lens mobile app (iOS)
// ABOUTME: Points to the Vite build output and configures platform-specific settings

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.merge.brandlens',
  appName: 'Brand Lens',
  webDir: 'dist',
  server: {
    // Allow connections to Supabase and Gemini APIs
    allowNavigation: [
      'foolpmhiedplyftbiocb.supabase.co',
      'generativelanguage.googleapis.com',
      'accounts.google.com',
    ],
  },
  backgroundColor: '#0f0a1e',
  ios: {
    scheme: 'BrandLens',
    contentInset: 'automatic',
    backgroundColor: '#0f0a1e',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0f0a1e',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f0a1e',
    },
  },
};

export default config;
