import type { CartItem } from '../types/cartTypes'

const CART_KEY = 'dni_cart'

/** Coerce weight/dims that may be stored as numeric strings in localStorage. */
function toPositiveNumber(value: unknown): number | null {
    if (value == null || value === '') return null
    const n = typeof value === 'number' ? value : Number(String(value).trim())
    return Number.isFinite(n) && n > 0 ? n : null
}

function normalizeStoredItem(raw: Partial<CartItem>): CartItem {
    return {
        productId: String(raw.productId ?? ''),
        variantId: raw.variantId ?? '',
        variantLabel: raw.variantLabel,
        shopId: String(raw.shopId ?? ''),
        shopName: String(raw.shopName ?? ''),
        name: String(raw.name ?? ''),
        image: raw.image,
        price: typeof raw.price === 'number' ? raw.price : Number(raw.price) || 0,
        quantity: typeof raw.quantity === 'number' ? raw.quantity : Number(raw.quantity) || 1,
        weightKg: toPositiveNumber(raw.weightKg),
        lengthCm: toPositiveNumber(raw.lengthCm),
        widthCm: toPositiveNumber(raw.widthCm),
        heightCm: toPositiveNumber(raw.heightCm),
        selected: Boolean(raw.selected),
        categoryId: raw.categoryId ? String(raw.categoryId) : undefined,
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