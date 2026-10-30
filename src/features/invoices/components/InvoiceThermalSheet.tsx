import type { InvoiceDocument } from '@/lib/api/invoiceClient'
import { addressToLines, formatCurrency, formatInvoiceNumber, formatThermalDateTime } from '../lib/invoiceFormat'
import { getCombinedThermalStyles } from '../lib/thermalReceiptStyles'
import ThermalItemTable from './thermal/ThermalItemTable'
import ThermalQRCode from './thermal/ThermalQRCode'

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
  const isPrint = mode === 'print'
  const currency = invoice.currency || 'MMK'
  const invoiceNumber = formatInvoiceNumber(invoice.invoiceNumber || invoice.id)
  const createdDate = formatThermalDateTime(invoice.createdAt)

  const lineItems = invoice.lineItems || (invoice.items?.map((item) => ({
    orderItemId: item.orderItemId,
    name: item.productName,
    sku: item.productSku,
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
      <header className="px-2 py-2">
        <div className="receipt-center">
          <h1 className="receipt-store-name">Daily Need Items</h1>
          <h2 className="receipt-document-title receipt-uppercase">Invoice</h2>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="receipt-label">Invoice No:</span>
            <span className="receipt-value receipt-bold">{invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="receipt-label">Date:</span>
            <span className="receipt-value">{createdDate}</span>
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
        <div className="receipt-section-title">Bill To</div>
        <div>{invoice.customerName || 'Customer'}</div>
        {invoice.customerPhone && <div className="receipt-muted">{invoice.customerPhone}</div>}
      </section>
      <section className="receipt-address-section px-2 py-1 text-xs">
        <div className="receipt-section-title">Shipping Address</div>
        <div className="receipt-address">{shippingAddressLines.length ? shippingAddressLines.join(', ') : '—'}</div>
      </section>
      <div className="receipt-divider" />
      <section className="thermal-items-section px-2 py-2">
        <div className="receipt-section-title mb-1">Items</div>
        {lineItems.length === 0 && <div className="text-xs receipt-muted">No line items</div>}
        {lineItems.length > 0 && <ThermalItemTable items={lineItems} currency={currency} width={width} />}
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
      <footer className="receipt-footer-main px-2 py-2">
        <ThermalQRCode width={width} title="Thank you for your purchase!" subtitle="This invoice is for your records." />
      </footer>
      <section className="receipt-policy-note receipt-muted px-2 py-2">
        Customers may inspect the package before making payment, subject to the delivery provider’s inspection policy.
      </section>
    </article>
  )
}

export default InvoiceThermalSheet
