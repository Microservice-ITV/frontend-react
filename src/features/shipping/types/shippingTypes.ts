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
    /** ISO currency code from the calculate API (e.g. MMK). */
    currency?: string
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
    /** From DB distance bracket (`fee`). */
    distanceFee?: number | null
    /** Additional weight fee beyond base weight. */
    weightFee?: number | null
    raw?: unknown
}