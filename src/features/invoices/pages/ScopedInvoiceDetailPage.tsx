import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Download, Loader2, Printer, Receipt, X } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors'
import InvoiceDocumentSheet from '@/features/invoices/components/InvoiceDocumentSheet'
import InvoiceThermalSheet from '@/features/invoices/components/InvoiceThermalSheet'
import ReceiptDocumentSheet from '@/features/invoices/components/ReceiptDocumentSheet'
import ThermalPdfPreview from '@/features/invoices/components/ThermalPdfPreview'
import InvoiceEmptyState from '@/features/invoices/components/InvoiceEmptyState'
import InvoiceTableSkeleton from '@/features/invoices/components/InvoiceTableSkeleton'
import { formatInvoiceNumber } from '@/features/invoices/lib/invoiceFormat'
import { downloadInvoicePdf, downloadReceiptPdf, downloadThermalInvoicePdf, getInvoiceByNumber, getReceiptForInvoice, type InvoiceDocument, type ReceiptDocument } from '@/lib/api/invoiceClient'
import { usePageTitle } from '@/components/routing/PageTitle'

type ScopedInvoiceDetailPageProps = {
  backTo: string
  backLabel: string
}

const ScopedInvoiceDetailPage = ({ backTo, backLabel }: ScopedInvoiceDetailPageProps) => {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
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
  const [isThermalInvoicePrinting, setIsThermalInvoicePrinting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const [thermalPdf, setThermalPdf] = useState<Blob | null>(null)
  const [isThermalPdfLoading, setIsThermalPdfLoading] = useState(false)
  const [thermalPdfError, setThermalPdfError] = useState<string | null>(null)
  const thermalPdfRequests = useRef(new Map<string, Promise<Blob | null>>())
  const receiptRequests = useRef(new Map<string, Promise<ReceiptDocument | null>>())

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
    if (!invoice) return Promise.resolve(null)
    const key = `${invoice.id}:${invoice.updatedAt ?? ''}:${kind}:${width}`
    const pending = thermalPdfRequests.current.get(key)
    if (pending) return pending

    const request = kind === 'invoice'
      ? downloadThermalInvoicePdf(invoice.id, width)
      : downloadReceiptPdf(invoice.id, { width })
    thermalPdfRequests.current.set(key, request)
    void request.catch(() => thermalPdfRequests.current.delete(key))
    return request
  }, [invoice])

  const getReceiptData = useCallback((invoiceId: string) => {
    const pending = receiptRequests.current.get(invoiceId)
    if (pending) return pending
    const request = Promise.resolve().then(() => getReceiptForInvoice(invoiceId))
    receiptRequests.current.set(invoiceId, request)
    void request.catch(() => receiptRequests.current.delete(invoiceId))
    return request
  }, [])

  useEffect(() => {
    if (documentView === 'a4' || !invoice) return

    let active = true
    setThermalPdf(null)
    setThermalPdfError(null)
    setIsThermalPdfLoading(true)
    void getThermalPdf(documentView, thermalWidth)
      .then((blob) => {
        if (!active) return
        if (!blob) throw new Error(`No ${documentView} PDF is available for this invoice.`)
        setThermalPdf(blob)
      })
      .catch((previewError: unknown) => {
        if (active) setThermalPdfError(previewError instanceof Error ? previewError.message : 'Unable to load the PDF preview.')
      })
      .finally(() => {
        if (active) setIsThermalPdfLoading(false)
      })

    return () => { active = false }
  }, [documentView, getThermalPdf, invoice, thermalWidth])

  useEffect(() => {
    if (!invoice) return

    // A4 PDFs already exist in storage. Warm the thermal variants in the
    // background after the authorized invoice details load, so the first
    // thermal download usually uses a completed PDF instead of launching a
    // Chromium render after the user clicks Download.
    const warmups: Promise<Blob | null>[] = [
      getThermalPdf('invoice', '58mm'),
      getThermalPdf('invoice', '80mm'),
    ]
    if (invoice.status === 'PAID') {
      warmups.push(getThermalPdf('receipt', '58mm'))
      warmups.push(getThermalPdf('receipt', '80mm'))
    }
    void Promise.allSettled(warmups)
  }, [getThermalPdf, invoice])

  useEffect(() => {
    if (!invoice || invoice.status !== 'PAID') return
    // Receipt JSON is small and authorized by the same invoice access rules.
    // Fetch it with the invoice so the first receipt preview has no extra wait.
    void getReceiptData(invoice.id).catch(() => undefined)
  }, [getReceiptData, invoice])

  const handleThermalView = async (width: "58mm" | "80mm", type: 'invoice' | 'receipt') => {
    if (!invoice) return

    setDocumentView(type)
    setThermalWidth(width)

    // Start Chromium PDF rendering while the thermal preview is being shown.
    // The download button then reuses this in-flight or completed request.
    void getThermalPdf(type, width).catch(() => undefined)

    if (type === 'invoice') {
      setError(null)
    } else {
      setReceiptError(null)
      // Fetch receipt data for paid invoices
      if (invoice.status === 'PAID') {
        setIsReceiptLoading(true)
        setReceiptData(null)
        try {
          const receiptRequest = getReceiptData(invoice.id)
          const receipt = await receiptRequest
          if (receiptRequests.current.get(invoice.id) === receiptRequest) receiptRequests.current.delete(invoice.id)
          setReceiptData(receipt)
          if (!receipt) {
            setReceiptError('No receipt found for this invoice. Receipt may not have been generated yet.')
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load receipt data'
          setReceiptError(`Error loading receipt: ${errorMessage}`)
          console.error('Error loading receipt:', err)
        } finally {
          setIsReceiptLoading(false)
        }
      }
    }
  }

  const closeThermalView = () => {
    setDocumentView('a4')
    setReceiptData(null)
    setReceiptError(null)
  }

  const handleThermalPrint = () => {
    if (documentView === 'invoice') {
      const cleanupInvoice = () => {
        document.body.classList.remove('thermal-printing', 'thermal-invoice-printing')
        setIsThermalInvoicePrinting(false)
      }
      document.body.classList.add('thermal-printing', 'thermal-invoice-printing')
      window.addEventListener('afterprint', cleanupInvoice, { once: true })
      setIsThermalInvoicePrinting(true)
      return
    }

    const cleanup = () => document.body.classList.remove('thermal-printing')
    document.body.classList.add('thermal-printing')
    window.addEventListener('afterprint', cleanup, { once: true })
    try {
      window.print()
    } catch (printError) {
      window.removeEventListener('afterprint', cleanup)
      cleanup()
      throw printError
    }
  }

  useEffect(() => {
    if (!isThermalInvoicePrinting || !invoice) return
    const timer = window.setTimeout(() => {
      try {
        window.print()
      } catch {
        document.body.classList.remove('thermal-printing', 'thermal-invoice-printing')
        setIsThermalInvoicePrinting(false)
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [invoice, isThermalInvoicePrinting])

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
                      disabled={documentView === 'receipt' && (!receiptData || isReceiptLoading)}
                      className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Printer size={15} />
                      Print {documentView === 'invoice' ? 'Invoice' : 'Receipt'} ({thermalWidth})
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

                {documentView === 'receipt' && !receiptData && !isReceiptLoading ? (
                  <div role={receiptError ? 'alert' : 'status'} className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
                    {receiptError || 'No receipt data available for this invoice.'}
                  </div>
                ) : (
                  <ThermalPdfPreview
                    pdf={thermalPdf}
                    loading={isThermalPdfLoading}
                    kind={documentView}
                    width={thermalWidth}
                    errorMessage={thermalPdfError}
                    fallback={documentView === 'invoice'
                      ? <InvoiceThermalSheet invoice={invoice} width={thermalWidth} mode="screen" showActions={false} />
                      : receiptData
                        ? <ReceiptDocumentSheet receipt={receiptData} invoice={invoice} width={thermalWidth} mode="screen" showActions={false} />
                        : <p role="status" className="px-4 text-sm text-slate-600">Loading receipt details…</p>}
                  />
                )}
                {thermalPdf && documentView === 'invoice' ? (
                  <div className="thermal-print-source" style={{ display: 'none' }}>
                    <InvoiceThermalSheet invoice={invoice} width={thermalWidth} mode="screen" showActions={false} />
                  </div>
                ) : thermalPdf && receiptData && (
                  <div className="thermal-print-source" style={{ display: 'none' }}>
                    <ReceiptDocumentSheet receipt={receiptData} invoice={invoice} width={thermalWidth} mode="screen" showActions={false} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {isThermalInvoicePrinting && invoice && createPortal(
        <InvoiceThermalSheet
          invoice={invoice}
          width={thermalWidth}
          mode="print"
          showActions={false}
        />,
        document.body,
      )}
    </section>
  )
}

export default ScopedInvoiceDetailPage
