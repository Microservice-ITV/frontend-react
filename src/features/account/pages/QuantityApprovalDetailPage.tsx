import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Typing } from '@/components/loading-ui/typing'
import { syncCart } from '@/features/cart/store/cartSlice'
import type { CartItem } from '@/features/cart/types/cartTypes'
import { setCurrentCheckout } from '@/features/checkout/store/checkoutSlice'
import OrderProductImage from '../components/OrderProductImage'
import {
  quantityApprovalApi,
  type CustomerQuantityApproval,
} from '../api/quantityApprovalApi'

const formatMoney = (value: number): string => {
  const amount = Number(value)
  const safe = Number.isFinite(amount) ? amount : 0
  return `Ks ${safe.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const statusLabel = (status: string): string => {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  return 'Pending approval'
}

const QuantityApprovalDetailPage = () => {
  const { checkoutId = '' } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const userId = useAppSelector((state) => state.auth.user?.id)
  const cartItems = useAppSelector((state) => state.cart.items)
  const [detail, setDetail] = useState<CustomerQuantityApproval | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId || !checkoutId) {
      setDetail(null)
      setError('This quantity request could not be found.')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void quantityApprovalApi.detail(userId, checkoutId)
      .then((next) => {
        if (!cancelled) setDetail(next)
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(null)
          setError('Unable to load this quantity request.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [checkoutId, userId])

  const continueCheckout = () => {
    if (!detail || !userId || detail.status !== 'approved') return
    const restored: CartItem[] = detail.items.map((item) => ({
      productId: item.product_id,
      variantId: item.variant_id ?? '',
      shopId: item.shop_id || 'shop',
      shopName: 'Shop',
      name: item.title,
      image: item.image_url ?? undefined,
      price: item.price,
      quantity: item.qty,
      selected: true,
    }))
    const fingerprint = restored
      .map((item) => `${item.productId}:${item.variantId}:${item.quantity}`)
      .sort()
      .join('|')
    dispatch(syncCart([
      ...cartItems.filter((item) => !item.selected),
      ...restored,
    ]))
    dispatch(setCurrentCheckout({
      checkout_id: detail.checkout_id,
      message: 'Quantity approval',
    }))
    sessionStorage.setItem(`dni.active-checkout.${userId}`, JSON.stringify({
      checkoutId: detail.checkout_id,
      cartFingerprint: fingerprint,
    }))
    navigate('/checkout')
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <nav className="text-xs text-gray-500">
        <Link to="/account/quantity-approvals" className="hover:text-emerald-600">Quantity Approvals</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-900">Detail</span>
      </nav>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Typing className="w-8" />
        </div>
      )}

      {!loading && error && (
        <div className="border border-red-200 rounded-sm px-4 py-6 text-sm text-red-600">{error}</div>
      )}

      {!loading && detail && (
        <div className="border border-gray-200 rounded-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold text-gray-900">Quantity request</h1>
              <p className="mt-1 text-sm text-gray-500">{formatDate(detail.created_at)} · {detail.quantity} items</p>
            </div>
            <span className="text-sm font-medium text-gray-700">{statusLabel(detail.status)}</span>
          </div>

          {detail.items.map((item, index) => (
            <div key={`${item.product_id}-${item.sku ?? index}`} className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <OrderProductImage imageUrl={item.image_url} alt={item.title} />
                  <div className="min-w-0 text-sm">
                    <p className="truncate text-gray-800">{item.title}</p>
                    <p className="mt-1 text-xs text-gray-500">SKU: {item.sku || '—'} · x{item.qty}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-600">{formatMoney(item.line_total)}</span>
              </div>
            </div>
          ))}

          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Merchandise total</span>
              <span className="font-semibold text-gray-900">{formatMoney(detail.merchandise_total)}</span>
            </div>
            {detail.rejection_reason && (
              <p className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">
                Rejection reason: {detail.rejection_reason}
              </p>
            )}
            {detail.status === 'pending' && (
              <p className="text-sm text-gray-600">Waiting for a shop admin. You can still place a separate order of 50 items or fewer.</p>
            )}
            {detail.status === 'rejected' && (
              <p className="text-sm text-gray-600">This request was rejected and cannot be placed.</p>
            )}
            {detail.status === 'approved' && detail.order_placed && (
              <p className="text-sm text-gray-600">Approved. This order has been placed. You can see it in My Purchase.</p>
            )}
            {detail.status === 'approved' && !detail.order_placed && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={continueCheckout}
                  className="rounded-sm bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Continue checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default QuantityApprovalDetailPage
