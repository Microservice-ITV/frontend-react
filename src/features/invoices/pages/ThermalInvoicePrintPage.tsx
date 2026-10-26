import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getInvoiceByNumber, type InvoiceDocument } from '@/lib/api/invoiceClient'
import ThermalInvoiceDocument from '@/features/invoices/components/ThermalInvoiceDocument'
import { getCombinedThermalStyles } from '@/features/invoices/lib/thermalReceiptStyles'
import { useAppSelector } from '@/app/hooks'
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors'

/**
 * Thermal invoice print-only route for dashboard users.
 * 
 * Renders invoice in thermal POS format for printing.
 * Width can be specified via query parameter: `?width=58mm` or `?width=80mm`.
 */
const ThermalInvoicePrintPage = () => {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>()
  const [searchParams] = useSearchParams()
  const width = (searchParams.get('width') as '58mm' | '80mm') || '58mm'
  
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  const [invoice, setInvoice] = useState<InvoiceDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInvoice = useCallback(async () => {
    if (!isAuthenticated) {
      setInvoice(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setInvoice(null)

    try {
      const loadedInvoice = await getInvoiceByNumber(invoiceNumber ?? '')
      setInvoice(loadedInvoice)
    } catch (requestError: unknown) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to load invoice.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [invoiceNumber, isAuthenticated])

  useEffect(() => {
    void loadInvoice()
  }, [loadInvoice])

  // Signal to the browser that content has loaded for print
  useEffect(() => {
    if (isLoading) return

    let cancelled = false
    const markReady = () => {
      if (cancelled) return
      // Signal that invoice is ready for printing
      setTimeout(() => {
        window.print()
      }, 500)
    }

    // On failure, don't auto-print
    if (!invoice || error) {
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
  }, [isLoading, invoice, error])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600 mb-3" />
          <p className="text-sm text-slate-600">Loading invoice for thermal printing…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-center">
          <h3 className="text-base font-semibold text-rose-800 mb-2">Unable to print invoice</h3>
          <p className="text-sm text-rose-700 mb-4">{error}</p>
          <p className="text-xs text-rose-600">
            Please return to the invoice and try again.
          </p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div role="alert" className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
          <h3 className="text-base font-semibold text-slate-800 mb-2">Invoice not found</h3>
          <p className="text-sm text-slate-700">
            This invoice does not exist, or you are not authorized to view it.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: getCombinedThermalStyles(width) }} />
      <div className="thermal-receipt">
        <ThermalInvoiceDocument invoice={invoice} width={width} />
      </div>
    </>
  )
}

export default ThermalInvoicePrintPage