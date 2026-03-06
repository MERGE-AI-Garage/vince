// ABOUTME: Vite configuration for Brand Lens.
// ABOUTME: Matches AI Garage toolchain — SWC compiler, @/ alias, chunk splitting.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8082,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@radix-ui/')) return 'vendor-radix';
          if (id.includes('node_modules/@supabase/')) return 'vendor-supabase';
          if (id.includes('node_modules/@tanstack/react-query')) return 'vendor-tanstack';
          if (id.includes('node_modules/three/') || id.includes('node_modules/@react-three/')) return 'vendor-three';
          if (id.includes('node_modules/framer-motion')) return 'vendor-framer';
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'vendor-charts';
        },
      },
    },
  },
});
