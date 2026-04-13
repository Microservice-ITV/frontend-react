import { GoogleMapLocationPicker } from './googleMapLocationPicker'
import { OpenStreetMapLocationPicker } from './openStreetMapLocationPicker'
import type { MapLocationPickerProps } from './mapLocationPickerTypes'

export type { MapLocationPickerProps } from './mapLocationPickerTypes'
export { DEFAULT_MAP_CENTER, MAP_PICKER_HEIGHT_PX } from './mapConstants'

/** `osm` = Leaflet + OpenStreetMap (free, default). `google` = Google Maps (needs key + billing). */
export function getMapProvider(): 'osm' | 'google' {
    const raw = (import.meta.env.VITE_MAP_PROVIDER ?? 'osm').toLowerCase().trim()
    return raw === 'google' ? 'google' : 'osm'
}

/**
 * Delivery pin picker. Provider from `VITE_MAP_PROVIDER` (`osm` | `google`, default `osm`).
 * - **OSM**: no API key; uses OpenStreetMap tiles.
 * - **Google**: set `VITE_GOOGLE_MAPS_API_KEY` and enable billing when ready.
 */
export function MapLocationPicker(props: MapLocationPickerProps) {
    if (getMapProvider() === 'google') {
        return <GoogleMapLocationPicker {...props} />
    }
    return <OpenStreetMapLocationPicker {...props} />
}