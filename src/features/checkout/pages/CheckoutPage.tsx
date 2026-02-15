import { useAppDispatch, useAppSelector } from '@/app/hooks'
import CheckoutAddress from '../components/CheckoutAddress'
import CheckoutItems from '../components/CheckoutItems'
import CheckoutPayment from '../components/CheckoutPayment'
import CheckoutSummary from '../components/CheckoutSummary'
import { selectSelectedItems } from '@/features/cart/store/cartSelectors'
import { calculateCheckout } from '../utils/checkoutCalculator'
import { checkoutCart } from '@/features/checkout/store/checkoutThunks'
import { useEffect } from 'react'

const CheckoutPage = () => {
    const dispatch = useAppDispatch()

    // Only grab selected items for checkout
    const items = useAppSelector(selectSelectedItems)
    const checkout = calculateCheckout(items)

    const { currentCheckout, loading } = useAppSelector(
        state => state.checkout
    )

    useEffect(() => {
        if (!currentCheckout && !loading) {
            dispatch(checkoutCart())
        }
    }, [dispatch, currentCheckout, loading])

    return (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-4 py-3 mb-5">
            <CheckoutAddress />
            <CheckoutItems checkout={checkout} />
            <CheckoutPayment />
            <CheckoutSummary checkout={checkout} />
        </div>
    )
}

export default CheckoutPage