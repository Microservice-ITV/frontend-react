import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import type { InvoiceDocument } from '@/lib/api/invoiceClient'
import { addressToLines, formatCurrency, formatInvoiceNumber } from '../lib/invoiceFormat'
import { getCombinedThermalStyles } from '../lib/thermalReceiptStyles'
import dniWebsiteQr from '@/assets/images/app/dni_website_qr.png'

type InvoiceThermalSheetProps = {
  invoice: InvoiceDocument
  width?: '58mm' | '80mm'
  mode?: 'screen' | 'print'
  showActions?: boolean
  onPrint?: (width: '58mm' | '80mm') => void
}

const InvoiceThermalSheet = ({
  invoice,
  width = '58mm',
  mode = 'screen',
  showActions = true,
  onPrint,
}: InvoiceThermalSheetProps) => {
  const [qrError, setQrError] = useState(false)
  const isPrint = mode === 'print'
  const currency = invoice.currency || 'MMK'
  const invoiceNumber = formatInvoiceNumber(invoice.invoiceNumber || invoice.id)
  const createdDate = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  const lineItems = invoice.lineItems || (invoice.items?.map((item) => ({
    name: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.totalPrice,
  })) ?? [])
  const shippingAddressLines = addressToLines(invoice.shippingAddress)

  const handlePrint = () => {
    if (onPrint) onPrint(width)
    else window.print()
  }

  return (
    <article
      data-invoice-thermal-root={isPrint ? 'print' : 'screen'}
      className={`thermal-receipt w-full overflow-hidden bg-white receipt-ink ${isPrint ? '' : 'rounded-lg border receipt-border shadow-sm'}`}
      style={{ width: width === '58mm' ? '52mm' : '70mm', maxWidth: '100%' }}
    >
      <style>{getCombinedThermalStyles(width)}</style>
      <header className="px-2 py-3">
        <div className="receipt-center">
          <h1 className="receipt-store-name">Daily Need Items</h1>
          <h2 className="receipt-document-title receipt-uppercase">Invoice</h2>
        </div>
        <div className="receipt-divider" />
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="receipt-label">Invoice No:</span>
            <span className="receipt-value receipt-bold">{invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="receipt-label">Date:</span>
            <span className="receipt-value">{createdDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="receipt-label">Status:</span>
            <span className="receipt-value receipt-bold">{invoice.status}</span>
          </div>
          {invoice.orderReference && (
            <div className="flex justify-between">
              <span className="receipt-label">Order:</span>
              <span className="receipt-value">{invoice.orderReference}</span>
            </div>
          )}
        </div>
      </header>
      <div className="receipt-divider" />
      <section className="px-2 py-2 space-y-1 text-xs">
        <div className="receipt-section-title">Billed To</div>
        <div>{invoice.customerName || 'Customer'}</div>
        {invoice.customerEmail && <div className="receipt-muted">{invoice.customerEmail}</div>}
        {invoice.customerPhone && <div className="receipt-muted">{invoice.customerPhone}</div>}
        <div className="receipt-muted">{invoice.shopName || 'Daily Need Items'}</div>
      </section>
      <section className="receipt-address-section px-2 py-1 text-xs">
        <div className="receipt-section-title">Shipping address</div>
        <div className="receipt-address">{shippingAddressLines.length ? shippingAddressLines.join(', ') : '—'}</div>
      </section>
      <div className="receipt-divider" />
      <section className="px-2 py-2">
        <div className="receipt-section-title mb-1">Items</div>
        {lineItems.length === 0 && (
          <div className="text-xs receipt-muted">No line items</div>
        )}
        {lineItems.map((item, index) => (
          <div key={item.orderItemId || `${item.name}-${index}`} className="receipt-item-row text-xs">
            <span className="receipt-item-name">{item.name}</span>
            <span className="receipt-item-qty">×{item.quantity}</span>
            <span className="receipt-item-price">{formatCurrency(item.total, currency)}</span>
          </div>
        ))}
      </section>
      <div className="receipt-divider" />
      <section className="px-2 py-2 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="receipt-label">Subtotal:</span>
          <span className="receipt-value">{formatCurrency(invoice.subtotal, currency)}</span>
        </div>
        {Number(invoice.deliveryFee) !== 0 && (
          <div className="flex justify-between">
            <span className="receipt-label">Delivery:</span>
            <span className="receipt-value">{formatCurrency(invoice.deliveryFee, currency)}</span>
          </div>
        )}
        {Number(invoice.taxAmount) !== 0 && (
          <div className="flex justify-between">
            <span className="receipt-label">Tax:</span>
            <span className="receipt-value">{formatCurrency(invoice.taxAmount, currency)}</span>
          </div>
        )}
        {Number(invoice.discountAmount) !== 0 && (
          <div className="flex justify-between">
            <span className="receipt-label">Discount:</span>
            <span className="receipt-value">-{formatCurrency(invoice.discountAmount, currency)}</span>
          </div>
        )}
        {invoice.otherCharges && invoice.otherCharges.length > 0 && invoice.otherCharges.map((charge, idx) => (
          <div key={idx} className="flex justify-between">
            <span className="receipt-label">{charge.label}:</span>
            <span className="receipt-value">{formatCurrency(charge.amount, currency)}</span>
          </div>
        ))}
        <div className="receipt-double-divider" />
        <div className="flex justify-between">
          <span className="receipt-label receipt-bold">Total:</span>
          <span className="receipt-total">{formatCurrency(invoice.grandTotal, currency)}</span>
        </div>
      </section>
      <div className="receipt-divider" />
      <section className="px-2 py-2 space-y-1 text-xs">
        {invoice.paymentMethod && (
          <div className="flex justify-between">
            <span className="receipt-label">Payment:</span>
            <span className="receipt-value">{invoice.paymentMethod}</span>
          </div>
        )}
        {invoice.paymentGatewayRef && (
          <div className="flex justify-between">
            <span className="receipt-label">Ref:</span>
            <span className="receipt-value">{invoice.paymentGatewayRef}</span>
          </div>
        )}
      </section>
      <div className="receipt-divider" />
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
      <footer className="px-2 py-2">
        <div className="receipt-footer">
          <p>Thank you for your purchase!</p>
          <p>This invoice is for your records.</p>
          <p className="mt-1">{new Date().getFullYear()} © Daily Need Items</p>
        </div>
      </footer>
    </article>
  )
}

export default InvoiceThermalSheet
