import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Personal OS',
        short_name: 'PersonalOS',
        description: 'Seu ecossistema de assistente pessoal',
        theme_color: '#050d08',
        background_color: '#050d08',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        categories: ['productivity', 'utilities'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        // Android: long-press the home screen icon to jump straight into a
        // panel. iOS Safari ignores this — harmless there.
        shortcuts: [
          { name: 'Terminal', url: '/?tab=terminal', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Financeiro', url: '/?tab=finance', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Nova tarefa', url: '/?tab=tasks&action=new-task', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Agenda', url: '/?tab=agenda', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0', // accessible over Tailscale / local network in dev mode
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    outDir: '../backend/public',
    emptyOutDir: true,
  },
});
