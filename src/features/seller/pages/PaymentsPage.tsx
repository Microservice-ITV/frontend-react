import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, RefreshCw } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { adminShopApi } from '@/features/admin/api/adminShopApi'
import {
  fetchOrdersAcrossOwnedShops,
  sellerOrderApi,
  type SellerOrder,
  type PaymentRecord,
} from '../api/sellerOrderApi'

type PaymentsPageProps = { admin?: boolean }

const money = (value: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value || 0)

const deliveryStatus = (order: SellerOrder) =>
  order.status?.toUpperCase() === 'DELIVERED' ||
  order.fulfillment?.deliveries?.some((delivery) => delivery.status?.toUpperCase() === 'DELIVERED')

export default function PaymentsPage({ admin = false }: PaymentsPageProps) {
  const user = useAppSelector((state) => state.auth.user)
  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [payments, setPayments] = useState<Record<string, PaymentRecord>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [collecting, setCollecting] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      if (admin) {
        const response = await adminShopApi.listShops({ page: 1, limit: 100 })
        const remainingPages = Array.from(
          { length: Math.max(0, response.data.pagination.totalPages - 1) },
          (_, index) => adminShopApi.listShops({ page: index + 2, limit: 100 }),
        )
        const additionalResponses = await Promise.all(remainingPages)
        const shops = [
          ...response.data.data,
          ...additionalResponses.flatMap((result) => result.data.data),
        ]
        const results = await Promise.all(
          shops.map((shop) => sellerOrderApi.shopOrders(shop.id).catch(() => [])),
        )
        const unique = new Map<string, SellerOrder>()
        results.flat().forEach((order) => unique.set(order.orderId, order))
        const records = [...unique.values()]
        setOrders(records)
        const paymentRows = await sellerOrderApi.paymentRecords(records.map((order) => order.orderId))
        setPayments(Object.fromEntries(paymentRows.map((payment) => [payment.orderId, payment])))
      } else {
        const records = await fetchOrdersAcrossOwnedShops(user?.id, user?.active_shop_id)
        setOrders(records)
        const paymentRows = await sellerOrderApi.paymentRecords(records.map((order) => order.orderId))
        setPayments(Object.fromEntries(paymentRows.map((payment) => [payment.orderId, payment])))
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load payment records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [admin, user?.id, user?.active_shop_id])

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
    [orders],
  )

  const collect = async (order: SellerOrder) => {
    setCollecting(order.orderId)
    setError('')
    try {
      await sellerOrderApi.collectPayment(order.orderId)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to collect COD payment.')
    } finally {
      setCollecting(null)
    }
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500"><Link to={admin ? '/super-admin/overview' : '/seller/overview'}>Dashboard</Link><span className="mx-1">/</span>Payments</nav>
      <div className="flex items-start justify-between gap-4">
        <div><h1 className="text-xl font-bold text-slate-900">Payments</h1><p className="mt-1 text-sm text-slate-600">{admin ? 'Payment records across all shops.' : 'Payment records for your shop orders.'}</p></div>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"><RefreshCw size={16} /> Refresh</button>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[850px]"><thead><tr className="border-b bg-slate-50 text-left text-xs text-slate-600"><th className="px-4 py-3">Order</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Delivery</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Loading payments…</td></tr> : sortedOrders.map((order) => { const payment = payments[order.orderId]; const method = payment?.paymentMethod || order.payment.method || ''; const status = payment?.status || order.payment.status; const isCod = method.toLowerCase() === 'cod'; const canCollect = isCod && deliveryStatus(order) && status.toUpperCase() !== 'COLLECTED'; return <tr key={order.orderId} className="border-b last:border-0"><td className="px-4 py-3 text-sm font-medium text-slate-900">{order.orderId}</td><td className="px-4 py-3 text-sm uppercase text-slate-600">{method || '—'}</td><td className="px-4 py-3 text-sm text-slate-700">{money(payment?.amount ?? order.totals.total, payment?.currency ?? order.totals.currency)}</td><td className="px-4 py-3 text-sm text-slate-700">{deliveryStatus(order) ? 'Delivered' : order.status}</td><td className="px-4 py-3 text-sm font-medium text-slate-700">{status || '—'}</td><td className="px-4 py-3">{canCollect ? <button disabled={collecting === order.orderId} onClick={() => void collect(order)} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">{collecting === order.orderId ? 'Collecting…' : 'Collect COD'}</button> : <span className="text-xs text-slate-400">{isCod ? 'Available after delivery' : '—'}</span>}</td></tr> })}</tbody></table></div></div>
    </div>
  )
}
