import type { LatLng } from '@/types/geo'

export type WardGeocodeParts = {
    ward: string
    district: string
    city: string
    state: string
}

function normalize(s: string): string {
    return s
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
}

/** Strip common suffixes so "Foo Ward" matches OSM "Foo". */
function normalizeForMatch(s: string): string {
    return normalize(s).replace(/\bward\b/g, '').replace(/\s+/g, ' ').trim()
}

export function buildSearchQuery(parts: WardGeocodeParts): string {
    const ward = parts.ward.trim()
    const district = parts.district.trim()
    const city = parts.city.trim()
    const state = parts.state.trim()
    // Duplicate region/city names (e.g. Mandalay, Mandalay) confuse Nominatim — use once.
    if (city && state && normalize(city) === normalize(state)) {
        return `${ward}, ${district}, ${city}, Myanmar`
    }
    return `${ward}, ${district}, ${city}, ${state}, Myanmar`
}

type NominatimHit = {
    lat: string
    lon: string
    display_name: string
    importance?: number
    address?: Record<string, string | undefined>
}

function scoreHit(hit: NominatimHit, parts: WardGeocodeParts): number {
    const dn = normalizeForMatch(hit.display_name)
    const wFull = normalize(parts.ward)
    const wLoose = normalizeForMatch(parts.ward)
    const d = normalizeForMatch(parts.district)
    const c = normalizeForMatch(parts.city)
    let score = 0
    if (wFull && dn.includes(wFull)) score += 10
    else if (wLoose.length >= 3 && dn.includes(wLoose)) score += 8
    else if (wLoose.length >= 3) {
        const tokens = wLoose.split(' ').filter((t) => t.length > 2)
        const hits = tokens.filter((t) => dn.includes(t)).length
        if (hits >= 2) score += 5
        else if (hits === 1) score += 2
    }
    if (d && dn.includes(d)) score += 6
    if (c && dn.includes(c)) score += 3
    const addr = hit.address
    if (addr) {
        const suburb = normalizeForMatch(
            addr.suburb ?? addr.neighbourhood ?? addr.quarter ?? addr.city_district ?? '',
        )
        if (wLoose.length >= 3 && suburb.includes(wLoose)) score += 8
        const city = normalizeForMatch(addr.city ?? addr.town ?? addr.municipality ?? '')
        if (c && city.includes(c)) score += 4
    }
    if (typeof hit.importance === 'number') score += hit.importance
    return score
}

function pickBestHit(hits: NominatimHit[], parts: WardGeocodeParts): NominatimHit | null {
    if (!hits.length) return null
    let best = hits[0]
    let bestScore = scoreHit(best, parts)
    for (let i = 1; i < hits.length; i++) {
        const s = scoreHit(hits[i], parts)
        if (s > bestScore) {
            bestScore = s
            best = hits[i]
        }
    }
    return best
}

async function nominatimSearch(params: URLSearchParams): Promise<NominatimHit[]> {
    const path = `/search?${params.toString()}`
    const url =
        import.meta.env.DEV
            ? `/nominatim${path}`
            : `https://nominatim.openstreetmap.org${path}`

    let res: Response
    try {
        res = await fetch(url, {
            headers: {
                Accept: 'application/json',
            },
        })
    } catch {
        return []
    }

    if (!res.ok) return []

    try {
        return (await res.json()) as NominatimHit[]
    } catch {
        return []
    }
}

/**
 * Forward geocode a Myanmar ward + hierarchy using OpenStreetMap Nominatim.
 * Fetches several candidates and picks the best match by ward/district names (not only first hit).
 */
export async function forwardGeocodeNominatim(parts: WardGeocodeParts): Promise<LatLng | null> {
    const q = buildSearchQuery(parts)
    if (!q) return null

    const baseParams = new URLSearchParams({
        format: 'json',
        limit: '8',
        countrycodes: 'mm',
        addressdetails: '1',
        'accept-language': 'en',
    })

    const params1 = new URLSearchParams(baseParams)
    params1.set('q', q)

    const hits = await nominatimSearch(params1)
    let chosen = pickBestHit(hits, parts)

    // Fallback: shorter query if nothing scored well (ward + district + Myanmar)
    if (!chosen || scoreHit(chosen, parts) < 4) {
        const fallbackQ = `${parts.ward.trim()}, ${parts.district.trim()}, Myanmar`
        const params2 = new URLSearchParams(baseParams)
        params2.set('q', fallbackQ)
        params2.set('limit', '6')
        const hits2 = await nominatimSearch(params2)
        const alt = pickBestHit(hits2, parts)
        if (alt && (!chosen || scoreHit(alt, parts) > scoreHit(chosen, parts))) {
            chosen = alt
        }
        if (!chosen && hits2[0]) chosen = hits2[0]
    }

    if (!chosen && hits[0]) chosen = hits[0]
    if (!chosen) return null

    const lat = Number(chosen.lat)
    const lng = Number(chosen.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

    return { lat, lng }
}