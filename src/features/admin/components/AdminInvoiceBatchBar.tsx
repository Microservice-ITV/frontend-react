import { useState } from 'react'
import { Download, FileSpreadsheet, Loader2, X } from 'lucide-react'
import { downloadBatchPdfs, type InvoiceDocument } from '@/lib/api/invoiceClient'

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

  const isBusy = isDownloading || isExporting

  if (selectedCount === 0) return null

  return (
    <div className="w-fit max-w-full">
      <div className="flex flex-col justify-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            {selectedCount} selected
          </div>
          <span className="truncate text-sm font-semibold text-slate-800">Bulk admin actions</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleBulkDownload()}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Download PDFs
          </button>

          <button
            type="button"
            onClick={exportAuditCsv}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
            Export CSV
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={14} />
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}

export default AdminInvoiceBatchBar
