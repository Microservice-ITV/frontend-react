import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'

/**
 * Serves the repository-root `public/logo.svg` at `/logo.svg`.
 *
 * The logo lives outside the Vite `publicDir` (`src/public`), so it is neither
 * emitted into the build nor served in dev. This plugin exposes it exactly the
 * way a normal public asset is exposed — without copying or duplicating the file.
 *
 * Both candidate layouts are probed because the Docker image flattens the repo:
 *   - local:  frontend-react/src/vite.config.js -> ../public/logo.svg
 *   - image:  /app/vite.config.js                -> ./public/logo.svg
 */
const LOGO_CANDIDATES = [
  fileURLToPath(new URL('./public/logo.svg', import.meta.url)),
  fileURLToPath(new URL('../public/logo.svg', import.meta.url)),
]

const resolveBrandLogo = () => LOGO_CANDIDATES.find((candidate) => fs.existsSync(candidate))

function serveBrandLogo() {
  return {
    name: 'serve-brand-logo',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        if (path !== '/logo.svg') return next()

        const logo = resolveBrandLogo()
        if (!logo) return next()

        res.setHeader('Content-Type', 'image/svg+xml')
        res.end(fs.readFileSync(logo))
      })
    },
    generateBundle() {
      const logo = resolveBrandLogo()
      if (!logo) {
        this.warn('public/logo.svg not found; /logo.svg will not be emitted.')
        return
      }

      this.emitFile({ type: 'asset', fileName: 'logo.svg', source: fs.readFileSync(logo) })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  envDir: '..',
  plugins: [react(), tailwindcss(), serveBrandLogo()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  server: {
    // The invoice service renders the invoice print route through this dev
    // server from another container on the shared `itv-network`. Vite blocks
    // requests whose Host is not allow-listed (DNS-rebinding protection), so the
    // container/service names used by that flow are permitted explicitly.
    allowedHosts: ['frontendreact-node', 'node', 'frontendreact-nginx', 'host.docker.internal'],
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
      /** Photon (komoot geocoding) — primary geocoder; proxied in dev to avoid strict privacy blocking. */
      '/photon': {
        target: 'https://photon.komoot.io',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/photon/, ''),
      },
    },
  }, // later needs to remove
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
})
