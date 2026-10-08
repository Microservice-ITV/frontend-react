import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, RefreshCw, RotateCw } from 'lucide-react'
import {
  getMissingInvoices,
  replayAllMissingInvoices,
  replayMissingInvoice,
  type MissingInvoiceOrder,
  type MissingInvoiceReplaySummary,
} from '@/lib/api/invoiceClient'

const formatMoney = (amount: string, currency: string | null) =>
  `${currency ?? 'MMK'} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const AdminMissingInvoicesPage = () => {
  const [orders, setOrders] = useState<MissingInvoiceOrder[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [cursors, setCursors] = useState<Array<string | null>>([null])
  const [pageIndex, setPageIndex] = useState(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeReplay, setActiveReplay] = useState<string | null>(null)
  const [replayAllCursor, setReplayAllCursor] = useState<string | null>(null)
  const [isReplayingAll, setIsReplayingAll] = useState(false)
  const [summary, setSummary] = useState<MissingInvoiceReplaySummary | null>(null)

  const loadOrders = useCallback(async (requestedCursor: string | null) => {
    setIsLoading(true)
    setError(null)
    try {
      const page = await getMissingInvoices({ limit: 25, cursor: requestedCursor })
      setOrders(page.data)
      setNextCursor(page.nextCursor)
      setCursor(requestedCursor)
    } catch (requestError: unknown) {
      const message = (
        requestError as { response?: { data?: { message?: string } } }
      ).response?.data?.message ?? 'Unable to load missing invoices.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOrders(null)
  }, [loadOrders])

  const goToNextPage = () => {
    if (!nextCursor) return
    const nextIndex = pageIndex + 1
    setCursors((current) => [...current.slice(0, nextIndex), nextCursor])
    setPageIndex(nextIndex)
    void loadOrders(nextCursor)
  }

  const goToPreviousPage = () => {
    if (pageIndex === 0) return
    const previousIndex = pageIndex - 1
    const previousCursor = cursors[previousIndex] ?? null
    setPageIndex(previousIndex)
    void loadOrders(previousCursor)
  }

  const handleReplay = async (orderId: string, shopId: string) => {
    const key = `${orderId}:${shopId}`
    setActiveReplay(key)
    setSummary(null)
    try {
      const result = await replayMissingInvoice(orderId, shopId)
      if (result.status === 'FAILED') {
        setError(`${orderId} / ${shopId}: ${result.reason ?? 'Invoice replay failed.'}`)
      }
      await loadOrders(cursor)
    } catch (requestError: unknown) {
      const message = (
        requestError as { response?: { data?: { message?: string } } }
      ).response?.data?.message ?? 'Unable to replay this shop invoice.'
      setError(message)
    } finally {
      setActiveReplay(null)
    }
  }

  const handleReplayAll = async (continueFromCursor = false) => {
    setIsReplayingAll(true)
    setError(null)
    try {
      const result = await replayAllMissingInvoices(continueFromCursor ? replayAllCursor : null)
      setSummary(result)
      setReplayAllCursor(result.hasMore ? result.nextCursor : null)
      await loadOrders(cursor)
    } catch (requestError: unknown) {
      const message = (
        requestError as { response?: { data?: { message?: string } } }
      ).response?.data?.message ?? 'Unable to replay missing invoices.'
      setError(message)
    } finally {
      setIsReplayingAll(false)
    }
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-400">
        <Link to="/super-admin/overview" className="transition hover:text-slate-600">Dashboard</Link>
        <span className="mx-1.5">/</span>
        <Link to="/super-admin/invoices" className="transition hover:text-slate-600">Invoices</Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600">Missing invoices</span>
      </nav>

      <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/super-admin/invoices" className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-700">
            <ArrowLeft size={14} /> Back to invoices
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">Missing invoices</h1>
          <p className="mt-1 text-sm text-slate-500">Eligible paid and COD orders with one or more shop invoices still missing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadOrders(cursor)}
            disabled={isLoading || isReplayingAll}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => void handleReplayAll(Boolean(replayAllCursor))}
            disabled={isReplayingAll || isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
          >
            {isReplayingAll ? <Loader2 size={15} className="animate-spin" /> : <RotateCw size={15} />}
            {isReplayingAll ? 'Replaying…' : replayAllCursor ? 'Continue replay' : 'Replay all missing'}
          </button>
        </div>
      </header>

      {summary && (
        <section role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-emerald-900">
            <CheckCircle2 size={17} /> Replay batch complete
          </div>
          <p className="mt-2 text-sm text-emerald-800">
            {summary.total} checked · {summary.created} created · {summary.skipped_existing} already existed · {summary.skipped_ineligible} ineligible · {summary.failed} failed
            {summary.hasMore ? ' · More orders remain; continue to process the next batch.' : ''}
          </p>
          {summary.results.filter((result) => result.status === 'FAILED').map((result) => (
            <p key={`${result.orderId}:${result.shopId}`} className="mt-1 break-all text-xs text-rose-800">
              {result.orderId}{result.shopId ? ` / ${result.shopId}` : ''}: {result.reason}
            </p>
          ))}
        </section>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Orders requiring shop invoices</h2>
            <p className="mt-0.5 text-xs text-slate-500">An order appears here when at least one expected shop invoice is absent.</p>
          </div>
          {!isLoading && <span className="text-xs text-slate-500">{orders.length} orders on this page</span>}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-14 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin" /> Loading missing invoices…
          </div>
        ) : orders.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <CheckCircle2 size={28} className="mx-auto text-emerald-600" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              {nextCursor ? 'No missing invoices in this batch' : 'No missing invoices'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {nextCursor
                ? 'Continue to check the next batch of eligible orders.'
                : 'Every discovered eligible order currently has an invoice for each shop.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <MissingOrderCard
                key={order.orderId}
                order={order}
                activeReplay={activeReplay}
                onReplay={handleReplay}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-5">
          <span className="text-xs text-slate-500">Page {pageIndex + 1}</span>
          <div className="flex gap-2">
            <button type="button" onClick={goToPreviousPage} disabled={pageIndex === 0 || isLoading} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">Previous</button>
            <button type="button" onClick={goToNextPage} disabled={!nextCursor || isLoading} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      </section>
    </div>
  )
}

const MissingOrderCard = ({
  order,
  activeReplay,
  onReplay,
}: {
  order: MissingInvoiceOrder
  activeReplay: string | null
  onReplay: (orderId: string, shopId: string) => void
}) => (
  <article className="p-4 sm:p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Order</p>
        <p className="mt-0.5 break-all font-mono text-sm font-semibold text-slate-900">{order.orderId}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>Customer: <strong className="font-medium text-slate-700">{order.customerName?.trim() || order.customerId}</strong></span>
          <span>Placed: {new Date(order.createdAt).toLocaleDateString()}</span>
          <span>Payment: <strong className="font-medium text-slate-700">{order.paymentMethod || order.paymentStatus}</strong></span>
        </div>
      </div>
      <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
        {order.paymentStatus}
      </span>
    </div>

    <div className="mt-4 space-y-2">
      {order.missingShops.map((shop) => {
        const replayKey = `${order.orderId}:${shop.shopId}`
        const isReplaying = activeReplay === replayKey
        return (
          <div key={shop.shopId} className="grid gap-3 rounded-lg border border-amber-100 bg-amber-50/50 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">{shop.shopName?.trim() || `Shop ID: ${shop.shopId}`}</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Invoice missing</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Expected status: {shop.expectedInvoiceStatus} · {formatMoney(shop.grandTotal, order.currency)}</p>
              <p className="mt-0.5 text-xs text-amber-800">{shop.reason === 'NO_INVOICE_FOR_SHOP' ? 'No invoice is recorded for this shop on the order.' : shop.reason}</p>
            </div>
            <button
              type="button"
              onClick={() => onReplay(order.orderId, shop.shopId)}
              disabled={isReplaying || activeReplay !== null}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-50 disabled:opacity-50"
            >
              {isReplaying ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
              {isReplaying ? 'Replaying…' : 'Replay invoice'}
            </button>
          </div>
        )
      })}
    </div>
  </article>
)

export default AdminMissingInvoicesPage
