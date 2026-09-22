export type MapTileConfig = {
    url: string
    attribution: string
    subdomains?: string
    maxZoom: number
}

export type MapTileProvider =
    | 'osm-fr'
    | 'osm-de'
    | 'cyclosm'
    | 'esri-street'
    | 'esri-imagery'
    | 'esri-topo'
    | 'carto-voyager'
    | 'carto-positron'
    | 'carto-dark'
    | 'osm'

const cartoKey = (import.meta.env.VITE_CARTO_API_KEY ?? '').trim()
const cartoKeySuffix = cartoKey ? `?key=${encodeURIComponent(cartoKey)}` : ''
const cartoAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
const osmAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

/**
 * Tile sources for the Leaflet picker.
 *
 * Default is the OpenStreetMap France style (`osm-fr`): OpenStreetMap's standard rendering, so it
 * shows place/town names AND building footprints — unlike Esri, which has almost no label/building
 * coverage in Myanmar.
 *
 * Notes:
 * - `*.tile.openstreetmap.org` (the OSM Foundation's own CDN) is unreachable on some networks
 *   (e.g. Myanmar), so community mirrors (`tile.openstreetmap.fr`, `tile.openstreetmap.de`) are used.
 * - CARTO raster basemaps require an API key and watermark unkeyed requests; set
 *   `VITE_CARTO_API_KEY` (free) to use them.
 * - For production/high traffic prefer a keyed provider (Google, Mapbox, MapTiler) — these
 *   community mirrors are best-effort.
 */
const TILE_PROVIDERS: Record<MapTileProvider, MapTileConfig> = {
    'osm-fr': {
        url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
        subdomains: 'abc',
        attribution: osmAttribution,
        maxZoom: 20,
    },
    'osm-de': {
        url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
        attribution: osmAttribution,
        maxZoom: 19,
    },
    cyclosm: {
        url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
        subdomains: 'abc',
        attribution: osmAttribution,
        maxZoom: 20,
    },
    'esri-street': {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        attribution:
            'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, and the GIS user community',
        maxZoom: 19,
    },
    'esri-imagery': {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        maxZoom: 19,
    },
    'esri-topo': {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        attribution:
            'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, FAO, NOAA, USGS, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
    },
    'carto-voyager': {
        url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png${cartoKeySuffix}`,
        subdomains: 'abcd',
        attribution: cartoAttribution,
        maxZoom: 20,
    },
    'carto-positron': {
        url: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png${cartoKeySuffix}`,
        subdomains: 'abcd',
        attribution: cartoAttribution,
        maxZoom: 20,
    },
    'carto-dark': {
        url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png${cartoKeySuffix}`,
        subdomains: 'abcd',
        attribution: cartoAttribution,
        maxZoom: 20,
    },
    osm: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: 'abc',
        attribution: osmAttribution,
        maxZoom: 19,
    },
}

const DEFAULT_TILE_PROVIDER: MapTileProvider = 'osm-fr'

/**
 * Resolve the active tile source.
 * - `VITE_MAP_TILE_URL` (optional): a fully custom Leaflet tile URL template; wins over everything.
 * - `VITE_TILE_PROVIDER`: one of the named providers; defaults to `osm-fr`.
 */
export function getMapTileConfig(): MapTileConfig {
    const customUrl = import.meta.env.VITE_MAP_TILE_URL?.trim()
    if (customUrl) {
        return {
            url: customUrl,
            attribution:
                import.meta.env.VITE_MAP_TILE_ATTRIBUTION?.trim() || TILE_PROVIDERS[DEFAULT_TILE_PROVIDER].attribution,
            maxZoom: 20,
        }
    }

    const key = (import.meta.env.VITE_TILE_PROVIDER ?? DEFAULT_TILE_PROVIDER).toLowerCase().trim() as MapTileProvider
    return TILE_PROVIDERS[key] ?? TILE_PROVIDERS[DEFAULT_TILE_PROVIDER]
}
