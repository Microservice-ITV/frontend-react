import type { CheckoutPaymentStatus } from '../types/checkoutTypes'

export const stockConfirmedCheckoutStatuses = new Set<CheckoutPaymentStatus>([
  'STOCK_CONFIRMED',
  'PAYMENT_INTENT_READY',
  'PAYMENT_PENDING_CONFIRMATION',
  'PENDING_PAYMENT',
  'PAID',
  'COMPLETED',
])

export const hasConfirmedStock = (status: CheckoutPaymentStatus | null | undefined): boolean => {
  return status ? stockConfirmedCheckoutStatuses.has(status) : false
}

/**
 * Whether the order summary may be shown (as opposed to the skeleton).
 *
 * This is deliberately MONOTONIC within a page mount: once a real summary has been
 * rendered, it stays rendered. There is a history of two separate summary ->
 * skeleton -> summary flickers here, both from keying the confirmation on a value
 * that legitimately changes:
 *
 * 1. Keying on `null` readiness. With no checkout session yet both the latch and the
 *    readiness key were null, so `latch === key` was `null === null` -> true: the
 *    summary rendered before stock was ever confirmed. Restoring the session from
 *    storage then made the key non-null, the latch stopped matching, and the summary
 *    flipped to the skeleton and back.
 *
 * 2. Keying on `${checkout_id}|${cartFingerprint}` (the current fix's predecessor).
 *    `checkoutCart.fulfilled` installs a new `checkout_id` AND resets
 *    `paymentStatus` to null in the same reducer, so the live-status check and the
 *    key comparison failed together. The latch is written from an effect, which runs
 *    *after* render, so the summary tore down for a full frame before the effect
 *    re-latched it. Any legitimate session replacement (a cart edit invalidates the
 *    stored fingerprint, so the page clears the session and creates a new one)
 *    produced summary -> skeleton -> summary.
 *
 * Monotonic is safe because nothing the summary displays is derived from the checkout
 * session: the totals come from the cart and the shipping quote, which update live.
 * A session that is mid-replacement cannot submit a stale order either, because Place
 * Order independently requires `clientSecret` and therefore disables itself.
 *
 * `confirmedReadinessKey` is only ever assigned, never cleared, so a non-null value is
 * exactly "a real summary has been painted for this mount". The readiness key itself is
 * deliberately NOT consulted here: it is the input for writing the latch, not for
 * reading it.
 */
export const isStockReadinessConfirmed = ({
  paymentStatus,
  confirmedReadinessKey,
}: {
  paymentStatus: CheckoutPaymentStatus | null | undefined
  confirmedReadinessKey: string | null
}): boolean => {
  if (hasConfirmedStock(paymentStatus)) return true
  return confirmedReadinessKey != null
}