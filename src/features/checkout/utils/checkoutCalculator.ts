import { CartItem } from '@/features/cart/types/cartTypes'
import type { ShopCalculatedShipping } from '@/features/shipping/types/shippingTypes'

export interface CheckoutTotals {
    merchandiseSubtotal: number
    shippingSubtotal: number
    shippingDiscount: number
    totalPayment: number
    groupedByShop: Record<string, CartItem[]>
}

export type CheckoutShippingFeeOpts = {
    feesByShop?: Record<string, Pick<ShopCalculatedShipping, 'amount'>>
    /** Prefer API aggregate when provided (matches payment summary). */
    totalShippingFee?: number | null
}

/** Fixed label for waived / pay-on-arrival delivery (keep two decimals). */
export const ZERO_DELIVERY_FEE_LABEL = 'Ks 0.00'

/**
 * Build calculateCheckout fee opts from a successful shipping quote.
 * The pay-now switch only changes display and place-order payload — not this quote.
 */
export function shippingFeesForCheckout(
    calculateStatus: string,
    feesByShopId: Record<string, Pick<ShopCalculatedShipping, 'amount'>>,
    totalShippingFee: number | null,
): CheckoutShippingFeeOpts | undefined {
    if (calculateStatus !== 'succeeded' || Object.keys(feesByShopId).length === 0) {
        return undefined
    }
    return { feesByShop: feesByShopId, totalShippingFee }
}

/**
 * Amount shown on payment method when the customer may waive delivery for now.
 * Includes tax when provided so cash tender matches the order total.
 */
export function amountDueNow(
    checkout: CheckoutTotals,
    payDeliveryFeeNow: boolean,
    taxAmount = 0,
    promotionDiscount = 0,
): number {
    const base = payDeliveryFeeNow ? checkout.totalPayment : checkout.merchandiseSubtotal
    return Math.max(0, base - Math.max(0, promotionDiscount)) + Math.max(0, taxAmount)
}

export const calculateCheckout = (
    items: CartItem[],
    opts?: CheckoutShippingFeeOpts,
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
        if (apiTotal != null && apiTotal >= 0) {
            shippingSubtotal = apiTotal
        } else {
            shippingSubtotal = shopIds.reduce((sum, id) => {
                const amount = fees[id]?.amount
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