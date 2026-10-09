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

/** True when no shop in the checkout has a company with a district route. */
export function checkoutHasNoDeliveryRoute(params: {
    shopIds: readonly string[]
    companiesCount: number
    unavailableCompanyIdsByShop: Record<string, string[]>
    loading: boolean
    routesReady: boolean
}): boolean {
    const { shopIds, companiesCount, unavailableCompanyIdsByShop, loading, routesReady } = params
    if (loading || !routesReady || companiesCount === 0 || shopIds.length === 0) return false
    return shopIds.every((shopId) => shopHasNoDeliveryRoute(companiesCount, unavailableCompanyIdsByShop[shopId]))
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