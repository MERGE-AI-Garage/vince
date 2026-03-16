// ABOUTME: Vite build config for the Vince Chrome extension
// ABOUTME: Aliases @/ to the main app src and copies needed assets

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import fs from 'fs';

function copyBrandAssets() {
  return {
    name: 'copy-brand-assets',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist');
      const pub = path.resolve(__dirname, '../public');

      // Extension icons
      const iconDir = path.join(dist, 'icons');
      fs.mkdirSync(iconDir, { recursive: true });
      const iconSrc = path.resolve(__dirname, 'icons');
      if (fs.existsSync(iconSrc)) {
        for (const file of fs.readdirSync(iconSrc)) {
          if (file.endsWith('.png')) {
            fs.copyFileSync(path.join(iconSrc, file), path.join(iconDir, file));
          }
        }
      }

      // manifest.json + background.js + mic permission grant page
      fs.copyFileSync(path.resolve(__dirname, 'manifest.json'), path.join(dist, 'manifest.json'));
      fs.copyFileSync(path.resolve(__dirname, 'background.js'), path.join(dist, 'background.js'));
      fs.copyFileSync(path.resolve(__dirname, 'mic-permission.html'), path.join(dist, 'mic-permission.html'));
      fs.copyFileSync(path.resolve(__dirname, 'grant-permission.js'), path.join(dist, 'grant-permission.js'));

      // Brand images (optional — skip if directory doesn't exist)
      const brandImgSrc = path.join(pub, 'images', 'brand-guidelines');
      if (fs.existsSync(brandImgSrc)) {
        const imgDir = path.join(dist, 'images', 'brand-guidelines');
        fs.mkdirSync(imgDir, { recursive: true });
        for (const file of fs.readdirSync(brandImgSrc)) {
          fs.copyFileSync(path.join(brandImgSrc, file), path.join(imgDir, file));
        }
      }
    },
  };
}

export default defineConfig({
  root: __dirname,
  envDir: path.resolve(__dirname, '..'),
  plugins: [react(), copyBrandAssets()],
  resolve: {
    alias: [
      { find: '@/integrations/supabase/client', replacement: path.resolve(__dirname, 'src/supabaseExtClient.ts') },
      { find: '@', replacement: path.resolve(__dirname, '../src') },
    ],
  },
  publicDir: false,
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: path.resolve(__dirname, 'sidepanel.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
