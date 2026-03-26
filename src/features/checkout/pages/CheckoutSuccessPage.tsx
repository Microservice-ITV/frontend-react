import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { removeSelectedItems } from '@/features/cart/store/cartSlice'
import { clearCheckout } from '../store/checkoutSlice'

const CheckoutSuccessPage = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Clear purchased items and transient checkout session when success page opens.
    dispatch(removeSelectedItems())
    dispatch(clearCheckout())
  }, [dispatch])

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-4 py-10">
      <div className="bg-white border border-black/5 rounded p-8 text-center">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-green-600">
            <path
              d="M20.3 6.7a1 1 0 00-1.4-1.4l-9 9-3.8-3.8a1 1 0 10-1.4 1.4l4.5 4.5a1 1 0 001.4 0l9.7-9.7z"
              fill="currentColor"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900">Payment Successful</h1>
        <p className="mt-2 text-sm text-gray-600">
          Your order has been confirmed successfully.
        </p>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-8 py-3 bg-emerald-600 text-white text-base font-medium rounded hover:bg-emerald-700"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CheckoutSuccessPage


