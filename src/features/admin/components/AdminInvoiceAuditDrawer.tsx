import { useEffect, useMemo } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Store,
  UserRound,
  X,
} from 'lucide-react'
import type { InvoiceDocument } from '@/lib/api/invoiceClient'

type AdminInvoiceAuditDrawerProps = {
  invoice: InvoiceDocument | null
  isOpen: boolean
  onClose: () => void
}

type TimelineEntry = {
  label: string
  timestamp: string | null
  actor: string
  note?: string
}

const STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Unpaid',
  PENDING_VERIFICATION: 'Pending verification',
  PAID: 'Paid',
  REJECTED: 'Rejected',
  VOID: 'Void',
  REFUNDED: 'Refunded',
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const getActorLabel = (invoice: InvoiceDocument, previousStatus?: string): string => {
  if (!previousStatus) {
    return 'System'
  }

  if (invoice.verifiedBy) {
    return invoice.verifiedBy
  }

  if (previousStatus === 'PAID' || previousStatus === 'REFUNDED' || previousStatus === 'VOID') {
    return 'System Admin'
  }

  return 'Shop Admin'
}

export const AdminInvoiceAuditDrawer = ({
  invoice,
  isOpen,
  onClose,
}: AdminInvoiceAuditDrawerProps) => {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const timeline = useMemo<TimelineEntry[]>(() => {
    if (!invoice) return []

    const entries: TimelineEntry[] = [
      {
        label: 'CREATED',
        timestamp: invoice.createdAt,
        actor: 'Customer',
        note: 'Invoice generated from a successful order payment flow.',
      },
    ]

    if (invoice.status === 'PENDING_VERIFICATION' || invoice.status === 'PAID' || invoice.status === 'REJECTED' || invoice.status === 'VOID' || invoice.status === 'REFUNDED') {
      entries.push({
        label: 'PENDING_VERIFICATION',
        timestamp: invoice.createdAt,
        actor: 'Shop Admin',
        note: 'Awaiting manual verification of uploaded payment slip.',
      })
    }

    if (invoice.status === 'PAID' || invoice.status === 'VOID' || invoice.status === 'REFUNDED') {
      entries.push({
        label: invoice.status,
        timestamp: invoice.updatedAt,
        actor: getActorLabel(invoice, invoice.status),
        note: invoice.rejectionReason ?? 'Invoice status updated by administrator.',
      })
    }

    if (invoice.status === 'REJECTED') {
      entries.push({
        label: 'REJECTED',
        timestamp: invoice.updatedAt,
        actor: invoice.verifiedBy ? 'Shop Admin' : 'System Admin',
        note: invoice.rejectionReason ?? 'Payment proof rejected by admin review.',
      })
    }

    return entries
  }, [invoice])

  if (!isOpen || !invoice) return null

  const handleDownloadPdf = () => {
    if (!invoice.pdfUrl) return
    window.open(invoice.pdfUrl, '_blank', 'noopener,noreferrer')
  }

  const handleRegeneratePdf = async () => {
    if (!invoice.pdfUrl) {
      handleDownloadPdf()
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_INVOICE_SERVICE_URL ?? 'http://localhost:5005/api/v1'}/invoices/${invoice.id}/generate-pdf`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Unable to regenerate PDF')
      }

      const payload = await response.json()
      const generatedUrl = payload?.data?.pdfUrl || payload?.pdfUrl

      if (generatedUrl) {
        window.open(generatedUrl, '_blank', 'noopener,noreferrer')
      }
    } catch {
      window.alert('Unable to regenerate invoice PDF at the moment.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Close invoice audit drawer"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <aside className="relative z-10 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur-sm">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600">Invoice audit</p>
            <h2 className="mt-2 truncate text-xl font-bold text-slate-950">{invoice.invoiceNumber || invoice.id}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Store size={12} />
                {invoice.shopId}
              </span>
              <span className="text-slate-300">•</span>
              <span>{invoice.customerId}</span>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close drawer"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Current status</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{STATUS_LABELS[invoice.status] ?? invoice.status}</p>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
              invoice.status === 'PAID'
                ? 'bg-emerald-100 text-emerald-700'
                : invoice.status === 'PENDING_VERIFICATION'
                  ? 'bg-amber-100 text-amber-700'
                  : invoice.status === 'VOID'
                    ? 'bg-zinc-200 text-zinc-700'
                    : invoice.status === 'REFUNDED'
                      ? 'bg-blue-100 text-blue-700'
                      : invoice.status === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-700'
            }`}>
              {STATUS_LABELS[invoice.status] ?? invoice.status}
            </span>
          </div>

          <section className="rounded-xl border border-slate-200 p-4">
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock size={16} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Status timeline</h3>
            </div>

            <div className="space-y-4">
              {timeline.map((entry, index) => (
                <div key={`${entry.label}-${index}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      {index === timeline.length - 1 ? <CheckCircle2 size={14} /> : <ShieldCheck size={14} />}
                    </div>
                    {index !== timeline.length - 1 && <div className="mt-1 h-full min-h-8 w-px bg-slate-200" />}
                  </div>
                  <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{entry.label}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{entry.actor}</p>
                      </div>
                      <span className="text-[11px] text-slate-500">{formatDate(entry.timestamp)}</span>
                    </div>
                    {entry.note && <p className="mt-2 text-xs leading-5 text-slate-600">{entry.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-4">
            <div className="mb-4 flex items-center gap-2">
              <FileText size={16} className="text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Administrative overrides</h3>
            </div>

            <div className="space-y-3">
              {invoice.rejectionReason ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">Reason note</p>
                  <p className="mt-2 text-sm text-amber-900">{invoice.rejectionReason}</p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                  No override notes have been logged for this invoice yet.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-4">
            <div className="mb-4 flex items-center gap-2">
              <ImageIcon size={16} className="text-violet-600" />
              <h3 className="text-sm font-bold text-slate-900">Payment details & slip</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Amount</p>
                <p className="mt-2 text-lg font-bold text-slate-950">{invoice.currency} {Number(invoice.grandTotal).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Payment method</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{invoice.paymentMethod}</p>
              </div>
            </div>

            {invoice.paymentSlipUrl ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
                <img
                  src={invoice.paymentSlipUrl}
                  alt={`Payment slip for ${invoice.invoiceNumber || invoice.id}`}
                  className="max-h-80 w-full rounded-lg object-contain"
                />
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No payment slip has been attached to this invoice.
              </div>
            )}
          </section>
        </div>

        <div className="sticky bottom-0 flex flex-col gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!invoice.pdfUrl}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={15} />
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => void handleRegeneratePdf()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <RefreshCcw size={15} />
            Re-generate PDF
          </button>
        </div>
      </aside>
    </div>
  )
}

export default AdminInvoiceAuditDrawer
