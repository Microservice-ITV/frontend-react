import { CalendarDays, Download, Printer, UserRound } from 'lucide-react'
import type { ReceiptDocument } from '@/lib/api/invoiceClient'
import type { InvoiceDocument } from '@/lib/api/invoiceClient'
import {
  formatCurrency,
  formatReceiptDate,
  formatReceiptNumber,
} from '../lib/invoiceFormat'
import { getCombinedThermalStyles } from '../lib/thermalReceiptStyles'
import ThermalItemTable from './thermal/ThermalItemTable'
import ThermalQRCode from './thermal/ThermalQRCode'

interface ReceiptDocumentSheetProps {
  receipt: ReceiptDocument
  invoice?: InvoiceDocument | null
  width?: '58mm' | '80mm'
  showActions?: boolean
  mode?: 'screen' | 'print'
  onDownload?: () => void
  isDownloading?: boolean
  onPrint?: (width: '58mm' | '80mm') => void
}

const ReceiptDocumentSheet = ({
  receipt,
  invoice,
  width = '58mm',
  showActions = true,
  mode = 'screen',
  onDownload,
  isDownloading = false,
  onPrint,
}: ReceiptDocumentSheetProps) => {
  const isPrint = mode === 'print'
  const currency = receipt.currency || 'MMK'

  const receiptNumber = formatReceiptNumber(receipt.receiptNumber || receipt.id)
  const issuedDate = formatReceiptDate(receipt.issuedAt)

  // Use invoice data if available, otherwise use receipt data
  const customerName = invoice?.customerName || receipt.customerName || 'Customer'

  // Calculate if we have non-zero amounts
  const hasNonZeroAmount = (value: string) => {
    const amount = Number(value)
    return Number.isFinite(amount) && amount !== 0
  }

  // Get line items from invoice if available
  const lineItems = invoice?.lineItems || []

  const handlePrint = () => {
    if (onPrint) {
      onPrint(width)
    } else {
      window.print()
    }
  }

  return (
    <article
      data-receipt-root={isPrint ? 'print' : 'screen'}
      className={`thermal-receipt w-full overflow-hidden bg-white receipt-ink ${isPrint ? '' : 'rounded-lg border receipt-border shadow-sm'}`}
      style={{ width: width === '58mm' ? '52mm' : '70mm', maxWidth: '100%' }}
    >
      <style>{getCombinedThermalStyles(width)}</style>

      {/* Header */}
      <header className="px-2 py-2">
        <div className="receipt-center">
          <h1 className="receipt-store-name">Daily Need Items</h1>
          <h2 className="receipt-document-title receipt-uppercase">Payment Receipt</h2>
        </div>

        <div className="receipt-divider" />

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="receipt-label">Receipt No:</span>
            <span className="receipt-value receipt-bold">{receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="receipt-label">Invoice No:</span>
            <span className="receipt-value">{receipt.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="receipt-label">Date:</span>
            <span className="receipt-value">{issuedDate}</span>
          </div>
          {receipt.orderReference && (
            <div className="flex justify-between">
              <span className="receipt-label">Order Ref:</span>
              <span className="receipt-value">{receipt.orderReference}</span>
            </div>
          )}
        </div>
      </header>

      {/* Customer & Shop Info */}
      <section className="px-2 py-2 space-y-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <UserRound size={12} className="receipt-muted" />
            <span className="receipt-label">Bill To</span>
          </div>
          <p className="receipt-value">{customerName}</p>
        </div>

      </section>

      <div className="receipt-divider" />

      {/* Line Items (if available) */}
      {lineItems.length > 0 && (
        <>
          <section className="thermal-items-section px-2 py-2">
            <h3 className="receipt-section-title">Items</h3>
            <ThermalItemTable items={lineItems} currency={currency} width={width} />
          </section>
          <div className="receipt-divider" />
        </>
      )}

      {/* Totals */}
      <section className="px-2 py-2 space-y-1">
        <div className="flex justify-between">
          <span className="receipt-label">Subtotal:</span>
          <span className="receipt-value">{formatCurrency(receipt.subtotal, currency)}</span>
        </div>

        {hasNonZeroAmount(receipt.deliveryFee) && (
          <div className="flex justify-between">
            <span className="receipt-label">Delivery:</span>
            <span className="receipt-value">{formatCurrency(receipt.deliveryFee, currency)}</span>
          </div>
        )}

        {hasNonZeroAmount(receipt.discountAmount) && (
          <div className="flex justify-between">
            <span className="receipt-label">Discount:</span>
            <span className="receipt-value">-{formatCurrency(receipt.discountAmount, currency)}</span>
          </div>
        )}

        {hasNonZeroAmount(receipt.taxAmount) && (
          <div className="flex justify-between">
            <span className="receipt-label">Tax:</span>
            <span className="receipt-value">{formatCurrency(receipt.taxAmount, currency)}</span>
          </div>
        )}

        <div className="receipt-double-divider" />

        <div className="flex justify-between">
          <span className="receipt-label receipt-bold">Total Collected:</span>
          <span className="receipt-total">{formatCurrency(receipt.grandTotal, currency)}</span>
        </div>
      </section>

      {/* QR Code */}
      <footer className="receipt-footer-main px-2 py-2">
        <ThermalQRCode width={width} title="Thank you for your purchase!" subtitle="This receipt confirms payment has been received." />
      </footer>

      {/* Footer */}
      <section className="receipt-policy-note receipt-muted px-2 py-2">
        Please keep this receipt for your records.
      </section>

      {/* Actions (hidden in print mode) */}
      {showActions && !isPrint && (
        <div className="thermal-receipt-actions flex flex-wrap justify-end gap-2 border-t receipt-border px-3 py-3">
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 rounded border receipt-border bg-white px-2.5 py-1.5 text-xs font-medium receipt-ink transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={12} />
              {isDownloading ? 'Preparing PDF…' : 'Download PDF'}
            </button>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPrint ? onPrint('58mm') : handlePrint()}
              className="inline-flex items-center gap-2 rounded bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
            >
              <Printer size={12} />
              Print 58mm
            </button>
            <button
              type="button"
              onClick={() => onPrint ? onPrint('80mm') : handlePrint()}
              className="inline-flex items-center gap-2 rounded bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-slate-900"
            >
              <Printer size={12} />
              Print 80mm
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

export default ReceiptDocumentSheet
