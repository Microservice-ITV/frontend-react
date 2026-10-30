import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Typing } from '@/components/loading-ui/typing'
import DataTablePagination from '@/components/ui/DataTablePagination'
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

const statusClass = (status: string): string => {
  if (status === 'approved') return 'text-emerald-600'
  if (status === 'rejected') return 'text-red-500'
  return 'text-amber-600'
}

const statusLabel = (status: string): string => {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  return 'Pending approval'
}

const QuantityApprovalsPage = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const userId = useAppSelector((state) => state.auth.user?.id)
  const cartItems = useAppSelector((state) => state.cart.items)
  const [approvals, setApprovals] = useState<CustomerQuantityApproval[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<CustomerQuantityApproval | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  useEffect(() => {
    if (!userId) {
      setApprovals([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void quantityApprovalApi.list(userId)
      .then((next) => {
        if (!cancelled) setApprovals(next)
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load quantity approvals.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const openDetail = (approval: CustomerQuantityApproval) => {
    setSelected(approval)
    setDetailError(null)
    if (!userId) return
    setDetailLoading(true)
    void quantityApprovalApi.detail(userId, approval.checkout_id)
      .then((next) => setSelected(next))
      .catch(() => setDetailError('Unable to load this quantity request.'))
      .finally(() => setDetailLoading(false))
  }

  const continueCheckout = () => {
    if (!selected || !userId || selected.status !== 'approved') return
    const restored: CartItem[] = selected.items.map((item) => ({
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
      checkout_id: selected.checkout_id,
      message: 'Quantity approval',
    }))
    sessionStorage.setItem(`dni.active-checkout.${userId}`, JSON.stringify({
      checkoutId: selected.checkout_id,
      cartFingerprint: fingerprint,
    }))
    setSelected(null)
    navigate('/checkout')
  }

  const totalPages = Math.max(1, Math.ceil(approvals.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const pageApprovals = approvals.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)

  return (
    <div className="p-0 md:p-6 space-y-4">
      <div className="bg-white px-4 py-4 md:px-0">
        <h1 className="text-base font-semibold text-gray-900">Quantity Approvals</h1>
        <p className="mt-1 text-sm text-gray-500">
          Orders with more than 50 items are saved here until a shop admin approves them. A normal order can still be placed.
        </p>
      </div>

      {!userId && (
        <div className="bg-white border border-gray-200 rounded-sm px-4 py-6 text-sm text-gray-600">
          Please log in to see your quantity approvals.
        </div>
      )}

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Typing className="w-8" />
        </div>
      )}

      {!!error && (
        <div className="bg-white border border-red-200 rounded-sm px-4 py-6 text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && userId && approvals.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-sm px-4 py-6 text-sm text-gray-600">
          No quantity approvals yet.
        </div>
      )}

      {!loading && !error && pageApprovals.map((approval) => (
        <div key={approval.checkout_id} className="bg-white border border-gray-200 rounded-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 text-xs md:text-sm">
            <div className="text-gray-700">
              {formatDate(approval.created_at)} · {approval.quantity} items
            </div>
            <span className={`font-medium ${statusClass(approval.status)}`}>{statusLabel(approval.status)}</span>
          </div>

          {approval.items.slice(0, 3).map((item, index) => (
            <div key={`${item.product_id}-${item.sku ?? index}`} className="px-4 py-3 border-b border-gray-100">
              <div className="flex gap-3">
                <OrderProductImage imageUrl={item.image_url} alt={item.title} />
                <div className="min-w-0 text-xs md:text-sm">
                  <p className="truncate text-gray-800">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-500">x{item.qty}</p>
                </div>
              </div>
            </div>
          ))}
          {approval.items.length > 3 && (
            <p className="px-4 py-2 text-xs text-gray-500">+{approval.items.length - 3} more items</p>
          )}

          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-emerald-600">{formatMoney(approval.merchandise_total)}</span>
            <button
              type="button"
              onClick={() => openDetail(approval)}
              className="rounded-sm border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              View
            </button>
          </div>
        </div>
      ))}

      {!loading && !error && approvals.length > 0 && (
        <DataTablePagination
          page={safePage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalItems={approvals.length}
          rowsPerPageOptions={[5, 10, 20]}
          itemLabel="requests"
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value)
            setPage(1)
          }}
        />
      )}

      {selected && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-slate-900/45"
            onClick={() => setSelected(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quantity-approval-detail-title"
            className="relative z-10 flex max-h-[min(720px,90vh)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div>
                <h2 id="quantity-approval-detail-title" className="text-lg font-bold text-gray-900">
                  Quantity request
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {formatDate(selected.created_at)} · {selected.quantity} items
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${statusClass(selected.status)}`}>{statusLabel(selected.status)}</span>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setSelected(null)}
                  className="rounded-md p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              {detailLoading && <p className="text-sm text-gray-500">Loading request...</p>}
              {detailError && <p className="mb-3 text-sm text-red-600">{detailError}</p>}

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-gray-500">Status</dt>
                  <dd className="mt-1 font-medium text-gray-900">{statusLabel(selected.status)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Quantity</dt>
                  <dd className="mt-1 font-medium text-gray-900">{selected.quantity}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Merchandise total</dt>
                  <dd className="mt-1 font-medium text-gray-900">{formatMoney(selected.merchandise_total)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Checkout</dt>
                  <dd className="mt-1 truncate font-mono text-xs text-gray-900" title={selected.checkout_id}>{selected.checkout_id}</dd>
                </div>
              </dl>

              <div className="mt-4 divide-y divide-gray-100 border-y border-gray-100">
                {selected.items.map((item, index) => (
                  <div key={`${item.product_id}-${item.sku ?? index}`} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex min-w-0 gap-3">
                      <OrderProductImage imageUrl={item.image_url} alt={item.title} />
                      <div className="min-w-0 text-sm">
                        <p className="truncate text-gray-800">{item.title}</p>
                        <p className="mt-1 text-xs text-gray-500">SKU: {item.sku || '—'} · x{item.qty}</p>
                        <p className="mt-1 text-xs text-gray-500">{formatMoney(item.price)} each</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-emerald-600">{formatMoney(item.line_total)}</span>
                  </div>
                ))}
              </div>

              {selected.rejection_reason && (
                <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  Rejection reason: {selected.rejection_reason}
                </p>
              )}
              {selected.status === 'pending' && (
                <p className="mt-4 text-sm text-gray-600">Waiting for a shop admin. You can still place a separate order of 50 items or fewer.</p>
              )}
              {selected.status === 'rejected' && (
                <p className="mt-4 text-sm text-gray-600">This request was rejected and cannot be placed.</p>
              )}
              {selected.status === 'approved' && (
                <p className="mt-4 text-sm text-gray-600">
                  {selected.order_placed
                    ? 'Approved. This order has been placed. You can see it in My Purchase.'
                    : 'A shop admin approved this request. You can continue checkout.'}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {selected.status === 'approved' && !selected.order_placed && (
                <button
                  type="button"
                  onClick={continueCheckout}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Continue checkout
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

export default QuantityApprovalsPage
