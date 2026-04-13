/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_RECAPTCHA_SITE_KEY: string
    /** Google Maps JavaScript API key (Maps JavaScript API + referrer restrictions). */
    readonly VITE_GOOGLE_MAPS_API_KEY?: string
    /** Map provider: `osm` (Leaflet + OpenStreetMap, default, free) or `google` (needs billing + key). */
    readonly VITE_MAP_PROVIDER?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
