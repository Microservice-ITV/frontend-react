import { shippingClient } from '@/lib/api/shippingClient'
import { forwardGeocodeAddress } from '@/lib/geocoding/geocode'
import type { CartItem } from '@/features/cart/types/cartTypes'
import type { UserAddress } from '@/features/account/types/addressTypes'

export type BatchShopProfilesRequest = {
    shopIds: string[]
}

export type CalculateShippingPackage = {
    actualWeightKg: number
    lengthCm: number
    widthCm: number
    heightCm: number
}

export type CalculateShippingShopPayload = {
    shopId: string
    items: Array<{
        productId: string
        variantId?: string
        quantity: number
    }>
    package: CalculateShippingPackage
}

export type CalculateShippingRequest = {
    deliveryAddress: {
        city: string
        district: string
        lat: number
        lng: number
    }
    shops: CalculateShippingShopPayload[]
    /** Matches shipping-service `calculateShippingSchema.serviceType`. */
    serviceType: 'STANDARD'
}

export type LatLng = { lat: number; lng: number }

/**
 * Placeholder parcel profile used until the catalog exposes per-SKU weight/dimensions.
 * The distance road-fee is real; the weight component uses this baseline (1 kg / 20×15×10 cm).
 */
const DEFAULT_PACKAGE = { weightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 10 }

function round(value: number, decimals: number): number {
    const factor = 10 ** decimals
    return Math.round(value * factor) / factor
}

/**
 * Build one parcel per shop from its cart lines.
 * Weight scales with the number of units; dimensions use the baseline box.
 */
function buildPackage(rows: CartItem[]): CalculateShippingPackage {
    const totalUnits = rows.reduce(
        (sum, item) => sum + Math.max(1, Number(item.quantity) || 1),
        0,
    )

    return {
        actualWeightKg: round(Math.max(totalUnits * DEFAULT_PACKAGE.weightKg, 0.001), 3),
        lengthCm: DEFAULT_PACKAGE.lengthCm,
        widthCm: DEFAULT_PACKAGE.widthCm,
        heightCm: DEFAULT_PACKAGE.heightCm,
    }
}

export function buildCalculatePayload(
    address: UserAddress,
    items: CartItem[],
    coords: LatLng,
): CalculateShippingRequest {
    const byShop = new Map<string, CartItem[]>()
    for (const item of items) {
        const list = byShop.get(item.shopId) ?? []
        list.push(item)
        byShop.set(item.shopId, list)
    }

    const shops: CalculateShippingShopPayload[] = []
    for (const [shopId, rows] of byShop) {
        shops.push({
            shopId,
            items: rows.map((i) => ({
                productId: i.productId,
                variantId: i.variantId || undefined,
                quantity: i.quantity,
            })),
            package: buildPackage(rows),
        })
    }

    return {
        deliveryAddress: {
            city: address.city ?? '',
            district: address.district ?? '',
            lat: coords.lat,
            lng: coords.lng,
        },
        shops,
        serviceType: 'STANDARD',
    }
}

function isValidCoordinate(lat: unknown, lng: unknown): boolean {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false
    // (0, 0) is the "unset" sentinel and sits in the Gulf of Guinea.
    if (lat === 0 && lng === 0) return false
    return true
}

/**
 * Resolve the delivery coordinates for fee calculation.
 * Uses the saved pin when present; otherwise forward-geocodes the address text via Nominatim.
 * Returns null when neither is available.
 */
export async function resolveDeliveryCoordinates(address: UserAddress): Promise<LatLng | null> {
    if (isValidCoordinate(address.latitude, address.longitude)) {
        return { lat: address.latitude as number, lng: address.longitude as number }
    }

    const ward = (address.ward ?? '').trim()
    const district = (address.district ?? '').trim()
    const city = (address.city ?? '').trim()
    const state = (address.state ?? '').trim()
    if (!ward && !district && !city && !state) return null

    const point = await forwardGeocodeAddress({ ward, district, city, state })
    if (!point) return null
    return { lat: point.lat, lng: point.lng }
}

export const shippingApi = {
    batchShopProfiles(shopIds: string[]) {
        const unique = [...new Set(shopIds.map((id) => id.trim()).filter(Boolean))]
        return shippingClient.post<unknown>('/shipping/shop-profiles/batch', { shopIds: unique })
    },

    calculateShipping(payload: CalculateShippingRequest) {
        return shippingClient.post<unknown>('/shipping/calculate', payload)
    },
}
