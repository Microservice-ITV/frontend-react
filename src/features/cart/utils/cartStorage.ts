import type { CartItem } from '../types/cartTypes'

const CART_KEY = 'dni_cart'

function normalizeStoredItem(raw: Partial<CartItem>): CartItem {
    return {
        productId: String(raw.productId ?? ''),
        variantId: raw.variantId ?? '',
        variantLabel: raw.variantLabel,
        shopId: String(raw.shopId ?? ''),
        shopName: String(raw.shopName ?? ''),
        name: String(raw.name ?? ''),
        image: raw.image,
        price: typeof raw.price === 'number' ? raw.price : 0,
        quantity: typeof raw.quantity === 'number' ? raw.quantity : 1,
        selected: Boolean(raw.selected),
        flashDealItemId: raw.flashDealItemId,
    }
}

export const loadCart = (): CartItem[] => {
    try {
        const raw = localStorage.getItem(CART_KEY)
        if (!raw) return []

        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.map((row: Partial<CartItem>) => normalizeStoredItem(row))
    } catch {
        return []
    }
}

export const saveCart = (items: CartItem[]) => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
}