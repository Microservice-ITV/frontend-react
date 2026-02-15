import { useAppDispatch, useAppSelector } from '@/app/hooks'
import CheckoutAddress from '../components/CheckoutAddress'
import CheckoutItems from '../components/CheckoutItems'
import CheckoutPayment from '../components/CheckoutPayment'
import CheckoutSummary from '../components/CheckoutSummary'
import { selectSelectedItems } from '@/features/cart/store/cartSelectors'
import { removeSelectedItems } from '@/features/cart/store/cartSlice'
import { calculateCheckout } from '../utils/checkoutCalculator'
import { checkoutCart, fetchCheckoutStatus } from '@/features/checkout/store/checkoutThunks'
import { clearCheckout } from '@/features/checkout/store/checkoutSlice'
import { useEffect } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe'
import { useNavigate } from 'react-router-dom'

const CheckoutPage = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    // Only grab selected items for checkout
    const items = useAppSelector(selectSelectedItems)
    const checkout = calculateCheckout(items)

    const { currentCheckout, loading, paymentStatus, clientSecret, isAwaitingFinalStatus } = useAppSelector(
        state => state.checkout
    )

    useEffect(() => {
        if (!currentCheckout && !loading) {
            dispatch(checkoutCart())
        }
    }, [dispatch, currentCheckout, loading])

    useEffect(() => {
        if (!currentCheckout?.checkout_id) {
            return
        }

        const terminalStatuses = new Set(['PAID', 'COMPLETED', 'FAILED', 'EXPIRED'])
        if (paymentStatus && terminalStatuses.has(paymentStatus)) {
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
            // Payment is finalized by backend; clear checked-out items from cart.
            dispatch(removeSelectedItems())
            // Reset transient checkout session state.
            dispatch(clearCheckout())
            navigate('/checkout/success', { replace: true })
        }
    }, [dispatch, paymentStatus, navigate])

    return (
        <Elements stripe={stripePromise}>
            <div className="max-w-[1200px] mx-auto px-4 sm:px-4 py-3 mb-5">
                <CheckoutAddress />
                <CheckoutItems checkout={checkout} />
                <CheckoutPayment />
                <CheckoutSummary checkout={checkout} />
            </div>
        </Elements>
    )
}

export default CheckoutPage