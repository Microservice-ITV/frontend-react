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

    /** Per-unit shipping parcel data captured from the selected variant. */
    weightKg?: number | null
    lengthCm?: number | null
    widthCm?: number | null
    heightCm?: number | null

    // selection state
    selected: boolean
}

export interface CartState {
    items: CartItem[]
}

export type CartItemListProps = {
    items: CartItem[]
}