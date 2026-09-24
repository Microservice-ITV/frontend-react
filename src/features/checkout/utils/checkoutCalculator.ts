import { CartItem } from '@/features/cart/types/cartTypes'
import type { ShopCalculatedShipping } from '@/features/shipping/types/shippingTypes'

export interface CheckoutTotals {
    merchandiseSubtotal: number
    shippingSubtotal: number
    shippingDiscount: number
    totalPayment: number
    groupedByShop: Record<string, CartItem[]>
}

export const calculateCheckout = (
    items: CartItem[],
    opts?: {
        feesByShop?: Record<string, Pick<ShopCalculatedShipping, 'amount' | 'deliveryStatus'>>
        /** Prefer API aggregate when provided (matches payment summary). */
        totalShippingFee?: number | null
    },
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

    const shopIds = Object.keys(groupedByShop)
    const useApiFees = opts?.feesByShop && Object.keys(opts.feesByShop).length > 0
    const apiTotal = opts?.totalShippingFee

    // No fake fallback: until the real calculate API succeeds, shipping is 0 and the
    // checkout surfaces an explicit "shipping unavailable" message instead of a stub fee.
    let shippingSubtotal = 0
    const shippingDiscount = 0

    if (useApiFees && opts?.feesByShop) {
        const fees = opts.feesByShop
        const hasUndeliverable = shopIds.some(
            (id) => fees[id]?.deliveryStatus === 'NOT_DELIVERABLE',
        )

        if (!hasUndeliverable && apiTotal != null && apiTotal >= 0) {
            shippingSubtotal = apiTotal
        } else {
            shippingSubtotal = shopIds.reduce((sum, id) => {
                const row = fees[id]
                if (row?.deliveryStatus === 'NOT_DELIVERABLE') return sum
                const amount = row?.amount
                return sum + (amount != null && amount >= 0 ? amount : 0)
            }, 0)
        }
    }

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