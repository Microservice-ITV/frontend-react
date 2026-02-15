export interface CartItem {
    productId: string
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