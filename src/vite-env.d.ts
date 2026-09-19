/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_RECAPTCHA_SITE_KEY: string
    /** Must equal auth-service `JWT_REFRESH_TTL * 60` when OAuth/hash flows skip JSON (optional alignment). */
    readonly VITE_REFRESH_TTL_SECONDS?: string
    /** Google Maps JavaScript API key (Maps JavaScript API + referrer restrictions). */
    readonly VITE_GOOGLE_MAPS_API_KEY?: string
    /** `false` forces the styled raster Google map instead of the default vector renderer (sharp labels + 3D buildings). */
    readonly VITE_GOOGLE_MAPS_VECTOR?: string
    /** Base URL for product images, local server in development or CDN in production. */
    readonly VITE_ASSET_BASE_URL?: string
    /** Google Analytics 4 measurement ID (e.g. G-XXXXXXXX). Empty = disabled. */
    readonly VITE_GA_MEASUREMENT_ID?: string
    /** Map provider: `osm` (Leaflet tile map, default, free) or `google` (needs billing + key). */
    readonly VITE_MAP_PROVIDER?: string
    /** Leaflet tile provider: `osm-fr` (default), `osm-de`, `cyclosm`, `esri-street`, `esri-imagery`, `esri-topo`, `carto-voyager`, `carto-positron`, `carto-dark`, `osm`. */
    readonly VITE_TILE_PROVIDER?: string
    /** Optional free CARTO API key; CARTO raster tiles watermark unkeyed requests. */
    readonly VITE_CARTO_API_KEY?: string
    /** Fully custom Leaflet tile URL template; overrides `VITE_TILE_PROVIDER`. */
    readonly VITE_MAP_TILE_URL?: string
    /** Attribution HTML for `VITE_MAP_TILE_URL`. */
    readonly VITE_MAP_TILE_ATTRIBUTION?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
