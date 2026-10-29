import { amountDueNow, CheckoutTotals, ZERO_DELIVERY_FEE_LABEL } from '../utils/checkoutCalculator'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Smartphone, TriangleAlert, X } from 'lucide-react'
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js'
import type { StripeCardElement } from '@stripe/stripe-js'
import axios from 'axios'
import {
  cartTaxFromKnownRates,
  checkoutApi,
  formatDisabledTaxAmount,
  isTaxChargeEnabled,
  resolveCartTax,
  type PromoCodeStatus,
  type PromotionQuoteResponse,
} from '../api/checkoutApi'
import {
  clearCheckout,
  setAwaitingFinalStatus,
  setCheckoutError,
  setCheckoutPaymentStatus,
  setCheckoutPlacingOrder,
  setCheckoutTaxAmount,
  setItemTaxes,
} from '../store/checkoutSlice'
import { removeSelectedItems } from '@/features/cart/store/cartSlice'
import {
  holdCheckoutForQuantityApproval,
  releaseQuantityApprovalHold,
} from '../utils/quantityApprovalHold'
import type { UserAddress } from '@/features/account/types/addressTypes'
import type { CartItem } from '@/features/cart/types/cartTypes'
import type { CheckoutShopShippingPayload } from '../api/checkoutApi'
import type { CheckoutStatusResponse } from '../types/checkoutTypes'
import { authFeatureApi } from '@/features/auth/api/authApi'
import { isShopStaffUser } from '../utils/staffCheckoutCustomer'
import { formatKsPrice } from '@/features/products/utils/formatProductPrice'
import { formatCashIncomeDisplay, normalizeCashDigits } from '../utils/cashTender'
import { getDeliveryBlockReason } from '../utils/deliveryReadiness'
import {
  checkoutShopsHaveDeliveryCompanies,
  distributeShippingFee,
  mapCheckoutShopIdsToCartShopIds,
  parseDeliveryFeeInput,
} from '../utils/checkoutShopShipping'

let activeCartTaxRequest = 0

const QUANTITY_APPROVAL_PENDING_MESSAGE =
  'You have a quantity approval waiting. You can place a new order after it is approved or rejected.'

interface CheckoutSummaryProps {
  checkout: CheckoutTotals
  /** On by default. Off places the order with a delivery fee of 0.00. */
  payDeliveryFeeNow: boolean
  hasDeliveryAddress: boolean
  onRequireAddress: () => void
  deliveryAddress: UserAddress | null
  cartItems: CartItem[]
  checkoutSessionItems?: CheckoutStatusResponse['items']
  /** No delivery company has a district route; fee is confirmed after the order. */
  deliveryQuotePendingConfirmation?: boolean
  deliveryCompanyIdByShopId: Record<string, string>
  /** False while shop companies and route availability are still loading. */
  deliveryCompanySelectionReady?: boolean
  /**
   * Cart shop ids with no delivery company, or whose companies are all
   * unavailable for this route. Those shops do not block place order.
   */
  cartShopIdsWithoutSelectableCompany?: readonly string[]
  /** Staff can type the delivery fee charged on this order. */
  editableDeliveryFee?: boolean
  deliveryFeeInput?: string
  onDeliveryFeeInputChange?: (value: string) => void
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
  deliveryCompanyIdByShopId: Record<string, string>,
  cartShopIdsWithoutSelectableCompany: ReadonlySet<string>,
): CheckoutShopShippingPayload[] => {
  const shopCountFromCart = Object.keys(checkout.groupedByShop).length
  const perShopFallback = shopCountFromCart > 0 ? checkout.shippingSubtotal / shopCountFromCart : 0
  const shopMappings = mapCheckoutShopIdsToCartShopIds(
    Object.keys(checkout.groupedByShop),
    cartItems,
    checkoutSessionItems,
  )
  const perShopFallbackForIds = shopMappings.length > 0
    ? checkout.shippingSubtotal / shopMappings.length
    : perShopFallback

  return shopMappings.map(({ checkoutShopId: shopId, cartShopId }) => {
    const row = cartShopId ? feesByShopId[cartShopId] : undefined
    const fromApi =
      shippingCalculateStatus === 'succeeded' && row?.amount != null && row.amount >= 0
        ? row.amount
        : null

    const waived = Boolean(cartShopId && cartShopIdsWithoutSelectableCompany.has(cartShopId))
    const companyId = !waived && cartShopId
      ? deliveryCompanyIdByShopId[cartShopId]?.trim() ?? ''
      : ''

    return {
      shop_id: shopId,
      shipping_fee: waived ? 0 : (fromApi ?? perShopFallbackForIds),
      delivery_company_id: companyId || null,
    }
  })
}

const firstValidationMessage = (errors: unknown): string | undefined => {
  if (!errors || typeof errors !== 'object') return undefined

  for (const messages of Object.values(errors)) {
    if (typeof messages === 'string' && messages.trim()) return messages
    if (Array.isArray(messages)) {
      const message = messages.find((item): item is string => typeof item === 'string' && item.trim() !== '')
      if (message) return message
    }
  }

  return undefined
}

const ACCOUNT_BLOCK_FALLBACK_SECONDS = 15 * 60

const retryAfterSeconds = (payload: Record<string, unknown> | null): number => {
  const value = Number(payload?.retry_after_seconds)
  return Number.isFinite(value) && value > 0 ? Math.ceil(value) : ACCOUNT_BLOCK_FALLBACK_SECONDS
}

const formatBlockCountdown = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const apiPayload = (error: unknown): Record<string, unknown> | null =>
  axios.isAxiosError(error) && error.response?.data && typeof error.response.data === 'object'
    ? error.response.data as Record<string, unknown>
    : null

const isAccountBlocked = (error: unknown): boolean =>
  apiPayload(error)?.code === 'account_temporarily_blocked'

const apiMessage = (error: unknown, fallback: string): string => {
  const message = apiPayload(error)?.message
  return typeof message === 'string' && message.trim() ? message : fallback
}

const responseIsObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isPromoCodeStatus = (value: unknown): value is PromoCodeStatus => {
  const statuses: PromoCodeStatus[] = [
    'VALID',
    'INVALID',
    'EXPIRED',
    'USED',
    'DISABLED',
    'RESERVED',
    'LIMIT_REACHED',
    'NOT_APPLICABLE',
  ]
  return statuses.some((status) => status === value)
}

const CheckoutSummary = ({
  checkout,
  payDeliveryFeeNow,
  hasDeliveryAddress,
  onRequireAddress,
  deliveryAddress,
  cartItems,
  checkoutSessionItems,
  deliveryQuotePendingConfirmation = false,
  deliveryCompanyIdByShopId,
  deliveryCompanySelectionReady = false,
  cartShopIdsWithoutSelectableCompany = [],
  editableDeliveryFee = false,
  deliveryFeeInput = '',
  onDeliveryFeeInputChange,
}: CheckoutSummaryProps) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const stripe = useStripe()
  const elements = useElements()
  const { currentCheckout, currentStatus, clientSecret, paymentStatus, isPlacingOrder, isAwaitingFinalStatus, error, paymentMethod, sessionPaymentMethod, prepaidProvider, cashTender, itemTaxes } = useAppSelector(
    state => state.checkout
  )

  const user = useAppSelector(state => state.auth.user)
  const feesByShopId = useAppSelector(state => state.shipping.feesByShopId)
  const totalShippingFee = useAppSelector(state => state.shipping.totalShippingFee)
  const shippingCalculateStatus = useAppSelector(state => state.shipping.calculateStatus)
  const shippingCalculateError = useAppSelector(state => state.shipping.calculateError)
  const [promotionDiscount, setPromotionDiscount] = useState(0)
  const [bundleSavings, setBundleSavings] = useState<NonNullable<PromotionQuoteResponse['bundle_savings']>>([])
  const [taxAmount, setTaxAmount] = useState(0)
  const [taxEnabled, setTaxEnabled] = useState(true)
  const [taxLoading, setTaxLoading] = useState(false)
  const [taxPreviewError, setTaxPreviewError] = useState(false)
  const [authoritativeTotal, setAuthoritativeTotal] = useState<number | null>(null)
  const [promotionFinal, setPromotionFinal] = useState<number | null>(null)
  const promotionAllocationsRef = useRef<Array<Record<string, unknown>>>([])
  const [promotionQuoteError, setPromotionQuoteError] = useState(false)
  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null)
  const [promoCodeStatus, setPromoCodeStatus] = useState<PromoCodeStatus | null>(null)
  const [promoCodeMessage, setPromoCodeMessage] = useState<string | null>(null)
  const [promoCodeApplying, setPromoCodeApplying] = useState(false)
  const [phoneModalOpen, setPhoneModalOpen] = useState(false)
  const [shopApprovalModalOpen, setShopApprovalModalOpen] = useState(false)
  const [shopApprovalRejected, setShopApprovalRejected] = useState(false)
  const [pendingApprovalBlockOpen, setPendingApprovalBlockOpen] = useState(false)
  const [emailVerifyModalOpen, setEmailVerifyModalOpen] = useState(false)
  const [guestPhoneModalOpen, setGuestPhoneModalOpen] = useState(false)
  const [guestPhoneDigits, setGuestPhoneDigits] = useState<string[]>(() => Array(6).fill(''))
  const [guestPhoneError, setGuestPhoneError] = useState<string | null>(null)
  const [guestPhoneSending, setGuestPhoneSending] = useState(false)
  const [guestPhoneVerifying, setGuestPhoneVerifying] = useState(false)
  const guestPhoneCodeRefs = useRef<(HTMLInputElement | null)[]>([])
  const [emailChallengePassed, setEmailChallengePassed] = useState(false)
  const [emailDigits, setEmailDigits] = useState<string[]>(() => Array(6).fill(''))
  const [emailCodeError, setEmailCodeError] = useState<string | null>(null)
  const [emailCodeChecking, setEmailCodeChecking] = useState(false)
  const [emailAccountBlocked, setEmailAccountBlocked] = useState(false)
  const [emailBlockSeconds, setEmailBlockSeconds] = useState(0)
  const [emailResendSeconds, setEmailResendSeconds] = useState(0)
  const emailCodeRefs = useRef<(HTMLInputElement | null)[]>([])
  const emailAccountBlockedRef = useRef(false)
  const emailBlockEndsAtRef = useRef<number | null>(null)
  emailAccountBlockedRef.current = emailAccountBlocked
  const beginAccountBlock = useCallback((seconds: number) => {
    const safeSeconds = seconds > 0 ? Math.ceil(seconds) : ACCOUNT_BLOCK_FALLBACK_SECONDS
    emailBlockEndsAtRef.current = Date.now() + safeSeconds * 1000
    setEmailBlockSeconds(safeSeconds)
    setEmailAccountBlocked(true)
    setEmailCodeError(null)
  }, [])
  const staffCheckout = isShopStaffUser(user)
  const accountPhoneMissing = Boolean(user) && !staffCheckout && !user?.phone?.trim()
  const checkoutAttemptCount = Number(
    (currentCheckout as { checkout_attempt_count?: number } | null)?.checkout_attempt_count ?? 0,
  )
  const emailVerificationRequired =
    Boolean(user) &&
    !staffCheckout &&
    checkoutAttemptCount >= 3 &&
    !emailChallengePassed

  useEffect(() => {
    if (typeof error === 'string' && error.includes(QUANTITY_APPROVAL_PENDING_MESSAGE)) {
      setPendingApprovalBlockOpen(true)
    }
  }, [error])

  useEffect(() => {
    if (!phoneModalOpen && !emailVerifyModalOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setPhoneModalOpen(false)
      setEmailVerifyModalOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [emailVerifyModalOpen, phoneModalOpen])

  useEffect(() => {
    if (!emailAccountBlocked) return
    const timerId = window.setInterval(() => {
      const endsAt = emailBlockEndsAtRef.current
      const remaining = endsAt == null ? 0 : Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setEmailBlockSeconds(remaining)
      if (remaining > 0) return
      emailBlockEndsAtRef.current = null
      setEmailAccountBlocked(false)
      if (!emailVerifyModalOpen || !user?.phone?.trim()) return
      setEmailResendSeconds(60)
      emailCodeRefs.current[0]?.focus()
      void authFeatureApi.requestCheckoutPhoneCode().catch((caughtError: unknown) => {
        setEmailResendSeconds(0)
        if (isAccountBlocked(caughtError)) beginAccountBlock(retryAfterSeconds(apiPayload(caughtError)))
        else setEmailCodeError(apiMessage(caughtError, 'Could not send the verification code.'))
      })
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [beginAccountBlock, emailAccountBlocked, emailVerifyModalOpen, user?.phone])

  useEffect(() => {
    if (!guestPhoneModalOpen) return
    const frame = window.requestAnimationFrame(() => {
      guestPhoneCodeRefs.current[0]?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [guestPhoneModalOpen])

  useEffect(() => {
    if (emailResendSeconds <= 0) return
    const timerId = window.setInterval(() => {
      setEmailResendSeconds((seconds) => (seconds > 0 ? seconds - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [emailResendSeconds])

  useEffect(() => {
    if (!emailVerifyModalOpen) {
      setEmailDigits(Array(6).fill(''))
      setEmailCodeChecking(false)
      setEmailResendSeconds(0)
      return
    }
    if (!user?.phone?.trim()) return

    let cancelled = false
    if (!emailAccountBlockedRef.current) {
      setEmailCodeError(null)
      setEmailResendSeconds(60)
      emailCodeRefs.current[0]?.focus()
    }
    void authFeatureApi.requestCheckoutPhoneCode()
      .then(() => {
        if (cancelled) return
        emailBlockEndsAtRef.current = null
        setEmailBlockSeconds(0)
        setEmailAccountBlocked(false)
        setEmailCodeError(null)
      })
      .catch((caughtError: unknown) => {
        if (cancelled) return
        setEmailResendSeconds(0)
        if (isAccountBlocked(caughtError)) {
          beginAccountBlock(retryAfterSeconds(apiPayload(caughtError)))
          return
        }
        setEmailCodeError(apiMessage(caughtError, 'Could not send the verification code.'))
      })

    return () => {
      cancelled = true
    }
  }, [emailVerifyModalOpen, user?.phone])
  const checkoutIdRef = useRef(currentCheckout?.checkout_id)
  checkoutIdRef.current = currentCheckout?.checkout_id
  const cartTaxKey = cartItems
    .map((item) => `${item.productId}:${item.variantId ?? ''}:${item.quantity}:${item.price}:${item.categoryId ?? ''}`)
    .join('|')
  const scaledTax = useMemo(
    () => cartTaxFromKnownRates(cartItems, itemTaxes, promotionDiscount),
    [cartItems, itemTaxes, promotionDiscount],
  )
  const shownTaxForPayment = scaledTax ?? taxAmount

  useEffect(() => {
    dispatch(setCheckoutTaxAmount(shownTaxForPayment))
  }, [dispatch, shownTaxForPayment])

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

  const applyQuotedTotals = (quote: Awaited<ReturnType<typeof requestPromotionQuote>>) => {
    if (!quote) return
    const rawBundles = Array.isArray(quote.bundle_savings) ? quote.bundle_savings : []
    let excess = 0
    const bundles = rawBundles.map((row) => {
      const sets = Math.max(1, Number(row.sets) || 1)
      if (sets <= 1) return row
      const amount = Math.round((Number(row.amount) / sets) * 100) / 100
      excess += Number(row.amount) - amount
      return { ...row, amount, sets: 1 }
    })
    const allocations = (Array.isArray(quote.allocations) ? quote.allocations : []).map((row) => {
      const id = String(row.promotion_id ?? row.reward_id ?? '')
      const original = rawBundles.find((bundle) => bundle.bundle_id === id)
      const sets = Math.max(1, Number(original?.sets) || 1)
      if (!original || sets <= 1) return row
      return { ...row, amount: Math.round((Number(row.amount) / sets) * 100) / 100 }
    })
    setPromotionDiscount(Math.max(0, Number(quote.discount_total ?? 0) - excess))
    setBundleSavings(bundles)
    promotionAllocationsRef.current = allocations
    setPromotionFinal(Number(quote.final_total ?? checkout.totalPayment) + excess)
  }

  useEffect(() => {
    if (!cartTaxKey) return

    const requestId = activeCartTaxRequest + 1
    activeCartTaxRequest = requestId
    setTaxLoading(true)
    setTaxPreviewError(false)

    const cartLines = cartItems.map((item) => ({
      productId: item.productId,
      categoryId: item.categoryId,
      price: item.price,
      quantity: item.quantity,
    }))
    const quotedItems = cartItems

    void (async () => {
      try {
        const resolved = await resolveCartTax(cartLines, promotionDiscount)
        if (requestId !== activeCartTaxRequest) return

        const quotedLines = resolved.quote.lines ?? []
        setTaxAmount(resolved.taxAmount)
        setTaxEnabled(isTaxChargeEnabled(resolved.quote))
        dispatch(setItemTaxes(quotedItems.map((item, index) => {
          const line = quotedLines[index]
          const rate = line?.tax_rate
          return {
            productId: item.productId,
            variantId: item.variantId ?? '',
            taxRate: rate == null || !Number.isFinite(Number(rate)) ? null : Number(rate),
            taxAmount: Number(line?.tax_amount ?? 0),
            noCategoryTax: line?.reason === 'NO_TAX_FOR_CATEGORY',
          }
        })))

        const checkoutId = checkoutIdRef.current
        if (checkoutId) {
          try {
            await checkoutApi.previewTax(checkoutId, {
              discount_total: promotionDiscount,
              allocations: promotionAllocationsRef.current,
              category_by_product: resolved.categoryByProduct,
            })
          } catch {
            // The amounts on screen already follow the current cart.
          }
        }
      } catch {
        if (requestId === activeCartTaxRequest) setTaxPreviewError(true)
      } finally {
        if (requestId === activeCartTaxRequest) setTaxLoading(false)
      }
    })()

    return () => {
      if (activeCartTaxRequest === requestId) {
        activeCartTaxRequest += 1
      }
    }
  }, [cartItems, cartTaxKey, currentCheckout?.checkout_id, dispatch, promotionDiscount])

  useEffect(() => {
    const checkoutId = currentCheckout?.checkout_id
    const userId = user?.id
    if (!checkoutId || !userId || promotionItems.length === 0) return

    let cancelled = false
    setPromotionQuoteError(false)

    void requestPromotionQuote(appliedPromoCode).then((quote) => {
      if (cancelled || !quote) return
      applyQuotedTotals(quote)
      if (cancelled) return
      if (appliedPromoCode) {
        setPromoCodeStatus(quote.promo_code_status ?? null)
        setPromoCodeMessage(quote.promo_code_message ?? null)
      }
    }).catch(() => {
      if (!cancelled) setPromotionQuoteError(true)
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

      applyQuotedTotals(quote)
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

  const buildCheckoutAddressPayload = (
    address: UserAddress,
    overridePaymentMethod?: 'prepaid' | 'cod',
    cashAmounts?: { paid: number; refund: number } | null,
  ) => {
    const quotedShippingTotal = deliveryQuotePendingConfirmation
      ? 0
      : shippingCalculateStatus === 'succeeded' && totalShippingFee != null && totalShippingFee >= 0
        ? totalShippingFee
        : checkout.shippingSubtotal
    const manualDeliveryFee = editableDeliveryFee ? parseDeliveryFeeInput(deliveryFeeInput) : null
    const shipping_total = manualDeliveryFee != null
      ? manualDeliveryFee
      : payDeliveryFeeNow
        ? quotedShippingTotal
        : 0

    const quotedShopShippings = buildShopShippings(
      checkout,
      cartItems,
      checkoutSessionItems ?? currentStatus?.items,
      feesByShopId,
      shippingCalculateStatus,
      deliveryCompanyIdByShopId,
      new Set(cartShopIdsWithoutSelectableCompany),
    )
    const baseShopShippings = payDeliveryFeeNow
      ? quotedShopShippings
      : quotedShopShippings.map((row) => ({ ...row, shipping_fee: 0 }))
    const shop_shippings = manualDeliveryFee != null
      ? distributeShippingFee(baseShopShippings, manualDeliveryFee)
      : baseShopShippings

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
      payment_method: overridePaymentMethod ?? sessionPaymentMethod ?? paymentMethod,
      ...(cashAmounts
        ? {
            cash_paid_amount: cashAmounts.paid,
            cash_refund_amount: cashAmounts.refund,
          }
        : {}),
    }
  }

  const guestPhone = deliveryAddress?.phone_no?.trim() ?? ''

  const sendGuestPhoneCode = async () => {
    if (!guestPhone) {
      setGuestPhoneError('Enter a phone number before placing this order.')
      return
    }
    setGuestPhoneError(null)
    setGuestPhoneSending(true)
    try {
      await authFeatureApi.requestGuestCheckoutPhoneCode(guestPhone)
    } catch (caughtError: unknown) {
      const message = axios.isAxiosError(caughtError)
        ? (caughtError.response?.data as { message?: string } | undefined)?.message
        : null
      setGuestPhoneError(message || 'Unable to send the verification code.')
    } finally {
      setGuestPhoneSending(false)
    }
  }

  const handlePlaceOrder = async (options?: { emailConfirmed?: boolean; phoneConfirmed?: boolean }) => {
    if (accountPhoneMissing) {
      setPhoneModalOpen(true)
      return
    }

    if (user && emailVerificationRequired && !options?.emailConfirmed) {
      setPhoneModalOpen(false)
      setGuestPhoneModalOpen(false)
      setEmailVerifyModalOpen(true)
      return
    }

    if (!hasDeliveryAddress || !deliveryAddress) {
      dispatch(setCheckoutError('Please add a delivery address before placing your order.'))
      onRequireAddress()
      return
    }

    if (!currentCheckout?.checkout_id) {
      dispatch(setCheckoutError('Checkout session is not ready yet. Please try again.'))
      return
    }

    if (!deliveryCompanySelectionReady) {
      dispatch(setCheckoutError('Delivery options are still loading. Please wait a moment.'))
      return
    }

    if (!hasDeliveryCompanyForEveryShop) {
      dispatch(setCheckoutError('Select a delivery company configured for every shop to continue.'))
      return
    }

    // Runtime guard. `canPlaceOrder` disables the button for durable faults, but a
    // click can still land while the quote is idle/loading (those states are not
    // treated as faults), so keep catching them here.
    if (
      payDeliveryFeeNow &&
      !deliveryQuotePendingConfirmation &&
      (shippingCalculateStatus !== 'succeeded' || totalShippingFee == null)
    ) {
      dispatch(
        setCheckoutError(
          shippingCalculateError?.trim() ||
            'Delivery fee is not ready yet. Please wait for it to calculate, or check your delivery address.',
        ),
      )
      return
    }

    // Service down, no usable fee, or a shop that cannot deliver to this address.
    if (deliveryBlockReason) {
      dispatch(setCheckoutError(deliveryBlockReason))
      return
    }

    if (promoCodeInput.trim() && !appliedPromoCode) {
      dispatch(setCheckoutError('Apply a valid promo code before placing your order, or clear the field.'))
      return
    }

    const effectivePaymentMethod = sessionPaymentMethod ?? paymentMethod
    const isPrepaid = effectivePaymentMethod === 'prepaid'
    const isStaffCash = prepaidProvider === 'cash'
    let card: StripeCardElement | null = null

    if (isStaffCash) {
      const orderDue = Number(
        authoritativeTotal ??
        amountDueNow(checkout, payDeliveryFeeNow, shownTaxForPayment, promotionDiscount)
          + (editableDeliveryFee ? parseDeliveryFeeInput(deliveryFeeInput) : 0),
      )
      const income = Number(cashTender?.income ?? 0)
      if (!cashTender || income < orderDue) {
        dispatch(setCheckoutError('Enter the cash amount the customer paid. It must cover the order total (including tax).'))
        return
      }
      if (!clientSecret) {
        dispatch(setCheckoutError('Cash payment is not ready yet. Please wait a moment.'))
        return
      }
    } else if (isPrepaid) {
      if (!stripe || !elements || !clientSecret) {
        dispatch(setCheckoutError('Payment is not ready yet.'))
        return
      }

      card = elements.getElement(CardElement)
      if (!card) {
        dispatch(setCheckoutError('Card input is not available.'))
        return
      }
    } else if (effectivePaymentMethod !== 'cod') {
      dispatch(setCheckoutError('Invalid payment method selected.'))
      return
    } else if (!clientSecret) {
      dispatch(setCheckoutError('Cash on Delivery is not ready yet. Please wait a moment.'))
      return
    }

    dispatch(setCheckoutError(null))
    dispatch(setCheckoutPlacingOrder(true))

    try {
      // Staff cash is collected at the counter — complete via the offline
      // authorize path (no Stripe). Cash is a prepaid provider, so the checkout
      // records payment_method=prepaid with the cash tender amounts.
      const placeOrderPaymentMethod: 'prepaid' | 'cod' = isStaffCash
        ? 'prepaid'
        : (effectivePaymentMethod as 'prepaid' | 'cod')

      const cashIncome = cashTender?.income
      const cashRefund = cashTender?.refund
      const cashAmounts =
        isStaffCash && cashIncome != null && Number.isFinite(cashIncome)
          ? {
              paid: Number(cashIncome),
              refund: Number.isFinite(Number(cashRefund)) ? Number(cashRefund) : 0,
            }
          : null

      // Staff cash: offline authorize is handled in updateDeliveryAddress (via cod path + cash tender)

      console.info('[PlaceOrder] Updating checkout address...')
      const addressResponse = await checkoutApi.updateCheckoutAddress(
        currentCheckout.checkout_id,
        buildCheckoutAddressPayload(deliveryAddress, placeOrderPaymentMethod, cashAmounts),
      )
      setPromotionDiscount(Number(addressResponse.data?.promotion_discount_total ?? 0))
      const nextTax = Number(addressResponse.data?.tax_amount ?? 0)
      setTaxAmount(nextTax)
      dispatch(setCheckoutTaxAmount(nextTax))
      setTaxPreviewError(false)
      setAuthoritativeTotal(addressResponse.data?.grand_total ?? null)
      if (addressResponse.data?.promo_code_status) {
        setPromoCodeStatus(addressResponse.data.promo_code_status)
        setPromoCodeMessage(addressResponse.data.promo_code_message ?? null)
      }
      console.info('[PlaceOrder] Address updated...')

      if (isStaffCash) {
        console.info('[PlaceOrder] Staff cash order authorised', {
          income: cashIncome,
          refund: cashRefund,
        })
        dispatch(setCheckoutPaymentStatus('PENDING_PAYMENT'))
      } else if (isPrepaid) {
        console.info('[PlaceOrder] Confirming payment with Stripe...')

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

        const result = await stripe!.confirmCardPayment(effectiveClientSecret!, {
          payment_method: {
            card: card!,
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
      } else {
        console.info('[PlaceOrder] Cash on Delivery order placed, awaiting payment collection...')
        dispatch(setCheckoutPaymentStatus('PENDING_PAYMENT'))
      }
      dispatch(setAwaitingFinalStatus(true))
      dispatch(setCheckoutError(null))
      dispatch(setCheckoutPlacingOrder(false))
    } catch (error: unknown) {
      console.error('[PlaceOrder] Checkout address update or payment confirmation failed:', error)

      const responseData = axios.isAxiosError(error) && responseIsObject(error.response?.data)
        ? error.response.data
        : undefined

      if (responseData?.code === 'guest_phone_verification_required') {
        setGuestPhoneModalOpen(true)
        if (!options?.phoneConfirmed) {
          setGuestPhoneDigits(Array(6).fill(''))
          setGuestPhoneError(null)
          void sendGuestPhoneCode()
        }
        dispatch(setCheckoutError(null))
        dispatch(setAwaitingFinalStatus(false))
        dispatch(setCheckoutPlacingOrder(false))
        return
      }

      if (
        responseData?.code === 'phone_verification_required' ||
        responseData?.code === 'email_verification_required' ||
        responseData?.code === 'account_temporarily_blocked'
      ) {
        if (responseData.code === 'account_temporarily_blocked') {
          beginAccountBlock(retryAfterSeconds(responseData))
        }
        setEmailVerifyModalOpen(true)
        dispatch(setCheckoutError(null))
        dispatch(setAwaitingFinalStatus(false))
        dispatch(setCheckoutPlacingOrder(false))
        return
      }

      if (responseData?.code === 'quantity_approval_pending') {
        dispatch(setCheckoutError(
          typeof responseData.error === 'string' && responseData.error.trim()
            ? responseData.error
            : QUANTITY_APPROVAL_PENDING_MESSAGE,
        ))
        dispatch(setAwaitingFinalStatus(false))
        dispatch(setCheckoutPlacingOrder(false))
        return
      }

      if (
        responseData?.code === 'shop_admin_approval_required' ||
        responseData?.code === 'shop_admin_approval_rejected'
      ) {
        holdCheckoutForQuantityApproval()
        setShopApprovalRejected(responseData.code === 'shop_admin_approval_rejected')
        setShopApprovalModalOpen(true)
        dispatch(removeSelectedItems())
        dispatch(clearCheckout())
        if (user?.id) sessionStorage.removeItem(`dni.active-checkout.${user.id}`)
        dispatch(setCheckoutError(null))
        dispatch(setAwaitingFinalStatus(false))
        dispatch(setCheckoutPlacingOrder(false))
        return
      }

      if (isPromoCodeStatus(responseData?.promo_code_status)) {
        setPromoCodeStatus(responseData.promo_code_status)
        setPromoCodeMessage(
          typeof responseData.promo_code_message === 'string'
            ? responseData.promo_code_message
            : null,
        )
        setAppliedPromoCode(null)
      }

      const validationMessage = firstValidationMessage(responseData?.errors)
      const apiError =
        (typeof responseData?.error === 'string' && responseData.error.trim()
          ? responseData.error
          : undefined) ??
        (typeof responseData?.message === 'string' && responseData.message.trim()
          ? [responseData.message, validationMessage].filter(Boolean).join(': ')
          : validationMessage)
      dispatch(
        setCheckoutError(
          apiError
            ?? 'Unable to update checkout. Please review the delivery details and try again.',
        ),
      )
      dispatch(setAwaitingFinalStatus(false))
      dispatch(setCheckoutPlacingOrder(false))
    }
  }

  const isTerminal =
    paymentStatus === 'PAID' ||
    paymentStatus === 'COMPLETED' ||
    paymentStatus === 'FAILED' ||
    paymentStatus === 'FAILED_STOCK' ||
    paymentStatus === 'FAILED_PAYMENT' ||
    paymentStatus === 'EXPIRED'

  const effectivePaymentMethod = sessionPaymentMethod ?? paymentMethod
  const isPrepaid = effectivePaymentMethod === 'prepaid'

  const deliveryFees = Object.values(feesByShopId)
  const anyNotDeliverable = deliveryFees.some((fee) => fee.deliveryStatus === 'NOT_DELIVERABLE')
  const showPendingDeliveryFee = deliveryQuotePendingConfirmation || (
    shippingCalculateStatus === 'succeeded' && anyNotDeliverable
  )

  // Route/area issues are a manual follow-up flow, not a hard block. The checkout
  // can go ahead with a zero-fee placeholder while a team confirms the final quote.
  const deliveryBlockReason = payDeliveryFeeNow
    ? getDeliveryBlockReason({
        hasDeliveryAddress,
        calculateStatus: shippingCalculateStatus,
        totalShippingFee,
        calculateError: shippingCalculateError,
        deliveryStatuses: deliveryFees.map((fee) => fee.deliveryStatus),
        unavailableReasons: deliveryFees.map((fee) => fee.unavailableReason),
      })
    : null

  const requiredShopMappings = mapCheckoutShopIdsToCartShopIds(
    Object.keys(checkout.groupedByShop),
    cartItems,
    checkoutSessionItems ?? currentStatus?.items,
  )
  const shopsWithoutSelectableCompany = new Set(cartShopIdsWithoutSelectableCompany)
  const hasDeliveryCompanyForEveryShop =
    deliveryCompanySelectionReady &&
    checkoutShopsHaveDeliveryCompanies(
      requiredShopMappings,
      deliveryCompanyIdByShopId,
      shopsWithoutSelectableCompany,
    )

  const canPlaceOrder =
    !!currentCheckout?.checkout_id &&
    !!clientSecret &&
    hasDeliveryCompanyForEveryShop &&
    deliveryBlockReason === null &&
    !isPlacingOrder &&
    !isAwaitingFinalStatus &&
    !isTerminal &&
    (!paymentStatus ||
      paymentStatus === 'PAYMENT_INTENT_READY' ||
      paymentStatus === 'PAYMENT_PENDING_CONFIRMATION' ||
      paymentStatus === 'PENDING_PAYMENT')

  const statusMessage = (() => {
    if (error) return error
    if (paymentStatus === 'PAID' || paymentStatus === 'COMPLETED') {
      return 'Order completed successfully.'
    }
    if (paymentStatus === 'FAILED_PAYMENT') {
      return 'Payment failed. Please try again.'
    }
    if (paymentStatus === 'FAILED_STOCK') {
      return 'We could not reserve the selected items. Please return to your cart and try again.'
    }
    if (paymentStatus === 'FAILED') {
      return 'Checkout could not be completed. Please start a new checkout.'
    }
    if (paymentStatus === 'STOCK_CONFIRMED') {
      return 'Stock confirmed. Finalizing payment...'
    }
    if (paymentStatus === 'PENDING_STOCK') {
      return 'Confirming stock availability...'
    }
    if (paymentStatus === 'EXPIRED') {
      return 'Checkout expired. Please start a new checkout.'
    }
    if (!hasDeliveryAddress) {
      return 'Please add your delivery address to continue.'
    }
    if (isAwaitingFinalStatus) {
      if (prepaidProvider === 'cash' || !isPrepaid) {
        return 'Confirming your cash order...'
      }
      return 'Waiting for payment confirmation...'
    }
    if (deliveryBlockReason) {
      return deliveryBlockReason
    }
    if (!deliveryCompanySelectionReady) {
      return 'Checking delivery options...'
    }
    if (!hasDeliveryCompanyForEveryShop) {
      return 'Select a delivery company configured for every shop to continue.'
    }
    if (clientSecret) {
      return isPrepaid
        ? 'Payment ready. You can place your order.'
        : 'Cash on Delivery ready. Place your order to confirm.'
    }
    return 'Preparing payment...'
  })()

  const {
    merchandiseSubtotal,
    shippingSubtotal,
    shippingDiscount,
    totalPayment,
  } = checkout
  const deliveryPriceText = (() => {
    if (!payDeliveryFeeNow || showPendingDeliveryFee) return ZERO_DELIVERY_FEE_LABEL
    if (!hasDeliveryAddress) return 'Add address'
    if (shippingCalculateStatus === 'loading') return 'Calculating…'
    if (shippingCalculateStatus === 'failed') return 'Unavailable'
    if (shippingCalculateStatus === 'succeeded') {
      return formatKsPrice(shippingSubtotal)
    }
    return '—'
  })()
  const shownTax = scaledTax ?? taxAmount
  const manualDeliveryFee = editableDeliveryFee ? parseDeliveryFeeInput(deliveryFeeInput) : 0
  const displayedTotal = !payDeliveryFeeNow
    ? Math.max(0, merchandiseSubtotal - promotionDiscount) + shownTax + manualDeliveryFee
    : (authoritativeTotal ?? (promotionFinal ?? totalPayment) + shownTax)
  const promoFeedback = promoStatusLabel(promoCodeStatus, promoCodeMessage)
  const promoIsValid = promoCodeStatus === 'VALID'

  return (
    <div className="rounded-sm border border-[var(--dni-cart-border)] bg-white px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5">
      {phoneModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setPhoneModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="phone-required-title"
            className="relative z-10 w-full max-w-md bg-white rounded-sm shadow-lg"
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-6 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-emerald-50 text-emerald-600">
                  <TriangleAlert className="h-5 w-5" />
                </span>
                <h2 id="phone-required-title" className="text-lg font-medium text-gray-900">
                  Phone number required
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setPhoneModalOpen(false)}
                className="cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 text-sm text-gray-700">
              <p>Please fill in your phone number before placing this order.</p>
              <div className="mt-4 flex items-start gap-3 border border-emerald-200 bg-emerald-50 px-4 py-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-emerald-600 text-xs font-bold text-white">
                  !
                </span>
                <p className="leading-5 text-gray-700">
                  Your phone number helps us contact you about your order and delivery updates.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 pt-4 pb-5">
              <button
                type="button"
                onClick={() => setPhoneModalOpen(false)}
                className="inline-flex cursor-pointer items-center justify-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 rounded-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => navigate('/account/profile')}
                className="inline-flex cursor-pointer items-center justify-center gap-2 bg-emerald-600 px-5 py-2 text-sm font-medium text-white rounded-sm hover:bg-emerald-700"
              >
                Go to profile
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
      {pendingApprovalBlockOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setPendingApprovalBlockOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pending-approval-block-title"
            className="relative z-10 w-full max-w-md bg-white rounded-sm shadow-lg"
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-6 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-emerald-50 text-emerald-600">
                  <TriangleAlert className="h-5 w-5" />
                </span>
                <h2 id="pending-approval-block-title" className="text-lg font-medium text-gray-900">
                  Quantity approval pending
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setPendingApprovalBlockOpen(false)}
                className="cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 text-sm leading-6 text-gray-700">
              {QUANTITY_APPROVAL_PENDING_MESSAGE}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 pt-4 pb-5">
              <button
                type="button"
                onClick={() => setPendingApprovalBlockOpen(false)}
                className="inline-flex cursor-pointer items-center justify-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 rounded-sm hover:bg-gray-50"
              >
                Close
              </button>
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setPendingApprovalBlockOpen(false)
                    navigate('/account/quantity-approvals')
                  }}
                  className="inline-flex cursor-pointer items-center justify-center bg-emerald-600 px-5 py-2 text-sm font-medium text-white rounded-sm hover:bg-emerald-700"
                >
                  Quantity Approvals
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
      {shopApprovalModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => {
              releaseQuantityApprovalHold()
              setShopApprovalModalOpen(false)
              navigate('/cart')
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shop-approval-title"
            className="relative z-10 w-full max-w-md bg-white rounded-sm shadow-lg"
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-6 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-emerald-50 text-emerald-600">
                  <TriangleAlert className="h-5 w-5" />
                </span>
                <h2 id="shop-approval-title" className="text-lg font-medium text-gray-900">
                  {shopApprovalRejected ? 'Quantity request rejected' : 'Shop admin approval required'}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => {
                  releaseQuantityApprovalHold()
                  setShopApprovalModalOpen(false)
                  navigate('/cart')
                }}
                className="cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 text-sm leading-6 text-gray-700">
              {user
                ? shopApprovalRejected
                  ? 'A shop admin rejected this quantity request, so it cannot be placed. You can check it in Quantity Approvals.'
                  : 'Your order needs shop admin approval. Please wait. When it is approved, the order is placed for you. You can follow it in Quantity Approvals.'
                : shopApprovalRejected
                  ? 'This quantity was not approved. We will contact you on the phone number from this checkout.'
                  : 'This quantity needs shop admin approval. We will contact you later on the phone number from this checkout.'}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 pt-4 pb-5">
              <button
                type="button"
                onClick={() => {
                  releaseQuantityApprovalHold()
                  setShopApprovalModalOpen(false)
                  navigate('/cart')
                }}
                className="inline-flex cursor-pointer items-center justify-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 rounded-sm hover:bg-gray-50"
              >
                Close
              </button>
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    releaseQuantityApprovalHold()
                    setShopApprovalModalOpen(false)
                    navigate('/account/quantity-approvals')
                  }}
                  className="inline-flex cursor-pointer items-center justify-center bg-emerald-600 px-5 py-2 text-sm font-medium text-white rounded-sm hover:bg-emerald-700"
                >
                  Quantity Approvals
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
      {guestPhoneModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setGuestPhoneModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-phone-verify-title"
            className="relative z-10 w-full max-w-md bg-white rounded-sm shadow-lg"
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-6 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-emerald-50 text-emerald-600">
                  <Smartphone className="h-5 w-5" />
                </span>
                <h2 id="guest-phone-verify-title" className="text-lg font-medium text-gray-900">
                  Verify your phone
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setGuestPhoneModalOpen(false)}
                className="cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 text-sm text-gray-700">
              <p>
                Enter the 6-digit code sent to <span className="font-medium text-gray-900">{guestPhone}</span>.
              </p>
              <div className="mt-4">
              <div className="flex justify-between gap-2">
                {guestPhoneDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      guestPhoneCodeRefs.current[index] = element
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={digit}
                    disabled={guestPhoneVerifying}
                    aria-label={`Digit ${index + 1}`}
                    onChange={(event) => {
                      const nextDigit = event.target.value.replace(/\D/g, '').slice(-1)
                      setGuestPhoneDigits((current) => {
                        const next = [...current]
                        next[index] = nextDigit
                        return next
                      })
                      setGuestPhoneError(null)
                      if (nextDigit && index < 5) guestPhoneCodeRefs.current[index + 1]?.focus()
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Backspace' && !guestPhoneDigits[index] && index > 0) {
                        guestPhoneCodeRefs.current[index - 1]?.focus()
                      }
                    }}
                    onPaste={(event) => {
                      const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
                      if (!pasted) return
                      event.preventDefault()
                      const next = Array(6).fill('')
                      pasted.split('').forEach((character, characterIndex) => {
                        next[characterIndex] = character
                      })
                      setGuestPhoneDigits(next)
                      setGuestPhoneError(null)
                      guestPhoneCodeRefs.current[Math.min(pasted.length, 5)]?.focus()
                    }}
                    className="h-12 w-full border border-gray-300 bg-white text-center text-lg font-medium text-gray-900 outline-none rounded-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 disabled:bg-gray-50"
                  />
                ))}
              </div>
              {guestPhoneError && (
                <p className="mt-3 text-center text-xs text-red-600" role="alert">{guestPhoneError}</p>
              )}
              <p className="mt-4 text-center text-sm text-gray-600">
                <button
                  type="button"
                  disabled={guestPhoneSending || guestPhoneVerifying}
                  onClick={() => {
                    setGuestPhoneDigits(Array(6).fill(''))
                    setGuestPhoneError(null)
                    guestPhoneCodeRefs.current[0]?.focus()
                    void sendGuestPhoneCode()
                  }}
                  className="cursor-pointer font-medium text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  {guestPhoneSending ? 'Sending...' : "Didn't receive the code? Resend"}
                </button>
              </p>
            </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 pt-4 pb-5">
              <button
                type="button"
                onClick={() => setGuestPhoneModalOpen(false)}
                className="inline-flex cursor-pointer items-center justify-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 rounded-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={guestPhoneVerifying || guestPhoneDigits.some((digit) => !digit)}
                onClick={() => {
                  void (async () => {
                    setGuestPhoneVerifying(true)
                    setGuestPhoneError(null)
                    try {
                      await authFeatureApi.confirmGuestCheckoutPhoneCode(guestPhone, guestPhoneDigits.join(''))
                      setGuestPhoneModalOpen(false)
                      void handlePlaceOrder({ phoneConfirmed: true })
                    } catch (caughtError: unknown) {
                      const message = axios.isAxiosError(caughtError)
                        ? (caughtError.response?.data as { message?: string } | undefined)?.message
                        : null
                      setGuestPhoneError(message || 'That verification code is invalid or has expired.')
                    } finally {
                      setGuestPhoneVerifying(false)
                    }
                  })()
                }}
                className="inline-flex cursor-pointer items-center justify-center gap-2 bg-emerald-600 px-5 py-2 text-sm font-medium text-white rounded-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {guestPhoneVerifying ? 'Checking...' : 'Verify phone'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
      {emailVerifyModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setEmailVerifyModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-verify-title"
            className="relative z-10 w-full max-w-md bg-white rounded-sm shadow-lg"
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-6 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-emerald-50 text-emerald-600">
                  {emailAccountBlocked
                    ? <TriangleAlert className="h-5 w-5" />
                    : <Smartphone className="h-5 w-5" />}
                </span>
                <h2 id="email-verify-title" className="text-lg font-medium text-gray-900">
                  {emailAccountBlocked ? 'Account temporarily blocked' : 'Verify your phone'}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setEmailVerifyModalOpen(false)}
                className="cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 text-sm text-gray-700">
            <p>
              {emailAccountBlocked
                ? 'Your account is temporarily blocked. You can place an order again when this timer ends.'
                : user?.phone?.trim()
                  ? <>Enter the 6-digit code sent to <span className="font-medium text-gray-900">{user.phone}</span>.</>
                  : 'Add a phone number on your profile before placing this order.'}
            </p>

            {emailAccountBlocked ? (
              <p className="mt-4 text-center text-4xl font-semibold tabular-nums tracking-wide text-gray-900" aria-live="polite">
                {formatBlockCountdown(emailBlockSeconds)}
              </p>
            ) : user?.phone?.trim() && (
              <div className="mt-4">
                <div className="flex justify-between gap-2">
                  {emailDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        emailCodeRefs.current[index] = element
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      maxLength={1}
                      value={digit}
                      disabled={emailCodeChecking}
                      aria-label={`Digit ${index + 1}`}
                      onChange={(event) => {
                        const nextDigit = event.target.value.replace(/\D/g, '').slice(-1)
                        setEmailDigits((current) => {
                          const next = [...current]
                          next[index] = nextDigit
                          return next
                        })
                        setEmailCodeError(null)
                        if (nextDigit && index < 5) emailCodeRefs.current[index + 1]?.focus()
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Backspace' && !emailDigits[index] && index > 0) {
                          emailCodeRefs.current[index - 1]?.focus()
                        }
                      }}
                      onPaste={(event) => {
                        const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
                        if (!pasted) return
                        event.preventDefault()
                        const next = Array(6).fill('')
                        pasted.split('').forEach((character, characterIndex) => {
                          next[characterIndex] = character
                        })
                        setEmailDigits(next)
                        setEmailCodeError(null)
                        emailCodeRefs.current[Math.min(pasted.length, 5)]?.focus()
                      }}
                      className="h-12 w-full border border-gray-300 bg-white text-center text-lg font-medium text-gray-900 outline-none rounded-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 disabled:bg-gray-50"
                    />
                  ))}
                </div>
                {emailCodeError && (
                  <p className="mt-3 text-center text-xs text-red-600">{emailCodeError}</p>
                )}
                <p className="mt-4 text-center text-sm text-gray-600">
                  {emailResendSeconds > 0 ? (
                    <>Resend code in {emailResendSeconds}s</>
                  ) : (
                    <button
                      type="button"
                      disabled={emailCodeChecking}
                      onClick={() => {
                        setEmailResendSeconds(60)
                        setEmailDigits(Array(6).fill(''))
                        setEmailCodeError(null)
                        emailCodeRefs.current[0]?.focus()
                        void authFeatureApi.requestCheckoutPhoneCode(true)
                          .catch((caughtError: unknown) => {
                            setEmailResendSeconds(0)
                            if (isAccountBlocked(caughtError)) beginAccountBlock(retryAfterSeconds(apiPayload(caughtError)))
                            else setEmailCodeError(apiMessage(caughtError, 'Could not resend the verification code.'))
                          })
                      }}
                      className="cursor-pointer font-medium text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-gray-400"
                    >
                      Didn&apos;t receive the code? Resend
                    </button>
                  )}
                </p>
              </div>
            )}

            {!user?.phone?.trim() && emailCodeError && (
              <p className="mt-3 text-xs text-red-600">{emailCodeError}</p>
            )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 pt-4 pb-5">
              <button
                type="button"
                onClick={() => setEmailVerifyModalOpen(false)}
                className="inline-flex cursor-pointer items-center justify-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 rounded-sm hover:bg-gray-50"
              >
                {emailAccountBlocked ? 'Close' : 'Cancel'}
              </button>
              {!emailAccountBlocked && <button
                type="button"
                disabled={
                  emailCodeChecking ||
                  (Boolean(user?.phone?.trim()) && emailDigits.some((digit) => !digit))
                }
                onClick={() => {
                  if (!user?.phone?.trim()) {
                    navigate('/account/profile')
                    return
                  }
                  void (async () => {
                    setEmailCodeChecking(true)
                    setEmailCodeError(null)
                    try {
                      await authFeatureApi.confirmCheckoutPhoneCode(emailDigits.join(''))
                      setEmailChallengePassed(true)
                      setEmailVerifyModalOpen(false)
                      void handlePlaceOrder({ emailConfirmed: true })
                    } catch (caughtError: unknown) {
                      if (isAccountBlocked(caughtError)) beginAccountBlock(retryAfterSeconds(apiPayload(caughtError)))
                      else setEmailCodeError(apiMessage(caughtError, 'That verification code is invalid or has expired.'))
                    } finally {
                      setEmailCodeChecking(false)
                    }
                  })()
                }}
                className="inline-flex cursor-pointer items-center justify-center gap-2 bg-emerald-600 px-5 py-2 text-sm font-medium text-white rounded-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {user?.phone?.trim() ? 'Verify phone' : 'Go to profile'}
                <ArrowRight className="h-4 w-4" />
              </button>}
            </div>
          </div>
        </div>,
        document.body,
      )}
      <div className="mb-4 text-sm text-gray-700 sm:mb-5">
        <div className="mb-2.5 flex justify-between gap-3">
          <span className="shrink-0 text-gray-600">Merchandise Subtotal</span>
          <span className="whitespace-nowrap tabular-nums text-gray-900">{formatKsPrice(merchandiseSubtotal)}</span>
        </div>
        {bundleSavings.map((row) => (
          <div key={row.bundle_id} className="mb-2.5 flex justify-between gap-3 text-emerald-800">
            <span className="min-w-0 truncate">{row.title}</span>
            <span className="whitespace-nowrap tabular-nums">-{formatKsPrice(row.amount)}</span>
          </div>
        ))}
        <div className="mb-2.5 flex justify-between gap-3">
          <span className="shrink-0 text-gray-600">
            Tax
          </span>
          <span className="whitespace-nowrap tabular-nums text-gray-900">
            {scaledTax == null && taxLoading
              ? 'Calculating…'
              : taxEnabled && shownTax !== 0
                ? formatKsPrice(shownTax)
                : formatDisabledTaxAmount(shownTax)}
          </span>
        </div>
        <div className="mb-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="checkout-delivery-fee" className="shrink-0 text-gray-600">Delivery</label>
            {editableDeliveryFee ? (
              <input
                id="checkout-delivery-fee"
                type="text"
                inputMode="numeric"
                value={formatCashIncomeDisplay(deliveryFeeInput)}
                onChange={(event) => onDeliveryFeeInputChange?.(normalizeCashDigits(event.target.value))}
                placeholder="Ks 0"
                aria-label="Delivery fee"
                disabled={isPlacingOrder}
                className="h-8 w-32 rounded-lg border border-gray-300 bg-white px-2.5 text-sm tabular-nums text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#5f8f80]"
              />
            ) : (
              <span className="whitespace-nowrap tabular-nums text-gray-900">{deliveryPriceText}</span>
            )}
          </div>
          {payDeliveryFeeNow && shippingCalculateStatus === 'failed' && shippingCalculateError && (
            <p className="mt-1 text-right text-[11px] text-amber-700">{shippingCalculateError}</p>
          )}
        </div>

        <div className="mb-4 space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
          <div>
            <label htmlFor="checkout-promo-code" className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">
              Promotion code
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
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

          {(promoCodeInput.trim() || appliedPromoCode) && (
            <>
              <div className="flex items-center justify-between gap-3 border-t border-emerald-100 pt-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">Your savings</p>
                  <p className="mt-0.5 text-xs text-emerald-700">Promotions are checked for this checkout</p>
                </div>
                <span className="whitespace-nowrap text-lg font-bold tabular-nums text-emerald-700">
                  -{formatKsPrice(promotionDiscount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Shipping discount</span>
                <span className="font-medium text-emerald-700">-{formatKsPrice(shippingDiscount)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Promotion discount</span>
                <span className="font-semibold text-emerald-700">-{formatKsPrice(promotionDiscount)}</span>
              </div>
            </>
          )}
        </div>

        {prepaidProvider === 'cash' && cashTender && (
          <div className="mb-3 space-y-2 border-t border-[var(--dni-cart-border)] pt-3">
            <div className="flex justify-between gap-3 text-sm">
              <span className="shrink-0 text-gray-600">Amount Paid by Customer</span>
              <span className="whitespace-nowrap tabular-nums font-medium text-gray-900">
                {formatKsPrice(cashTender.income)}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="shrink-0 text-gray-600">Refund Amount</span>
              <span className="whitespace-nowrap tabular-nums font-medium text-gray-900">
                {formatKsPrice(cashTender.refund)}
              </span>
            </div>
          </div>
        )}

        <div
          className={`flex items-end justify-between gap-3 ${
            prepaidProvider === 'cash' && cashTender
              ? 'pt-1'
              : 'border-t border-[var(--dni-cart-border)] pt-3'
          }`}
        >
          <span className="shrink-0 font-medium text-gray-900">
            Total Payment:
          </span>
          <span className="whitespace-nowrap text-right text-xl font-semibold tabular-nums text-emerald-600 sm:text-2xl">
            {formatKsPrice(displayedTotal)}
          </span>
        </div>
        {promotionQuoteError && (
          <p className="mt-2 text-right text-[11px] text-amber-700">Promotion preview unavailable. Your total will be checked before payment.</p>
        )}
        {taxPreviewError && (
          <p className="mt-2 text-right text-[11px] text-amber-700">Tax preview unavailable. Tax is calculated again before payment.</p>
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
          className="w-full rounded bg-emerald-600 px-4 py-3 text-base font-medium text-white hover:bg-emerald-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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
          {statusMessage}
        </p>
      </div>
    </div>
  )
}

export default CheckoutSummary
