import { useEffect, useState } from 'react'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { AlertCircle, Download, Eye, FileText, RefreshCw, Search, SendHorizontal, ShieldCheck } from 'lucide-react'
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

const toDisplayInvoice = (invoice: InvoiceDocument): Invoice => ({
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
  due: '-',
  amount: `${invoice.currency} ${invoice.grandTotal}`,
  currency: invoice.currency,
  pdfUrl: invoice.pdfUrl,
})

const SellerInvoicesPage = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | InvoiceStatus>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [invoices, setInvoices] = useState<Invoice[]>([])
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

  const openInvoicePreview = (invoice: Invoice) => {
    openModal({
      title: `Invoice ${invoice.id}`,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4">
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

  return (
    <section className="space-y-3 pb-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 border-t-2 border-t-emerald-500 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => void loadInvoices()}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              title="Refresh invoices"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <div className="relative w-full sm:w-60">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveFilter(tab.key)
                    setPage(1)
                  }}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                    activeFilter === tab.key
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading && (
          <div aria-live="polite" className="space-y-3 p-5">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-14 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        )}
        {error && (
          <div aria-live="assertive" className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">We couldn&apos;t load your invoices</p>
              <p className="mt-1 text-xs text-slate-500">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadInvoices()}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
            >
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        )}

        {!isLoading && !error && <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="bg-slate-50/80">
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Invoice</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Order</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Issued</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Due</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Amount</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <FileText size={21} />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-900">No matching invoices</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Try another search term or switch to a different status.</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-slate-100 transition hover:bg-emerald-50/30 last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <FileText size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{invoice.id}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">Invoice document</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <p className="text-xs font-semibold text-slate-800">{invoice.customer.name}</p>
                    <p className="mt-0.5 max-w-[145px] truncate text-[10px] text-slate-400">{invoice.customer.email}</p>
                  </td>
                  <td className="px-3 py-4 font-mono text-[11px] text-slate-500">{invoice.orderId.slice(0, 13)}...</td>
                  <td className="px-3 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLES[invoice.status]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {STATUS_LABELS[invoice.status]}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-xs text-slate-600">{invoice.issued}</td>
                  <td className="px-3 py-4 text-xs text-slate-400">{invoice.due}</td>
                  <td className="px-3 py-4 text-xs font-bold text-slate-900">{invoice.amount}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2 text-slate-500">
                      {invoice.pdfUrl && (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="cursor-pointer rounded p-1 hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Download invoice PDF"
                          title="Download invoice PDF"
                        >
                          <Download size={14} />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => openInvoicePreview(invoice)}
                        className="cursor-pointer rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        aria-label={`View ${invoice.id}`}
                        title="View invoice details"
                      >
                        <Eye size={14} />
                      </button>
                      {['pending', 'rejected'].includes(invoice.status) && (
                        <button
                          type="button"
                          onClick={() => {
                            const document = invoiceDocuments.find((item) => item.invoiceNumber === invoice.id || item.id === invoice.id)
                            if (document) setVerificationInvoice(document)
                          }}
                          className="cursor-pointer rounded p-1 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800"
                          aria-label={`Review payment for ${invoice.id}`}
                          title="Review payment slip"
                        >
                          <ShieldCheck size={14} />
                        </button>
                      )}
                      {!invoice.pdfUrl && (
                        <span className="cursor-wait rounded p-1 text-slate-300" aria-label="PDF is being generated" title="PDF is being generated">
                          <Download size={14} />
                        </span>
                      )}
                      <button type="button" disabled className="cursor-not-allowed rounded p-1 text-slate-300" aria-label="Send invoice" title="Sending invoices is not available yet">
                        <SendHorizontal size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}

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