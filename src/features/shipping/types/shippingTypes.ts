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
    methodLabel?: string
    etaHint?: string
    /** Business days from shipping service calculate API */
    estimatedDays?: number | null
    raw?: unknown
}