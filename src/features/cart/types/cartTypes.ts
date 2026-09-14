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

    // selection state
    selected: boolean
}

export interface CartState {
    items: CartItem[]
}

export type CartItemListProps = {
    items: CartItem[]
}