import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Loader2, Printer } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors'
import InvoiceDocumentSheet from '@/features/invoices/components/InvoiceDocumentSheet'
import InvoiceEmptyState from '@/features/invoices/components/InvoiceEmptyState'
import InvoiceTableSkeleton from '@/features/invoices/components/InvoiceTableSkeleton'
import { formatInvoiceNumber } from '@/features/invoices/lib/invoiceFormat'
import { downloadInvoicePdf, getInvoiceByNumber, type InvoiceDocument } from '@/lib/api/invoiceClient'
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
  const [error, setError] = useState<string | null>(null)

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

  const handleDownload = async () => {
    if (!invoice) return

    setIsDownloading(true)
    setError(null)
    try {
      const objectUrl = URL.createObjectURL(await downloadInvoicePdf(invoice.id))
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = `${formatInvoiceNumber(invoice.invoiceNumber || invoice.id)}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to download this invoice.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <section className="min-h-full bg-slate-50 p-4 md:p-6">
      <div className="mx-auto w-full max-w-5xl">
        <div data-print-hide className="mb-5 flex flex-wrap items-center gap-2">
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft size={15} />
            {backLabel}
          </Link>
          {invoice && (
            <>
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
                onClick={() => void handleDownload()}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                {isDownloading ? 'Preparing PDF…' : 'Download PDF'}
              </button>
            </>
          )}
        </div>

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
          <InvoiceDocumentSheet invoice={invoice} showActions={false} />
        )}
      </div>
    </section>
  )
}

export default ScopedInvoiceDetailPage
