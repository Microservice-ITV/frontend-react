import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  envDir: '..',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  server: {
    // later needs to remove
    proxy: {
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      // Fallback for plain local `npm run dev` without an .env value. When VITE_BFF_SERVICE_URL
      // is set, the browser calls that origin directly, exactly like the Docker/nginx bundle.
      '/api/v1/ai': {
        target: 'http://localhost:5008',
        changeOrigin: true,
      },
      /** Nominatim (OSM geocoding) — browser CORS blocks direct calls; dev uses this proxy. */
      '/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/nominatim/, ''),
      },
    },
  }, // later needs to remove
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
})
