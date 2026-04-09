import type { CartItem } from '../types/cartTypes'

export function normalizeVariantId(variantId?: string | null): string {
    return variantId ?? ''
}

/** Same physical line in the cart (product + SKU variant). */
export function sameCartLine(
    a: Pick<CartItem, 'productId' | 'variantId'>,
    b: Pick<CartItem, 'productId' | 'variantId'>,
): boolean {
    return a.productId === b.productId && normalizeVariantId(a.variantId) === normalizeVariantId(b.variantId)
}

export function cartLineKey(item: Pick<CartItem, 'productId' | 'variantId'>): string {
    return `${item.productId}::${normalizeVariantId(item.variantId)}`
}