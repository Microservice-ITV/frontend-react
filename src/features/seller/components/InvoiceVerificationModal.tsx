import { useEffect, useState } from 'react'
import { Check, ImageOff, Loader2, X, XCircle, ZoomIn } from 'lucide-react'
import {
  verifyInvoice,
  type InvoiceDocument,
} from '@/lib/api/invoiceClient'

type InvoiceVerificationModalProps = {
  invoice: InvoiceDocument
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void | Promise<void>
}

export const InvoiceVerificationModal = ({
  invoice,
  isOpen,
  onClose,
  onSuccess,
}: InvoiceVerificationModalProps) => {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setReason('')
      setError(null)
      setIsZoomed(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  const submitDecision = async (approved: boolean) => {
    const trimmedReason = reason.trim()

    if (!approved && !trimmedReason) {
      setError('A rejection reason is required.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await verifyInvoice(invoice.id, approved, trimmedReason || undefined)
      await onSuccess()
      onClose()
    } catch (requestError: unknown) {
      const responseMessage = (
        requestError as { response?: { data?: { message?: string } } }
      ).response?.data?.message
      setError(responseMessage ?? 'Unable to update this invoice. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-verification-title"
    >
      <button
        type="button"
        aria-label="Close invoice verification modal"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!isSubmitting) onClose()
        }}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">Payment verification</p>
            <h2 id="invoice-verification-title" className="mt-1 text-lg font-bold text-slate-950">
              {invoice.invoiceNumber || invoice.id}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            title="Close"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 overflow-y-auto lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-slate-200 bg-slate-50 p-4 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Payment slip</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {invoice.paymentSlipUrl ? 'Review the submitted payment proof.' : 'No payment proof is attached to this invoice yet.'}
                </p>
              </div>
              {invoice.paymentSlipUrl && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
                  onClick={() => setIsZoomed(true)}
                >
                  <ZoomIn size={14} />
                  Zoom
                </button>
              )}
            </div>

            <div className="flex min-h-65 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-2 sm:min-h-90">
              {invoice.paymentSlipUrl ? (
                <button
                  type="button"
                  className="group relative h-full w-full cursor-zoom-in"
                  aria-label="Zoom payment slip"
                  onClick={() => setIsZoomed(true)}
                >
                  <img
                    src={invoice.paymentSlipUrl}
                    alt={`Payment slip for invoice ${invoice.invoiceNumber || invoice.id}`}
                    className="h-full max-h-[55vh] w-full object-contain transition group-hover:scale-[1.01]"
                  />
                  <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/75 px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                    <ZoomIn size={13} />
                    Click to zoom
                  </span>
                </button>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center text-slate-400">
                  <ImageOff size={28} />
                  <p className="text-sm font-semibold">No payment slip uploaded</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col p-4 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900">Invoice summary</h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-lg border border-slate-200 p-3">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Grand total</dt>
                <dd className="mt-1 text-lg font-bold text-slate-950">{invoice.currency} {invoice.grandTotal}</dd>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order ID</dt>
                <dd className="mt-1 break-all font-mono text-xs text-slate-700">{invoice.orderId}</dd>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment method</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-700">{invoice.paymentMethod}</dd>
              </div>
            </dl>

            <div className="mt-5 flex-1">
              <label htmlFor="invoice-rejection-reason" className="text-sm font-bold text-slate-900">
                Verification note
                <span className="ml-1 text-xs font-normal text-slate-400">(optional for approval)</span>
              </label>
              <textarea
                id="invoice-rejection-reason"
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value)
                  if (error) setError(null)
                }}
                placeholder="Add an approval note, or explain why payment is rejected"
                rows={4}
                className="mt-2 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void submitDecision(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Reject
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                onClick={() => void submitDecision(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>

      {isZoomed && invoice.paymentSlipUrl && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed payment slip"
        >
          <button
            type="button"
            aria-label="Close zoomed payment slip"
            title="Close zoomed payment slip"
            className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
            onClick={() => setIsZoomed(false)}
          >
            <X size={20} />
          </button>
          <img
            src={invoice.paymentSlipUrl}
            alt={`Zoomed payment slip for invoice ${invoice.invoiceNumber || invoice.id}`}
            className="max-h-full max-w-full object-contain"
            onClick={() => setIsZoomed(false)}
          />
        </div>
      )}
    </div>
  )
}

export default InvoiceVerificationModal