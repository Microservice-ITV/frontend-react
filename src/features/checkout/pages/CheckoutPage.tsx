import { useAppDispatch, useAppSelector } from '@/app/hooks'
import CheckoutAddress from '../components/CheckoutAddress'
import { CheckoutAddressSelectorModal } from '../components/CheckoutAddressSelectorModal'
import CheckoutItems from '../components/CheckoutItems'
import CheckoutPayment from '../components/CheckoutPayment'
import CheckoutSummary from '../components/CheckoutSummary'
import CheckoutSummarySkeleton, { stockReadyCheckoutStatuses } from '../components/CheckoutSummarySkeleton'
import { SagaStatusDisplay } from '../components/SagaStatusDisplay'
import { selectSelectedItems } from '@/features/cart/store/cartSelectors'
import { calculateCheckout } from '../utils/checkoutCalculator'
import { checkoutCart, fetchCheckoutStatus, fetchSagaStatus } from '@/features/checkout/store/checkoutThunks'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe'
import { useNavigate } from 'react-router-dom'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { selectAuthUser } from '@/features/auth/store/authSelectors'
import { clearCheckout, setCurrentCheckout, setSagaId, setCheckoutError } from '@/features/checkout/store/checkoutSlice'
import {
    selectAccountAddresses,
    selectAccountAddressesLoading,
    selectDefaultAddress,
} from '@/features/account/store/accountSelectors'
import { fetchUserAddresses } from '@/features/account/store/accountThunks'
import { NewAddressModal } from '@/features/account/components/NewAddressModal'
import type { UserAddress } from '@/features/account/types/addressTypes'
import { clearShippingCalculate } from '@/features/shipping/store/shippingSlice'
import { fetchCheckoutShippingCalculation } from '@/features/shipping/store/shippingThunks'

type StoredCheckoutSession = {
    checkoutId: string
    cartFingerprint: string
    sagaId?: string
}

const terminalCheckoutStatuses = new Set(['PAID', 'COMPLETED', 'FAILED', 'FAILED_STOCK', 'FAILED_PAYMENT', 'EXPIRED'])
const terminalSagaStatuses = new Set(['COMPLETED', 'FAILED', 'TIMEOUT'])

const CheckoutPage = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const { openModal, closeModal } = useGlobalModal()
    const authUser = useAppSelector(selectAuthUser)
    const addresses = useAppSelector(selectAccountAddresses)
    const addressesLoading = useAppSelector(selectAccountAddressesLoading)
    const defaultAddress = useAppSelector(selectDefaultAddress)
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
    const [hasResolvedInitialAddressFetch, setHasResolvedInitialAddressFetch] = useState(false)
    const [checkoutSessionBootstrapped, setCheckoutSessionBootstrapped] = useState(false)
    const hasAutoPromptedRef = useRef(false)

    // Only grab selected items for checkout
    const items = useAppSelector(selectSelectedItems)
    const feesByShopId = useAppSelector(state => state.shipping.feesByShopId)
    const totalShippingFee = useAppSelector(state => state.shipping.totalShippingFee)
    const shippingCalculateStatus = useAppSelector(state => state.shipping.calculateStatus)

    const checkout = useMemo(
        () =>
            calculateCheckout(
                items,
                shippingCalculateStatus === 'succeeded' && Object.keys(feesByShopId).length > 0
                    ? { feesByShop: feesByShopId, totalShippingFee }
                    : undefined,
            ),
        [items, shippingCalculateStatus, feesByShopId, totalShippingFee],
    )
    const selectedItemsFingerprint = useMemo(
        () =>
            items
                .map(item => `${item.productId}:${item.variantId ?? ''}:${item.quantity}`)
                .sort()
                .join('|'),
        [items],
    )

    const selectedDeliveryAddress = useMemo(() => {
        const selected = selectedAddressId
            ? addresses.find((address) => address.address_id === selectedAddressId) ?? null
            : null
        return selected ?? defaultAddress ?? null
    }, [addresses, selectedAddressId, defaultAddress])
    const hasDeliveryAddress = !!selectedDeliveryAddress

    const shippingCalculateCacheKey = useMemo(() => {
        if (!selectedDeliveryAddress?.address_id) return ''
        return `${selectedDeliveryAddress.address_id}|${selectedItemsFingerprint}`
    }, [selectedDeliveryAddress?.address_id, selectedItemsFingerprint])

    const { currentCheckout, loading, paymentStatus, clientSecret, isAwaitingFinalStatus, paymentMethod, sessionPaymentMethod, error: checkoutError } = useAppSelector(
        state => state.checkout
    )
    const sagaId = useAppSelector(state => state.checkout.sagaId)
    const sagaStatus = useAppSelector(state => state.checkout.sagaStatus)
    const checkoutStorageKey = authUser?.id ? `dni.active-checkout.${authUser.id}` : null
    const isStockReady = paymentStatus ? stockReadyCheckoutStatuses.has(paymentStatus) : false

    const refreshAddresses = useCallback(async () => {
        if (!authUser?.id) return
        await dispatch(fetchUserAddresses(authUser.id)).unwrap()
    }, [authUser?.id, dispatch])

    const abandonCheckoutAndGoToCart = useCallback(() => {
        dispatch(clearCheckout())
        if (checkoutStorageKey) {
            sessionStorage.removeItem(checkoutStorageKey)
        }
        navigate('/cart')
    }, [dispatch, checkoutStorageKey, navigate])

    const openCreateAddressModal = useCallback(
        (requiredForCheckout?: boolean) => {
            // Must use === true: if this is passed directly to onClick, React passes a SyntheticEvent as arg 1,
            // which is truthy and would wrongly enable "abandon → cart" on Cancel.
            const handleAbandon = requiredForCheckout === true ? abandonCheckoutAndGoToCart : undefined
            openModal({
                title: 'New Address',
                content: (
                    <NewAddressModal
                        mode="create"
                        onSaved={refreshAddresses}
                        description="To place order, please add a delivery address."
                        onCancel={handleAbandon}
                    />
                ),
                hidePrimary: true,
                hideSecondary: true,
                onSecondary: handleAbandon,
            })
        },
        [abandonCheckoutAndGoToCart, openModal, refreshAddresses],
    )

    const openEditAddressModal = useCallback((address: UserAddress) => {
        openModal({
            title: 'Edit Address',
            content: (
                <NewAddressModal
                    mode="edit"
                    initialAddress={address}
                    onSaved={refreshAddresses}
                    description="Update delivery details for this checkout."
                />
            ),
            hidePrimary: true,
            hideSecondary: true,
        })
    }, [openModal, refreshAddresses])

    const openAddressSelectionModal = useCallback(() => {
        if (addresses.length === 0) {
            openCreateAddressModal(true)
            return
        }

        openModal({
            title: 'My Address',
            content: (
                <CheckoutAddressSelectorModal
                    addresses={addresses}
                    selectedAddressId={selectedDeliveryAddress?.address_id ?? null}
                    onSelectAddress={(addressId) => {
                        setSelectedAddressId(addressId)
                        closeModal()
                    }}
                    onEditAddress={(address) => openEditAddressModal(address)}
                    onAddNewAddress={() => openCreateAddressModal()}
                />
            ),
            hidePrimary: true,
            hideSecondary: true,
        })
    }, [
        addresses,
        selectedDeliveryAddress?.address_id,
        closeModal,
        openModal,
        openCreateAddressModal,
        openEditAddressModal,
    ])

    useEffect(() => {
        if (!authUser?.id) return

        setHasResolvedInitialAddressFetch(false)
        void dispatch(fetchUserAddresses(authUser.id)).finally(() => {
            setHasResolvedInitialAddressFetch(true)
        })
    }, [authUser?.id, dispatch])

    useEffect(() => {
        if (!authUser?.id || !hasResolvedInitialAddressFetch || addressesLoading || hasAutoPromptedRef.current) return
        if (addresses.length > 0) return

        // Force address creation first: if user cancels, redirect back to cart.
        // This prevents entering checkout flow without a deliverable address.
        hasAutoPromptedRef.current = true
        openCreateAddressModal(true)
    }, [authUser?.id, hasResolvedInitialAddressFetch, addressesLoading, addresses.length, openCreateAddressModal])

    useEffect(() => {
        if (!selectedAddressId) return
        const stillExists = addresses.some((address) => address.address_id === selectedAddressId)
        if (!stillExists) {
            setSelectedAddressId(null)
        }
    }, [addresses, selectedAddressId])

    useEffect(() => {
        if (!hasDeliveryAddress || !selectedDeliveryAddress || items.length === 0) {
            dispatch(clearShippingCalculate())
            return
        }
        if (!shippingCalculateCacheKey) return

        void dispatch(
            fetchCheckoutShippingCalculation({
                address: selectedDeliveryAddress,
                items,
                cacheKey: shippingCalculateCacheKey,
                customer: { id: authUser?.id, name: authUser?.name },
            }),
        )
    }, [
        dispatch,
        hasDeliveryAddress,
        selectedDeliveryAddress,
        items,
        shippingCalculateCacheKey,
        authUser?.id,
        authUser?.name,
    ])

    // Drop any stale checkout session from Redux/storage when the user has no saved addresses yet.
    useEffect(() => {
        if (!hasResolvedInitialAddressFetch || addressesLoading) return
        if (addresses.length > 0) return
        dispatch(clearCheckout())
        if (checkoutStorageKey) {
            sessionStorage.removeItem(checkoutStorageKey)
        }
    }, [addresses.length, addressesLoading, checkoutStorageKey, dispatch, hasResolvedInitialAddressFetch])

    useEffect(() => {
        setCheckoutSessionBootstrapped(false)
    }, [authUser?.id, selectedItemsFingerprint])

    useEffect(() => {
        if (!authUser?.id) return

        if (!hasDeliveryAddress) {
            setCheckoutSessionBootstrapped(true)
            return
        }

        if (currentCheckout?.checkout_id) {
            let storedFingerprint: string | null = null
            try {
                const raw = checkoutStorageKey ? sessionStorage.getItem(checkoutStorageKey) : null
                if (raw) {
                    const parsed = JSON.parse(raw) as StoredCheckoutSession
                    if (parsed.checkoutId === currentCheckout.checkout_id) {
                        storedFingerprint = parsed.cartFingerprint
                    }
                }
            } catch {
                if (checkoutStorageKey) sessionStorage.removeItem(checkoutStorageKey)
            }

            if (storedFingerprint && storedFingerprint !== selectedItemsFingerprint) {
                if (checkoutStorageKey) sessionStorage.removeItem(checkoutStorageKey)
                dispatch(clearCheckout())
            }
            setCheckoutSessionBootstrapped(true)
            return
        }

        if (!checkoutStorageKey) {
            setCheckoutSessionBootstrapped(true)
            return
        }

        let parsed: StoredCheckoutSession | null = null
        try {
            const raw = sessionStorage.getItem(checkoutStorageKey)
            parsed = raw ? JSON.parse(raw) as StoredCheckoutSession : null
        } catch {
            sessionStorage.removeItem(checkoutStorageKey)
        }

        if (!parsed?.checkoutId || parsed.cartFingerprint !== selectedItemsFingerprint) {
            sessionStorage.removeItem(checkoutStorageKey)
            setCheckoutSessionBootstrapped(true)
            return
        }

        dispatch(setCurrentCheckout({
            checkout_id: parsed.checkoutId,
            message: 'Restored checkout session',
        }))

        if (parsed.sagaId) {
            dispatch(setSagaId(parsed.sagaId))
        }

        void dispatch(fetchCheckoutStatus(parsed.checkoutId))
            .unwrap()
            .catch(() => {
                sessionStorage.removeItem(checkoutStorageKey)
                dispatch(clearCheckout())
            })
            .finally(() => {
                setCheckoutSessionBootstrapped(true)
            })
    }, [
        authUser?.id,
        hasDeliveryAddress,
        currentCheckout?.checkout_id,
        checkoutStorageKey,
        dispatch,
        selectedItemsFingerprint,
    ])

    useEffect(() => {
        if (!checkoutStorageKey || !currentCheckout?.checkout_id) return

        let storedFingerprint: string | null = null
        try {
            const raw = sessionStorage.getItem(checkoutStorageKey)
            if (raw) {
                const parsed = JSON.parse(raw) as StoredCheckoutSession
                if (parsed.checkoutId === currentCheckout.checkout_id) {
                    storedFingerprint = parsed.cartFingerprint
                }
            }
        } catch {
            sessionStorage.removeItem(checkoutStorageKey)
        }

        if (storedFingerprint && storedFingerprint !== selectedItemsFingerprint) {
            sessionStorage.removeItem(checkoutStorageKey)
            dispatch(clearCheckout())
            return
        }

        const payload: StoredCheckoutSession = {
            checkoutId: currentCheckout.checkout_id,
            cartFingerprint: selectedItemsFingerprint,
            sagaId: currentCheckout.saga_id ?? undefined,
        }
        sessionStorage.setItem(checkoutStorageKey, JSON.stringify(payload))
    }, [checkoutStorageKey, currentCheckout?.checkout_id, currentCheckout?.saga_id, dispatch, selectedItemsFingerprint])

    useEffect(() => {
        if (!checkoutStorageKey || !paymentStatus) return
        if (terminalCheckoutStatuses.has(paymentStatus)) {
            sessionStorage.removeItem(checkoutStorageKey)
        }
    }, [checkoutStorageKey, paymentStatus])

    useEffect(() => {
        // Allow a fresh checkout attempt when the cart or address changes.
        dispatch(setCheckoutError(null))
    }, [dispatch, selectedItemsFingerprint, selectedDeliveryAddress?.address_id])

    useEffect(() => {
        if (!hasDeliveryAddress) {
            // Important guard: do NOT create checkout intent/session until an address exists.
            // This prevents duplicate checkout intents when users cancel address modal,
            // go back to cart, and re-enter checkout.
            return
        }

        // Note: we do NOT gate this on `checkoutSessionBootstrapped`. That flag is
        // set/cleared by two racing effects (the reset effect and the bootstrap
        // effect), which can leave it stuck `false` and silently prevent the
        // checkout POST from ever firing. The `!currentCheckout` and `!loading`
        // guards below are sufficient: while a session is being restored/created,
        // either `currentCheckout` is set or `loading` is true, so we skip.
        // Also skip while a previous hard failure is latched (thunk condition).
        if (!currentCheckout && !loading && !checkoutError) {
            dispatch(checkoutCart())
        }
    }, [dispatch, currentCheckout, loading, hasDeliveryAddress, checkoutError])

    useEffect(() => {
        if (!hasDeliveryAddress) {
            return
        }

        if (!currentCheckout?.checkout_id) {
            return
        }

        if (paymentStatus && terminalCheckoutStatuses.has(paymentStatus)) {
            return
        }

        const effectivePaymentMethod = sessionPaymentMethod ?? paymentMethod
        const isCod = effectivePaymentMethod === 'cod'
        // Prepaid: poll until Stripe client_secret is ready, then again after place order.
        // COD: keep polling until intent metadata (client_secret) is ready, then after
        // place order until authorize → payment.completed marks the session PAID.
        const shouldPollForClientSecret = !clientSecret
        const shouldPollForFinalStatus = isAwaitingFinalStatus
        const shouldPollForCodReady =
            isCod &&
            !isAwaitingFinalStatus &&
            (!!clientSecret
                ? paymentStatus === 'PENDING_STOCK' ||
                  paymentStatus === 'STOCK_CONFIRMED' ||
                  !paymentStatus
                : true)

        if (!shouldPollForClientSecret && !shouldPollForFinalStatus && !shouldPollForCodReady) {
            return
        }

        void dispatch(fetchCheckoutStatus(currentCheckout.checkout_id))

        const intervalId = window.setInterval(() => {
            void dispatch(fetchCheckoutStatus(currentCheckout.checkout_id))
        }, 500)

        return () => window.clearInterval(intervalId)
    }, [
        dispatch,
        hasDeliveryAddress,
        currentCheckout?.checkout_id,
        paymentStatus,
        clientSecret,
        isAwaitingFinalStatus,
        sessionPaymentMethod,
        paymentMethod,
    ])

    useEffect(() => {
        if (paymentStatus === 'PAID' || paymentStatus === 'COMPLETED') {
            navigate('/checkout/success', {
                replace: true,
                state: { checkoutId: currentCheckout?.checkout_id },
            })
        }
    }, [paymentStatus, navigate, currentCheckout?.checkout_id])

    // Poll the saga tracker while a run is in progress so SagaStatusDisplay stays live.
    const sagaPollingActive = !!sagaId && !terminalSagaStatuses.has(sagaStatus?.status ?? '')
    useEffect(() => {
        if (!sagaPollingActive) return

        void dispatch(fetchSagaStatus(sagaId as string))

        const intervalId = window.setInterval(() => {
            void dispatch(fetchSagaStatus(sagaId as string))
        }, 5000)

        return () => window.clearInterval(intervalId)
    }, [dispatch, sagaId, sagaPollingActive])

    return (
        <Elements stripe={stripePromise}>
            <div className="bg-[#f5f5f5] py-3 sm:py-4 lg:py-5">
                <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6">
                    {/* <h1 className="mb-3 text-lg font-semibold text-gray-900 sm:mb-4 sm:text-xl">Checkout</h1> */}

                    <div className="grid items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-5">
                        <div className="min-w-0 space-y-3">
                            <CheckoutAddress
                                address={selectedDeliveryAddress}
                                loading={addressesLoading}
                                onChangeAddress={openAddressSelectionModal}
                            />
                            <CheckoutItems checkout={checkout} />
                        </div>

                        <aside className="space-y-3 lg:sticky lg:top-4">
                        <CheckoutPayment totalAmount={checkout.totalPayment} />

                            {isStockReady ? (
                                <CheckoutSummary
                                    checkout={checkout}
                                    hasDeliveryAddress={hasDeliveryAddress}
                                    onRequireAddress={openAddressSelectionModal}
                                    deliveryAddress={selectedDeliveryAddress}
                                    cartItems={items}
                                />
                            ) : checkoutError ? (
                                <div role="alert" className="rounded-sm border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                    {checkoutError}
                                </div>
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

export default CheckoutPage
