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
import { useEffect, useMemo } from 'react'
import { calculateCheckout } from '../utils/checkoutCalculator'
import CheckoutItems from '../components/CheckoutItems'
import CheckoutAddress from '../components/CheckoutAddress'
import GuestCheckoutAnnouncementBanner from '../components/GuestCheckoutAnnouncementBanner'
import CheckoutPayment from '../components/CheckoutPayment'
import CheckoutSummary from '../components/CheckoutSummary'
import { SagaStatusDisplay } from '../components/SagaStatusDisplay'
import { fetchCheckoutStatus, fetchSagaStatus } from '../store/checkoutThunks'
import { fetchCheckoutShippingCalculation } from '@/features/shipping/store/shippingThunks'
import { clearShippingCalculate } from '@/features/shipping/store/shippingSlice'
import { clearCheckout, setCurrentCheckout } from '../store/checkoutSlice'

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
        shippingCalculateStatus === 'succeeded' && Object.keys(feesByShopId).length > 0
          ? { feesByShop: feesByShopId, totalShippingFee }
          : undefined,
      ),
    [items, shippingCalculateStatus, feesByShopId, totalShippingFee],
  )

  const shippingCalculateCacheKey = useMemo(() => {
    if (!paymentDeliveryAddress?.address_id) return ''
    const fingerprint = items
      .map((item) => `${item.productId}:${item.variantId ?? ''}:${item.quantity}`)
      .sort()
      .join('|')
    return `${paymentDeliveryAddress.address_id}|${fingerprint}`
  }, [paymentDeliveryAddress?.address_id, items])

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
    if (!paymentDeliveryAddress) {
      dispatch(clearShippingCalculate())
      return
    }
    if (!shippingCalculateCacheKey) return

    void dispatch(
      fetchCheckoutShippingCalculation({
        address: paymentDeliveryAddress,
        items,
        cacheKey: shippingCalculateCacheKey,
      }),
    )
  }, [dispatch, paymentDeliveryAddress, items, shippingCalculateCacheKey])

  const terminalCheckoutStatuses = useMemo(
    () => new Set(['PAID', 'COMPLETED', 'FAILED', 'FAILED_PAYMENT', 'EXPIRED']),
    [],
  )
  const terminalSagaStatuses = useMemo(() => new Set(['COMPLETED', 'FAILED', 'TIMEOUT']), [])

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
      <div className="max-w-[1200px] mx-auto px-4 sm:px-4 py-3 mb-5 space-y-4">
        <GuestCheckoutAnnouncementBanner />
        <CheckoutAddress address={paymentDeliveryAddress} loading={false} onChangeAddress={goToGuestForm} />
        <CheckoutItems items={items} />

        <div className="grid lg:grid-cols-[1fr_400px] gap-6 lg:gap-8 mt-4">
          <div className="space-y-4">
            <CheckoutPayment totalAmount={checkoutTotals.totalPayment} />
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start mt-4">
            <CheckoutSummary
              checkout={checkoutTotals}
              hasDeliveryAddress={true}
              onRequireAddress={goToGuestForm}
              deliveryAddress={paymentDeliveryAddress}
              cartItems={items}
            />
          </div>
        </div>

        {sagaId && <SagaStatusDisplay sagaId={sagaId} />}
      </div>
    </Elements>
  )
}

const CheckoutGatePage = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  return isAuthenticated ? <AuthCheckout /> : <GuestCheckoutPayment />
}

export default CheckoutGatePage

