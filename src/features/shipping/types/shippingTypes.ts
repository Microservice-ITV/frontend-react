/** Matches shipping-service calculation method (admin-configured). */
export type ShippingCalculationMethod = 'REAL_ROUTE' | 'CITY_ROUTE'

/** Normalized row for cart UI (batch shop-profiles). */
export type ShopShippingProfileRow = {
    shopId: string
    /** Shop origin city used for city-route pricing. */
    cityId?: string | null
    districtId?: string | null
    /** Display / promo line */
    hint?: string
    /** Suggested default fee if API exposes it */
    defaultFee?: number | null
    /** Minimum cart value for free shipping, if provided */
    freeShippingMin?: number | null
    raw?: unknown
}

/** Why checkout cannot price this shop. */
export type DeliveryUnavailableReason = 'PROFILE_NOT_READY' | 'ROUTE_NOT_AVAILABLE'

/** Per-shop fee after calculate API (checkout). */
export type ShopCalculatedShipping = {
    shopId: string
    amount: number | null
    deliveryStatus?: 'DELIVERABLE' | 'NOT_DELIVERABLE'
    /** Set when deliveryStatus is NOT_DELIVERABLE. */
    unavailableReason?: DeliveryUnavailableReason
    /** ISO currency code from the calculate API (e.g. MMK). */
    currency?: string
    /** Admin shipping setting used for this quote. */
    calculationMethod?: ShippingCalculationMethod
    /** Shop city id when calculationMethod is CITY_ROUTE. */
    fromDistrictId?: string | null
    /** Customer city id when calculationMethod is CITY_ROUTE. */
    toDistrictId?: string | null
    methodLabel?: string
    etaHint?: string
    /** Business days from shipping service calculate API */
    estimatedDays?: number | null
    distanceKm?: number | null
    actualWeightKg?: number | null
    volumetricWeightKg?: number | null
    chargeableWeightKg?: number | null
    /** From DB weight rate (`base_fee`). Covers the first `baseWeightKg`. */
    baseFee?: number | null
    /** Included kilograms covered by the base weight fee (`base_weight_kg`). */
    baseWeightKg?: number | null
    /** Route fee (distance bracket or city rate), stored as distanceFee. */
    distanceFee?: number | null
    /** Additional weight fee beyond base weight. Zero means no extra weight charge. */
    weightFee?: number | null
    raw?: unknown
}
