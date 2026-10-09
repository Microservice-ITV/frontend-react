export interface CartItem {
    productId: string
    /** Empty string when the catalog line has no variant row */
    variantId: string
    /** e.g. "Red · M" for display */
    variantLabel?: string
    shopId: string
    shopName: string
    name: string
    image?: string
    price: number
    quantity: number
    /** Units that can still be purchased for this variant. */
    availableStock?: number

    // flash-deal promo origin (present only for flash-deal cart lines)
    flashDealId?: string
    flashDealItemId?: string
    originalPrice?: number
    /** Per-unit shipping parcel data captured from the selected variant. */
    weightKg?: number | null
    lengthCm?: number | null
    widthCm?: number | null
    heightCm?: number | null

    // selection state
    selected: boolean
    /** Catalog category used to match a tax charge at checkout. */
    categoryId?: string
}

export interface CartState {
    items: CartItem[]
}

export type CartItemListProps = {
    items: CartItem[]
}