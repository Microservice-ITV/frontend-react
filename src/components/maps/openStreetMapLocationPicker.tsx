import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { DEFAULT_MAP_CENTER, MAP_PICKER_HEIGHT_PX, MAP_PICKER_HINT_TEXT } from './mapConstants'
import { getMapTileConfig } from './mapTiles'
import type { LatLng } from '@/types/geo'
import type { MapLocationPickerProps } from './mapLocationPickerTypes'

let leafletDefaultIconsReady = false

/** Fix default marker images with Vite bundling (Leaflet expects default paths). */
function ensureLeafletDefaultIcons() {
    if (leafletDefaultIconsReady) return
    leafletDefaultIconsReady = true
    const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string }
    delete proto._getIconUrl
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
}

/**
 * Free Leaflet map with a draggable pin. Tile source from `getMapTileConfig()` (CARTO by default).
 * Set `VITE_MAP_PROVIDER=osm` to force this Leaflet picker over Google.
 */
export function OpenStreetMapLocationPicker({ latitude, longitude, onChange, className }: MapLocationPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<L.Map | null>(null)
    const markerRef = useRef<L.Marker | null>(null)
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange

    const initialCenterRef = useRef<LatLng | null>(null)
    const hasPin =
        latitude != null &&
        longitude != null &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)

    if (initialCenterRef.current === null) {
        initialCenterRef.current = hasPin ? { lat: latitude!, lng: longitude! } : DEFAULT_MAP_CENTER
    }

    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        ensureLeafletDefaultIcons()

        const center = initialCenterRef.current ?? DEFAULT_MAP_CENTER
        const map = L.map(el).setView([center.lat, center.lng], hasPin ? 17 : 13)

        const tiles = getMapTileConfig()
        L.tileLayer(tiles.url, {
            maxZoom: tiles.maxZoom,
            // Never pass `undefined`: Leaflet overwrites its default `subdomains` with it and then
            // throws in `getTileUrl()` (it calls `_getSubdomain()` even when the URL has no `{s}`).
            subdomains: tiles.subdomains ?? 'abc',
            attribution: tiles.attribution,
        }).addTo(map)

        map.on('click', (e: L.LeafletMouseEvent) => {
            onChangeRef.current(e.latlng.lat, e.latlng.lng)
        })

        mapRef.current = map

        /**
         * Leaflet caches the container size at init. Inside a modal/scroll container the element may
         * still be 0×0 (or resize later), which leaves a blank map — so re-measure after paint and
         * whenever the container changes size.
         */
        const rafId = window.requestAnimationFrame(() => map.invalidateSize())
        const resizeObserver = new ResizeObserver(() => map.invalidateSize())
        resizeObserver.observe(el)

        return () => {
            window.cancelAnimationFrame(rafId)
            resizeObserver.disconnect()
            map.remove()
            mapRef.current = null
            markerRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once per component instance (key resets)
    }, [])

    useEffect(() => {
        const map = mapRef.current
        if (!map) return

        if (hasPin && latitude != null && longitude != null) {
            if (!markerRef.current) {
                const m = L.marker([latitude, longitude], { draggable: true }).addTo(map)
                m.on('dragend', () => {
                    const ll = m.getLatLng()
                    onChangeRef.current(ll.lat, ll.lng)
                })
                markerRef.current = m
            } else {
                markerRef.current.setLatLng([latitude, longitude])
            }
            map.setView([latitude, longitude], 17)
        } else if (markerRef.current) {
            markerRef.current.remove()
            markerRef.current = null
        }
    }, [hasPin, latitude, longitude])

    return (
        <div className={className}>
            <div
                ref={containerRef}
                className="z-0 w-full rounded-sm border border-gray-200"
                style={{ height: MAP_PICKER_HEIGHT_PX }}
            />
            <p className="mt-1.5 text-[11px] leading-snug text-gray-500">{MAP_PICKER_HINT_TEXT}</p>
        </div>
    )
}