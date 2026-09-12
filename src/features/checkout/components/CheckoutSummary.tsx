import { CheckoutTotals } from '../utils/checkoutCalculator'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useEffect, useState } from 'react'
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { checkoutApi } from '../api/checkoutApi'
import {
  setAwaitingFinalStatus,
  setCheckoutError,
  setCheckoutPaymentStatus,
  setCheckoutPlacingOrder,
} from '../store/checkoutSlice'
import type { UserAddress } from '@/features/account/types/addressTypes'
import type { CartItem } from '@/features/cart/types/cartTypes'
import type { CheckoutShopShippingPayload } from '../api/checkoutApi'
import type { CheckoutStatusResponse } from '../types/checkoutTypes'

interface CheckoutSummaryProps {
  checkout: CheckoutTotals
  hasDeliveryAddress: boolean
  onRequireAddress: () => void
  deliveryAddress: UserAddress | null
  cartItems: CartItem[]
  checkoutSessionItems?: CheckoutStatusResponse['items']
}

const buildShopShippings = (
  checkout: CheckoutTotals,
  cartItems: CartItem[],
  checkoutSessionItems: CheckoutStatusResponse['items'] | undefined,
  feesByShopId: Record<string, { amount?: number | null }>,
  shippingCalculateStatus: string,
): CheckoutShopShippingPayload[] => {
  const shopCountFromCart = Object.keys(checkout.groupedByShop).length
  const perShopFallback = shopCountFromCart > 0 ? checkout.shippingSubtotal / shopCountFromCart : 0
  const cartProductToShop = new Map(cartItems.map((item) => [item.productId, item.shopId]))

  const sessionShops = new Map<string, string[]>()
  for (const item of checkoutSessionItems ?? []) {
    const shopId = item.shop_id?.trim()
    if (!shopId) continue
    const productIds = sessionShops.get(shopId) ?? []
    productIds.push(item.product_id)
    sessionShops.set(shopId, productIds)
  }

  const shopIds =
    sessionShops.size > 0
      ? [...sessionShops.keys()]
      : Object.keys(checkout.groupedByShop)

  const perShopFallbackForIds =
    shopIds.length > 0 ? checkout.shippingSubtotal / shopIds.length : perShopFallback

  return shopIds.map((shopId) => {
    const productIds = sessionShops.get(shopId)
    let cartShopId: string | undefined
    if (productIds) {
      for (const productId of productIds) {
        const mapped = cartProductToShop.get(productId)
        if (mapped) {
          cartShopId = mapped
          break
        }
      }
    } else {
      cartShopId = shopId
    }

    const row = cartShopId ? feesByShopId[cartShopId] : undefined
    const fromApi =
      shippingCalculateStatus === 'succeeded' && row?.amount != null && row.amount >= 0
        ? row.amount
        : null

    return {
      shop_id: shopId,
      shipping_fee: fromApi ?? perShopFallbackForIds,
    }
  })
}

const CheckoutSummary = ({
  checkout,
  hasDeliveryAddress,
  onRequireAddress,
  deliveryAddress,
  cartItems,
  checkoutSessionItems,
}: CheckoutSummaryProps) => {
  const dispatch = useAppDispatch()
  const stripe = useStripe()
  const elements = useElements()
  const { currentCheckout, currentStatus, clientSecret, paymentStatus, isPlacingOrder, isAwaitingFinalStatus, error } = useAppSelector(
    state => state.checkout
  )

  const user = useAppSelector(state => state.auth.user)
  const feesByShopId = useAppSelector(state => state.shipping.feesByShopId)
  const totalShippingFee = useAppSelector(state => state.shipping.totalShippingFee)
  const shippingCalculateStatus = useAppSelector(state => state.shipping.calculateStatus)
  const [promotionDiscount, setPromotionDiscount] = useState(0)
  const [authoritativeTotal, setAuthoritativeTotal] = useState<number | null>(null)
  const [promotionQuoteLoading, setPromotionQuoteLoading] = useState(false)
  const [promotionQuoteError, setPromotionQuoteError] = useState(false)

  const promotionItems = cartItems.map((item) => ({
    product_id: item.productId,
    shop_id: item.shopId,
    unit_price: item.price,
    quantity: item.quantity,
  }))

  useEffect(() => {
    const checkoutId = currentCheckout?.checkout_id
    const userId = user?.id
    if (!checkoutId || !userId || promotionItems.length === 0) return

    let cancelled = false
    setPromotionQuoteLoading(true)
    setPromotionQuoteError(false)

    void checkoutApi.quotePromotions({
      checkout_id: checkoutId,
      user_id: userId,
      items: promotionItems,
      subtotal: checkout.merchandiseSubtotal,
      shipping_total: checkout.shippingSubtotal,
    }).then((quote) => {
      if (cancelled) return
      setPromotionDiscount(Number(quote.discount_total ?? 0))
      setAuthoritativeTotal(Number(quote.final_total ?? checkout.totalPayment))
    }).catch(() => {
      if (!cancelled) setPromotionQuoteError(true)
    }).finally(() => {
      if (!cancelled) setPromotionQuoteLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [checkout.merchandiseSubtotal, checkout.shippingSubtotal, checkout.totalPayment, currentCheckout?.checkout_id, user?.id, cartItems])

  const buildCheckoutAddressPayload = (address: UserAddress) => {
    const shipping_total =
      shippingCalculateStatus === 'succeeded' && totalShippingFee != null && totalShippingFee >= 0
        ? totalShippingFee
        : checkout.shippingSubtotal

    const shop_shippings = buildShopShippings(
      checkout,
      cartItems,
      checkoutSessionItems ?? currentStatus?.items,
      feesByShopId,
      shippingCalculateStatus,
    )

    return {
      full_name: address.full_name,
      phone_no: address.phone_no,
      email: address.email ?? user?.email ?? null,
      country_code: address.country_code || 'MM',
      country: address.country ?? '',
      state: address.state ?? '',
      city: address.city ?? '',
      district: address.district ?? '',
      ward: address.ward ?? '',
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 ?? null,
      postal_code: address.postal_code ?? null,
      latitude: address.latitude ?? null,
      longitude: address.longitude ?? null,
      delivery_note: address.delivery_note ?? null,
      shipping_total,
      shop_shippings,
    }
  }

  const handlePlaceOrder = async () => {
    if (!hasDeliveryAddress || !deliveryAddress) {
      dispatch(setCheckoutError('Please add a delivery address before placing your order.'))
      onRequireAddress()
      return
    }

    if (!currentCheckout?.checkout_id) {
      dispatch(setCheckoutError('Checkout session is not ready yet. Please try again.'))
      return
    }

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
      // Persist shipping snapshot to order-service before payment confirmation.
      console.info('[PlaceOrder] Updating checkout address...')
      const addressResponse = await checkoutApi.updateCheckoutAddress(
        currentCheckout.checkout_id,
        buildCheckoutAddressPayload(deliveryAddress),
      )
      setPromotionDiscount(Number(addressResponse.data?.promotion_discount_total ?? 0))
      setAuthoritativeTotal(addressResponse.data?.grand_total ?? null)
      console.info('[PlaceOrder] Address updated, confirming payment with Stripe...')

      // If the backend reports the payment intent already succeeded (e.g. from a
      // prior confirmCardPayment call), skip confirmation and go straight to
      // polling for the final checkout status.
      if (addressResponse.data?.already_succeeded) {
        console.info('[PlaceOrder] Payment intent already succeeded, skipping confirmCardPayment')
        dispatch(setCheckoutPaymentStatus('PAYMENT_PENDING_CONFIRMATION'))
        dispatch(setAwaitingFinalStatus(true))
        dispatch(setCheckoutError(null))
        dispatch(setCheckoutPlacingOrder(false))
        return
      }

      // The address update may have triggered a payment-intent amount update on
      // the backend. If the original Stripe intent no longer exists the payment-
      // service creates a new one, returning a fresh client_secret. Use it so we
      // don't confirm against a stale / deleted intent.
      const updatedClientSecret = addressResponse.data?.payment?.client_secret
      const effectiveClientSecret = updatedClientSecret ?? clientSecret

      const result = await stripe.confirmCardPayment(effectiveClientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: user?.name,
            email: user?.email,
          },
        },
      })

      console.info('[PlaceOrder] Stripe confirmCardPayment result:', {
        hasError: !!result.error,
        paymentIntentStatus: result.paymentIntent?.status,
        errorMessage: result.error?.message,
      })

      // If Stripe says the intent already succeeded (race with prior call or webhook),
      // treat it as success — the webhook will complete the flow.
      if (
        result.error &&
        (result.error.code === 'payment_intent_unexpected_state' ||
          /already succeeded/i.test(result.error.message ?? ''))
      ) {
        console.info('[PlaceOrder] Payment intent already succeeded per Stripe, proceeding to polling')
        dispatch(setCheckoutPaymentStatus('PAYMENT_PENDING_CONFIRMATION'))
        dispatch(setAwaitingFinalStatus(true))
        dispatch(setCheckoutError(null))
        dispatch(setCheckoutPlacingOrder(false))
        return
      }

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
    } catch (error: unknown) {
      console.error('[PlaceOrder] Unexpected error during payment confirmation:', error)

      const apiError =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { data?: { error?: string } } }).response?.data?.error
      dispatch(
        setCheckoutError(
          typeof apiError === 'string' && apiError.trim() !== ''
            ? apiError
            : 'Unable to confirm payment. Please try again.',
        ),
      )
      dispatch(setAwaitingFinalStatus(false))
      dispatch(setCheckoutPlacingOrder(false))
    }
  }

  const isTerminal =
    paymentStatus === 'PAID' ||
    paymentStatus === 'COMPLETED' ||
    paymentStatus === 'FAILED_PAYMENT' ||
    paymentStatus === 'EXPIRED'

  const canPlaceOrder =
    !!clientSecret &&
    !isPlacingOrder &&
    !isAwaitingFinalStatus &&
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
  const displayedTotal = authoritativeTotal ?? totalPayment

return (
    <div className="bg-[#fffefb] border-t border-dashed border-black/10 px-6 py-6">
      {/* Summary breakdown */}
      <div className="text-sm text-gray-700 mb-6">
        {/* Merchandise */}
        <div className="flex justify-between mb-3">
          <span className="text-gray-600">Merchandise Subtotal</span>
          <span className="text-gray-900">${merchandiseSubtotal.toFixed(2)}</span>
        </div>

        {/* Shipping subtotal uses API `totalShippingFee` when calculate succeeds */}
        <div className="flex justify-between mb-3">
          <span className="text-gray-600">Shipping Subtotal</span>
          <span className="text-gray-900">${shippingSubtotal.toFixed(2)}</span>
        </div>

        <div className="mb-4 space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">Your savings</p>
              <p className="mt-0.5 text-xs text-emerald-700">Promotions are checked for this checkout</p>
            </div>
            {promotionQuoteLoading ? (
              <span className="text-xs font-medium text-emerald-700">Checking…</span>
            ) : (
              <span className="text-lg font-bold text-emerald-700">-${promotionDiscount.toFixed(2)}</span>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-emerald-100 pt-2 text-xs">
            <span className="text-gray-600">Shipping discount</span>
            <span className="font-medium text-emerald-700">-${shippingDiscount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Promotion discount</span>
            <span className="font-semibold text-emerald-700">-${promotionDiscount.toFixed(2)}</span>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-end pt-4 border-t border-black/10">
          <span className="text-gray-900 font-medium">
            Total Payment:
          </span>
          <span className="text-3xl font-semibold text-emerald-600">
            ${displayedTotal.toFixed(2)}
          </span>
        </div>
        {promotionQuoteError && (
          <p className="mt-2 text-right text-[11px] text-amber-700">Promotion preview unavailable. Your total will be checked before payment.</p>
        )}
      </div>

      {/* GST note */}
      <div className="flex items-center justify-end gap-1 text-xs text-gray-500 mb-4">
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

      {/* Place order */}
      <div className="w-full mb-4">
        <button
          onClick={() => void handlePlaceOrder()}
          disabled={!canPlaceOrder}
          className="w-full px-12 py-3 bg-emerald-600 text-white text-base font-medium rounded hover:bg-emerald-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPlacingOrder
            ? 'Processing...'
            : isAwaitingFinalStatus
              ? 'Waiting confirmation...'
              : 'Place Order'}
        </button>
      </div>

      {/* Status message */}
      <div className="text-right">
        <p className="text-xs text-gray-500">
          {error
            ? error
            : paymentStatus === 'PAID' || paymentStatus === 'COMPLETED'
              ? 'Order completed successfully.'
              : paymentStatus === 'FAILED_PAYMENT'
                ? 'Payment failed. Please try again.'
                : paymentStatus === 'STOCK_CONFIRMED'
                  ? 'Stock confirmed. Finalizing payment...'
                  : paymentStatus === 'PENDING_STOCK'
                    ? 'Confirming stock availability...'
                    : paymentStatus === 'EXPIRED'
                      ? 'Checkout expired. Please start a new checkout.'
                      : !hasDeliveryAddress
                        ? 'Please add your delivery address to continue.'
                        : clientSecret
                          ? 'Payment ready. You can place your order.'
                          : 'Preparing payment...'}
        </p>
      </div>
    </div>
  )
}

export default CheckoutSummary