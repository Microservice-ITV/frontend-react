import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors'
import { ProtectedRoute } from '@/routes/RouteGuards'
import { ROUTE_ACCESS } from '@/routes/routeAccessMap'
import CheckoutPage from './CheckoutPage'
import type { UserAddress } from '@/features/account/types/addressTypes'
import { selectSelectedItems } from '@/features/cart/store/cartSelectors'
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe'
import { Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { amountDueNow, calculateCheckout, shippingFeesForCheckout } from '../utils/checkoutCalculator'
import CheckoutItems from '../components/CheckoutItems'
import CheckoutAddress from '../components/CheckoutAddress'
import GuestCheckoutAnnouncementBanner from '../components/GuestCheckoutAnnouncementBanner'
import CheckoutPayment from '../components/CheckoutPayment'
import CheckoutSummary from '../components/CheckoutSummary'
import CheckoutSummarySkeleton from '../components/CheckoutSummarySkeleton'
import { SagaStatusDisplay } from '../components/SagaStatusDisplay'
import { fetchCheckoutStatus, fetchSagaStatus } from '../store/checkoutThunks'
import { fetchCheckoutShippingCalculation, fetchShopProfilesForCurrentCart } from '@/features/shipping/store/shippingThunks'
import { useCheckoutDeliveryCompany } from '@/features/shipping/hooks/useCheckoutDeliveryCompany'
import { clearShippingCalculate } from '@/features/shipping/store/shippingSlice'
import { clearCheckout, setCurrentCheckout } from '../store/checkoutSlice'
import { hasConfirmedStock, isStockReadinessConfirmed } from '../utils/checkoutStatus'
import { usePayDeliveryFeeNow } from '../hooks/usePayDeliveryFeeNow'

const AuthCheckout = () => {
  const items = useAppSelector(selectSelectedItems)

  return (
    <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.checkout}>
      {items.length === 0 ? <Navigate to="/cart" replace /> : <CheckoutPage />}
    </ProtectedRoute>
  )
}

const GuestCheckoutPayment = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const items = useAppSelector(selectSelectedItems)
  const { currentCheckout, loading, paymentStatus, sagaId, sagaStatus } = useAppSelector((state) => state.checkout)
  const [stockConfirmedSessionKey, setStockConfirmedSessionKey] = useState<string | null>(null)

  // If nothing selected, checkout shouldn't be reachable.
  if (items.length === 0) {
    return <Navigate to="/cart" replace />
  }

  const paymentDeliveryAddress = useMemo<UserAddress | null>(() => {
    try {
      const raw = sessionStorage.getItem('dni.guest_checkout.delivery_address')
      if (!raw) return null
      return JSON.parse(raw) as UserAddress
    } catch {
      return null
    }
  }, [])

  const storedCheckoutId = useMemo(() => {
    try {
      return sessionStorage.getItem('dni.guest_checkout.checkout_id')
    } catch {
      return null
    }
  }, [])

  const storedCartKey = useMemo(() => {
    try {
      return sessionStorage.getItem('dni.guest_checkout.cart_key')
    } catch {
      return null
    }
  }, [])

  const currentCartKey = useMemo(() => {
    return items
      .map((item) => `${item.productId}:${item.variantId ?? ''}:${item.quantity}`)
      .sort()
      .join('|')
  }, [items])

  const hasCheckoutId = Boolean(currentCheckout?.checkout_id || storedCheckoutId)
  const cartMatches = Boolean(storedCartKey && storedCartKey === currentCartKey)
  const ready = Boolean(paymentDeliveryAddress && hasCheckoutId && cartMatches)

  const feesByShopId = useAppSelector((state) => state.shipping.feesByShopId)
  const totalShippingFee = useAppSelector((state) => state.shipping.totalShippingFee)
  const shippingCalculateStatus = useAppSelector((state) => state.shipping.calculateStatus)
  const checkoutTotals = useMemo(
    () =>
      calculateCheckout(
        items,
        shippingFeesForCheckout(shippingCalculateStatus, feesByShopId, totalShippingFee),
      ),
    [items, shippingCalculateStatus, feesByShopId, totalShippingFee],
  )

  const shopIds = useMemo(
    () => [...new Set(items.map((item) => item.shopId).filter(Boolean))],
    [items],
  )
  const profilesByShopId = useAppSelector((state) => state.shipping.profilesByShopId)
  const shopRoutes = useMemo(
    () => shopIds.map((shopId) => ({
      shopId,
      fromDistrictId: profilesByShopId[shopId]?.districtId?.trim() ?? '',
      toDistrictId: paymentDeliveryAddress?.district_id != null
        ? String(paymentDeliveryAddress.district_id)
        : '',
    })),
    [paymentDeliveryAddress?.district_id, profilesByShopId, shopIds],
  )
  const deliveryCompany = useCheckoutDeliveryCompany(shopIds, shopRoutes)
  useEffect(() => {
    if (shopIds.length === 0) return
    void dispatch(fetchShopProfilesForCurrentCart())
  }, [dispatch, shopIds])
  const quotableCompanyByShopId = useMemo(() => {
    const next: Record<string, string> = {}
    for (const shopId of shopIds) {
      const companyId = deliveryCompany.companyByShopId[shopId]
      if (!companyId) continue
      if ((deliveryCompany.unavailableCompanyIdsByShop[shopId] ?? []).includes(companyId)) continue
      next[shopId] = companyId
    }
    return next
  }, [deliveryCompany.companyByShopId, deliveryCompany.unavailableCompanyIdsByShop, shopIds])
  const hasQuotableCompany = Object.keys(quotableCompanyByShopId).length > 0
  const prepaidProvider = useAppSelector((state) => state.checkout.prepaidProvider)
  const staffCashSelected = prepaidProvider === 'cash'
  const {
    payDeliveryFeeNow,
    setPayDeliveryFeeNow,
    payDeliveryFeeNowLockedOff,
    payDeliveryFeeNowLockReason,
    deliveryQuotePendingConfirmation,
  } = usePayDeliveryFeeNow({
    shopIds,
    companiesCountByShop: deliveryCompany.companiesCountByShop,
    unavailableCompanyIdsByShop: deliveryCompany.unavailableCompanyIdsByShop,
    loading: deliveryCompany.loading,
    routesReady: deliveryCompany.routesReady,
    forceOff: staffCashSelected,
    forceOffReason: 'cash',
  })

  const shippingCalculateCacheKey = useMemo(() => {
    if (!paymentDeliveryAddress?.address_id || !hasQuotableCompany) return ''
    const fingerprint = items
      .map((item) => `${item.productId}:${item.variantId ?? ''}:${item.quantity}`)
      .sort()
      .join('|')
    const quoteKey = Object.entries(quotableCompanyByShopId).map(([shopId, companyId]) => `${shopId}:${companyId}`).sort().join('|')
    return `${quoteKey}|${paymentDeliveryAddress.address_id}|${fingerprint}`
  }, [paymentDeliveryAddress?.address_id, items, hasQuotableCompany, quotableCompanyByShopId])

  const goToGuestForm = () => {
    try {
      sessionStorage.setItem('dni.guest_checkout.entry_ok', '1')
      sessionStorage.removeItem('dni.guest_checkout.delivery_address')
      sessionStorage.removeItem('dni.guest_checkout.checkout_id')
      sessionStorage.removeItem('dni.guest_checkout.cart_key')
    } catch {
      // ignore
    }
    dispatch(clearCheckout())
    dispatch(clearShippingCalculate())
    navigate('/checkout/guest', { replace: true })
  }

  if (!ready) {
    try {
      sessionStorage.removeItem('dni.guest_checkout.delivery_address')
      sessionStorage.removeItem('dni.guest_checkout.checkout_id')
      sessionStorage.removeItem('dni.guest_checkout.cart_key')
    } catch {
      // ignore
    }
    return <Navigate to="/checkout/guest" replace />
  }

  useEffect(() => {
    if (currentCheckout?.checkout_id) return
    if (!storedCheckoutId) return
    dispatch(setCurrentCheckout({ checkout_id: storedCheckoutId, message: 'Restored guest checkout session' } as any))
  }, [currentCheckout?.checkout_id, storedCheckoutId, dispatch])

  useEffect(() => {
    if (!currentCheckout?.checkout_id) return
    try {
      sessionStorage.setItem('dni.guest_checkout.checkout_id', currentCheckout.checkout_id)
    } catch {
      // ignore
    }
  }, [currentCheckout?.checkout_id])

  useEffect(() => {
    // Keep the last quote. Turning the switch off only changes what the customer pays now.
    if (!payDeliveryFeeNow) return
    if (!paymentDeliveryAddress || !hasQuotableCompany || !deliveryCompany.routesReady) {
      dispatch(clearShippingCalculate())
      return
    }
    if (!shippingCalculateCacheKey) return

    void dispatch(
      fetchCheckoutShippingCalculation({
        address: paymentDeliveryAddress,
        items,
        companyByShopId: quotableCompanyByShopId,
        cacheKey: shippingCalculateCacheKey,
        customer: {
          id: paymentDeliveryAddress.address_id,
          name: paymentDeliveryAddress.full_name || undefined,
        },
      }),
    )
  }, [dispatch, payDeliveryFeeNow, paymentDeliveryAddress, items, shippingCalculateCacheKey, hasQuotableCompany, deliveryCompany.routesReady, quotableCompanyByShopId])

  const terminalCheckoutStatuses = useMemo(
    () => new Set(['PAID', 'COMPLETED', 'FAILED', 'FAILED_PAYMENT', 'EXPIRED']),
    [],
  )
  const terminalSagaStatuses = useMemo(() => new Set(['COMPLETED', 'FAILED', 'TIMEOUT']), [])
  const stockReadinessKey = currentCheckout?.checkout_id
    ? `${currentCheckout.checkout_id}|${currentCartKey}`
    : null
  const isStockReady = isStockReadinessConfirmed({
    paymentStatus,
    confirmedReadinessKey: stockConfirmedSessionKey,
  })

  useEffect(() => {
    if (stockReadinessKey && hasConfirmedStock(paymentStatus)) {
      setStockConfirmedSessionKey(stockReadinessKey)
    }
  }, [paymentStatus, stockReadinessKey])

  useEffect(() => {
    if (!currentCheckout?.checkout_id) return
    if (paymentStatus && terminalCheckoutStatuses.has(paymentStatus)) return
    if (loading) return

    void dispatch(fetchCheckoutStatus(currentCheckout.checkout_id))
    const intervalId = window.setInterval(() => {
      void dispatch(fetchCheckoutStatus(currentCheckout.checkout_id))
    }, 800)
    return () => window.clearInterval(intervalId)
  }, [dispatch, currentCheckout?.checkout_id, paymentStatus, loading, terminalCheckoutStatuses])

  const sagaPollingActive = !!sagaId && !terminalSagaStatuses.has(sagaStatus?.status ?? '')
  useEffect(() => {
    if (!sagaPollingActive) return
    void dispatch(fetchSagaStatus(sagaId as string))
    const intervalId = window.setInterval(() => {
      void dispatch(fetchSagaStatus(sagaId as string))
    }, 5000)
    return () => window.clearInterval(intervalId)
  }, [dispatch, sagaId, sagaPollingActive, sagaStatus?.status])

  useEffect(() => {
    if (paymentStatus === 'PAID' || paymentStatus === 'COMPLETED') {
      navigate('/checkout/guest/success', {
        replace: true,
        state: { checkoutId: currentCheckout?.checkout_id, phone: paymentDeliveryAddress?.phone_no },
      })
    }
  }, [paymentStatus, navigate, currentCheckout?.checkout_id, paymentDeliveryAddress?.phone_no])

  return (
    <Elements stripe={stripePromise}>
      <div className="bg-[#f5f5f5] py-3 sm:py-4 lg:py-5">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6">
          <GuestCheckoutAnnouncementBanner />

          <div className="mt-3 grid items-start gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-5">
            <div className="min-w-0 space-y-3">
              <CheckoutAddress
                address={paymentDeliveryAddress}
                loading={false}
                onChangeAddress={goToGuestForm}
              />
              <CheckoutItems
                checkout={checkoutTotals}
                payDeliveryFeeNow={payDeliveryFeeNow}
                onPayDeliveryFeeNowChange={setPayDeliveryFeeNow}
                payDeliveryFeeNowLockedOff={payDeliveryFeeNowLockedOff}
                deliveryCompany={{
                  companiesByShopId: deliveryCompany.companiesByShopId,
                  selectedByShopId: deliveryCompany.selectedByShopId,
                  unavailableCompanyIdsByShop: deliveryCompany.unavailableCompanyIdsByShop,
                  loading: deliveryCompany.loading,
                  error: deliveryCompany.error,
                  onSelect: deliveryCompany.selectCompany,
                }}
              />
            </div>

            <aside className="space-y-3 lg:sticky lg:top-4">
            <CheckoutPayment totalAmount={amountDueNow(checkoutTotals, payDeliveryFeeNow)} />

              {isStockReady ? (
                <CheckoutSummary
                  checkout={checkoutTotals}
                  payDeliveryFeeNow={payDeliveryFeeNow}
                  hasDeliveryAddress={true}
                  onRequireAddress={goToGuestForm}
                  deliveryAddress={paymentDeliveryAddress}
                  cartItems={items}
                  deliveryQuotePendingConfirmation={deliveryQuotePendingConfirmation}
                  deliveryCompanyIdByShopId={deliveryCompany.companyByShopId}
                />
              ) : (
                <CheckoutSummarySkeleton />
              )}
            </aside>
          </div>

          {sagaId && (
            <div className="mt-4">
              <SagaStatusDisplay sagaId={sagaId} />
            </div>
          )}
        </div>
      </div>
    </Elements>
  )
}

const CheckoutGatePage = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  return isAuthenticated ? <AuthCheckout /> : <GuestCheckoutPayment />
}

export default CheckoutGatePage
