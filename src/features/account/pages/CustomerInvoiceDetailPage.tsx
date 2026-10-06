import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, ExternalLink, Printer, Receipt } from 'lucide-react'
import { downloadInvoicePdf, getCustomerInvoiceByNumber, type InvoiceDocument } from '@/lib/api/invoiceClient'
import InvoiceDocumentSheet from '@/features/invoices/components/InvoiceDocumentSheet'
import InvoiceEmptyState from '@/features/invoices/components/InvoiceEmptyState'
import InvoiceTableSkeleton from '@/features/invoices/components/InvoiceTableSkeleton'
import { formatInvoiceNumber } from '@/features/invoices/lib/invoiceFormat'
import { useAppSelector } from '@/app/hooks'
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors'
import { usePageTitle } from '@/components/routing/PageTitle'

/**
 * Dedicated full-page invoice screen at `/account/invoices/:invoiceNumber`.
 *
 * Loads only the requested invoice through the customer-owned detail endpoint.
 */
const CustomerInvoiceDetailPage = () => {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  const [invoice, setInvoice] = useState<InvoiceDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Uses the project's existing title mechanism. Falls back to the route rule
  // ("Invoice") until the real invoice has loaded, then uses its actual number.
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
      const decodedNumber = invoiceNumber ? decodeURIComponent(invoiceNumber) : ''
      setInvoice(await getCustomerInvoiceByNumber(decodedNumber))
    } catch (requestError: unknown) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to load this invoice.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [invoiceNumber, isAuthenticated])

  useEffect(() => {
    void loadInvoice()
  }, [loadInvoice])

  const handleDownloadPdf = async (target: InvoiceDocument) => {
    setIsDownloading(true)
    setError(null)
    try {
      const blobUrl = URL.createObjectURL(await downloadInvoicePdf(target.id, { asCustomer: true }))
      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = `${formatInvoiceNumber(target.invoiceNumber || target.id)}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to download this invoice.')
    } finally {
      setIsDownloading(false)
    }
  }

return (
    <section className="min-h-full bg-slate-50 p-4 md:p-6">
      <div className="mx-auto w-full max-w-5xl">
      {/* ── Actions (hidden when printed) ────────────────────────────── */}
      <div data-print-hide className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/account/invoices"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft size={15} />
            Back to Invoices
          </Link>

          {invoice && (
            <>
              {invoice.orderId && (
                <Link
                  to={`/account/orders/${invoice.orderId}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <ExternalLink size={15} />
                  View order
                </Link>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Printer size={15} />
                Print Invoice
              </button>

              <button
                type="button"
                onClick={() => void handleDownloadPdf(invoice)}
                disabled={isDownloading}
                title="Download invoice PDF"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Download size={15} />
                {isDownloading ? 'Preparing PDF…' : 'Download Invoice'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      {isLoading && (
        <div aria-live="polite" className="overflow-hidden rounded-[20px] bg-white shadow-sm ring-1 ring-slate-200/80">
          <InvoiceTableSkeleton rows={5} />
        </div>
      )}

      {!isLoading && error && (
        <div
          aria-live="assertive"
          className="rounded-2xl bg-white px-6 py-12 text-center text-sm text-rose-600 shadow-sm ring-1 ring-rose-200"
        >
          {error}
        </div>
      )}

      {!isLoading && !error && !invoice && (
        <div className="rounded-[20px] bg-white shadow-sm ring-1 ring-slate-200/80">
          <InvoiceEmptyState
            icon={<Receipt size={20} />}
            title="Invoice not found"
            description="This invoice does not exist, or it is not linked to your account."
            action={
              <Link
                to="/account/invoices"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0e7a53] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#0b6243]"
              >
                <ArrowLeft size={13} /> Back to invoices
              </Link>
            }
          />
        </div>
      )}

      {!isLoading && !error && invoice && (
        <InvoiceDocumentSheet invoice={invoice} showActions={false} />
      )}
      </div>
    </section>
  )
}

export default CustomerInvoiceDetailPage