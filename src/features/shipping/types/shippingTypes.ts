/** Matches shipping-service calculation method (admin-configured). */
export type ShippingCalculationMethod = 'REAL_ROUTE' | 'CITY_ROUTE'

/** Normalized row for cart UI (batch shop-profiles). */
export type ShopShippingProfileRow = {
    shopId: string
    /** Display / promo line */
    hint?: string
    /** Suggested default fee if API exposes it */
    defaultFee?: number | null
    /** Minimum cart value for free shipping, if provided */
    freeShippingMin?: number | null
    raw?: unknown
}

/** Per-shop fee after calculate API (checkout). */
export type ShopCalculatedShipping = {
    shopId: string
    amount: number | null
    deliveryStatus?: 'DELIVERABLE' | 'NOT_DELIVERABLE'
    /** ISO currency code from the calculate API (e.g. MMK). */
    currency?: string
    /** Admin shipping setting used for this quote. */
    calculationMethod?: ShippingCalculationMethod
    /** Shop city id when calculationMethod is CITY_ROUTE. */
    fromCityId?: string | null
    /** Customer city id when calculationMethod is CITY_ROUTE. */
    toCityId?: string | null
    methodLabel?: string
    etaHint?: string
    /** Business days from shipping service calculate API */
    estimatedDays?: number | null
    distanceKm?: number | null
    actualWeightKg?: number | null
    volumetricWeightKg?: number | null
    chargeableWeightKg?: number | null
    /** From DB weight rate (`base_fee`). */
    baseFee?: number | null
    /** Route fee (distance bracket or city rate), stored as distanceFee. */
    distanceFee?: number | null
    /** Additional weight fee beyond base weight. */
    weightFee?: number | null
    raw?: unknown
}
