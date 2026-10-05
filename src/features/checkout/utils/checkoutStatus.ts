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
