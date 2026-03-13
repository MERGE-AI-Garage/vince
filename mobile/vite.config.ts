// ABOUTME: Vite build config for the Vince mobile app (Capacitor — iOS)
// ABOUTME: Aliases @/ to the main app src and swaps the Supabase client for the mobile-compatible version

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      // Point @/ to the main app's src directory so we reuse all existing components
      '@': path.resolve(__dirname, '../src'),
      // Swap the Supabase client for the mobile version (uses Capacitor Preferences)
      '@/integrations/supabase/client': path.resolve(__dirname, 'src/supabaseMobileClient.ts'),
    },
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});
