import { useAppDispatch, useAppSelector } from '@/app/hooks'
import CheckoutAddress from '../components/CheckoutAddress'
import { CheckoutAddressSelectorModal } from '../components/CheckoutAddressSelectorModal'
import CheckoutItems from '../components/CheckoutItems'
import CheckoutPayment from '../components/CheckoutPayment'
import CheckoutSummary from '../components/CheckoutSummary'
import { selectSelectedItems } from '@/features/cart/store/cartSelectors'
import { calculateCheckout } from '../utils/checkoutCalculator'
import { checkoutCart, fetchCheckoutStatus } from '@/features/checkout/store/checkoutThunks'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe'
import { useNavigate } from 'react-router-dom'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { selectAuthUser } from '@/features/auth/store/authSelectors'
import { clearCheckout, setCurrentCheckout } from '@/features/checkout/store/checkoutSlice'
import {
    selectAccountAddresses,
    selectAccountAddressesLoading,
    selectDefaultAddress,
} from '@/features/account/store/accountSelectors'
import { fetchUserAddresses } from '@/features/account/store/accountThunks'
import { NewAddressModal } from '@/features/account/components/NewAddressModal'
import type { UserAddress } from '@/features/account/types/addressTypes'

type StoredCheckoutSession = {
    checkoutId: string
    cartFingerprint: string
}

const terminalCheckoutStatuses = new Set(['PAID', 'COMPLETED', 'FAILED', 'FAILED_PAYMENT', 'EXPIRED'])

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
    const checkout = calculateCheckout(items)
    const selectedItemsFingerprint = useMemo(() => (
        items
            .map(item => `${item.productId}:${item.quantity}`)
            .sort()
            .join('|')
    ), [items])
    const selectedDeliveryAddress = useMemo(() => {
        const selected = selectedAddressId
            ? addresses.find((address) => address.address_id === selectedAddressId) ?? null
            : null
        return selected ?? defaultAddress ?? null
    }, [addresses, selectedAddressId, defaultAddress])
    const hasDeliveryAddress = !!selectedDeliveryAddress

    const { currentCheckout, loading, paymentStatus, clientSecret, isAwaitingFinalStatus } = useAppSelector(
        state => state.checkout
    )
    const checkoutStorageKey = authUser?.id ? `dni.active-checkout.${authUser.id}` : null

    const refreshAddresses = useCallback(async () => {
        if (!authUser?.id) return
        await dispatch(fetchUserAddresses(authUser.id)).unwrap()
    }, [authUser?.id, dispatch])

    const openCreateAddressModal = useCallback((requiredForCheckout = false) => {
        openModal({
            title: 'New Address',
            content: (
                <NewAddressModal
                    mode="create"
                    onSaved={refreshAddresses}
                    description="To place order, please add a delivery address."
                />
            ),
            hidePrimary: true,
            hideSecondary: true,
            onSecondary: () => {
                if (requiredForCheckout) {
                    navigate('/cart')
                }
            },
        })
    }, [openModal, refreshAddresses, navigate])

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
            openCreateAddressModal()
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
                    onAddNewAddress={openCreateAddressModal}
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
        setCheckoutSessionBootstrapped(false)
    }, [authUser?.id, selectedItemsFingerprint])

    useEffect(() => {
        if (!authUser?.id) return

        if (!hasDeliveryAddress) {
            setCheckoutSessionBootstrapped(true)
            return
        }

        if (currentCheckout?.checkout_id) {
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

        const payload: StoredCheckoutSession = {
            checkoutId: currentCheckout.checkout_id,
            cartFingerprint: selectedItemsFingerprint,
        }
        sessionStorage.setItem(checkoutStorageKey, JSON.stringify(payload))
    }, [checkoutStorageKey, currentCheckout?.checkout_id, selectedItemsFingerprint])

    useEffect(() => {
        if (!checkoutStorageKey || !paymentStatus) return
        if (terminalCheckoutStatuses.has(paymentStatus)) {
            sessionStorage.removeItem(checkoutStorageKey)
        }
    }, [checkoutStorageKey, paymentStatus])

    useEffect(() => {
        if (!hasDeliveryAddress) {
            // Important guard: do NOT create checkout intent/session until an address exists.
            // This prevents duplicate checkout intents when users cancel address modal,
            // go back to cart, and re-enter checkout.
            return
        }

        if (!checkoutSessionBootstrapped) {
            // Wait until we restore/validate any existing session from storage.
            return
        }

        if (!currentCheckout && !loading) {
            dispatch(checkoutCart())
        }
    }, [dispatch, currentCheckout, loading, hasDeliveryAddress, checkoutSessionBootstrapped])

    useEffect(() => {
        if (!currentCheckout?.checkout_id) {
            return
        }

        if (paymentStatus && terminalCheckoutStatuses.has(paymentStatus)) {
            return
        }

        // Poll in two phases:
        // 1) until client_secret is ready
        // 2) after Place Order (PAYMENT_PENDING_CONFIRMATION) until terminal state
        const shouldPollForClientSecret = !clientSecret
        const shouldPollForFinalStatus = isAwaitingFinalStatus

        if (!shouldPollForClientSecret && !shouldPollForFinalStatus) {
            return
        }

        // Poll order service until payment intent is ready / terminal status
        void dispatch(fetchCheckoutStatus(currentCheckout.checkout_id))

        const intervalId = window.setInterval(() => {
            void dispatch(fetchCheckoutStatus(currentCheckout.checkout_id))
        }, 2000)

        return () => window.clearInterval(intervalId)
    }, [dispatch, currentCheckout?.checkout_id, paymentStatus, clientSecret, isAwaitingFinalStatus])

    useEffect(() => {
        if (paymentStatus === 'PAID' || paymentStatus === 'COMPLETED') {
            navigate('/checkout/success', { replace: true })
        }
    }, [paymentStatus, navigate])

    return (
        <Elements stripe={stripePromise}>
            <div className="max-w-[1200px] mx-auto px-4 sm:px-4 py-3 mb-5">
                <CheckoutAddress
                    address={selectedDeliveryAddress}
                    loading={addressesLoading}
                    onChangeAddress={openAddressSelectionModal}
                />
                <CheckoutItems checkout={checkout} />
                <CheckoutPayment />
                <CheckoutSummary
                    checkout={checkout}
                    hasDeliveryAddress={hasDeliveryAddress}
                    onRequireAddress={openAddressSelectionModal}
                    deliveryAddress={selectedDeliveryAddress}
                />
            </div>
        </Elements>
    )
}

export default CheckoutPage