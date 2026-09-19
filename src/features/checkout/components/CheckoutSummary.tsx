import { CheckoutTotals } from '../utils/checkoutCalculator'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useEffect, useState } from 'react'
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { checkoutApi, type PromoCodeStatus } from '../api/checkoutApi'
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
import { formatProductPrice } from '@/features/products/utils/formatProductPrice'

interface CheckoutSummaryProps {
  checkout: CheckoutTotals
  hasDeliveryAddress: boolean
  onRequireAddress: () => void
  deliveryAddress: UserAddress | null
  cartItems: CartItem[]
  checkoutSessionItems?: CheckoutStatusResponse['items']
}

const promoStatusLabel = (status: PromoCodeStatus | null | undefined, message?: string | null): string => {
  if (message?.trim()) return message
  switch (status) {
    case 'VALID':
      return 'Promo code applied'
    case 'EXPIRED':
      return 'Promo code has expired'
    case 'USED':
      return 'Promo code has already been used'
    case 'DISABLED':
      return 'Promo code is disabled'
    case 'RESERVED':
      return 'Promo code is reserved for another customer'
    case 'LIMIT_REACHED':
      return 'Promo code has reached its usage limit'
    case 'NOT_APPLICABLE':
      return 'This promo code does not apply to the current cart'
    case 'INVALID':
      return 'Promo code is invalid'
    default:
      return ''
  }
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
  const shippingCalculateError = useAppSelector(state => state.shipping.calculateError)
  const [promotionDiscount, setPromotionDiscount] = useState(0)
  const [authoritativeTotal, setAuthoritativeTotal] = useState<number | null>(null)
  const [promotionQuoteLoading, setPromotionQuoteLoading] = useState(false)
  const [promotionQuoteError, setPromotionQuoteError] = useState(false)
  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null)
  const [promoCodeStatus, setPromoCodeStatus] = useState<PromoCodeStatus | null>(null)
  const [promoCodeMessage, setPromoCodeMessage] = useState<string | null>(null)
  const [promoCodeApplying, setPromoCodeApplying] = useState(false)

  const promotionItems = cartItems.map((item) => ({
    product_id: item.productId,
    shop_id: item.shopId,
    unit_price: item.price,
    quantity: item.quantity,
  }))

  const requestPromotionQuote = async (promoCode?: string | null) => {
    const checkoutId = currentCheckout?.checkout_id
    const userId = user?.id
    if (!checkoutId || !userId || promotionItems.length === 0) return null

    return checkoutApi.quotePromotions({
      checkout_id: checkoutId,
      user_id: userId,
      items: promotionItems,
      subtotal: checkout.merchandiseSubtotal,
      shipping_total: checkout.shippingSubtotal,
      promo_code: promoCode ?? undefined,
    })
  }

  useEffect(() => {
    const checkoutId = currentCheckout?.checkout_id
    const userId = user?.id
    if (!checkoutId || !userId || promotionItems.length === 0) return

    let cancelled = false
    setPromotionQuoteLoading(true)
    setPromotionQuoteError(false)

    void requestPromotionQuote(appliedPromoCode).then((quote) => {
      if (cancelled || !quote) return
      setPromotionDiscount(Number(quote.discount_total ?? 0))
      setAuthoritativeTotal(Number(quote.final_total ?? checkout.totalPayment))
      if (appliedPromoCode) {
        setPromoCodeStatus(quote.promo_code_status ?? null)
        setPromoCodeMessage(quote.promo_code_message ?? null)
      }
    }).catch(() => {
      if (!cancelled) setPromotionQuoteError(true)
    }).finally(() => {
      if (!cancelled) setPromotionQuoteLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [checkout.merchandiseSubtotal, checkout.shippingSubtotal, checkout.totalPayment, currentCheckout?.checkout_id, user?.id, cartItems, appliedPromoCode])

  const handleApplyPromoCode = async () => {
    const code = promoCodeInput.trim().toUpperCase()
    if (!code) {
      setAppliedPromoCode(null)
      setPromoCodeStatus(null)
      setPromoCodeMessage(null)
      return
    }

    setPromoCodeApplying(true)
    setPromotionQuoteError(false)
    try {
      const quote = await requestPromotionQuote(code)
      if (!quote) return

      setPromotionDiscount(Number(quote.discount_total ?? 0))
      setAuthoritativeTotal(Number(quote.final_total ?? checkout.totalPayment))
      setPromoCodeStatus(quote.promo_code_status ?? 'INVALID')
      setPromoCodeMessage(quote.promo_code_message ?? null)

      if (quote.promo_code_status === 'VALID') {
        setAppliedPromoCode(code)
        setPromoCodeInput(code)
      } else {
        setAppliedPromoCode(null)
      }
    } catch {
      setPromotionQuoteError(true)
      setPromoCodeStatus('INVALID')
      setPromoCodeMessage('Unable to validate promo code. Please try again.')
      setAppliedPromoCode(null)
    } finally {
      setPromoCodeApplying(false)
    }
  }

  const handleClearPromoCode = () => {
    setPromoCodeInput('')
    setAppliedPromoCode(null)
    setPromoCodeStatus(null)
    setPromoCodeMessage(null)
  }

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
      promo_code: appliedPromoCode,
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

    if (shippingCalculateStatus !== 'succeeded' || totalShippingFee == null) {
      dispatch(
        setCheckoutError(
          shippingCalculateError?.trim() ||
            'Delivery fee is not ready yet. Please wait for it to calculate, or check your delivery address.',
        ),
      )
      return
    }

    if (promoCodeInput.trim() && !appliedPromoCode) {
      dispatch(setCheckoutError('Apply a valid promo code before placing your order, or clear the field.'))
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
      console.info('[PlaceOrder] Updating checkout address...')
      const addressResponse = await checkoutApi.updateCheckoutAddress(
        currentCheckout.checkout_id,
        buildCheckoutAddressPayload(deliveryAddress),
      )
      setPromotionDiscount(Number(addressResponse.data?.promotion_discount_total ?? 0))
      setAuthoritativeTotal(addressResponse.data?.grand_total ?? null)
      if (addressResponse.data?.promo_code_status) {
        setPromoCodeStatus(addressResponse.data.promo_code_status)
        setPromoCodeMessage(addressResponse.data.promo_code_message ?? null)
      }
      console.info('[PlaceOrder] Address updated, confirming payment with Stripe...')

      if (addressResponse.data?.already_succeeded) {
        console.info('[PlaceOrder] Payment intent already succeeded, skipping confirmCardPayment')
        dispatch(setCheckoutPaymentStatus('PAYMENT_PENDING_CONFIRMATION'))
        dispatch(setAwaitingFinalStatus(true))
        dispatch(setCheckoutError(null))
        dispatch(setCheckoutPlacingOrder(false))
        return
      }

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

      if (result.error) {
        dispatch(setCheckoutError(result.error.message ?? 'Payment confirmation failed.'))
        dispatch(setAwaitingFinalStatus(false))
        dispatch(setCheckoutPlacingOrder(false))
        return
      }

      dispatch(setCheckoutPaymentStatus('PAYMENT_PENDING_CONFIRMATION'))
      dispatch(setAwaitingFinalStatus(true))
      dispatch(setCheckoutError(null))
      dispatch(setCheckoutPlacingOrder(false))
    } catch (error: unknown) {
      console.error('[PlaceOrder] Unexpected error during payment confirmation:', error)

      const responseData =
        error &&
        typeof error === 'object' &&
        'response' in error
          ? (error as {
              response?: {
                data?: {
                  error?: string
                  promo_code_status?: PromoCodeStatus
                  promo_code_message?: string
                }
              }
            }).response?.data
          : undefined

      if (responseData?.promo_code_status) {
        setPromoCodeStatus(responseData.promo_code_status)
        setPromoCodeMessage(responseData.promo_code_message ?? null)
        setAppliedPromoCode(null)
      }

      const apiError = responseData?.error
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
  const promoFeedback = promoStatusLabel(promoCodeStatus, promoCodeMessage)
  const promoIsValid = promoCodeStatus === 'VALID'

  return (
    <div className="bg-[#fffefb] border-t border-dashed border-black/10 px-6 py-6">
      <div className="text-sm text-gray-700 mb-6">
        <div className="flex justify-between mb-3">
          <span className="text-gray-600">Merchandise Subtotal</span>
          <span className="text-gray-900">{formatProductPrice(merchandiseSubtotal)}</span>
        </div>

        <div className="flex justify-between mb-3">
          <span className="text-gray-600">Shipping Subtotal</span>
          <span className="text-gray-900">{formatProductPrice(shippingSubtotal)}</span>
        </div>

        <div className="mb-4 space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
          <div>
            <label htmlFor="checkout-promo-code" className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">
              Promotion code
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="checkout-promo-code"
                type="text"
                value={promoCodeInput}
                onChange={(event) => setPromoCodeInput(event.target.value.toUpperCase())}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void handleApplyPromoCode()
                  }
                }}
                placeholder="e.g. WELCOME10"
                maxLength={64}
                className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-500"
                disabled={promoCodeApplying || isPlacingOrder}
              />
              <button
                type="button"
                onClick={() => void handleApplyPromoCode()}
                disabled={promoCodeApplying || isPlacingOrder || !promoCodeInput.trim()}
                className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {promoCodeApplying ? 'Checking…' : 'Apply'}
              </button>
              {appliedPromoCode && (
                <button
                  type="button"
                  onClick={handleClearPromoCode}
                  disabled={promoCodeApplying || isPlacingOrder}
                  className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-white disabled:opacity-60"
                >
                  Clear
                </button>
              )}
            </div>
            {promoFeedback && (
              <p className={`mt-2 text-xs ${promoIsValid ? 'text-emerald-700' : 'text-amber-700'}`}>
                {promoFeedback}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-emerald-100 pt-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">Your savings</p>
              <p className="mt-0.5 text-xs text-emerald-700">Promotions are checked for this checkout</p>
            </div>
            {promotionQuoteLoading ? (
              <span className="text-xs font-medium text-emerald-700">Checking…</span>
            ) : (
              <span className="text-lg font-bold text-emerald-700">-{formatProductPrice(promotionDiscount)}</span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Shipping discount</span>
            <span className="font-medium text-emerald-700">-{formatProductPrice(shippingDiscount)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Promotion discount</span>
            <span className="font-semibold text-emerald-700">-{formatProductPrice(promotionDiscount)}</span>
          </div>
        </div>

        <div className="flex justify-between items-end pt-4 border-t border-black/10">
          <span className="text-gray-900 font-medium">
            Total Payment:
          </span>
          <span className="text-3xl font-semibold text-emerald-600">
            {formatProductPrice(displayedTotal)}
          </span>
        </div>
        {promotionQuoteError && (
          <p className="mt-2 text-right text-[11px] text-amber-700">Promotion preview unavailable. Your total will be checked before payment.</p>
        )}
      </div>

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
