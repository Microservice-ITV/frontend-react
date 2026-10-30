import { lazy, Suspense } from 'react'
import { MapErrorBoundary } from './MapErrorBoundary'
import type { MapLocationPickerProps } from './mapLocationPickerTypes'
import { MAP_PICKER_HEIGHT_PX } from './mapConstants'

export type { MapLocationPickerProps } from './mapLocationPickerTypes'
export { DEFAULT_MAP_CENTER, MAP_PICKER_HEIGHT_PX } from './mapConstants'

const GoogleMapLocationPicker = lazy(() =>
  import('./googleMapLocationPicker').then((m) => ({
    default: m.GoogleMapLocationPicker,
  })),
)

const OpenStreetMapLocationPicker = lazy(() =>
  import('./openStreetMapLocationPicker').then((m) => ({
    default: m.OpenStreetMapLocationPicker,
  })),
)

/** `google` = Google Maps (needs key + billing). `osm` = free Leaflet tiles (default/fallback). */
export function getMapProvider(): 'osm' | 'google' {
    const raw = (import.meta.env.VITE_MAP_PROVIDER ?? 'osm').toLowerCase().trim()
    if (raw !== 'google') return 'osm'

    // Fall back gracefully instead of showing a dead "key missing" box when billing isn't set up yet.
    const key = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '').trim()
    if (!key) {
        console.warn('[map] VITE_MAP_PROVIDER=google but VITE_GOOGLE_MAPS_API_KEY is empty; using the free OSM map.')
        return 'osm'
    }
    return 'google'
}

/**
 * Delivery pin picker. Provider from `VITE_MAP_PROVIDER` (`osm` | `google`, default `osm`).
 * - **Google**: Grab/Foodpanda-style theme; set `VITE_GOOGLE_MAPS_API_KEY` (billing enabled).
 * - **OSM**: free Leaflet raster tiles; also the automatic fallback when the Google key is absent.
 */
export function MapLocationPicker(props: MapLocationPickerProps) {
    const picker =
        getMapProvider() === 'google' ? (
            <GoogleMapLocationPicker {...props} />
        ) : (
            <OpenStreetMapLocationPicker {...props} />
        )

    return (
      <MapErrorBoundary>
        <Suspense
          fallback={
            <div className="w-full" style={{ height: MAP_PICKER_HEIGHT_PX }} aria-hidden />
          }
        >
          {picker}
        </Suspense>
      </MapErrorBoundary>
    )
}
