import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const apiUrl = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL || 'https://avpc-federacio-backend.onrender.com/api';
  const apiOrigin = apiUrl.startsWith('/') ? "'self'" : new URL(apiUrl).origin;
  const csp = ["default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "font-src 'self' https://fonts.gstatic.com", "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://server.arcgisonline.com", "connect-src 'self' " + apiOrigin + " https://nominatim.openstreetmap.org", "frame-src blob:", "object-src 'none'", "base-uri 'self'", "form-action 'self'"].join('; ');
  return {
  plugins: [
    react(),
    { name: 'privacy-headers', transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: csp }, injectTo: 'head-prepend' as const },
      { tag: 'meta', attrs: { name: 'referrer', content: 'no-referrer' }, injectTo: 'head-prepend' as const },
    ] },
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      manifest: {
        name: 'AVPC Federació - Gestió d\'Agrupacions',
        short_name: 'AVPC Federació',
        description: 'Gestió de material, vehicles, membres, documentació i formació de les agrupacions',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  server: {
    port: 5174,
    host: true,
  },
};
});
