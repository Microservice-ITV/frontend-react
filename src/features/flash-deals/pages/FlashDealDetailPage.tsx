import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Flame, Package } from 'lucide-react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { fetchFlashDealById } from '../store/flashDealThunks'
import { selectFlashDeals, selectFlashDealsLoading, selectFlashDealsError } from '../store/flashDealSelectors'
import { getFlashDealChipStyle } from '../utils/flashDealStatus'

const FlashDealDetailPage = () => {
  const { flashDealId } = useParams<{ flashDealId: string }>()
  const dispatch = useAppDispatch()
  const deals = useAppSelector(selectFlashDeals)
  const loading = useAppSelector(selectFlashDealsLoading)
  const error = useAppSelector(selectFlashDealsError)

  const deal = deals.find((item) => item.id === flashDealId)

  useEffect(() => {
    if (flashDealId && !deal) {
      dispatch(fetchFlashDealById(flashDealId))
    }
  }, [dispatch, flashDealId, deal])

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  if (loading && !deal) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-500">Loading flash deal...</p>
      </div>
    )
  }

  if (error && !deal) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Flash deal not found.
      </div>
    )
  }

  const totalStock = deal.items.reduce((sum, item) => sum + item.allocatedQuantity, 0)
  const totalSold = deal.items.reduce((sum, item) => sum + item.soldQuantity, 0)
  const overallPercent = totalStock > 0 ? Math.round((totalSold / totalStock) * 100) : 0

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to="/super-admin/promotion-engine" className="hover:text-slate-700">
          Promotion Engine
        </Link>
        <span className="mx-1">/</span>
        <Link to="/super-admin/promotion-engine/flash-deals" className="hover:text-slate-700">
          Flash Deals
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">{deal.name}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Flame size={18} className="fill-emerald-600 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900">{deal.name}</h1>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${getFlashDealChipStyle(deal.status)}`}>
              {deal.status}
            </span>
          </div>
          {deal.description && (
            <p className="mt-1 text-sm text-slate-600">{deal.description}</p>
          )}
        </div>
        <Link
          to={`/super-admin/promotion-engine/flash-deals/${deal.id}/edit`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
        >
          Edit Flash Deal
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Slot</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{deal.slotTime ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Period</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{formatDate(deal.startAt)}</p>
          <p className="text-xs text-slate-500">to {formatDate(deal.endAt)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Total Stock</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{totalStock}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Sold</p>
          <p className="mt-1 text-sm font-bold text-emerald-700">{totalSold}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-emerald-600" style={{ width: `${overallPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Package size={16} className="text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Products ({deal.items.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-600">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Deal Price</th>
                <th className="px-4 py-3">Allocated</th>
                <th className="px-4 py-3">Sold</th>
                <th className="px-4 py-3">Remaining</th>
                <th className="px-4 py-3">Purchase Limit</th>
                <th className="px-4 py-3">Stock Status</th>
              </tr>
            </thead>
            <tbody>
              {deal.items.map((item) => {
                const remaining = Math.max(0, item.allocatedQuantity - item.soldQuantity)
                const soldPercent =
                  item.allocatedQuantity > 0
                    ? Math.min(100, Math.round((item.soldQuantity / item.allocatedQuantity) * 100))
                    : 100
                const stockText =
                  item.allocatedQuantity > 0 && item.soldQuantity >= item.allocatedQuantity
                    ? 'SOLD OUT'
                    : soldPercent >= 80
                      ? 'SELLING FAST'
                      : remaining <= 5
                        ? `ONLY ${remaining} LEFT`
                        : `${soldPercent}% SOLD`
                return (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded bg-slate-100">
                          {item.product.images?.[0] ? (
                            <img
                              src={productServiceAssetUrl(item.product.images[0])}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">No img</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.product.name}</p>
                          <p className="text-xs text-slate-500">{item.product.categoryName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      ${Number(item.originalPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-700">
                      ${Number(item.dealPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.allocatedQuantity}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.soldQuantity}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{remaining}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.purchaseLimit}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full bg-emerald-600" style={{ width: `${soldPercent}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-600">{stockText}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Link
        to="/super-admin/promotion-engine/flash-deals"
        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline"
      >
        <ArrowLeft size={16} />
        Back to Flash Deals
      </Link>
    </div>
  )
}

export default FlashDealDetailPage