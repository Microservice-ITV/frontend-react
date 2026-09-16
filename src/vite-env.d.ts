/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_RECAPTCHA_SITE_KEY: string
    /** Must equal auth-service `JWT_REFRESH_TTL * 60` when OAuth/hash flows skip JSON (optional alignment). */
    readonly VITE_REFRESH_TTL_SECONDS?: string
    /** Google Maps JavaScript API key (Maps JavaScript API + referrer restrictions). */
    readonly VITE_GOOGLE_MAPS_API_KEY?: string
    /** Base URL for product images, local server in development or CDN in production. */
    readonly VITE_ASSET_BASE_URL?: string
    /** Absolute BFF origin baked at build time (required for Docker/nginx builds); relative path + Vite proxy is only a local fallback. */
    readonly VITE_BFF_SERVICE_URL?: string
    /** Google Analytics 4 measurement ID (e.g. G-XXXXXXXX). Empty = disabled. */
    readonly VITE_GA_MEASUREMENT_ID?: string
    /** Map provider: `osm` (Leaflet + OpenStreetMap, default, free) or `google` (needs billing + key). */
    readonly VITE_MAP_PROVIDER?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
