import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { AlertCircle, Download, Eye, FileText, RefreshCw, Search, SendHorizontal, ShieldCheck } from 'lucide-react'
import axios from 'axios'
import { downloadInvoicePdf, getShopInvoices, type InvoiceDocument } from '@/lib/api/invoiceClient'
import { useAppSelector } from '@/app/hooks'
import { selectAuthUser, selectIsAuthenticated } from '@/features/auth/store/authSelectors'
import type { Invoice, InvoiceStatus } from '../types/invoiceTypes'
import InvoiceVerificationModal from '../components/InvoiceVerificationModal'
import InvoiceStatusBadge from '@/features/invoices/components/InvoiceStatusBadge'
import InvoiceEmptyState from '@/features/invoices/components/InvoiceEmptyState'
import InvoiceTableSkeleton from '@/features/invoices/components/InvoiceTableSkeleton'

/** Maps the seller display status to the shared invoice status badge tone. Visual only. */
const SELLER_STATUS_TO_INVOICE_STATUS: Record<InvoiceStatus, string> = {
  paid: 'PAID',
  pending: 'UNPAID',
  overdue: 'UNPAID',
  rejected: 'REJECTED',
  void: 'VOID',
  refunded: 'REFUNDED',
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
  orderReference: invoice.orderReference || 'Unavailable',
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
  const [verificationInvoice, setVerificationInvoice] = useState<InvoiceDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null)
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

  const downloadPdf = async (invoice: InvoiceDocument) => {
    if (downloadingInvoiceId) return;
    setDownloadingInvoiceId(invoice.id);
    setError(null);
    try {
      const url = URL.createObjectURL(await downloadInvoicePdf(invoice.id));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Unable to download this invoice PDF.');
    } finally {
      setDownloadingInvoiceId(null);
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
      (invoice.document.orderReference || '').toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / rowsPerPage))
  const paginatedInvoices = filteredInvoices.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const statusTabs = FILTER_TABS

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <nav className="text-xs text-slate-400">
            <Link to="/seller/overview" className="transition hover:text-slate-600">Dashboard</Link>
            <span className="mx-1.5">/</span>
            <span className="text-slate-600">Invoices</span>
          </nav>
          <h1 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">Track billing documents and payment verification for your shop orders.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadInvoices()}
          disabled={isRefreshing}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">All invoices</p>
            <p className="mt-0.5 text-xs text-slate-500">{filteredInvoices.length} of {invoices.length} shown</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-56">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
            <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100/70 p-1">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveFilter(tab.key)
                    setPage(1)
                  }}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                    activeFilter === tab.key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <InvoiceTableSkeleton rows={5} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Invoice</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Shop</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Customer</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Order reference</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Payment method</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Amount</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</th>
                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <InvoiceEmptyState
                          compact
                          icon={<FileText size={20} />}
                          title="No invoices found"
                          description="Invoices for your shop orders will appear here."
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="font-mono text-[13px] font-semibold text-slate-900">{invoice.id}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">Issued {invoice.issued}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-600">
                          {invoice.document.shopName || 'N/A'}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs font-medium text-slate-800">{invoice.customer.name}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">{invoice.customer.email}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs font-medium text-slate-600">
                          {invoice.orderReference}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <p className="text-xs font-medium text-slate-800">
                            {formatPaymentMethod(invoice.document.paymentMethod)}
                          </p>
                          {invoice.document.paymentMethod && (
                            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">{invoice.document.paymentMethod}</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-semibold tabular-nums text-slate-900">
                          {invoice.amount}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <InvoiceStatusBadge
                            status={SELLER_STATUS_TO_INVOICE_STATUS[invoice.status] ?? 'UNPAID'}
                            label={STATUS_LABELS[invoice.status]}
                            size="sm"
                          />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <Link
                              to={`/seller/invoices/${encodeURIComponent(invoice.document.invoiceNumber || invoice.document.id)}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              <Eye size={13} /> Details
                            </Link>
                            {invoice.pdfUrl && (
                              <button
                                type="button"
                                onClick={() => void downloadPdf(invoice.document)}
                                disabled={downloadingInvoiceId !== null}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
                                aria-label="Download invoice PDF"
                                title="Download invoice PDF"
                              >
                                {downloadingInvoiceId === invoice.document.id ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
                              </button>
                            )}
                            {['pending', 'rejected'].includes(invoice.status) && (
                              <button
                                type="button"
                                onClick={() => setVerificationInvoice(invoice.document)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-900 hover:text-white"
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
                                className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-slate-100 text-slate-300"
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