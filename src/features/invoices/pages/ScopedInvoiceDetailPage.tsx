import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Download, Loader2, Printer, Receipt, X } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { selectAuthUser, selectIsAuthenticated } from '@/features/auth/store/authSelectors'
import InvoiceDocumentSheet from '@/features/invoices/components/InvoiceDocumentSheet'
import ThermalPdfPreview from '@/features/invoices/components/ThermalPdfPreview'
import InvoiceEmptyState from '@/features/invoices/components/InvoiceEmptyState'
import InvoiceTableSkeleton from '@/features/invoices/components/InvoiceTableSkeleton'
import { formatInvoiceNumber } from '@/features/invoices/lib/invoiceFormat'
import { downloadInvoicePdf, downloadReceiptPdf, downloadThermalInvoicePdf, getInvoiceByNumber, getReceiptForInvoice, pollThermalPdf, type InvoiceDocument, type ReceiptDocument } from '@/lib/api/invoiceClient'
import { usePageTitle } from '@/components/routing/PageTitle'

type ScopedInvoiceDetailPageProps = {
  backTo: string
  backLabel: string
}

const ScopedInvoiceDetailPage = ({ backTo, backLabel }: ScopedInvoiceDetailPageProps) => {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const authUser = useAppSelector(selectAuthUser)
  const [invoice, setInvoice] = useState<InvoiceDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const [isPrintDropdownOpen, setIsPrintDropdownOpen] = useState(false)
  const [isReceiptDropdownOpen, setIsReceiptDropdownOpen] = useState(false)
  const [documentView, setDocumentView] = useState<'a4' | 'invoice' | 'receipt'>('a4')
  const [thermalWidth, setThermalWidth] = useState<'58mm' | '80mm'>('58mm')
  const [pendingA4Print, setPendingA4Print] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptDocument | null>(null)
  const [isReceiptLoading, setIsReceiptLoading] = useState(false)
  const [isThermalPrinting, setIsThermalPrinting] = useState(false)
  const [isThermalPrintPreparing, setIsThermalPrintPreparing] = useState(false)
  const [thermalPrintError, setThermalPrintError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const [thermalPdf, setThermalPdf] = useState<Blob | null>(null)
  const [thermalPdfKey, setThermalPdfKey] = useState<string | null>(null)
  const [thermalPdfError, setThermalPdfError] = useState<string | null>(null)
  const [thermalRetryNonce, setThermalRetryNonce] = useState(0)
  const thermalPdfRequests = useRef(new Map<string, Promise<Blob | null>>())
  const receiptRequests = useRef(new Map<string, Promise<ReceiptDocument | null>>())
  const thermalPrintInProgress = useRef(false)
  const thermalPrintCleanup = useRef(new Set<() => void>())
  const currentThermalContext = useRef<string | null>(null)
  const isMounted = useRef(true)

  usePageTitle(invoice?.invoiceNumber ? `Invoice ${invoice.invoiceNumber}` : 'Invoice')

  const loadInvoice = useCallback(async () => {
    if (!isAuthenticated) {
      setInvoice(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      setInvoice(await getInvoiceByNumber(invoiceNumber ?? ''))
    } catch (requestError: unknown) {
      const responseMessage = typeof requestError === 'object' && requestError !== null
        && 'response' in requestError
        && typeof requestError.response === 'object'
        && requestError.response !== null
        && 'data' in requestError.response
        && typeof requestError.response.data === 'object'
        && requestError.response.data !== null
        && 'message' in requestError.response.data
        && typeof requestError.response.data.message === 'string'
        ? requestError.response.data.message
        : null
      setError(responseMessage || (requestError instanceof Error ? requestError.message : 'Unable to load this invoice.'))
    } finally {
      setIsLoading(false)
    }
  }, [invoiceNumber, isAuthenticated])

  useEffect(() => {
    void loadInvoice()
  }, [loadInvoice])

  useEffect(() => {
    if (!pendingA4Print || documentView !== 'a4') return
    setPendingA4Print(false)
    window.print()
  }, [documentView, pendingA4Print])

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const isPrintDropdown = target.closest('[data-print-dropdown]')
      const isReceiptDropdown = target.closest('[data-receipt-dropdown]')

      if (!isPrintDropdown && isPrintDropdownOpen) {
        setIsPrintDropdownOpen(false)
      }
      if (!isReceiptDropdown && isReceiptDropdownOpen) {
        setIsReceiptDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isPrintDropdownOpen, isReceiptDropdownOpen])

  const handleDownload = async (kind: 'a4' | 'invoice' | 'receipt' = 'a4') => {
    if (!invoice) return
    if (kind === 'receipt' && invoice.status !== 'PAID') return

    setIsDownloading(true)
    setDownloadError(null)
    try {
      const blob = kind === 'a4'
        ? await downloadInvoicePdf(invoice.id)
        : await getThermalPdf(kind, thermalWidth)
      if (!blob) throw new Error('No receipt PDF is available for this invoice.')
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      const number = (invoice.invoiceNumber || invoice.id).replace(/[^a-zA-Z0-9-]/g, '-')
      const thermalInvoiceSuffix = (invoice.invoiceNumber || invoice.id)
        .trim()
        .replace(/^DNI-/i, '')
        .replace(/^INV-/i, '')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
      anchor.download = kind === 'a4'
        ? `${formatInvoiceNumber(invoice.invoiceNumber || invoice.id)}.pdf`
        : kind === 'invoice'
          ? `INV-${thermalInvoiceSuffix || 'invoice'}-thermal-${thermalWidth}.pdf`
          : `${number}-receipt-${thermalWidth}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (requestError: unknown) {
      setDownloadError(requestError instanceof Error ? requestError.message : 'Unable to download this document.')
    } finally {
      setIsDownloading(false)
    }
  }

  const getThermalPdf = useCallback((kind: 'invoice' | 'receipt', width: '58mm' | '80mm') => {
    if (!isAuthenticated || !invoice) return Promise.resolve(null)
    const key = `${isAuthenticated ? 'authenticated' : 'unauthenticated'}:${authUser?.id ?? ''}:${invoice.id}:${invoice.updatedAt ?? ''}:${kind}:${width}`
    const pending = thermalPdfRequests.current.get(key)
    if (pending) return pending

    const request = pollThermalPdf(() => kind === 'invoice'
      ? downloadThermalInvoicePdf(invoice.id, width)
      : downloadReceiptPdf(invoice.id, { width }))
    thermalPdfRequests.current.set(key, request)
    void request.catch(() => {
      if (thermalPdfRequests.current.get(key) === request) thermalPdfRequests.current.delete(key)
    })
    return request
  }, [authUser?.id, invoice, isAuthenticated])

  const getReceiptData = useCallback((invoiceId: string) => {
    const pending = receiptRequests.current.get(invoiceId)
    if (pending) return pending
    const request = Promise.resolve().then(() => getReceiptForInvoice(invoiceId))
    receiptRequests.current.set(invoiceId, request)
    void request.catch(() => receiptRequests.current.delete(invoiceId))
    return request
  }, [])

  useEffect(() => {
    // Do not carry authorized PDF blobs or pending requests across invoice
    // revisions, accounts, or authentication changes.
    thermalPdfRequests.current.clear()
  }, [authUser?.id, invoice?.id, invoice?.updatedAt, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || documentView === 'a4' || !invoice) return

    let active = true
    const key = `${isAuthenticated ? 'authenticated' : 'unauthenticated'}:${authUser?.id ?? ''}:${invoice.id}:${invoice.updatedAt ?? ''}:${documentView}:${thermalWidth}`
    setThermalPdfError(null)
    void getThermalPdf(documentView, thermalWidth)
      .then((blob) => {
        if (!active) return
        if (!blob) throw new Error(`No ${documentView} PDF is available for this invoice.`)
        setThermalPdf(blob)
        setThermalPdfKey(key)
      })
      .catch((previewError: unknown) => {
        if (active) setThermalPdfError(previewError instanceof Error ? previewError.message : 'Unable to load the PDF preview.')
      })

    return () => { active = false }
  }, [authUser?.id, documentView, getThermalPdf, invoice, isAuthenticated, thermalRetryNonce, thermalWidth])

  const visibleThermalPdfKey = isAuthenticated && invoice && documentView !== 'a4'
    ? `authenticated:${authUser?.id ?? ''}:${invoice.id}:${invoice.updatedAt ?? ''}:${documentView}:${thermalWidth}`
    : null
  const visibleThermalPdf = thermalPdfKey === visibleThermalPdfKey ? thermalPdf : null
  currentThermalContext.current = visibleThermalPdfKey

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      currentThermalContext.current = null
      for (const cleanup of [...thermalPrintCleanup.current]) cleanup()
    }
  }, [])

  useEffect(() => {
    if (!invoice || invoice.status !== 'PAID') return
    // Receipt JSON is small and authorized by the same invoice access rules.
    // Fetch it with the invoice so the first receipt preview has no extra wait.
    void getReceiptData(invoice.id).catch(() => undefined)
  }, [getReceiptData, invoice])

  const handleThermalView = async (width: "58mm" | "80mm", type: 'invoice' | 'receipt') => {
    if (!invoice) return
    if (type === 'invoice') {
      setDocumentView(type)
      setThermalWidth(width)
      setError(null)
      // Start PDF preparation in parallel with immediate React preview rendering.
      void getThermalPdf(type, width).catch(() => undefined)
      return
    }

    if (invoice.status !== 'PAID') return
    if (receiptData?.invoiceId === invoice.id) {
      setReceiptError(null)
      setThermalWidth(width)
      setDocumentView(type)
      void getThermalPdf(type, width).catch(() => undefined)
      return
    }
    setReceiptError(null)
    setIsReceiptLoading(true)
    const receiptRequest = getReceiptData(invoice.id)
    // Start PDF preparation alongside the authorized receipt data request.
    void getThermalPdf(type, width).catch(() => undefined)
    try {
      const receipt = await receiptRequest
      if (receiptRequests.current.get(invoice.id) === receiptRequest) receiptRequests.current.delete(invoice.id)
      if (!receipt) throw new Error('No receipt found for this invoice. Receipt may not have been generated yet.')
      setReceiptData(receipt)
      setThermalWidth(width)
      setDocumentView(type)
    } catch (err) {
      setReceiptData(null)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load receipt data'
      setReceiptError(`Error loading receipt: ${errorMessage}`)
      setDocumentView(type)
      setThermalWidth(width)
      console.error('Error loading receipt:', err)
    } finally {
      setIsReceiptLoading(false)
    }
  }

  const closeThermalView = () => {
    setDocumentView('a4')
    setReceiptError(null)
  }

  const handleThermalPrint = async () => {
    if (!invoice || !isAuthenticated || documentView === 'a4' || thermalPrintInProgress.current) return
    if (documentView === 'receipt' && (invoice.status !== 'PAID' || !receiptData || isReceiptLoading)) return

    const kind = documentView
    const width = thermalWidth
    const expectedKey = visibleThermalPdfKey
    if (!expectedKey) return
    setThermalPrintError(null)
    thermalPrintInProgress.current = true
    setIsThermalPrinting(true)
    setIsThermalPrintPreparing(true)

    const printFrame = document.createElement('iframe')
    printFrame.title = `Thermal ${kind} print document`
    printFrame.setAttribute('aria-hidden', 'true')
    printFrame.tabIndex = -1
    Object.assign(printFrame.style, {
      position: 'fixed', left: '0', bottom: '0', width: '1px', height: '1px',
      border: '0', opacity: '0', pointerEvents: 'none',
    })
    let objectUrl: string | null = null
    let completed = false
    let printStarted = false
    let loadTimeout = 0
    let completionTimeout = 0
    let focusCleanupTimeout = 0
    const cleanup = () => {
      if (completed) return
      completed = true
      if (loadTimeout) window.clearTimeout(loadTimeout)
      if (completionTimeout) window.clearTimeout(completionTimeout)
      if (focusCleanupTimeout) window.clearTimeout(focusCleanupTimeout)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      printFrame.removeEventListener('load', onPdfLoaded)
      printFrame.removeEventListener('error', onFrameError)
      printFrame.contentWindow?.removeEventListener('afterprint', onAfterPrint)
      window.removeEventListener('afterprint', onAfterPrint)
      window.removeEventListener('focus', onPrintDialogClosed)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      printFrame.remove()
      thermalPrintCleanup.current.delete(cleanup)
      thermalPrintInProgress.current = false
      if (isMounted.current) {
        setIsThermalPrinting(false)
        setIsThermalPrintPreparing(false)
      }
    }
    const onAfterPrint = () => cleanup()
    const onPrintDialogClosed = () => {
      if (!printStarted || focusCleanupTimeout) return
      focusCleanupTimeout = window.setTimeout(cleanup, 250)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') onPrintDialogClosed()
    }
    const onPdfLoaded = () => {
      if (!objectUrl || printStarted) return
      if (currentThermalContext.current !== expectedKey || !isAuthenticated) {
        cleanup()
        return
      }
      printStarted = true
      printFrame.removeEventListener('load', onPdfLoaded)
      if (loadTimeout) window.clearTimeout(loadTimeout)
      setIsThermalPrintPreparing(false)
      try {
        const printWindow = printFrame.contentWindow
        if (!printWindow) throw new Error('Unable to access the thermal PDF print frame.')
        printWindow.focus()
        window.addEventListener('focus', onPrintDialogClosed)
        document.addEventListener('visibilitychange', onVisibilityChange)
        completionTimeout = window.setTimeout(cleanup, 120000)
        printWindow.print()
        // PDF viewers can return before their print dialog finishes opening.
        // Unlock the control now, but retain the frame and Blob until the
        // dialog closes so the viewer can still read the selected PDF.
        thermalPrintInProgress.current = false
        if (isMounted.current) {
          setIsThermalPrinting(false)
          setIsThermalPrintPreparing(false)
        }
      } catch (printError: unknown) {
        cleanup()
        setThermalPrintError(printError instanceof Error ? printError.message : 'Unable to open the print dialog.')
      }
    }
    const onFrameError = () => {
      cleanup()
      setThermalPrintError('Unable to load the thermal PDF for printing.')
    }
    thermalPrintCleanup.current.add(cleanup)

    try {
      const blob = visibleThermalPdf && thermalPdfKey === expectedKey
        ? visibleThermalPdf
        : await getThermalPdf(kind, width)
      if (!blob) throw new Error(`No ${kind} PDF is available for this invoice.`)
      if (currentThermalContext.current !== expectedKey || !isAuthenticated) {
        cleanup()
        return
      }
      objectUrl = URL.createObjectURL(blob)
      printFrame.addEventListener('load', onPdfLoaded)
      printFrame.addEventListener('error', onFrameError)
      printFrame.src = objectUrl
      document.body.appendChild(printFrame)
      printFrame.contentWindow?.addEventListener('afterprint', onAfterPrint, { once: true })
      window.addEventListener('afterprint', onAfterPrint, { once: true })
      loadTimeout = window.setTimeout(() => {
        cleanup()
        setThermalPrintError('The thermal PDF did not finish loading for printing. Please try again.')
      }, 30000)
    } catch (printError: unknown) {
      cleanup()
      setThermalPrintError(printError instanceof Error ? printError.message : 'Unable to prepare the thermal PDF for printing.')
    }
  }

  const handleA4Print = () => {
    // Clear thermal print mode before switching, then let React commit the A4
    // document before opening the print dialog.
    document.body.classList.remove('thermal-printing')
    setDocumentView('a4')
    setPendingA4Print(true)
  }

  return (
    <section className="min-h-full w-full min-w-0 bg-slate-50">
      <div className="mx-auto w-full min-w-0 max-w-[960px] px-3 sm:px-4">
        {documentView === 'a4' && <div data-print-hide className="mb-5 flex flex-wrap items-center gap-2">
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft size={15} />
            {backLabel}
          </Link>
          {invoice && documentView === 'a4' && (
            <>
              <button
                type="button"
                aria-pressed={documentView === 'a4'}
                onClick={handleA4Print}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                A4 Invoice
              </button>

              {/* Standard A4 Print Button */}
              <button
                type="button"
                onClick={handleA4Print}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Printer size={15} />
                Print A4 Invoice
              </button>

              {/* Print Invoice (Thermal) Dropdown */}
              <div className="relative inline-block" data-print-dropdown>
                <button
                  type="button"
                  onClick={() => setIsPrintDropdownOpen(!isPrintDropdownOpen)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Printer size={15} />
                  Print Invoice
                  <ChevronDown size={14} className="ml-1" />
                </button>
                {isPrintDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPrintDropdownOpen(false)
                        handleThermalView('58mm', 'invoice')
                      }}
                      onMouseEnter={() => void getThermalPdf('invoice', '58mm').catch(() => undefined)}
                      onFocus={() => void getThermalPdf('invoice', '58mm').catch(() => undefined)}
                      className="flex w-full items-center px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Thermal 58mm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPrintDropdownOpen(false)
                        handleThermalView('80mm', 'invoice')
                      }}
                      onMouseEnter={() => void getThermalPdf('invoice', '80mm').catch(() => undefined)}
                      onFocus={() => void getThermalPdf('invoice', '80mm').catch(() => undefined)}
                      className="flex w-full items-center px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Thermal 80mm
                    </button>
                  </div>
                )}
              </div>

              {/* Print Receipt (Thermal) Dropdown - Only show for paid invoices */}
              {invoice.status === 'PAID' && (
                <div className="relative inline-block" data-receipt-dropdown>
                  <button
                    type="button"
                    onClick={() => setIsReceiptDropdownOpen(!isReceiptDropdownOpen)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Receipt size={15} />
                    Print Receipt
                    <ChevronDown size={14} className="ml-1" />
                  </button>
                  {isReceiptDropdownOpen && (
                    <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setIsReceiptDropdownOpen(false)
                          handleThermalView('58mm', 'receipt')
                        }}
                        onMouseEnter={() => void getThermalPdf('receipt', '58mm').catch(() => undefined)}
                        onFocus={() => void getThermalPdf('receipt', '58mm').catch(() => undefined)}
                        className="flex w-full items-center px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Thermal 58mm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsReceiptDropdownOpen(false)
                          handleThermalView('80mm', 'receipt')
                        }}
                        onMouseEnter={() => void getThermalPdf('receipt', '80mm').catch(() => undefined)}
                        onFocus={() => void getThermalPdf('receipt', '80mm').catch(() => undefined)}
                        className="flex w-full items-center px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Thermal 80mm
                      </button>
                    </div>
                  )}
                </div>
              )}

              {documentView === 'a4' && <button
                type="button"
                onClick={() => void handleDownload('a4')}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                {isDownloading ? 'Preparing PDF…' : 'Download PDF'}
              </button>}
            </>
          )}
        </div>}

        {documentView === 'a4' && downloadError && <p data-print-hide role="alert" className="mb-3 text-sm text-rose-600">{downloadError}</p>}

        {isLoading && (
          <div aria-live="polite" className="overflow-hidden rounded-[20px] bg-white shadow-sm ring-1 ring-slate-200/80">
            <InvoiceTableSkeleton rows={5} />
          </div>
        )}

        {!isLoading && error && (
          <div role="alert" className="rounded-2xl bg-white px-6 py-12 text-center text-sm text-rose-600 shadow-sm ring-1 ring-rose-200">
            {error}
          </div>
        )}

        {!isLoading && !error && !invoice && (
          <div className="rounded-[20px] bg-white shadow-sm ring-1 ring-slate-200/80">
            <InvoiceEmptyState
              title="Invoice not found"
              description="This invoice does not exist, or you are not authorized to view it."
              action={
                <Link to={backTo} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800">
                  <ArrowLeft size={13} /> {backLabel}
                </Link>
              }
            />
          </div>
        )}

        {!isLoading && !error && invoice && (
          <>
            {documentView === 'a4' && <InvoiceDocumentSheet invoice={invoice} showActions={false} compact />}

            {documentView !== 'a4' && (
              <div>
                <div data-testid="thermal-preview-actions" data-print-hide className="mb-3 flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-x-auto pb-1">
                    <Link
                      to={backTo}
                      className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <ArrowLeft size={15} /> {backLabel}
                    </Link>
                    <button type="button" aria-label={`${isDownloading ? 'Downloading' : 'Download'} PDF ${documentView} ${thermalWidth}`} onClick={() => void handleDownload(documentView)} disabled={isDownloading}
                      className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                      {isDownloading ? 'Downloading…' : 'Download PDF'}
                    </button>
                    <button
                      type="button"
                      onClick={handleThermalPrint}
                      disabled={isThermalPrinting || (documentView === 'receipt' && (!receiptData || isReceiptLoading))}
                      className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isThermalPrintPreparing ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
                      {isThermalPrintPreparing ? 'Preparing…' : `Print ${documentView === 'invoice' ? 'Invoice' : 'Receipt'} (${thermalWidth})`}
                    </button>
                    <button
                      type="button"
                      onClick={closeThermalView}
                      className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <X size={15} />
                      Close Preview
                    </button>
                </div>
                {downloadError && <p role="alert" className="mb-3 text-sm text-rose-600">{downloadError}</p>}
                {thermalPrintError && <p role="alert" className="mb-3 text-sm text-rose-600">{thermalPrintError}</p>}
                {thermalPdfError && (
                  <div role="alert" className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <span>{thermalPdfError}</span>
                    <button type="button" onClick={() => setThermalRetryNonce((value) => value + 1)} className="rounded-md border border-amber-400 bg-white px-3 py-1.5 font-medium hover:bg-amber-100">
                      Retry preparation
                    </button>
                  </div>
                )}

                {documentView === 'receipt' && !receiptData && !isReceiptLoading ? (
                  <div role={receiptError ? 'alert' : 'status'} className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
                    {receiptError || 'No receipt data available for this invoice.'}
                  </div>
                ) : (
                  <ThermalPdfPreview
                    pdf={visibleThermalPdf}
                    kind={documentView}
                    width={thermalWidth}
                    errorMessage={thermalPdfError}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default ScopedInvoiceDetailPage
