import { useState } from 'react'
import { Download, FileArchive, FileSpreadsheet, Loader2, X } from 'lucide-react'
import { batchGeneratePdfs, downloadBatchPdfs, type InvoiceDocument } from '@/lib/api/invoiceClient'

type AdminInvoiceBatchBarProps = {
  selectedInvoiceIds: string[]
  selectedInvoices: InvoiceDocument[]
  onClearSelection: () => void
  onBatchComplete: () => void
}

const formatCsvValue = (value: string | number | null | undefined): string => {
  const stringValue = String(value ?? '').replace(/"/g, '""')
  return `"${stringValue}"`
}

export const AdminInvoiceBatchBar = ({
  selectedInvoiceIds,
  selectedInvoices,
  onClearSelection,
  onBatchComplete,
}: AdminInvoiceBatchBarProps) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedCount = selectedInvoiceIds.length

  const exportAuditCsv = () => {
    if (selectedCount === 0) return

    setIsExporting(true)
    setError(null)

    try {
      const rows = [
        [
          'invoiceId',
          'invoiceNumber',
          'orderId',
          'shopId',
          'customerId',
          'status',
          'subtotal',
          'taxAmount',
          'discountAmount',
          'grandTotal',
          'currency',
          'paymentMethod',
          'paymentGatewayRef',
          'verifiedBy',
          'verifiedAt',
          'createdAt',
          'updatedAt',
        ],
        ...selectedInvoices.map((invoice) => [
          invoice.id,
          invoice.invoiceNumber,
          invoice.orderId,
          invoice.shopId,
          invoice.customerId,
          invoice.status,
          invoice.subtotal,
          invoice.taxAmount,
          invoice.discountAmount,
          invoice.grandTotal,
          invoice.currency,
          invoice.paymentMethod,
          invoice.paymentGatewayRef,
          invoice.verifiedBy,
          invoice.verifiedAt,
          invoice.createdAt,
          invoice.updatedAt,
        ]),
      ]

      const csv = rows.map((row) => row.map(formatCsvValue).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-audit-export-${Date.now()}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      onBatchComplete()
    } catch {
      setError('Unable to export selected invoice audit log.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleBulkGenerate = async () => {
    if (selectedCount === 0) return

    setIsGenerating(true)
    setError(null)

    try {
      await batchGeneratePdfs(selectedInvoiceIds)
      onBatchComplete()
    } catch {
      setError('Unable to generate PDFs for the selected invoices.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleBulkDownload = async () => {
    if (selectedCount === 0) return

    setIsDownloading(true)
    setError(null)

    try {
      const blob = await downloadBatchPdfs(selectedInvoiceIds)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-batch-${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      onBatchComplete()
    } catch {
      setError('Unable to download selected invoice PDFs.')
    } finally {
      setIsDownloading(false)
    }
  }

  const isBusy = isGenerating || isDownloading || isExporting

  if (selectedCount === 0) return null

  return (
    <div className="sticky bottom-4 z-40 px-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-slate-950 px-4 py-3 text-white shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/20 px-2 py-1 text-xs font-bold text-emerald-200">
            {selectedCount} selected
          </div>
          <span className="text-sm text-slate-200">Bulk admin actions</span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => void handleBulkDownload()}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Bulk Download PDFs
          </button>

          <button
            type="button"
            onClick={() => void handleBulkGenerate()}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <FileArchive size={14} />}
            Bulk Generate PDFs
          </button>

          <button
            type="button"
            onClick={exportAuditCsv}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-lg border border-sky-700 bg-sky-700/20 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:bg-sky-700/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
            Export Audit Log (CSV)
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            <X size={14} />
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-auto mt-2 max-w-5xl rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}

export default AdminInvoiceBatchBar
