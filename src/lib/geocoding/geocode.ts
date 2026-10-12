import type { LatLng } from '@/types/geo'

import { buildSearchQuery, forwardGeocodeNominatim, type WardGeocodeParts } from './nominatim'

export type { WardGeocodeParts } from './nominatim'

type PhotonProperties = {
    name?: string
    street?: string
    locality?: string
    district?: string
    city?: string
    county?: string
    state?: string
    country?: string
    countrycode?: string
    osm_value?: string
    type?: string
}

type PhotonFeature = {
    properties: PhotonProperties
    geometry: { coordinates: [number, number] }
}

function normalize(s: string): string {
    return s
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
}

/** Strip common suffixes so "Foo Ward" matches "Foo". */
function normalizeLoose(s: string): string {
    return normalize(s).replace(/\bward\b/g, '').replace(/\s+/g, ' ').trim()
}

function featureLabel(props: PhotonProperties): string {
    return [
        props.name,
        props.street,
        props.locality,
        props.district,
        props.city,
        props.county,
        props.state,
        props.country,
    ]
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
        .join(', ')
}

function scoreFeature(feature: PhotonFeature, parts: WardGeocodeParts): number {
    const props = feature.properties
    if (props.countrycode && props.countrycode.toUpperCase() !== 'MM') return -1

    const hay = normalizeLoose(featureLabel(props))
    const wFull = normalize(parts.ward)
    const wLoose = normalizeLoose(parts.ward)
    const d = normalizeLoose(parts.district)
    const c = normalizeLoose(parts.city)
    const s = normalizeLoose(parts.state)

    let score = 0
    if (wFull && hay.includes(wFull)) score += 10
    else if (wLoose.length >= 3 && hay.includes(wLoose)) score += 8
    else if (wLoose.length >= 3) {
        const tokens = wLoose.split(' ').filter((t) => t.length > 2)
        const hits = tokens.filter((t) => hay.includes(t)).length
        if (hits >= 2) score += 5
        else if (hits === 1) score += 2
    }

    if (d && hay.includes(d)) score += 6
    if (c && hay.includes(c)) score += 4
    if (s && hay.includes(s)) score += 2

    const osmValue = (props.osm_value ?? '').toLowerCase()
    if (osmValue === 'suburb' || osmValue === 'neighbourhood' || osmValue === 'quarter') score += 3
    if (osmValue === 'city' || osmValue === 'town') score += 1

    return score
}

function pickBestFeature(features: PhotonFeature[], parts: WardGeocodeParts): PhotonFeature | null {
    let best: PhotonFeature | null = null
    let bestScore = 0
    for (const feature of features) {
        const score = scoreFeature(feature, parts)
        if (score > bestScore) {
            bestScore = score
            best = feature
        }
    }
    // Require at least a ward/district signal before trusting the hit.
    return bestScore >= 4 ? best : null
}

async function fetchPhotonFeatures(url: string): Promise<PhotonFeature[]> {
    let res: Response
    try {
        res = await fetch(url, { headers: { Accept: 'application/json' } })
    } catch {
        return []
    }
    if (!res.ok) return []

    try {
        const text = await res.text()
        if (!text.trim().startsWith('{')) return []
        const data = JSON.parse(text) as { features?: PhotonFeature[] }
        return Array.isArray(data.features) ? data.features : []
    } catch {
        return []
    }
}

async function photonSearch(query: string): Promise<PhotonFeature[]> {
    const params = new URLSearchParams({ q: query, limit: '8', lang: 'en' })
    const path = `/api?${params.toString()}`
    // Photon allows CORS; in dev we try the proxy first (dodges strict privacy blocking) and then
    // the direct endpoint, so a missing/stale dev proxy does not silently kill the pin.
    const urls = import.meta.env.DEV
        ? [`/photon${path}`, `https://photon.komoot.io${path}`]
        : [`https://photon.komoot.io${path}`]

    for (const url of urls) {
        const features = await fetchPhotonFeatures(url)
        if (features.length > 0) return features
    }
    return []
}

/** Forward geocode a Myanmar ward hierarchy via Photon (komoot). */
async function forwardGeocodePhoton(parts: WardGeocodeParts): Promise<LatLng | null> {
    const query = buildSearchQuery(parts)
    if (!query) return null

    const hits = await photonSearch(query)
    let chosen = pickBestFeature(hits, parts)

    if (!chosen) {
        const fallbackQ = `${parts.ward.trim()}, ${parts.district.trim()}, Myanmar`
        const hits2 = await photonSearch(fallbackQ)
        chosen = pickBestFeature(hits2, parts) ?? hits2.find((f) => !!f.geometry) ?? null
    }

    if (!chosen) return null

    const [lng, lat] = chosen.geometry.coordinates
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
}

/**
 * Resolve a ward + hierarchy to coordinates.
 * Tries Photon first (reachable where OSM/Nominatim's Fastly CDN is blocked), then falls back
 * to the Nominatim implementation.
 */
export async function forwardGeocodeAddress(parts: WardGeocodeParts): Promise<LatLng | null> {
    try {
        const photon = await forwardGeocodePhoton(parts)
        if (photon) return photon
    } catch {
        /* fall through to Nominatim */
    }
    return forwardGeocodeNominatim(parts)
}

type GoogleLatLng = { lat: () => number; lng: () => number }

type GoogleGeocoderCtor = new () => {
    geocode: (
        request: { address: string; componentRestrictions?: { country: string } },
        callback: (results: Array<{ geometry?: { location?: GoogleLatLng } }> | null, status: string) => void,
    ) => void
}

function googleGeocoder(): GoogleGeocoderCtor | null {
    const maps = (globalThis as { google?: { maps?: { Geocoder?: GoogleGeocoderCtor } } }).google?.maps
    return maps?.Geocoder ?? null
}

function googleGeocodeQuery(query: string): Promise<LatLng | null> {
    const Geocoder = googleGeocoder()
    if (!Geocoder || !query.trim()) return Promise.resolve(null)
    return new Promise((resolve) => {
        new Geocoder().geocode(
            { address: query, componentRestrictions: { country: 'MM' } },
            (results, status) => {
                const loc = status === 'OK' ? results?.[0]?.geometry?.location : undefined
                if (!loc) {
                    resolve(null)
                    return
                }
                const lat = loc.lat()
                const lng = loc.lng()
                resolve(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null)
            },
        )
    })
}

/** Wait until the Maps script used by the pin picker has loaded, without blocking forever. */
async function waitForGoogleGeocoder(timeoutMs = 4000): Promise<boolean> {
    if (googleGeocoder()) return true
    const started = Date.now()
    while (Date.now() - started < timeoutMs) {
        await new Promise((resolve) => window.setTimeout(resolve, 200))
        if (googleGeocoder()) return true
    }
    return false
}

export type AddressPinMatch = {
    point: LatLng
    /** True when the point is the area, not a confirmed ward match. */
    approximate: boolean
}

/**
 * Find a pin for a ward. Exact Photon/Nominatim match first, then Google (already used by the
 * map), then a coarser district/city/state match so edit can still drop a pin.
 */
export async function locateAddressPin(parts: WardGeocodeParts): Promise<AddressPinMatch | null> {
    const exact = await forwardGeocodeAddress(parts)
    if (exact) return { point: exact, approximate: false }

    await waitForGoogleGeocoder()
    const queries = [
        buildSearchQuery(parts),
        `${parts.district.trim()}, ${parts.city.trim()}, ${parts.state.trim()}, Myanmar`,
        `${parts.city.trim()}, ${parts.state.trim()}, Myanmar`,
        `${parts.state.trim()}, Myanmar`,
    ]
    for (const [index, query] of queries.entries()) {
        const hit = await googleGeocodeQuery(query)
        if (hit) return { point: hit, approximate: index > 0 }
    }
    return null
}
