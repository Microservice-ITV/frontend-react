import { useEffect, useState, type ChangeEvent, type DragEvent } from 'react'
import { AlertCircle, Download, ExternalLink, Eye, FileText, Loader2, RefreshCw, UploadCloud, X, Image as ImageIcon } from 'lucide-react'
import { getMyInvoices, type InvoiceDocument, type InvoiceStatus, uploadPaymentSlip } from '@/lib/api/invoiceClient'
import { useAppSelector } from '@/app/hooks'
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors'

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  UNPAID: 'bg-amber-100 text-amber-700 border border-amber-200',
  PENDING_VERIFICATION: 'bg-sky-100 text-sky-700 border border-sky-200',
  PAID: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-red-100 text-red-700 border border-red-200',
  VOID: 'bg-slate-200 text-slate-700 border border-slate-300',
  REFUNDED: 'bg-violet-100 text-violet-700 border border-violet-200',
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

const CustomerInvoicesPage = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const [invoices, setInvoices] = useState<InvoiceDocument[]>([])
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

  const handleOpenPdf = (invoice: InvoiceDocument) => {
    if (!invoice.pdfUrl) return
    window.open(invoice.pdfUrl, '_blank', 'noopener,noreferrer')
  }

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

  return (
    <section className="space-y-4 bg-[#f5f5f5] p-4 md:p-6">
      <div className="flex flex-col gap-3 rounded-sm border border-gray-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
            Billing
          </div>
          <h1 className="mt-2 text-xl font-semibold text-gray-900">My Invoices</h1>
          <p className="mt-1 text-xs text-gray-500">Track your invoices and upload payment slips when needed.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadInvoices()}
          className="inline-flex items-center justify-center gap-2 rounded-sm border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-emerald-200 hover:text-emerald-700"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

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
        <div className="overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-190 w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  {['Invoice #', 'Order ID', 'Date', 'Amount', 'Status', 'Actions'].map((header) => (
                    <th key={header} className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
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
                    <tr key={invoice.id} className="border-t border-gray-100 transition hover:bg-emerald-50/20">
                      <td className="px-4 py-4 text-sm font-semibold text-gray-800">{invoice.invoiceNumber}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{invoice.orderId}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{formatDate(invoice.createdAt)}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-gray-900">{formatMoney(invoice.grandTotal, invoice.currency)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${STATUS_STYLES[invoice.status]}`}>
                          {STATUS_LABELS[invoice.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenPdf(invoice)}
                            disabled={!invoice.pdfUrl}
                            title={invoice.pdfUrl ? 'Open invoice PDF in a new tab' : 'PDF is still being generated'}
                            className="inline-flex items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-700 transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            <ExternalLink size={12} />
                            View PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDownloadPdf(invoice)}
                            disabled={!invoice.pdfUrl || downloadingInvoiceId !== null}
                            title={invoice.pdfUrl ? 'Download invoice PDF' : 'PDF is still being generated'}
                            className="inline-flex items-center gap-1.5 rounded-sm bg-emerald-600 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-300"
                          >
                            {downloadingInvoiceId === invoice.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                            {downloadingInvoiceId === invoice.id ? 'Downloading...' : 'Download PDF'}
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
    </section>
  )
}

export default CustomerInvoicesPage