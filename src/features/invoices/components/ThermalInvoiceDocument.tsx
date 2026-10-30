import { QrCode } from 'lucide-react'
import type { InvoiceDocument } from '@/lib/api/invoiceClient'
import { formatInvoiceNumber, formatCurrency, formatThermalDateTime } from '@/features/invoices/lib/invoiceFormat'

interface ThermalInvoiceDocumentProps {
  invoice: InvoiceDocument
  width: '58mm' | '80mm'
}

const ThermalInvoiceDocument = ({ invoice, width }: ThermalInvoiceDocumentProps) => {
  // Calculate totals
  const subtotal = invoice.subtotal || '0.00'
  const deliveryFee = invoice.deliveryFee || '0.00'
  const taxAmount = invoice.taxAmount || '0.00'
  const discountAmount = invoice.discountAmount || '0.00'
  const grandTotal = invoice.grandTotal || '0.00'

  // QR code URL - using invoice verification URL
  const qrCodeUrl = `${window.location.origin}/invoices/${invoice.invoiceNumber}/verify`

  return (
    <div className="p-2">
      {/* Header */}
      <header className="receipt-center mb-4">
        <h1 className="receipt-store-name">DAILY NEED ITEMS</h1>
        <div className="receipt-divider" />
        <h2 className="receipt-document-title">INVOICE</h2>
        <p className="receipt-label mb-1">Official Sales Document</p>
      </header>

      {/* Document Info */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="receipt-label">Invoice No:</span>
          <span className="receipt-value receipt-accent">{formatInvoiceNumber(invoice.invoiceNumber)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="receipt-label">Date:</span>
          <span className="receipt-value">{formatThermalDateTime(invoice.createdAt)}</span>
        </div>
        {invoice.orderReference && (
          <div className="flex justify-between items-center mb-2">
            <span className="receipt-label">Order Ref:</span>
            <span className="receipt-value">{invoice.orderReference}</span>
          </div>
        )}
      </div>

      <div className="receipt-divider" />

      {/* Customer & Shop Info */}
      <div className="mb-4">
        <h3 className="receipt-section-title mb-2">PARTIES</h3>
        {invoice.customerName && (
          <div className="mb-1">
            <div className="receipt-label">Customer:</div>
            <div className="receipt-value">{invoice.customerName}</div>
          </div>
        )}
        {invoice.shopName && (
          <div className="mb-1">
            <div className="receipt-label">Shop:</div>
            <div className="receipt-value">{invoice.shopName}</div>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="mb-4">
        <h3 className="receipt-section-title mb-2">ITEMS</h3>
        <div className="receipt-divider" />

        {/* Table Header */}
        <div className="flex justify-between mb-1 receipt-label">
          <div className="flex-1">Description</div>
          <div className="w-15 text-right">Qty</div>
          <div className="w-20 text-right">Price</div>
          <div className="w-25 text-right">Total</div>
        </div>
        <div className="receipt-divider" />

        {/* Items */}
        {invoice.items?.map((item, index) => (
          <div key={index} className="receipt-item-row mb-2">
            <div className="receipt-item-name receipt-value">
              {item.name || 'Item'}
              {item.variantName && (
                <div className="receipt-faint text-xs">{item.variantName}</div>
              )}
            </div>
            <div className="receipt-item-qty receipt-value">
              ×{item.quantity}
            </div>
            <div className="receipt-item-price receipt-value">
              {formatCurrency(item.unitPrice, invoice.currency)}
            </div>
            <div className="receipt-item-price receipt-value receipt-accent">
              {formatCurrency(item.lineTotal, invoice.currency)}
            </div>
          </div>
        ))}

        <div className="receipt-divider" />
      </div>

      {/* Totals */}
      <div className="mb-4">
        <h3 className="receipt-section-title mb-2">TOTALS</h3>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="receipt-label">Subtotal:</span>
            <span className="receipt-value">{formatCurrency(subtotal, invoice.currency)}</span>
          </div>
          {Number(deliveryFee) > 0 && (
            <div className="flex justify-between">
              <span className="receipt-label">Delivery:</span>
              <span className="receipt-value">+{formatCurrency(deliveryFee, invoice.currency)}</span>
            </div>
          )}
          {Number(taxAmount) > 0 && (
            <div className="flex justify-between">
              <span className="receipt-label">Tax:</span>
              <span className="receipt-value">+{formatCurrency(taxAmount, invoice.currency)}</span>
            </div>
          )}
          {Number(discountAmount) > 0 && (
            <div className="flex justify-between">
              <span className="receipt-label">Discount:</span>
              <span className="receipt-value">-{formatCurrency(discountAmount, invoice.currency)}</span>
            </div>
          )}
          <div className="receipt-double-divider" />
          <div className="flex justify-between">
            <span className="receipt-total">GRAND TOTAL:</span>
            <span className="receipt-total">{formatCurrency(grandTotal, invoice.currency)}</span>
          </div>
        </div>
      </div>

      {/* QR Code for Verification */}
      <div className="receipt-qr-container mb-4">
        <div className="receipt-qr-caption">Verify Invoice Online</div>
        <div className="border border-dashed border-slate-300 p-2 inline-block">
          <div className="w-30 h-30 flex items-center justify-center bg-slate-50">
            <QrCode size={24} className="text-slate-400" />
            <div className="text-xs text-slate-500 ml-2">QR Code</div>
          </div>
        </div>
        <div className="receipt-qr-caption mt-1">
          Scan to verify at {window.location.hostname}
        </div>
      </div>

      <section className="mb-2 text-[9px] leading-snug receipt-muted">
        Customers may inspect the package before making payment, subject to the delivery provider’s inspection policy.
      </section>
      {/* Footer */}
      <footer className="receipt-footer">
        <div className="receipt-divider" />
        <p className="mt-2">Thank you for shopping with Daily Need Items!</p>
        <p className="mt-1">This is an official invoice document.</p>
        <p className="mt-1">For support: support@dailyneeditems.com</p>
        <p className="mt-1 text-xs">Printed: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </footer>
    </div>
  )
}

export default ThermalInvoiceDocument
