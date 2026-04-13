import type { LatLng } from '@/types/geo'

/** Default map center (Yangon) when no pin is set yet. */
export const DEFAULT_MAP_CENTER: LatLng = { lat: 16.8661, lng: 96.1951 }

export const MAP_PICKER_HEIGHT_PX = 220

export const MAP_PICKER_HINT_TEXT =
    'Tap the map to place a pin, or drag the pin to adjust. We use this location for delivery and shipping estimates.'