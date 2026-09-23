import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        injectionPoint: undefined, // Allows standalone sw.ts execution without revision injection error
      },
      manifest: {
        name: 'MiniDesk Library Admin',
        short_name: 'MiniDesk',
        description: 'Administrative panel for Library Members, Books, and Checkouts',
        theme_color: '#0a0d14',
        background_color: '#0a0d14',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
});
