import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { AlertCircle, Download, Eye, RefreshCw, Search, SendHorizontal, ShieldCheck } from 'lucide-react'
import axios from 'axios'
import { getShopInvoices, type InvoiceDocument } from '@/lib/api/invoiceClient'
import { useAppSelector } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { selectAuthUser, selectIsAuthenticated } from '@/features/auth/store/authSelectors'
import type { Invoice, InvoiceStatus } from '../types/invoiceTypes'
import InvoiceVerificationModal from '../components/InvoiceVerificationModal'

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
  void: 'bg-slate-100 text-slate-700',
  refunded: 'bg-blue-100 text-blue-700',
}

const FILTER_TABS: { key: 'all' | InvoiceStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
]

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  paid: 'Paid',
  pending: 'Pending',
  overdue: 'Overdue',
  rejected: 'Rejected',
  void: 'Void',
  refunded: 'Refunded',
}

const formatMoney = (value: string | number, currency: string): string => {
  const amount = Number(value || 0)
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency || 'USD'} ${amount.toFixed(2)}`
  }
}

const formatDate = (value: string | Date): string => {
  const date = typeof value === 'string' ? new Date(value) : value
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
}

const formatPaymentMethod = (value?: string | null): string => {
  const method = (value ?? '').trim()
  if (!method) return '—'

  const normalized = method.toLowerCase()

  if (normalized === 'prepaid') return 'Prepaid'
  if (normalized === 'cod' || normalized === 'cash on delivery' || normalized === 'cash_on_delivery') return 'Cash on Delivery'
  if (normalized === 'card') return 'Card'
  if (normalized === 'cash') return 'Cash'

  return method
}

type SellerInvoiceRow = Invoice & { document: InvoiceDocument }

const toDisplayInvoice = (invoice: InvoiceDocument): SellerInvoiceRow => ({
  document: invoice,
  id: invoice.invoiceNumber || invoice.id,
  customer: {
    name: invoice.customerName || 'N/A',
    email: invoice.customerEmail || 'N/A',
  },
  orderId: invoice.orderId,
  status: invoice.status === 'PAID'
    ? 'paid'
    : invoice.status === 'REJECTED'
      ? 'rejected'
      : invoice.status === 'VOID'
        ? 'void'
        : invoice.status === 'REFUNDED'
          ? 'refunded'
          : 'pending',
  issued: new Date(invoice.createdAt).toLocaleDateString(),
  amount: `${invoice.currency} ${invoice.grandTotal}`,
  currency: invoice.currency,
  pdfUrl: invoice.pdfUrl,
})

const SellerInvoicesPage = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | InvoiceStatus>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [invoices, setInvoices] = useState<SellerInvoiceRow[]>([])
  const [invoiceDocuments, setInvoiceDocuments] = useState<InvoiceDocument[]>([])
  const [verificationInvoice, setVerificationInvoice] = useState<InvoiceDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { openModal } = useGlobalModal()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const authUser = useAppSelector(selectAuthUser)
  const accessToken = useAppSelector((state) => state.auth.accessToken)

  const loadInvoices = async () => {
    setIsRefreshing(true)
    setIsLoading((current) => invoices.length === 0 ? true : current)
    setError(null)

    if (!authUser?.active_shop_id) {
      setError('No active shop is assigned to this seller account. Please assign this user to a shop before loading shop invoices.')
      setIsLoading(false)
      setIsRefreshing(false)
      return
    }

    try {
      const data = await getShopInvoices()
      setInvoiceDocuments(data)
      setInvoices(data.map(toDisplayInvoice))
    } catch (requestError: unknown) {
      if (axios.isAxiosError(requestError)) {
        const status = requestError.response?.status
        const message = requestError.response?.data?.message
        setError(message ? `${message} (${status ?? 'request failed'})` : `Unable to load invoices (${status ?? 'request failed'}).`)
      } else {
        setError('Unable to load invoices.')
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setIsLoading(false)
      return
    }

    void loadInvoices()
  }, [accessToken, authUser?.active_shop_id, authUser?.id, isAuthenticated])

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesFilter = activeFilter === 'all' || invoice.status === activeFilter
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      invoice.id.toLowerCase().includes(q) ||
      invoice.customer.name.toLowerCase().includes(q) ||
      invoice.customer.email.toLowerCase().includes(q) ||
      invoice.orderId.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / rowsPerPage))
  const paginatedInvoices = filteredInvoices.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const openInvoicePreview = (invoiceDocument: InvoiceDocument) => {
    const invoice = toDisplayInvoice(invoiceDocument)
    const lineItems = invoiceDocument.lineItems ?? []
    const formatDetailMoney = (value: string) => formatMoney(value, invoiceDocument.currency)

    openModal({
      title: `Invoice ${invoice.id}`,
      content: (
        <div className="max-h-[68vh] space-y-4 overflow-y-auto pr-1">
          <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Total amount</p>
              <p className="mt-1 text-xl font-bold text-slate-950">{invoice.amount}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[invoice.status]}`}>
              {STATUS_LABELS[invoice.status]}
            </span>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order ID</dt>
              <dd className="mt-1 break-all font-mono text-xs text-slate-700">{invoice.orderId}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer</dt>
              <dd className="mt-1 text-xs text-slate-700">{invoice.customer.name}</dd>
              <dd className="mt-1 break-all text-[11px] text-slate-400">{invoice.customer.email}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Issued</dt>
              <dd className="mt-1 text-xs text-slate-700">{invoice.issued}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PDF status</dt>
              <dd className="mt-1 text-xs text-slate-700">{invoice.pdfUrl ? 'Ready to download' : 'Generating PDF...'}</dd>
            </div>
          </dl>

          <section className="rounded-lg border border-slate-200">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Invoice items</h3>
            </div>
            {lineItems.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {lineItems.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{item.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{formatDetailMoney(item.unitPrice)} each</p>
                    </div>
                    <span className="text-slate-500">x{item.quantity}</span>
                    <span className="font-semibold text-slate-800">{formatDetailMoney(item.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-4 text-xs text-slate-500">Item details are not available for this invoice.</p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Amount breakdown</h3>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Subtotal</dt><dd className="font-medium text-slate-800">{formatDetailMoney(invoiceDocument.subtotal)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Delivery fee</dt><dd className="font-medium text-slate-800">{formatDetailMoney(invoiceDocument.deliveryFee)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Tax</dt><dd className="font-medium text-slate-800">{formatDetailMoney(invoiceDocument.taxAmount)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Discount</dt><dd className="font-medium text-emerald-700">-{formatDetailMoney(invoiceDocument.discountAmount)}</dd></div>
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 text-sm"><dt className="font-bold text-slate-900">Grand total</dt><dd className="font-bold text-slate-950">{formatDetailMoney(invoiceDocument.grandTotal)}</dd></div>
            </dl>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment verification</h3>
              <dl className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Method</dt><dd className="font-semibold text-slate-700">{invoiceDocument.paymentMethod || 'Not provided'}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Verified</dt><dd className="text-right text-slate-700">{invoiceDocument.verifiedAt ? formatDate(invoiceDocument.verifiedAt) : 'Not verified'}</dd></div>
              </dl>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reference</h3>
              <dl className="mt-2 space-y-1.5 text-xs">
                <div><dt className="text-slate-500">Payment reference</dt><dd className="mt-1 break-all font-mono text-[11px] text-slate-700">{invoiceDocument.paymentGatewayRef || 'Not provided'}</dd></div>
              </dl>
            </div>
          </section>

          {(invoiceDocument.rejectionReason || invoiceDocument.verificationNote || invoiceDocument.refundAmount) && (
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Additional details</h3>
              {invoiceDocument.rejectionReason && <p className="mt-2 text-xs text-red-700"><strong>Rejection reason:</strong> {invoiceDocument.rejectionReason}</p>}
              {invoiceDocument.verificationNote && <p className="mt-2 text-xs text-slate-700"><strong>Verification note:</strong> {invoiceDocument.verificationNote}</p>}
              {invoiceDocument.refundAmount && <p className="mt-2 text-xs text-blue-700"><strong>Refunded:</strong> {formatDetailMoney(invoiceDocument.refundAmount)}{invoiceDocument.refundReason ? ` - ${invoiceDocument.refundReason}` : ''}</p>}
            </section>
          )}
          {invoice.status === 'paid' && !invoice.pdfUrl && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
              The invoice was created successfully. Its PDF is still being generated. Use the refresh button when you want to check again.
            </p>
          )}
          {invoice.status === 'pending' && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
              Payment verification is still pending. Approve the payment after reviewing the payment slip.
            </p>
          )}
          {invoice.status === 'rejected' && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
              This payment was rejected. Review the rejection reason before taking further action.
            </p>
          )}
        </div>
      ),
      primaryLabel: invoice.pdfUrl ? 'Download PDF' : undefined,
      hidePrimary: !invoice.pdfUrl,
      onPrimary: invoice.pdfUrl ? () => {
        window.open(invoice.pdfUrl as string, '_blank', 'noopener,noreferrer')
      } : undefined,
      secondaryLabel: 'Close',
    })
  }

  const statusTabs = useMemo(
    () => [{ key: 'all', label: 'All' }, ...FILTER_TABS.filter((tab) => tab.key !== 'all').map((tab) => ({ key: tab.key, label: tab.label }))],
    [],
  )

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <nav className="text-xs text-slate-500">
            <Link to="/seller/overview">Dashboard</Link>
            <span className="mx-1">/</span>Invoices
          </nav>
          <h1 className="mt-1 text-xl font-bold text-slate-900">Invoices</h1>
          <p className="mt-0.5 text-sm text-slate-600">Invoices for your shop orders.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadInvoices()}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-900">All Invoices</p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-52">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-emerald-500"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveFilter(tab.key)
                    setPage(1)
                  }}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${
                    activeFilter === tab.key
                      ? 'bg-slate-200 text-slate-900'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div aria-live="polite" className="space-y-3 py-2">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-14 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Invoice</th>
                    <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Order</th>
                    <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Payment Method</th>
                    <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Amount</th>
                    <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Status</th>
                    <th className="px-2 py-2 text-right text-[11px] font-medium text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-2 py-8 text-center text-sm text-slate-500">
                        No invoices found.
                      </td>
                    </tr>
                  ) : (
                    paginatedInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-2 py-3 text-xs font-semibold text-slate-900">
                          {invoice.id}
                        </td>
                        <td className="px-2 py-3 text-xs text-slate-600">
                          <span className="font-mono">{invoice.orderId}</span>
                        </td>
                        <td className="px-2 py-3">
                          <p className="text-xs font-medium capitalize text-slate-900">
                            {formatPaymentMethod(invoice.document.paymentMethod)}
                          </p>
                          {invoice.document.paymentMethod && (
                            <p className="text-[11px] text-slate-500">{invoice.document.paymentMethod}</p>
                          )}
                        </td>
                        <td className="px-2 py-3 text-xs font-semibold text-slate-900">
                          {invoice.amount}
                        </td>
                        <td className="px-2 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[invoice.status] ?? 'bg-slate-100 text-slate-600'}`}
                          >
                            {STATUS_LABELS[invoice.status]}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openInvoicePreview(invoice.document)}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <Eye size={13} /> Details
                            </button>
                            {invoice.pdfUrl && (
                              <a
                                href={invoice.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                aria-label="Download invoice PDF"
                                title="Download invoice PDF"
                              >
                                <Download size={13} />
                              </a>
                            )}
                            {['pending', 'rejected'].includes(invoice.status) && (
                              <button
                                type="button"
                                onClick={() => setVerificationInvoice(invoice.document)}
                                className="inline-flex items-center justify-center rounded-md p-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800"
                                aria-label={`Review payment for ${invoice.id}`}
                                title="Review payment slip"
                              >
                                <ShieldCheck size={14} />
                              </button>
                            )}
                            {!invoice.pdfUrl && (
                              <button
                                type="button"
                                disabled
                                className="cursor-not-allowed rounded-md p-2 text-slate-300"
                                aria-label="PDF is being generated"
                                title="PDF is being generated"
                              >
                                <SendHorizontal size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <DataTablePagination
              page={page}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage}
              totalItems={filteredInvoices.length}
              itemLabel="invoices"
              onPageChange={setPage}
              onRowsPerPageChange={(value) => {
                setRowsPerPage(value)
                setPage(1)
              }}
            />
          </>
        )}
      </div>

      {verificationInvoice && (
        <InvoiceVerificationModal
          invoice={verificationInvoice}
          isOpen
          onClose={() => setVerificationInvoice(null)}
          onSuccess={loadInvoices}
        />
      )}
    </section>
  )
}

export default SellerInvoicesPage