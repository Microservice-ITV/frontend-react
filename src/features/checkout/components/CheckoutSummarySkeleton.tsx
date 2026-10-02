export const stockReadyCheckoutStatuses = new Set([
  'STOCK_CONFIRMED',
  'PAYMENT_INTENT_READY',
  'PAYMENT_PENDING_CONFIRMATION',
  'PENDING_PAYMENT',
  'PAID',
  'COMPLETED',
])

const CheckoutSummarySkeleton = () => (
  <div
    aria-busy="true"
    aria-label="Confirming stock availability"
    className="animate-pulse rounded-sm border border-[var(--dni-cart-border)] bg-white px-3 py-3 sm:px-4 sm:py-4"
  >
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="h-4 w-16 rounded bg-gray-200" />
      </div>
      <div className="flex justify-between">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="h-4 w-16 rounded bg-gray-200" />
      </div>
      <div className="h-24 rounded-xl bg-gray-100" />
      <div className="flex justify-between border-t border-black/10 pt-4">
        <div className="h-5 w-28 rounded bg-gray-200" />
        <div className="h-8 w-24 rounded bg-gray-200" />
      </div>
      <div className="h-12 w-full rounded bg-gray-200" />
    </div>
  </div>
)

export default CheckoutSummarySkeleton
