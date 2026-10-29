import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { getCustomerInvoiceByNumber, getReceiptForInvoice, getReceiptForPrint, type InvoiceDocument, type ReceiptDocument } from '@/lib/api/invoiceClient'
import ReceiptDocumentSheet from '@/features/invoices/components/ReceiptDocumentSheet'
import { useAppSelector } from '@/app/hooks'
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors'

/**
 * Thermal receipt print-only route: `/account/invoices/:invoiceNumber/receipt/print`.
 *
 * Renders the `ReceiptDocumentSheet` in `mode="print"` for thermal printing.
 * Width can be specified via query parameter: `?width=58mm` or `?width=80mm`.
 */
const CustomerReceiptPrintPage = () => {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>()
  const [searchParams] = useSearchParams()
  const width = (searchParams.get('width') as '58mm' | '80mm') || '58mm'
  const printToken = searchParams.get('token')
  
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  useEffect(() => {
    document.body.classList.add('thermal-printing')
    return () => document.body.classList.remove('thermal-printing')
  }, [])

  const [invoice, setInvoice] = useState<InvoiceDocument | null>(null)
  const [receipt, setReceipt] = useState<ReceiptDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!isAuthenticated && !printToken) {
      setInvoice(null)
      setReceipt(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setInvoice(null)
    setReceipt(null)

    try {
      const decodedNumber = invoiceNumber ? decodeURIComponent(invoiceNumber) : ''
      const printData = printToken ? await getReceiptForPrint(decodedNumber, printToken) : null
      const loadedInvoice = printData?.invoice ?? await getCustomerInvoiceByNumber(decodedNumber)
      setInvoice(loadedInvoice)
      const loadedReceipt = printData?.receipt ?? await getReceiptForInvoice(loadedInvoice.id, { asCustomer: true })
      if (!loadedReceipt) {
        throw new Error('No receipt found for this invoice. Receipts are only available for paid invoices.')
      }
      setReceipt(loadedReceipt)
    } catch (requestError: unknown) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to load receipt.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [invoiceNumber, isAuthenticated, printToken])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Signal to the browser that content has loaded for print
  useEffect(() => {
    if (isLoading) return

    let cancelled = false
    const markReady = () => {
      if (cancelled) return
      ;(window as unknown as { __THERMAL_READY__?: boolean }).__THERMAL_READY__ = true
      // Browser print route may print automatically; the PDF renderer waits for readiness.
      if (printToken) return
      setTimeout(() => {
        window.print()
      }, 500)
    }

    // On failure, don't auto-print
    if (!receipt || error) {
      ;(window as unknown as { __THERMAL_ERROR__?: string; __THERMAL_READY__?: boolean }).__THERMAL_ERROR__ = error || 'Receipt data is missing.'
      ;(window as unknown as { __THERMAL_READY__?: boolean }).__THERMAL_READY__ = true
      return
    }

    const done = async () => {
      if (document.fonts) {
        await document.fonts.ready
      }
      await Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map((img) => new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true })
            img.addEventListener('error', () => resolve(), { once: true })
          })),
      )
      markReady()
    }

    void done().catch(() => {
      markReady()
    })
    return () => {
      cancelled = true
    }
  }, [isLoading, receipt, error, printToken])

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 print:bg-white print:p-0">
      <div data-print-hide className="mx-auto max-w-4xl">
        <nav className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <Link
            to={`/account/invoices/${encodeURIComponent(invoiceNumber ?? '')}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Invoice
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-600">
              Thermal width: <span className="font-semibold">{width}</span>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!receipt || isLoading || Boolean(error)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer size={16} />
              Print Receipt
            </button>
          </div>
        </nav>
        {isLoading && <p className="text-sm text-slate-500">Loading receipt…</p>}
        {!isLoading && error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm text-rose-600">{error}</p>
            <Link
              to={`/account/invoices/${encodeURIComponent(invoiceNumber ?? '')}`}
              className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft size={14} />
              Return to invoice
            </Link>
          </div>
        )}
        {!isLoading && !error && !receipt && (
          <p className="text-sm text-slate-500">Receipt not found.</p>
        )}
      </div>

      {receipt && invoice && (
        <div className="mx-auto print:mx-0" style={{ width: width === '58mm' ? '52mm' : '70mm' }}>
          <ReceiptDocumentSheet
            receipt={receipt}
            invoice={invoice}
            width={width}
            mode="print"
            showActions={false}
          />
        </div>
      )}
    </div>
  )
}

export default CustomerReceiptPrintPage
