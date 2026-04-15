import { CartItem } from '@/features/cart/types/cartTypes'
import type { ShopCalculatedShipping } from '@/features/shipping/types/shippingTypes'

export interface CheckoutTotals {
    merchandiseSubtotal: number
    shippingSubtotal: number
    shippingDiscount: number
    totalPayment: number
    groupedByShop: Record<string, CartItem[]>
}

const DEFAULT_SHOP_SHIPPING = 1.99

export const calculateCheckout = (
    items: CartItem[],
    opts?: {
        feesByShop?: Record<string, Pick<ShopCalculatedShipping, 'amount'>>
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

    let shippingSubtotal: number
    let shippingDiscount: number

    if (useApiFees && opts?.feesByShop) {
        const fees = opts.feesByShop
        if (apiTotal != null && apiTotal >= 0) {
            shippingSubtotal = apiTotal
        } else {
            shippingSubtotal = shopIds.reduce((sum, id) => {
                const amount = fees[id]?.amount
                return sum + (amount != null && amount >= 0 ? amount : DEFAULT_SHOP_SHIPPING)
            }, 0)
        }
        shippingDiscount = 0
    } else {
        shippingSubtotal = shopIds.length * DEFAULT_SHOP_SHIPPING
        shippingDiscount = shippingSubtotal > 0 ? DEFAULT_SHOP_SHIPPING : 0
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