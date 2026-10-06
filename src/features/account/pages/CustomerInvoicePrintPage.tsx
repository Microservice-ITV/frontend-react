import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { getMyInvoices, getInvoiceForPrint, type InvoiceDocument } from '@/lib/api/invoiceClient'
import InvoiceDocumentSheet from '@/features/invoices/components/InvoiceDocumentSheet'
import { INVOICE_DOCUMENT_STYLES, INVOICE_PRINT_STYLES } from '@/features/invoices/lib/invoicePrintStyles'

/**
 * Print-only route: `/account/invoices/:invoiceNumber/print`.
 *
 * Renders the *same* `InvoiceDocumentSheet` in `mode="print"`, so the printed
 * output and the server-generated PDF share one design. All application chrome
 * and action buttons are excluded.
 *
 * When opened by the invoice service's headless browser it carries a short-lived
 * print token; the server verifies the token and the invoice's ownership, so
 * nothing is exposed publicly.
 */
const CustomerInvoicePrintPage = () => {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>()
  const [searchParams] = useSearchParams()
  const printToken = searchParams.get('token')

  const [invoice, setInvoice] = useState<InvoiceDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInvoice = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const decoded = invoiceNumber ? decodeURIComponent(invoiceNumber) : ''
      const data = printToken
        ? await getInvoiceForPrint(decoded, printToken)
        : (await getMyInvoices()).find((item) => item.invoiceNumber === decoded || item.id === decoded) ?? null

      if (!data) {
        throw new Error('Invoice not found')
      }

      setInvoice(data)
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : 'Unable to load this invoice.'
      setError(message)
      // Surfaced to the headless PDF renderer so it fails loudly instead of
      // producing a PDF of an error page.
      ;(window as unknown as { __INVOICE_ERROR__?: string }).__INVOICE_ERROR__ = message
    } finally {
      setIsLoading(false)
    }
  }, [invoiceNumber, printToken])

  useEffect(() => {
    void loadInvoice()
  }, [loadInvoice])

  // Signal to the headless browser that fonts, logo and images have settled.
  useEffect(() => {
    if (isLoading) return

    let cancelled = false
    const markReady = () => {
      if (cancelled) return
      ;(window as unknown as { __INVOICE_READY__?: boolean }).__INVOICE_READY__ = true
    }

    // On failure there is nothing to wait for, so signal immediately and let the
    // renderer read `__INVOICE_ERROR__` rather than waiting for a timeout.
    if (!invoice) {
      markReady()
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

    void done().catch((readyError: unknown) => {
      const message = readyError instanceof Error ? readyError.message : 'Invoice assets failed to load.'
      ;(window as unknown as { __INVOICE_ERROR__?: string }).__INVOICE_ERROR__ = message
      markReady()
    })
    return () => {
      cancelled = true
    }
  }, [isLoading, invoice])

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 print:bg-white print:p-0">
      <style>{`${INVOICE_DOCUMENT_STYLES}${INVOICE_PRINT_STYLES}`}</style>
      <div data-print-hide className="mx-auto max-w-4xl">
        <nav className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <Link
            to={`/account/invoices/${encodeURIComponent(invoiceNumber ?? '')}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Invoice
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!invoice || isLoading || Boolean(error)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer size={16} />
            Print Invoice
          </button>
        </nav>
        {isLoading && <p className="text-sm text-slate-500">Preparing invoice…</p>}
        {!isLoading && error && <p className="text-sm text-rose-600">{error}</p>}
        {!isLoading && !error && !invoice && <p className="text-sm text-slate-500">Invoice not found.</p>}
      </div>

      {invoice && (
        <div className="mx-auto max-w-4xl print:max-w-none">
          <InvoiceDocumentSheet invoice={invoice} mode="print" showActions={false} />
        </div>
      )}
    </div>
  )
}

export default CustomerInvoicePrintPage