import type { DeliveryUnavailableReason } from '@/features/shipping/types/shippingTypes'

/** Mirrors `ShippingState['calculateStatus']` in features/shipping/store/shippingSlice. */
export type ShippingCalculateStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

export function deliveryUnavailableMessage(
    reason: DeliveryUnavailableReason | undefined,
): string {
    if (reason === 'PROFILE_NOT_READY') return 'This shop cannot deliver yet.'
    if (reason === 'ROUTE_NOT_AVAILABLE') return 'We cannot deliver this shop on this route.'
    return 'Delivery is not available to this address.'
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
        if (messages.length > 0) return messages.join(' ')
        return 'One or more shops cannot deliver to your address. Please remove those items or choose another address.'
    }

    return null
}