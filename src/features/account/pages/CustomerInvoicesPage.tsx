import { useEffect, useState, type ChangeEvent, type DragEvent } from 'react'
import { AlertCircle, CheckCircle2, Clock3, Download, Eye, FileText, Loader2, RefreshCw, UploadCloud, X, Image as ImageIcon } from 'lucide-react'
import { getMyInvoices, type InvoiceDocument, type InvoiceStatus, uploadPaymentSlip } from '@/lib/api/invoiceClient'
import { useAppSelector } from '@/app/hooks'
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors'

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  UNPAID: 'border border-amber-200 bg-amber-50 text-amber-700',
  PENDING_VERIFICATION: 'border border-sky-200 bg-sky-50 text-sky-700',
  PAID: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border border-red-200 bg-red-50 text-red-700',
  VOID: 'border border-slate-300 bg-slate-100 text-slate-700',
  REFUNDED: 'border border-violet-200 bg-violet-50 text-violet-700',
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  UNPAID: 'Unpaid',
  PENDING_VERIFICATION: 'Pending Verification',
  PAID: 'Paid',
  REJECTED: 'Rejected',
  VOID: 'Void',
  REFUNDED: 'Refunded',
}

const formatMoney = (value: string | number, currency: string): string => {
  const safeCurrency = currency || 'USD'
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

const formatDate = (value: string | Date): string => {
  const date = typeof value === 'string' ? new Date(value) : value
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatAmount = (value: string | number): string => {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00'
}

const CustomerInvoicesPage = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const [invoices, setInvoices] = useState<InvoiceDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDocument | null>(null)
  const [detailsInvoice, setDetailsInvoice] = useState<InvoiceDocument | null>(null)
  
  // File state & preview
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmittingSlip, setIsSubmittingSlip] = useState(false)
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null)

  const loadInvoices = async () => {
    if (!isAuthenticated) {
      setInvoices([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getMyInvoices()
      setInvoices(data)
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

  const handleDownloadPdf = async (invoice: InvoiceDocument) => {
    if (!invoice.pdfUrl || downloadingInvoiceId) return

    setDownloadingInvoiceId(invoice.id)
    setError(null)

    try {
      const response = await fetch(invoice.pdfUrl)
      if (!response.ok) throw new Error('Unable to download this invoice PDF.')

      const blobUrl = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${invoice.invoiceNumber || 'invoice'}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (downloadError: unknown) {
      const message = downloadError instanceof Error ? downloadError.message : 'Unable to download this invoice PDF.'
      setError(message)
    } finally {
      setDownloadingInvoiceId(null)
    }
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
    if (!selectedInvoice || !selectedFile) return

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
  const totalBilled = invoices.reduce((total, invoice) => total + Number(invoice.grandTotal || 0), 0)
  const currency = invoices[0]?.currency || 'USD'

  return (
    <section className="space-y-5 bg-[#f6f8f7] p-4 md:p-6">
      {!isLoading && isAuthenticated && !error && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-500">Total billed</span><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><FileText size={15} /></span></div>
            <p className="mt-3 text-xl font-semibold text-gray-900">{formatMoney(totalBilled, currency)}</p>
            <p className="mt-1 text-[11px] text-gray-400">Across {invoices.length} invoice{invoices.length === 1 ? '' : 's'}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-500">Paid invoices</span><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-700"><CheckCircle2 size={15} /></span></div>
            <p className="mt-3 text-xl font-semibold text-gray-900">{paidInvoices.length}</p>
            <p className="mt-1 text-[11px] text-gray-400">Payment completed</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-500">Needs attention</span><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Clock3 size={15} /></span></div>
            <p className="mt-3 text-xl font-semibold text-gray-900">{pendingInvoices.length}</p>
            <p className="mt-1 text-[11px] text-gray-400">Unpaid or under review</p>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <div className="rounded-sm border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">Submit payment slip</p>
              <p className="mt-1 text-sm text-gray-700">Invoice {selectedInvoice.invoiceNumber}</p>
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
                className={`relative flex w-full flex-col items-center justify-center rounded-sm border-2 border-dashed p-6 text-center transition ${
                  isDragging ? 'border-amber-500 bg-amber-100/50' : 'border-amber-300 bg-white'
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
        <div aria-live="polite" className="space-y-3 rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
          {[1, 2, 3].map((row) => (
            <div key={row} className="h-14 animate-pulse rounded-sm bg-gray-100" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div aria-live="assertive" className="flex flex-col items-center gap-3 rounded-sm border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-500">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">We couldn&apos;t load your invoices</p>
            <p className="mt-1 text-xs text-gray-500">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadInvoices()}
            className="inline-flex items-center gap-2 rounded-sm bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-700"
          >
            <RefreshCw size={13} /> Try again
          </button>
        </div>
      )}

      {!isLoading && !error && !isAuthenticated && (
        <div className="rounded-sm border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-600 shadow-sm">
          Please log in to view your invoices.
        </div>
      )}

      {!isLoading && !error && isAuthenticated && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Invoice history</h2>
              <p className="mt-1 text-xs text-gray-500">Your latest billing documents and payment status.</p>
            </div>
            <span className="text-xs font-medium text-gray-400">{invoices.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-190 w-full text-left">
              <thead className="border-b border-gray-100 bg-gray-50/80">
                <tr>
                  {['Invoice #', 'Order ID', 'Date', 'Amount', 'Status', 'Actions'].map((header) => (
                    <th key={header} className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                          <FileText size={20} />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-gray-800">No invoices found</p>
                        <p className="mt-1 text-xs text-gray-500">Your invoices will appear here once they are created.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-gray-100 transition hover:bg-emerald-50/30">
                      <td className="whitespace-nowrap px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><FileText size={15} /></span><div><p className="text-sm font-semibold text-gray-900">{invoice.invoiceNumber}</p><p className="mt-0.5 text-[10px] text-gray-400">Invoice document</p></div></div></td>
                      <td className="max-w-45 truncate px-5 py-4 font-mono text-xs text-gray-600" title={invoice.orderId}>{invoice.orderId}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">{formatDate(invoice.createdAt)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-900">{formatAmount(invoice.grandTotal)}</td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold uppercase leading-none tracking-[0.08em] ${STATUS_STYLES[invoice.status]}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                          {STATUS_LABELS[invoice.status]}
                        </span>
                      </td>
                      <td className="w-20 whitespace-nowrap px-5 py-4">
                        <div className="inline-flex flex-nowrap items-center gap-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setDetailsInvoice(invoice)}
                            title="View invoice details"
                            aria-label={`View details for ${invoice.invoiceNumber}`}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDownloadPdf(invoice)}
                            disabled={!invoice.pdfUrl || downloadingInvoiceId !== null}
                            title={invoice.pdfUrl ? 'Download invoice PDF' : 'PDF is still being generated'}
                            aria-label={invoice.pdfUrl ? `Download ${invoice.invoiceNumber} PDF` : 'PDF is still being generated'}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-300"
                          >
                            {downloadingInvoiceId === invoice.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                          </button>

                          {(invoice.status === 'UNPAID' || invoice.status === 'REJECTED') && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoice(invoice)
                                setSelectedFile(null)
                                setPreviewUrl(null)
                              }}
                              className="inline-flex items-center gap-1.5 rounded-sm bg-emerald-600 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-emerald-500"
                            >
                              <UploadCloud size={12} />
                              Submit Payment Slip
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
        </div>
      )}

      {detailsInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invoice-details-title"
          onClick={() => setDetailsInvoice(null)}
        >
          <div className="max-h-[min(680px,calc(100vh-2rem))] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">Invoice details</p>
                <h2 id="invoice-details-title" className="mt-1 text-lg font-semibold text-gray-900">{detailsInvoice.invoiceNumber}</h2>
              </div>
              <button type="button" onClick={() => setDetailsInvoice(null)} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700" aria-label="Close invoice details">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <div>
                  <p className="text-xs text-gray-500">Total amount</p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">{formatMoney(detailsInvoice.grandTotal, detailsInvoice.currency)}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] ${STATUS_STYLES[detailsInvoice.status]}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {STATUS_LABELS[detailsInvoice.status]}
                </span>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-100 p-3"><dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Order ID</dt><dd className="mt-1 break-all font-mono text-xs text-gray-700">{detailsInvoice.orderId}</dd></div>
                <div className="rounded-xl border border-gray-100 p-3"><dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Issued</dt><dd className="mt-1 text-sm text-gray-700">{formatDate(detailsInvoice.createdAt)}</dd></div>
                <div className="rounded-xl border border-gray-100 p-3"><dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Payment method</dt><dd className="mt-1 text-sm capitalize text-gray-700">{detailsInvoice.paymentMethod || 'Not provided'}</dd></div>
                <div className="rounded-xl border border-gray-100 p-3"><dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Payment reference</dt><dd className="mt-1 break-all font-mono text-xs text-gray-700">{detailsInvoice.paymentGatewayRef || 'Not provided'}</dd></div>
              </dl>
              <div className="rounded-xl border border-gray-100">
                <div className="border-b border-gray-100 px-4 py-3"><h3 className="text-xs font-semibold text-gray-800">Invoice items</h3></div>
                <div className="divide-y divide-gray-100">
                  {(detailsInvoice.lineItems ?? []).length > 0 ? detailsInvoice.lineItems?.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-4 px-4 py-3 text-xs">
                      <div><p className="font-medium text-gray-800">{item.name}</p><p className="mt-1 text-gray-400">Qty {item.quantity}</p></div>
                      <span className="font-semibold text-gray-800">{formatMoney(item.total, detailsInvoice.currency)}</span>
                    </div>
                  )) : <p className="px-4 py-4 text-xs text-gray-500">Item details are not available.</p>}
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setDetailsInvoice(null)} className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-700">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default CustomerInvoicesPage