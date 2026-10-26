import { useState } from 'react'
import { CalendarDays, CreditCard, ImageOff, Printer, Store, UserRound, Wallet } from 'lucide-react'
import type { ReceiptDocument } from '@/lib/api/invoiceClient'
import type { InvoiceDocument } from '@/lib/api/invoiceClient'
import {
  addressToLines,
  formatCurrency,
  formatReceiptDate,
  formatReceiptNumber,
} from '../lib/invoiceFormat'
import { getCombinedThermalStyles } from '../lib/thermalReceiptStyles'
import ThermalQRCode from './thermal/ThermalQRCode'
import dniWebsiteQr from '@/assets/images/app/dni_website_qr.png'

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
  const [qrError, setQrError] = useState(false)
  const isPrint = mode === 'print'
  const currency = receipt.currency || 'MMK'

  const receiptNumber = formatReceiptNumber(receipt.receiptNumber || receipt.id)
  const issuedDate = formatReceiptDate(receipt.issuedAt)

  // Use invoice data if available, otherwise use receipt data
  const customerName = invoice?.customerName || receipt.customerName || 'Customer'
  const customerEmail = invoice?.customerEmail || receipt.customerEmail
  const shopName = invoice?.shopName || receipt.shopName || 'Daily Need Items'

  // Calculate if we have non-zero amounts
  const hasNonZeroAmount = (value: string) => {
    const amount = Number(value)
    return Number.isFinite(amount) && amount !== 0
  }

  // Get line items from invoice if available
  const lineItems = invoice?.lineItems || []
  const shippingAddressLines = addressToLines(invoice?.shippingAddress)

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
      <header className="px-2 py-3">
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

      <div className="receipt-divider" />

      {/* Customer & Shop Info */}
      <section className="px-2 py-2 space-y-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <UserRound size={12} className="receipt-muted" />
            <span className="receipt-label">Customer</span>
          </div>
          <p className="receipt-value">{customerName}</p>
          {customerEmail && <p className="receipt-value receipt-faint text-xs">{customerEmail}</p>}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Store size={12} className="receipt-muted" />
            <span className="receipt-label">Merchant</span>
          </div>
          <p className="receipt-value">{shopName}</p>
        </div>
      </section>

      <section className="receipt-address-section px-2 py-1 text-xs">
        <div className="receipt-section-title">Shipping address</div>
        <div className="receipt-address">{shippingAddressLines.length ? shippingAddressLines.join(', ') : '—'}</div>
      </section>

      <div className="receipt-divider" />

      {/* Payment Information */}
      <section className="px-2 py-2 space-y-2">
        <div className="flex items-center gap-1">
          <CreditCard size={12} className="receipt-muted" />
          <span className="receipt-label">Payment Details</span>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="receipt-label">Method:</span>
            <span className="receipt-value">{receipt.paymentMethod || 'Not specified'}</span>
          </div>
          {receipt.paymentGatewayRef && (
            <div className="flex justify-between">
              <span className="receipt-label">Reference:</span>
              <span className="receipt-value">{receipt.paymentGatewayRef}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="receipt-label">Status:</span>
            <span className="receipt-value receipt-bold">{receipt.status}</span>
          </div>
        </div>
      </section>

      <div className="receipt-divider" />

      {/* Line Items (if available) */}
      {lineItems.length > 0 && (
        <>
          <section className="px-2 py-2">
            <h3 className="receipt-section-title receipt-center">Items</h3>
            <div className="space-y-1">
              {lineItems.map((item, index) => (
                <div key={`${item.orderItemId || item.name}-${index}`} className="receipt-item-row">
                  <div className="receipt-item-name">
                    <span className="receipt-value">{item.name}</span>
                  </div>
                  <div className="receipt-item-qty">
                    <span className="receipt-value">×{item.quantity}</span>
                  </div>
                  <div className="receipt-item-price">
                    <span className="receipt-value">{formatCurrency(item.total, currency)}</span>
                  </div>
                </div>
              ))}
            </div>
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

      <div className="receipt-divider" />

      {/* QR Code */}
      <section className="px-2 py-2">
        <div className="receipt-qr-container">
          {!qrError ? (
            <img
              src={dniWebsiteQr}
              alt="Daily Need Items Website QR Code"
              onError={() => setQrError(true)}
              className="receipt-qr-image max-w-full h-auto"
              style={{ width: width === '58mm' ? '18mm' : '25mm', imageRendering: 'pixelated' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 border receipt-border rounded">
              <ImageOff size={24} className="receipt-muted mb-2" />
              <span className="receipt-faint text-xs">QR Code unavailable</span>
            </div>
          )}
          <p className="receipt-qr-caption">Scan to visit our store</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-2 py-2">
        <div className="receipt-footer">
          <p>Thank you for your purchase!</p>
          <p>This receipt confirms payment has been received.</p>
          <p className="mt-1">{new Date().getFullYear()} © Daily Need Items</p>
        </div>
      </footer>

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
