import { CartItem } from '@/features/cart/types/cartTypes'

export interface CheckoutTotals {
    merchandiseSubtotal: number
    shippingSubtotal: number
    shippingDiscount: number
    totalPayment: number
    groupedByShop: Record<string, CartItem[]>
}

export const calculateCheckout = (
    items: CartItem[]
): CheckoutTotals => {
    const groupedByShop = items.reduce<Record<string, CartItem[]>>(
        (acc, item) => {
            if (!acc[item.shopId]) acc[item.shopId] = []
            acc[item.shopId].push(item)
            return acc
        },
        {}
    )

    const merchandiseSubtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    )

    const shippingSubtotal = Object.keys(groupedByShop).length * 1.99
    const shippingDiscount = shippingSubtotal > 0 ? 1.99 : 0

    const totalPayment =
        merchandiseSubtotal + shippingSubtotal - shippingDiscount

    return {
        merchandiseSubtotal,
        shippingSubtotal,
        shippingDiscount,
        totalPayment,
        groupedByShop,
    }
}