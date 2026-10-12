import type { DeliveryUnavailableReason } from '@/features/shipping/types/shippingTypes'

/** Mirrors `ShippingState['calculateStatus']` in features/shipping/store/shippingSlice. */
export type ShippingCalculateStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

export const DELIVERY_FOLLOW_UP_MESSAGE =
    'Delivery fees will be confirmed later. You can place your order now, and our team will contact you to arrange delivery.'

export function deliveryUnavailableMessage(
    reason: DeliveryUnavailableReason | undefined,
): string {
    if (reason === 'PROFILE_NOT_READY') return 'This shop cannot deliver yet.'
    if (reason === 'ROUTE_NOT_AVAILABLE') return DELIVERY_FOLLOW_UP_MESSAGE
    return 'Delivery is not available to this address.'
}

/** True when every listed company is blocked for this shop's district pair. */
export function shopHasNoDeliveryRoute(
    companiesCount: number,
    unavailableCompanyIds: readonly string[] | undefined,
): boolean {
    return companiesCount > 0 && (unavailableCompanyIds?.length ?? 0) >= companiesCount
}

export type DeliveryAvailabilityParams = {
    shopIds: readonly string[]
    /** Per-shop count of companies the shop admin enabled for checkout. */
    companiesCountByShop: Record<string, number>
    unavailableCompanyIdsByShop: Record<string, string[]>
    loading: boolean
    routesReady: boolean
}

export type PayDeliveryLockReason = 'company' | 'route'

function shopCompanyCount(
    companiesCountByShop: Record<string, number>,
    shopId: string,
): number {
    return companiesCountByShop[shopId] ?? 0
}

/** True when no shop in the checkout has a company with a district route. */
export function checkoutHasNoDeliveryRoute(params: DeliveryAvailabilityParams): boolean {
    const { shopIds, companiesCountByShop, unavailableCompanyIdsByShop, loading, routesReady } = params
    if (loading || !routesReady || shopIds.length === 0) return false
    const anyCompanies = shopIds.some((shopId) => shopCompanyCount(companiesCountByShop, shopId) > 0)
    if (!anyCompanies) return false
    return shopIds.every((shopId) =>
        shopHasNoDeliveryRoute(
            shopCompanyCount(companiesCountByShop, shopId),
            unavailableCompanyIdsByShop[shopId],
        ),
    )
}

/**
 * When true, "Pay delivery fee now" must stay off and cannot be turned on:
 * - no delivery companies, or
 * - companies exist but none have a route for this checkout.
 */
export function mustWaiveDeliveryFeeNow(params: DeliveryAvailabilityParams): boolean {
    const { shopIds, companiesCountByShop, loading } = params
    if (loading) return false
    const totalCompanies = shopIds.reduce(
        (sum, shopId) => sum + shopCompanyCount(companiesCountByShop, shopId),
        0,
    )
    if (totalCompanies === 0) return true
    return checkoutHasNoDeliveryRoute(params)
}

/** Tooltip / hint when the pay-now switch is forced off. */
export function payDeliveryFeeNowLockMessage(reason: PayDeliveryLockReason): string {
    if (reason === 'route') {
        return 'No delivery route for this address. You cannot pay the delivery fee now.'
    }
    return 'No delivery company is available. You cannot pay the delivery fee now.'
}

/** Prefer route over company when both apply for a shop card. */
export function shopPayDeliveryLockReason(params: {
    noDeliveryCompany: boolean
    noDeliveryRoute: boolean
    checkoutLockedOff?: boolean
}): PayDeliveryLockReason | null {
    if (params.noDeliveryRoute) return 'route'
    if (params.noDeliveryCompany || params.checkoutLockedOff) return 'company'
    return null
}

export type DeliveryReadinessInput = {
    /** A delivery address has been chosen for this checkout. */
    hasDeliveryAddress: boolean
    /** Status of the shipping quote that produces the delivery fee. */
    calculateStatus: ShippingCalculateStatus
    /** Authoritative delivery total; null when the quote has no usable number. */
    totalShippingFee: number | null
    /** Raw failure message from the shipping service, when it sent one. */
    calculateError?: string | null
    /** Per-shop `deliveryStatus === 'NOT_DELIVERABLE'` flags from the quote. */
    deliveryStatuses?: ReadonlyArray<string | undefined>
    /** Per-shop reason, aligned with `deliveryStatuses` when present. */
    unavailableReasons?: ReadonlyArray<DeliveryUnavailableReason | undefined>
}

/**
 * The reason an order cannot be placed yet because of delivery, or `null` when
 * the delivery fee is settled and payable.
 *
 * A missing address deliberately returns `null` rather than blocking: that click
 * opens the address modal, so the button has to stay live for it.
 */
export const getDeliveryBlockReason = ({
    hasDeliveryAddress,
    calculateStatus,
    totalShippingFee,
    calculateError,
    deliveryStatuses = [],
    unavailableReasons = [],
}: DeliveryReadinessInput): string | null => {
    if (!hasDeliveryAddress) return null

    // 'idle' and 'loading' are NOT faults — the quote has not resolved yet and will
    // settle on its own within a moment. Deliberately return null for both: blocking
    // here made the Place Order button flash disabled on every checkout mount
    // (idle -> loading -> succeeded) and swapped the helper text under it twice,
    // which visibly janked the summary card's height. A click that lands mid-calc is
    // still caught by the runtime guard in handlePlaceOrder.
    if (calculateStatus !== 'succeeded') {
        if (calculateStatus === 'failed') {
            // Shipping service is down, or the quote request itself failed.
            const message = calculateError?.trim()
            return message || 'The delivery service is unavailable right now. Please try again in a moment.'
        }
        return null
    }

    // The quote resolved but carries no usable fee.
    if (totalShippingFee == null) {
        return 'The delivery fee is not ready yet. Please wait for it to calculate, or check your delivery address.'
    }

    if (deliveryStatuses.includes('NOT_DELIVERABLE')) {
        const messages = [
            ...new Set(
                unavailableReasons
                    .filter((reason): reason is DeliveryUnavailableReason => reason != null)
                    .map((reason) => deliveryUnavailableMessage(reason)),
            ),
        ]

        // Route/area problems are handled as a follow-up flow: the customer can still
        // place the order now, and the team will confirm the final delivery fee later.
        if (messages.length > 0) {
            const routeIssue = unavailableReasons.some((reason) => reason === 'ROUTE_NOT_AVAILABLE')
            if (routeIssue) return null
            return messages.join(' ')
        }

        return null
    }

    return null
}