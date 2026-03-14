// ABOUTME: Capacitor configuration for the Vince mobile app (iOS)
// ABOUTME: Points to the Vite build output and configures platform-specific settings

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.merge.brandlens',
  appName: 'Vince',
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
    scheme: 'Vince',
    contentInset: 'automatic',
    backgroundColor: '#0f0a1e',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
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
