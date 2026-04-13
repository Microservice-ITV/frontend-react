import { useEffect, useRef, type CSSProperties } from 'react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { DEFAULT_MAP_CENTER, MAP_PICKER_HEIGHT_PX, MAP_PICKER_HINT_TEXT } from './mapConstants'
import type { LatLng } from '@/types/geo'
import type { MapLocationPickerProps } from './mapLocationPickerTypes'

const MAP_CONTAINER_STYLE: CSSProperties = {
    width: '100%',
    height: `${MAP_PICKER_HEIGHT_PX}px`,
}

/**
 * Google Maps pin picker. Requires billing-enabled GCP + `VITE_GOOGLE_MAPS_API_KEY`.
 * Enable when `VITE_MAP_PROVIDER=google`.
 */
export function GoogleMapLocationPicker({ latitude, longitude, onChange, className }: MapLocationPickerProps) {
    const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim()

    if (!apiKey) {
        return (
            <div
                className={`rounded-sm border border-dashed border-amber-300 bg-amber-50 px-3 py-4 text-xs text-amber-950 ${className ?? ''}`}
            >
                <p className="font-medium">Google Maps selected but key missing</p>
                <p className="mt-1 text-amber-900/90">
                    Set <code className="rounded bg-amber-100/80 px-1 font-mono text-[11px]">VITE_GOOGLE_MAPS_API_KEY</code>{' '}
                    in <code className="font-mono text-[11px]">.env</code> (Maps JavaScript API + billing), or use{' '}
                    <code className="font-mono text-[11px]">VITE_MAP_PROVIDER=osm</code> for the free map.
                </p>
            </div>
        )
    }

    return <GoogleMapInner apiKey={apiKey} latitude={latitude} longitude={longitude} onChange={onChange} className={className} />
}

type InnerProps = MapLocationPickerProps & { apiKey: string }

function GoogleMapInner({ apiKey, latitude, longitude, onChange, className }: InnerProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'dni-google-maps',
        googleMapsApiKey: apiKey,
    })

    const mapRef = useRef<google.maps.Map | null>(null)
    const hadPinRef = useRef(false)

    const hasPin =
        latitude != null &&
        longitude != null &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)

    const initialCenterRef = useRef<LatLng | null>(null)
    if (initialCenterRef.current === null) {
        initialCenterRef.current = hasPin ? { lat: latitude!, lng: longitude! } : DEFAULT_MAP_CENTER
    }

    useEffect(() => {
        if (!isLoaded || !hasPin || latitude == null || longitude == null) return
        if (hadPinRef.current) return
        const id = window.setTimeout(() => {
            if (hadPinRef.current) return
            const map = mapRef.current
            if (!map) return
            map.panTo({ lat: latitude, lng: longitude })
            map.setZoom(16)
            hadPinRef.current = true
        }, 0)
        return () => window.clearTimeout(id)
    }, [isLoaded, hasPin, latitude, longitude])

    if (loadError) {
        return (
            <div className={`rounded-sm border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-800 ${className ?? ''}`}>
                Google Maps failed to load. Check the console and your API key / billing.
            </div>
        )
    }

    if (!isLoaded) {
        return (
            <div
                className={`flex items-center justify-center rounded-sm border border-gray-200 bg-gray-50 text-xs text-gray-500 ${className ?? ''}`}
                style={{ height: MAP_PICKER_HEIGHT_PX }}
            >
                Loading Google Maps…
            </div>
        )
    }

    return (
        <div className={className}>
            <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={initialCenterRef.current}
                zoom={hasPin ? 16 : 13}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                }}
                onLoad={(map) => {
                    mapRef.current = map
                    if (latitude != null && longitude != null) {
                        map.panTo({ lat: latitude, lng: longitude })
                        map.setZoom(16)
                    }
                    hadPinRef.current = hasPin
                }}
                onUnmount={() => {
                    mapRef.current = null
                }}
                onClick={(e) => {
                    if (!e.latLng) return
                    onChange(e.latLng.lat(), e.latLng.lng())
                }}
            >
                {hasPin && (
                    <Marker
                        position={{ lat: latitude!, lng: longitude! }}
                        draggable
                        onDragEnd={(e) => {
                            if (e.latLng) onChange(e.latLng.lat(), e.latLng.lng())
                        }}
                    />
                )}
            </GoogleMap>
            <p className="mt-1.5 text-[11px] leading-snug text-gray-500">{MAP_PICKER_HINT_TEXT}</p>
        </div>
    )
}