import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import {
  refundInvoice,
  voidInvoice,
  type InvoiceDocument,
} from '@/lib/api/invoiceClient'

type AdminInvoiceActionModalProps = {
  invoice: InvoiceDocument | null
  actionType: 'VOID' | 'REFUND'
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type RefundMethod = 'BANK_TRANSFER' | 'CREDIT_CARD' | 'SYSTEM_CREDIT'

const REFUND_METHODS: Array<{ value: RefundMethod; label: string }> = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'SYSTEM_CREDIT', label: 'System Credit' },
]

const getRequestError = (error: unknown) => {
  const responseMessage = (
    error as { response?: { data?: { message?: string } } }
  ).response?.data?.message
  return responseMessage ?? 'Unable to complete this invoice action. Please try again.'
}

const AdminInvoiceActionModal = ({
  invoice,
  actionType,
  isOpen,
  onClose,
  onSuccess,
}: AdminInvoiceActionModalProps) => {
  const [refundAmount, setRefundAmount] = useState('')
  const [refundMethod, setRefundMethod] = useState<RefundMethod>('BANK_TRANSFER')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !invoice) {
      setRefundAmount('')
      setRefundMethod('BANK_TRANSFER')
      setReason('')
      setError(null)
      setIsSubmitting(false)
      return
    }

    setRefundAmount(invoice.grandTotal)
    setRefundMethod('BANK_TRANSFER')
    setReason('')
    setError(null)
  }, [invoice, isOpen, actionType])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen || !invoice) return null

  const trimmedReason = reason.trim()
  const parsedRefundAmount = Number(refundAmount)
  const isValidRefundAmount =
    actionType === 'VOID' ||
    (Number.isFinite(parsedRefundAmount) && parsedRefundAmount > 0 && parsedRefundAmount <= Number(invoice.grandTotal))
  const isValid = trimmedReason.length >= 10 && isValidRefundAmount

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValid || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      if (actionType === 'VOID') {
        await voidInvoice(invoice.id, trimmedReason)
      } else {
        await refundInvoice(invoice.id, {
          amount: parsedRefundAmount,
          method: refundMethod,
          reason: trimmedReason,
        })
      }
      onSuccess()
      onClose()
    } catch (requestError: unknown) {
      setError(getRequestError(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-invoice-action-title"
    >
      <button
        type="button"
        aria-label="Close invoice action modal"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!isSubmitting) onClose()
        }}
      />

      <form
        className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-2xl"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
              System admin override
            </p>
            <h2 id="admin-invoice-action-title" className="mt-1 text-lg font-bold text-slate-950">
              {actionType === 'VOID' ? 'Void invoice' : 'Refund invoice'}
            </h2>
            <p className="mt-1 font-mono text-xs text-slate-500">
              {invoice.invoiceNumber || invoice.id}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <p>This action bypasses normal shop workflows and will be recorded in the audit trail.</p>
          </div>

          {actionType === 'REFUND' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-800">
                Refund Amount
                <span className="ml-1 text-red-500">*</span>
                <div className="mt-1 flex rounded-lg border border-slate-200 focus-within:border-emerald-500">
                  <span className="border-r border-slate-200 px-3 py-2 text-sm text-slate-500">{invoice.currency}</span>
                  <input
                    type="number"
                    min="0.01"
                    max={invoice.grandTotal}
                    step="0.01"
                    value={refundAmount}
                    onChange={(event) => setRefundAmount(event.target.value)}
                    className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
                    disabled={isSubmitting}
                  />
                </div>
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Maximum: {invoice.currency} {invoice.grandTotal}
                </span>
              </label>

              <label className="block text-sm font-semibold text-slate-800">
                Refund Method
                <span className="ml-1 text-red-500">*</span>
                <select
                  value={refundMethod}
                  onChange={(event) => setRefundMethod(event.target.value as RefundMethod)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  disabled={isSubmitting}
                >
                  {REFUND_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>{method.label}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <label className="block text-sm font-semibold text-slate-800">
            Reason / Audit Note
            <span className="ml-1 text-red-500">*</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              minLength={10}
              rows={4}
              placeholder="Enter at least 10 characters explaining this override"
              className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              disabled={isSubmitting}
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              {reason.trim().length}/10 minimum characters
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {actionType === 'VOID' ? 'Confirm Void' : 'Confirm Refund'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdminInvoiceActionModal
