import { useEffect, useState, type ChangeEvent, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { AlertCircle, CheckCircle2, Clock3, Download, Eye, FileText, Loader2, Receipt, RefreshCw, UploadCloud, X, Image as ImageIcon } from 'lucide-react'
import { downloadInvoicePdf, getMyInvoices, type InvoiceDocument, type InvoiceStatus, uploadPaymentSlip } from '@/lib/api/invoiceClient'
import InvoiceStatCard from '@/features/invoices/components/InvoiceStatCard'
import InvoiceStatusBadge from '@/features/invoices/components/InvoiceStatusBadge'
import InvoiceEmptyState from '@/features/invoices/components/InvoiceEmptyState'
import InvoiceTableSkeleton from '@/features/invoices/components/InvoiceTableSkeleton'
import {
  formatInvoiceStatusLabel,
  formatPaymentMethodLabel,
  isCodPayment,
} from '@/features/invoices/lib/invoiceFormat'
import { useAppSelector } from '@/app/hooks'
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors'

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  UNPAID: 'Unpaid',
  PENDING_VERIFICATION: 'Pending Verification',
  PAID: 'Paid',
  REJECTED: 'Rejected',
  VOID: 'Void',
  REFUNDED: 'Refunded',
}

const DEFAULT_ROWS_PER_PAGE = 10

const formatMoney = (value: string | number, currency: string): string => {
  const safeCurrency = currency || 'MMK'
  const numericValue = Number(value || 0)

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue)
  } catch {
    return `${safeCurrency} ${numericValue.toFixed(2)}`
  }
}

const formatAmount = (value: string | number): string => {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00'
}

const formatDate = (value: string | Date): string => {
  const date = typeof value === 'string' ? new Date(value) : value
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const canSubmitPaymentSlip = (invoice: InvoiceDocument): boolean =>
  (invoice.status === 'UNPAID' || invoice.status === 'REJECTED') &&
  !isCodPayment(invoice.paymentMethod)

const getInvoiceStatusLabel = (invoice: InvoiceDocument): string =>
  isCodPayment(invoice.paymentMethod)
    ? formatInvoiceStatusLabel(invoice.status, invoice.paymentMethod)
    : STATUS_LABELS[invoice.status]

const CustomerInvoicesPage = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const [invoices, setInvoices] = useState<InvoiceDocument[]>([])
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDocument | null>(null)
  
  // File state & preview
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmittingSlip, setIsSubmittingSlip] = useState(false)
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null)

  const loadInvoices = async () => {
    if (!isAuthenticated) {
      setInvoices([])
      setPage(1)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getMyInvoices()
      setInvoices(data)
      setPage(1)
    } catch (requestError: unknown) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to load your invoices.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadInvoices()
  }, [isAuthenticated])

  const handleDownloadPdf = (invoice: InvoiceDocument) => {
    if (downloadingInvoiceId) return
    setDownloadingInvoiceId(invoice.id)
    setError(null)
    void downloadInvoicePdf(invoice.id, { asCustomer: true })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = `${invoice.invoiceNumber || 'invoice'}.pdf`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
      })
      .catch((downloadError: unknown) => {
        setError(downloadError instanceof Error ? downloadError.message : 'Unable to download this invoice PDF.')
      })
      .finally(() => setDownloadingInvoiceId(null))
  }

  const resetSelection = () => {
    setSelectedInvoice(null)
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleFileChange = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, JPEG).')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileChange(file)
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (err) => reject(err)
    })
  }

  const submitPaymentSlip = async () => {
    if (!selectedInvoice || !selectedFile || isCodPayment(selectedInvoice.paymentMethod)) return

    setIsSubmittingSlip(true)

    try {
      // Pass FormData if uploadPaymentSlip takes FormData, or Base64 string if it accepts a string URI
      const payload = await convertFileToBase64(selectedFile)
      await uploadPaymentSlip(selectedInvoice.id, payload)

      resetSelection()
      await loadInvoices()
    } catch (requestError: unknown) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to submit payment slip.'
      setError(message)
    } finally {
      setIsSubmittingSlip(false)
    }
  }

  const paidInvoices = invoices.filter((invoice) => invoice.status === 'PAID')
  const pendingInvoices = invoices.filter((invoice) => invoice.status === 'PENDING_VERIFICATION' || invoice.status === 'UNPAID')
  const totalBilled = invoices.reduce((sum, invoice) => sum + Number(invoice.grandTotal || 0), 0)
  const currency = invoices[0]?.currency || 'MMK'
  const totalPages = Math.max(1, Math.ceil(invoices.length / rowsPerPage))
  const pageInvoices = invoices.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  return (
    <section className="bg-slate-50/80 p-3 sm:p-4 md:p-6">
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="mb-6 flex items-start gap-3 sm:mb-7">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <Receipt size={19} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">My Invoices</h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">View and manage your order invoices and payment documents.</p>
        </div>
      </div>

      <div className="space-y-5 sm:space-y-6">
        {!isLoading && isAuthenticated && !error && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InvoiceStatCard
              label="Total billed"
              value={formatMoney(totalBilled, currency)}
              valueClassName="whitespace-nowrap text-[clamp(0.75rem,1.2vw,1.25rem)]"
              hint={`Across ${invoices.length} invoice${invoices.length === 1 ? '' : 's'}`}
              icon={<FileText size={14} />}
              tone="emerald"
            />
            <InvoiceStatCard
              label="Paid"
              value={String(paidInvoices.length)}
              hint="Payment completed"
              icon={<CheckCircle2 size={14} />}
              tone="emerald"
            />
            <InvoiceStatCard
              label="Needs attention"
              value={String(pendingInvoices.length)}
              hint="Unpaid or under review"
              icon={<Clock3 size={14} />}
              tone="amber"
            />
            <InvoiceStatCard
              label="Invoice count"
              value={String(invoices.length)}
              hint="All billing documents"
              icon={<Receipt size={14} />}
              tone="slate"
            />
          </div>
        )}

      {selectedInvoice && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">Submit payment slip</p>
              <p className="mt-1 text-sm text-slate-700">Invoice {selectedInvoice.invoiceNumber}</p>
            </div>
            <button
              type="button"
              onClick={resetSelection}
              className="text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          <div className="mt-4 flex flex-col items-center gap-4 md:flex-row">
            {!previewUrl ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition ${
                  isDragging ? 'border-amber-500 bg-amber-100/60' : 'border-amber-300 bg-white'
                }`}
              >
                <UploadCloud className="h-8 w-8 text-amber-500" />
                <p className="mt-2 text-xs font-medium text-gray-700">
                  <label htmlFor="file-upload" className="cursor-pointer font-semibold text-amber-700 hover:underline">
                    Click to upload
                  </label>{' '}
                  or drag and drop
                </p>
                <p className="text-[10px] text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileChange(e.target.files?.[0])}
                />
              </div>
            ) : (
              <div className="relative flex items-center gap-3 rounded-sm border border-amber-300 bg-white p-2">
                <img src={previewUrl} alt="Slip preview" className="h-16 w-16 object-cover rounded-sm border" />
                <div className="flex max-w-50 flex-col truncate text-xs text-gray-700">
                  <span className="font-semibold truncate">{selectedFile?.name}</span>
                  <span className="text-[10px] text-gray-500">
                    {selectedFile ? (selectedFile.size / 1024).toFixed(1) + ' KB' : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  className="ml-auto rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => void submitPaymentSlip()}
              disabled={isSubmittingSlip || !selectedFile}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-amber-300 md:w-auto"
            >
              {isSubmittingSlip ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
              {isSubmittingSlip ? 'Submitting...' : 'Submit Slip'}
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div aria-live="polite" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
            <p className="text-sm font-semibold text-slate-900">Invoice history</p>
            <p className="mt-1 text-xs text-slate-500">Loading your billing documents…</p>
          </div>
          <InvoiceTableSkeleton rows={4} />
        </div>
      )}

      {!isLoading && error && (
        <div aria-live="assertive" className="flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-white px-5 py-12 text-center shadow-sm sm:px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">We couldn&apos;t load your invoices</p>
            <p className="mt-1 text-xs text-slate-500">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadInvoices()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            <RefreshCw size={13} /> Try again
          </button>
        </div>
      )}

      {!isLoading && !error && !isAuthenticated && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
          <InvoiceEmptyState
            icon={<FileText size={20} />}
            title="Please log in to view your invoices"
            description="Your billing documents will appear here once you sign in."
          />
        </div>
      )}

      {!isLoading && !error && isAuthenticated && (
        <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                <FileText size={16} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Invoice history</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">Your latest billing documents and payment status.</p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
              {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}
            </span>
          </div>
          <div className="space-y-3 bg-slate-50/50 p-3 sm:p-4 2xl:hidden">
            {invoices.length === 0 ? (
              <InvoiceEmptyState
                icon={<Receipt size={20} />}
                title="No invoices yet"
                description="Your invoices will appear here after an order is placed."
                compact
              />
            ) : (
              pageInvoices.map((invoice) => (
                <article key={invoice.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-emerald-200 hover:shadow-sm sm:p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <FileText size={17} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/account/invoices/${encodeURIComponent(invoice.invoiceNumber || invoice.id)}`}
                        title={invoice.invoiceNumber}
                        className="block truncate font-mono text-sm font-semibold tracking-tight text-slate-900 transition hover:text-emerald-700"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </div>
                    <div className="shrink-0">
                      <InvoiceStatusBadge
                        status={invoice.status}
                        label={getInvoiceStatusLabel(invoice)}
                        size="sm"
                      />
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-slate-100 pt-4 text-xs sm:grid-cols-4">
                    <div className="min-w-0">
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Shop</dt>
                      <dd className="mt-1.5 break-words font-medium text-slate-700">{invoice.shopName || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Date</dt>
                      <dd className="mt-1.5 text-slate-600">{formatDate(invoice.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Amount</dt>
                      <dd className="mt-1.5 font-semibold tabular-nums text-slate-900">
                        {formatAmount(invoice.grandTotal)}
                      </dd>
                    </div>
                    {invoice.paymentMethod && (
                      <div className="min-w-0">
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Payment</dt>
                        <dd className="mt-1.5 break-words font-medium text-slate-700">
                          {formatPaymentMethodLabel(invoice.paymentMethod)}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    <Link
                      to={`/account/invoices/${encodeURIComponent(invoice.invoiceNumber || invoice.id)}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                    >
                      <Eye size={14} aria-hidden="true" /> View invoice
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(invoice)}
                      disabled={downloadingInvoiceId !== null}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
                    >
                      {downloadingInvoiceId === invoice.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Download size={14} />}
                      Download
                    </button>
                    {canSubmitPaymentSlip(invoice) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInvoice(invoice)
                          setSelectedFile(null)
                          setPreviewUrl(null)
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:border-emerald-200 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                      >
                        <UploadCloud size={13} /> Submit slip
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
          <div className="hidden 2xl:block">
            <table className="w-full table-fixed text-left">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="w-[23%] px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Invoice #</th>
                  <th className="w-[17%] px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Shop</th>
                  <th className="w-[12%] px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Date</th>
                  <th className="w-[13%] py-3 pl-2 pr-4 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Amount</th>
                  <th className="w-[17%] py-3 pl-4 pr-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Status</th>
                  <th className="w-[18%] px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Actions</th>
                </tr>
              </thead>

              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-4">
                      <InvoiceEmptyState
                        icon={<FileText size={20} />}
                        title="No invoices found"
                        description="Your invoices will appear here once they are created."
                      />
                    </td>
                  </tr>
                ) : (
                  pageInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                      <td className="min-w-0 px-2 py-4">
                        <Link
                          to={`/account/invoices/${encodeURIComponent(invoice.invoiceNumber || invoice.id)}`}
                          title={invoice.invoiceNumber}
                          className="block truncate whitespace-nowrap font-mono text-xs font-semibold tracking-tight text-slate-900 transition hover:text-emerald-700"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="truncate whitespace-nowrap px-2 py-4 text-[13px] font-medium text-slate-700" title={invoice.shopName || 'N/A'}>{invoice.shopName || 'N/A'}</td>
                      <td className="min-w-0 px-2 py-4 text-[13px] text-slate-600" title={formatDate(invoice.createdAt)}>
                        <span className="block truncate whitespace-nowrap">{formatDate(invoice.createdAt)}</span>
                      </td>
                      <td className="min-w-0 py-4 pl-2 pr-4 text-right text-[13px] font-semibold tabular-nums text-slate-900" title={formatAmount(invoice.grandTotal)}>
                        <span className="block truncate whitespace-nowrap">{formatAmount(invoice.grandTotal)}</span>
                      </td>
                      <td
                        className="min-w-0 py-4 pl-4 pr-2"
                        title={[
                          getInvoiceStatusLabel(invoice),
                          invoice.paymentMethod ? formatPaymentMethodLabel(invoice.paymentMethod) : null,
                        ].filter(Boolean).join(' · ')}
                      >
                        <InvoiceStatusBadge
                          status={invoice.status}
                          label={getInvoiceStatusLabel(invoice)}
                          size="sm"
                          className="max-w-full overflow-hidden whitespace-nowrap"
                        />
                        {invoice.paymentMethod && (
                          <p className="mt-1.5 truncate whitespace-nowrap text-[11px] leading-snug text-slate-500">
                            {formatPaymentMethodLabel(invoice.paymentMethod)}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <Link
                            to={`/account/invoices/${encodeURIComponent(invoice.invoiceNumber || invoice.id)}`}
                            title="View invoice details"
                            aria-label={`View details for ${invoice.invoiceNumber}`}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
                          >
                            <Eye size={14} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(invoice)}
                            disabled={downloadingInvoiceId !== null}
                            title="Download invoice PDF"
                            aria-label={`Download ${invoice.invoiceNumber} PDF`}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300"
                          >
                            {downloadingInvoiceId === invoice.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          </button>

                          {canSubmitPaymentSlip(invoice) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoice(invoice)
                                setSelectedFile(null)
                                setPreviewUrl(null)
                              }}
                              title="Submit payment slip"
                              aria-label={`Submit slip for ${invoice.invoiceNumber}`}
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-800 transition hover:border-emerald-200 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
                            >
                              <UploadCloud size={12} />
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
            totalItems={invoices.length}
            itemLabel="invoices"
            onPageChange={setPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value)
              setPage(1)
            }}
          />
        </div>
      )}
      </div>
    </section>
  )
}

export default CustomerInvoicesPage