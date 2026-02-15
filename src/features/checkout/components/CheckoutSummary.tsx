import { CheckoutTotals } from '../utils/checkoutCalculator'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js'
import {
  setAwaitingFinalStatus,
  setCheckoutError,
  setCheckoutPaymentStatus,
  setCheckoutPlacingOrder,
} from '../store/checkoutSlice'

interface CheckoutSummaryProps {
  checkout: CheckoutTotals
}

const CheckoutSummary = ({ checkout }: CheckoutSummaryProps) => {
  const dispatch = useAppDispatch()
  const stripe = useStripe()
  const elements = useElements()
  const { clientSecret, paymentStatus, isPlacingOrder, error } = useAppSelector(
    state => state.checkout
  )

  const user = useAppSelector(state => state.auth.user)

  const handlePlaceOrder = async () => {
    if (!stripe || !elements || !clientSecret) {
      dispatch(setCheckoutError('Payment is not ready yet.'))
      return
    }

    const card = elements.getElement(CardElement)
    if (!card) {
      dispatch(setCheckoutError('Card input is not available.'))
      return
    }

    dispatch(setCheckoutError(null))
    dispatch(setCheckoutPlacingOrder(true))


    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: user?.name,
            email: user?.email,
          },
        },
      })

      // Payment final state is webhook-driven; polling updates checkout status in store.
      if (result.error) {
        dispatch(setCheckoutError(result.error.message ?? 'Payment confirmation failed.'))
        dispatch(setAwaitingFinalStatus(false))
        dispatch(setCheckoutPlacingOrder(false))
        return
      }

      // Switch to awaiting-final-status mode so checkout page resumes polling.
      dispatch(setCheckoutPaymentStatus('PAYMENT_PENDING_CONFIRMATION'))
      dispatch(setAwaitingFinalStatus(true))
      dispatch(setCheckoutError(null))
      dispatch(setCheckoutPlacingOrder(false))
    } catch {
      dispatch(setCheckoutError('Unable to confirm payment. Please try again.'))
      dispatch(setAwaitingFinalStatus(false))
      dispatch(setCheckoutPlacingOrder(false))
    }
  }

  const isTerminal =
    paymentStatus === 'PAID' ||
    paymentStatus === 'COMPLETED' ||
    paymentStatus === 'FAILED' ||
    paymentStatus === 'EXPIRED'

  const canPlaceOrder =
    !!clientSecret &&
    !isPlacingOrder &&
    !isTerminal &&
    (!paymentStatus ||
      paymentStatus === 'PAYMENT_INTENT_READY' ||
      paymentStatus === 'PAYMENT_PENDING_CONFIRMATION' ||
      paymentStatus === 'PENDING_PAYMENT')

  const {
    merchandiseSubtotal,
    shippingSubtotal,
    shippingDiscount,
    totalPayment,
  } = checkout

  return (
    <div className="bg-[#fffefb] border-t border-dashed border-black/10 px-6 py-6">
      {/* Summary rows */}
      <div className="flex justify-center md:justify-end">
        <div className="w-full md:w-[360px] text-sm text-gray-700">

          {/* Merchandise */}
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">Merchandise Subtotal</span>
            <span className="text-gray-900">${merchandiseSubtotal.toFixed(2)}</span>
          </div>

          {/* Shipping */}
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">Shipping Subtotal</span>
            <span className="text-gray-900">${shippingSubtotal.toFixed(2)}</span>
          </div>

          {/* Discount */}
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">Shipping Discount Subtotal</span>
            <span className="text-[#ee4d2d]">-{shippingDiscount.toFixed(2)}</span>
          </div>

          {/* Total */}
          <div className="flex justify-between items-end">
            <span className="text-gray-900 font-medium">
              Total Payment:
            </span>
            <span className="text-3xl font-semibold text-[#ee4d2d] text-center md:text-right">
              ${totalPayment.toFixed(2)}
            </span>
          </div>

          {/* GST note */}
          <div className="mt-2 flex items-center justify-end gap-1 text-xs text-gray-500">
            <span>GST included, where applicable.</span>
            <svg viewBox="0 0 15 15" className="w-4 h-4 text-gray-400">
              <circle cx="7.5" cy="7.5" r="6.5" fill="none" stroke="currentColor" />
              <path
                d="M7.5 11.2v-1.2M5.7 5.6a1.9 1.9 0 013.6.7c0 1.2-1.2 1.5-1.4 2.3"
                stroke="currentColor"
                fill="none"
              />
            </svg>
          </div>

        </div>
      </div>

      {/* Place order */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => void handlePlaceOrder()}
          disabled={!canPlaceOrder}
          className="w-full md:w-auto px-12 py-3 bg-[#ee4d2d] text-white text-base font-medium rounded hover:bg-[#d73211] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPlacingOrder ? 'Processing...' : 'Place Order'}
        </button>
      </div>

      <div className="mt-2 flex justify-end">
        <p className="text-xs text-gray-500">
          {error
            ? error
            : paymentStatus === 'PAID' || paymentStatus === 'COMPLETED'
              ? 'Order completed successfully.'
              : paymentStatus === 'FAILED'
                ? 'Payment failed. Please try again.'
                : paymentStatus === 'EXPIRED'
                  ? 'Checkout expired. Please start a new checkout.'
                  : clientSecret
                    ? 'Payment ready. You can place your order.'
                    : 'Preparing payment...'}
        </p>
      </div>
    </div>
  )
}

export default CheckoutSummary