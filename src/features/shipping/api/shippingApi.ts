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
    shopName?: string
    items: Array<{
        productId: string
        variantId?: string
        productName?: string
        quantity: number
    }>
    package: CalculateShippingPackage
}

export type CalculateShippingCustomer = {
    id?: string
    name?: string
}

export type CalculateShippingRequest = {
    deliveryAddress: {
        city: string
        cityId?: string
        districtId?: string
        district: string
        lat: number
        lng: number
    }
    shops: CalculateShippingShopPayload[]
    /** Matches shipping-service `calculateShippingSchema.serviceType`. */
    serviceType: 'STANDARD'
    customerId?: string
    customerName?: string
}

export type LatLng = { lat: number; lng: number }

/**
 * Fallback parcel profile for cart lines whose variant has no weight/dimensions.
 * Real values are captured from the product variant when the item is added to the cart.
 */
const DEFAULT_PACKAGE = { weightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 10 }

function round(value: number, decimals: number): number {
    const factor = 10 ** decimals
    return Math.round(value * factor) / factor
}

/** Coerce cart / API values that may arrive as numeric strings. */
function toPositiveNumber(value: unknown): number | null {
    if (value == null || value === '') return null
    const n = typeof value === 'number' ? value : Number(String(value).trim())
    return Number.isFinite(n) && n > 0 ? n : null
}

function positiveOr(value: unknown, fallback: number): number {
    return toPositiveNumber(value) ?? fallback
}

/**
 * Build one parcel per shop from its cart lines.
 * Weight scales with the number of units; the box uses the largest footprint and
 * stacks height across units so volumetric weight (CBM) is computed from real data.
 */
function buildPackage(rows: CartItem[]): CalculateShippingPackage {
    let totalWeightKg = 0
    let lengthCm = 0
    let widthCm = 0
    let heightCm = 0

    for (const item of rows) {
        const qty = Math.max(1, Number(item.quantity) || 1)

        totalWeightKg += positiveOr(item.weightKg, DEFAULT_PACKAGE.weightKg) * qty

        lengthCm = Math.max(lengthCm, positiveOr(item.lengthCm, DEFAULT_PACKAGE.lengthCm))
        widthCm = Math.max(widthCm, positiveOr(item.widthCm, DEFAULT_PACKAGE.widthCm))
        heightCm += positiveOr(item.heightCm, DEFAULT_PACKAGE.heightCm) * qty
    }

    return {
        actualWeightKg: round(Math.max(totalWeightKg, 0.001), 3),
        lengthCm: round(lengthCm, 2),
        widthCm: round(widthCm, 2),
        heightCm: round(heightCm, 2),
    }
}

export function buildCalculatePayload(
    address: UserAddress,
    items: CartItem[],
    coords: LatLng,
    customer?: CalculateShippingCustomer,
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
            shopName: rows[0]?.shopName || undefined,
            items: rows.map((i) => ({
                productId: i.productId,
                variantId: i.variantId || undefined,
                productName: i.name || undefined,
                quantity: i.quantity,
            })),
            package: buildPackage(rows),
        })
    }

    const cityId =
        address.city_id != null && Number.isFinite(Number(address.city_id))
            ? String(address.city_id)
            : undefined
    const districtId =
        address.district_id != null && Number.isFinite(Number(address.district_id))
            ? String(address.district_id)
            : undefined

    return {
        deliveryAddress: {
            city: address.city ?? '',
            ...(cityId ? { cityId } : {}),
            district: address.district ?? '',
            ...(districtId ? { districtId } : {}),
            lat: coords.lat,
            lng: coords.lng,
        },
        shops,
        serviceType: 'STANDARD',
        customerId: customer?.id || undefined,
        customerName: customer?.name || undefined,
    }
}

/** Backend decimals often arrive as strings; parse before validating. */
function parseCoordinate(value: unknown): number | null {
    if (value == null || value === '') return null
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
        const n = Number(value.trim())
        return Number.isFinite(n) ? n : null
    }
    return null
}

function isValidCoordinate(lat: unknown, lng: unknown): LatLng | null {
    const parsedLat = parseCoordinate(lat)
    const parsedLng = parseCoordinate(lng)
    if (parsedLat == null || parsedLng == null) return null
    if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) return null
    // (0, 0) is the "unset" sentinel and sits in the Gulf of Guinea.
    if (parsedLat === 0 && parsedLng === 0) return null
    return { lat: parsedLat, lng: parsedLng }
}

/**
 * Resolve the delivery coordinates for fee calculation.
 * Uses the saved pin when present; otherwise forward-geocodes the address text via Nominatim.
 * Returns null when neither is available.
 */
export async function resolveDeliveryCoordinates(address: UserAddress): Promise<LatLng | null> {
    const saved = isValidCoordinate(address.latitude, address.longitude)
    if (saved) return saved

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
