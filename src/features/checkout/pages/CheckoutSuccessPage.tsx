import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { removeSelectedItems } from '@/features/cart/store/cartSlice'
import { clearCheckout } from '../store/checkoutSlice'
import { ecommerceReadClient } from '@/lib/api/ecommerceReadClient'
import type { PurchasedOrder } from '@/features/account/types/orderTypes'

const MY_ORDERS_QUERY = `
  query MyOrders {
    myOrders {
      orderId
      checkoutId
      status
      placedAt
      totals {
        total
        currency
      }
    }
  }
`

const CheckoutSuccessPage = () => {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const checkoutId = (location.state as { checkoutId?: string } | null)?.checkoutId

  const [matchedOrder, setMatchedOrder] = useState<PurchasedOrder | null>(null)
  const [orderLoading, setOrderLoading] = useState(!!checkoutId)

  useEffect(() => {
    dispatch(removeSelectedItems())
    dispatch(clearCheckout())
  }, [dispatch])

  useEffect(() => {
    if (!checkoutId) return

    let cancelled = false

    const fetchOrder = async () => {
      try {
        const response = await ecommerceReadClient.post<{
          data?: { myOrders?: Array<PurchasedOrder & { checkoutId?: string }> }
          errors?: { message?: string }[]
        }>('', { query: MY_ORDERS_QUERY })

        if (cancelled) return

        const orders = response.data.data?.myOrders ?? []
        const match = orders.find((o) => o.checkoutId === checkoutId)
        if (match && !cancelled) setMatchedOrder(match)
      } catch {
        // silently fail — user can still navigate to orders page manually
      } finally {
        if (!cancelled) setOrderLoading(false)
      }
    }

    void fetchOrder()
    return () => { cancelled = true }
  }, [checkoutId])

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

        {matchedOrder && (
          <div className="mt-4 text-sm text-gray-700">
            Order ID: <span className="font-medium text-gray-900">{matchedOrder.orderId}</span>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          {matchedOrder ? (
            <Link
              to={`/account/orders/${matchedOrder.orderId}`}
              className="inline-flex items-center justify-center px-8 py-3 bg-emerald-600 text-white text-base font-medium rounded hover:bg-emerald-700"
            >
              View Order Tracking
            </Link>
          ) : orderLoading ? (
            <span className="text-sm text-gray-500">Loading order details...</span>
          ) : null}
          <Link
            to="/account/orders"
            className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-gray-700 text-base font-medium rounded hover:bg-gray-50"
          >
            Go to My Orders
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-gray-700 text-base font-medium rounded hover:bg-gray-50"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CheckoutSuccessPage
